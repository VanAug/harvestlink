from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.notifications import create_notification
from app.db.session import get_db
from app.models.models import Company, Deal, Review, ShippingTracking, User
from app.schemas.schemas import ReviewCreate, ReviewOut, ShippingTrackingCreate, ShippingTrackingOut, ShippingTrackingUpdate

router = APIRouter(tags=["tracking"])


async def _assert_deal_participant(deal: Deal, current_user: User, db: AsyncSession):
    if current_user.role in ("admin", "finance_partner"):
        return
    user_companies = list(await db.scalars(select(Company).where(Company.owner_id == current_user.id)))
    company_ids = {c.id for c in user_companies}
    if not company_ids.intersection({deal.buyer_company_id, deal.exporter_company_id}):
        raise HTTPException(status_code=403, detail="You are not a participant in this deal")


@router.get("/tracking", response_model=list[ShippingTrackingOut])
async def tracking_list(
    deal_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(ShippingTracking).order_by(ShippingTracking.id)
    if deal_id:
        stmt = stmt.where(ShippingTracking.deal_id == deal_id)
    return list(await db.scalars(stmt))


@router.get("/tracking/{tracking_id}", response_model=ShippingTrackingOut)
async def tracking_detail(
    tracking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(ShippingTracking, tracking_id)
    if not item:
        raise HTTPException(status_code=404, detail="Tracking not found")
    return item


@router.post("/deals/{deal_id}/tracking", response_model=ShippingTrackingOut)
async def create_tracking(
    deal_id: int,
    payload: ShippingTrackingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(deal, current_user, db)
    existing = await db.scalar(select(ShippingTracking).where(ShippingTracking.deal_id == deal_id))
    if existing:
        raise HTTPException(status_code=400, detail="Tracking already exists for this deal")
    tracking = ShippingTracking(deal_id=deal_id, **payload.model_dump(), status="pending")
    db.add(tracking)
    await db.commit()
    await db.refresh(tracking)
    
    # Notify: tracking created
    buyer_company = await db.get(Company, deal.buyer_company_id)
    exporter_company = await db.get(Company, deal.exporter_company_id)
    
    if buyer_company:
        await create_notification(
            db,
            user_id=buyer_company.owner_id,
            title="Shipment Tracking Started",
            message=f"Tracking has been created for deal #{deal_id} ({deal.product_name}). Shipment reference: {payload.shipment_reference or 'Pending'}",
            notification_type="tracking_created",
        )
    if exporter_company:
        await create_notification(
            db,
            user_id=exporter_company.owner_id,
            title="Shipment Tracking Started",
            message=f"Tracking has been created for deal #{deal_id} ({deal.product_name}). Shipment reference: {payload.shipment_reference or 'Pending'}",
            notification_type="tracking_created",
        )
    
    return tracking


@router.patch("/tracking/{tracking_id}", response_model=ShippingTrackingOut)
async def update_tracking(
    tracking_id: int,
    payload: ShippingTrackingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(ShippingTracking, tracking_id)
    if not item:
        raise HTTPException(status_code=404, detail="Tracking not found")
    deal = await db.get(Deal, item.deal_id)
    if deal:
        await _assert_deal_participant(deal, current_user, db)
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    
    # Notify: tracking updated
    if deal and changes:
        buyer_company = await db.get(Company, deal.buyer_company_id)
        exporter_company = await db.get(Company, deal.exporter_company_id)
        
        # Build change summary
        change_summary = ", ".join([f"{k.replace('_', ' ')}" for k in changes.keys()])
        
        if buyer_company:
            await create_notification(
                db,
                user_id=buyer_company.owner_id,
                title="Shipment Update",
                message=f"Tracking for deal #{item.deal_id} has been updated: {change_summary}. Status: {item.status.replace('_', ' ').title()}",
                notification_type="tracking_updated",
            )
        if exporter_company:
            await create_notification(
                db,
                user_id=exporter_company.owner_id,
                title="Shipment Update",
                message=f"Tracking for deal #{item.deal_id} has been updated: {change_summary}. Status: {item.status.replace('_', ' ').title()}",
                notification_type="tracking_updated",
            )
    
    return item


@router.get("/reviews", response_model=list[ReviewOut])
async def reviews_list(
    deal_id: int | None = None,
    reviewed_company_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Review).order_by(Review.id.desc())
    if deal_id:
        stmt = stmt.where(Review.deal_id == deal_id)
    if reviewed_company_id:
        stmt = stmt.where(Review.reviewed_company_id == reviewed_company_id)
    return list(await db.scalars(stmt))


@router.post("/deals/{deal_id}/reviews", response_model=ReviewOut)
async def create_review(
    deal_id: int,
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(deal, current_user, db)
    reviewer_company_id = payload.reviewer_company_id or deal.buyer_company_id
    existing = await db.scalar(
        select(Review).where(Review.deal_id == deal_id, Review.reviewer_company_id == reviewer_company_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists from this reviewer")
    reviewer = await db.get(Company, reviewer_company_id)
    review = Review(
        deal_id=deal_id,
        reviewer_company_id=reviewer_company_id,
        reviewer_name=reviewer.name if reviewer else deal.buyer_name,
        **payload.model_dump(exclude={"reviewer_company_id"}),
        status="submitted",
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review
