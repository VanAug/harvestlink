from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.notifications import create_notification, notify_admin, notify_company_owner, notify_rfq_responders
from app.db.session import get_db
from app.models.models import Company, Deal, Offer, RFQ, User
from app.schemas.schemas import OfferCreate, OfferOut, RFQCreate, RFQOut

router = APIRouter(tags=["rfqs"])


@router.get("/rfqs", response_model=list[RFQOut])
async def rfqs(status: str | None = None, db: AsyncSession = Depends(get_db)):
    """Public: list all RFQs (buyers and exporters browse these)."""
    stmt = select(RFQ).order_by(RFQ.id)
    if status:
        stmt = stmt.where(RFQ.status == status)
    return list(await db.scalars(stmt))


@router.post("/rfqs", response_model=RFQOut)
async def create_rfq(
    payload: RFQCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated buyers only."""
    if current_user.role not in ("buyer", "admin"):
        raise HTTPException(status_code=403, detail="Only buyers can create RFQs")
    buyer = await db.get(Company, payload.buyer_company_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer company not found")
    if buyer.type != "buyer":
        raise HTTPException(status_code=400, detail="RFQs can only be created by buyer companies")
    if buyer.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only create RFQs for your own company")
    data = payload.model_dump()
    # Automatically populate buyer_company_name from the company record
    data["buyer_company_name"] = data.get("buyer_company_name") or buyer.name
    rfq = RFQ(**data, status="open")
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)

    # Notify: new RFQ posted to buyer (confirmation)
    buyer = await db.get(Company, payload.buyer_company_id)
    if buyer:
        await create_notification(
            db,
            user_id=buyer.owner_id,
            title="RFQ Posted",
            message=f"Your RFQ for {rfq.product_name} ({rfq.quantity} {rfq.unit}) has been posted. Exporters can now submit offers.",
            notification_type="rfq_posted_confirmation",
        )
    
    # Notify: new RFQ to admins for review
    await notify_admin(
        db,
        title="New RFQ Posted",
        message=f"New RFQ for {rfq.product_name} ({rfq.quantity} {rfq.unit}) posted by {rfq.buyer_company_name}.",
        notification_type="new_rfq",
    )

    return rfq


@router.get("/rfqs/{rfq_id}", response_model=RFQOut)
async def rfq(rfq_id: int, db: AsyncSession = Depends(get_db)):
    """Public: view a single RFQ."""
    item = await db.get(RFQ, rfq_id)
    if not item:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return item


@router.get("/rfqs/{rfq_id}/offers", response_model=list[OfferOut])
async def rfq_offers(
    rfq_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: buyer who owns the RFQ, exporters, or admin."""
    rfq = await db.get(RFQ, rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return list(await db.scalars(select(Offer).where(Offer.rfq_id == rfq_id).order_by(Offer.id)))


@router.post("/rfqs/{rfq_id}/offers", response_model=OfferOut)
async def create_offer(
    rfq_id: int,
    payload: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated exporters only."""
    if current_user.role not in ("exporter", "supplier", "admin"):
        raise HTTPException(status_code=403, detail="Only exporters can submit offers")
    rfq = await db.get(RFQ, rfq_id)
    exporter = await db.get(Company, payload.exporter_company_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if not exporter or exporter.type != "exporter":
        raise HTTPException(status_code=400, detail="Exporter company not found")
    if exporter.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only submit offers for your own company")
    offer = Offer(rfq_id=rfq_id, status="submitted", **payload.model_dump())
    db.add(offer)
    await db.commit()
    await db.refresh(offer)

    # Notify: offer submitted to buyer
    await notify_company_owner(
        db,
        company_id=rfq.buyer_company_id,
        title="Offer Received",
        message=f"{offer.exporter_name} submitted an offer on your RFQ for {rfq.product_name} — USD {offer.price} / {offer.quantity} {rfq.unit}.",
        notification_type="rfq_response",
    )
    
    # Notify: offer submitted to exporter (confirmation)
    await create_notification(
        db,
        user_id=exporter.owner_id,
        title="Offer Submitted",
        message=f"Your offer for {rfq.product_name} ({offer.quantity} {rfq.unit} @ USD {offer.price}) has been submitted to {rfq.buyer_company_name}.",
        notification_type="offer_submitted_confirmation",
    )

    return offer


@router.post("/rfqs/{rfq_id}/offers/{offer_id}/accept")
async def accept_offer(
    rfq_id: int,
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: buyer who owns the RFQ."""
    rfq = await db.get(RFQ, rfq_id)
    offer = await db.get(Offer, offer_id)
    if not rfq or not offer:
        raise HTTPException(status_code=404, detail="RFQ or offer not found")
    buyer_company = await db.get(Company, rfq.buyer_company_id)
    if current_user.role != "admin" and (not buyer_company or buyer_company.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Only the buyer who posted this RFQ can accept offers")
    buyer = await db.get(Company, rfq.buyer_company_id)
    exporter = await db.get(Company, offer.exporter_company_id)
    offer.status = "accepted"
    rfq.status = "awarded"
    deal = Deal(
        buyer_company_id=rfq.buyer_company_id,
        exporter_company_id=offer.exporter_company_id,
        buyer_name=buyer.name if buyer else rfq.buyer_name,
        exporter_name=exporter.name if exporter else offer.exporter_name,
        rfq_id=rfq.id,
        offer_id=offer.id,
        product_name=rfq.product_name,
        quantity=offer.quantity,
        unit=rfq.unit,
        total_amount=offer.price * offer.quantity,
        currency="USD",
        destination_country=rfq.destination_country,
        delivery_terms=offer.delivery_terms,
        status="agreed",
        escrow_status="pending_deposit",
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)

    # Notify: offer accepted — let the exporter know
    exporter = await db.get(Company, offer.exporter_company_id)
    if exporter:
        await create_notification(
            db,
            user_id=exporter.owner_id,
            title="Offer Accepted",
            message=f"Your offer on RFQ for {rfq.product_name} has been accepted by {buyer.name}. A deal room has been created.",
            notification_type="offer_accepted",
        )

    # Notify buyer if an admin accepted the offer on their behalf
    if current_user.role == "admin" and buyer_company:
        await create_notification(
            db,
            user_id=buyer_company.owner_id,
            title="RFQ Offer Accepted",
            message=f"An offer for your RFQ on {rfq.product_name} has been accepted by an administrator.",
            notification_type="offer_accepted_by_admin",
        )

    return {"message": "Offer accepted", "deal_id": deal.id}


@router.get("/exporter/rfqs-with-offers", response_model=list[RFQOut])
async def exporter_rfqs_with_offers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated exporters: list RFQs for which they have submitted offers."""
    if current_user.role not in ("exporter", "supplier", "admin"):
        raise HTTPException(status_code=403, detail="Only exporters can view their RFQs")
    companies = await db.scalars(select(Company).where(Company.owner_id == current_user.id, Company.type == "exporter"))
    company_ids = [c.id for c in companies]
    if not company_ids:
        return []
    # Get distinct RFQ ids from offers submitted by this exporter's companies
    offer_rfq_ids = await db.scalars(
        select(Offer.rfq_id)
        .where(Offer.exporter_company_id.in_(company_ids))
        .distinct()
    )
    rfq_ids = list(offer_rfq_ids)
    if not rfq_ids:
        return []
    rfqs_result = await db.scalars(select(RFQ).where(RFQ.id.in_(rfq_ids)).order_by(RFQ.id))
    return list(rfqs_result)


@router.post("/rfqs/{rfq_id}/offers/{offer_id}/reject")
async def reject_offer(
    rfq_id: int,
    offer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: buyer who owns the RFQ."""
    rfq = await db.get(RFQ, rfq_id)
    offer = await db.get(Offer, offer_id)
    if not rfq or not offer:
        raise HTTPException(status_code=404, detail="RFQ or offer not found")
    buyer_company = await db.get(Company, rfq.buyer_company_id)
    if current_user.role != "admin" and (not buyer_company or buyer_company.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Only the buyer who posted this RFQ can reject offers")
    offer.status = "rejected"
    await db.commit()
    await db.refresh(offer)

    # Notify: offer rejected
    exporter = await db.get(Company, offer.exporter_company_id)
    if exporter:
        await create_notification(
            db,
            user_id=exporter.owner_id,
            title="Offer Rejected",
            message=f"Your offer on RFQ for {rfq.product_name} has been rejected.",
            notification_type="offer_rejected",
        )

    # Notify buyer if an admin rejected the offer on their behalf
    if current_user.role == "admin" and buyer_company:
        await create_notification(
            db,
            user_id=buyer_company.owner_id,
            title="RFQ Offer Rejected",
            message=f"An offer for your RFQ on {rfq.product_name} has been rejected by an administrator.",
            notification_type="offer_rejected_by_admin",
        )

    return {"message": "Offer rejected"}
