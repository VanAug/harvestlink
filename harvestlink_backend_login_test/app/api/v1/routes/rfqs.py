from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Company, Deal, Offer, RFQ
from app.schemas.schemas import OfferCreate, OfferOut, RFQCreate, RFQOut

router = APIRouter(tags=["rfqs"])


@router.get("/rfqs", response_model=list[RFQOut])
async def rfqs(status: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(RFQ).order_by(RFQ.id)
    if status:
        stmt = stmt.where(RFQ.status == status)
    return list(await db.scalars(stmt))


@router.post("/rfqs", response_model=RFQOut)
async def create_rfq(payload: RFQCreate, db: AsyncSession = Depends(get_db)):
    buyer = await db.get(Company, payload.buyer_company_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer company not found")
    if buyer.type != "buyer":
        raise HTTPException(status_code=400, detail="RFQs can only be created by buyer companies")
    rfq = RFQ(**payload.model_dump(), status="open")
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)
    return rfq


@router.get("/rfqs/{rfq_id}", response_model=RFQOut)
async def rfq(rfq_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(RFQ, rfq_id)
    if not item:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return item


@router.get("/rfqs/{rfq_id}/offers", response_model=list[OfferOut])
async def rfq_offers(rfq_id: int, db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Offer).where(Offer.rfq_id == rfq_id).order_by(Offer.id)))


@router.post("/rfqs/{rfq_id}/offers", response_model=OfferOut)
async def create_offer(rfq_id: int, payload: OfferCreate, db: AsyncSession = Depends(get_db)):
    rfq = await db.get(RFQ, rfq_id)
    exporter = await db.get(Company, payload.exporter_company_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if not exporter or exporter.type != "exporter":
        raise HTTPException(status_code=400, detail="Exporter company not found")
    offer = Offer(rfq_id=rfq_id, status="submitted", **payload.model_dump())
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    return offer


@router.post("/rfqs/{rfq_id}/offers/{offer_id}/accept")
async def accept_offer(rfq_id: int, offer_id: int, db: AsyncSession = Depends(get_db)):
    rfq = await db.get(RFQ, rfq_id)
    offer = await db.get(Offer, offer_id)
    if not rfq or not offer:
        raise HTTPException(status_code=404, detail="RFQ or offer not found")
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
    return {"message": "Offer accepted", "deal_id": deal.id}


@router.post("/rfqs/{rfq_id}/offers/{offer_id}/reject")
async def reject_offer(rfq_id: int, offer_id: int, db: AsyncSession = Depends(get_db)):
    rfq = await db.get(RFQ, rfq_id)
    offer = await db.get(Offer, offer_id)
    if not rfq or not offer:
        raise HTTPException(status_code=404, detail="RFQ or offer not found")
    offer.status = "rejected"
    await db.commit()
    await db.refresh(offer)
    return {"message": "Offer rejected"}
