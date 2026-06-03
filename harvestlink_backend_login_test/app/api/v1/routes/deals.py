from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Company, Deal, EscrowTransaction, Message, User
from app.schemas.schemas import DealCreate, DealOut, DealStatusUpdate, EscrowOut, MessageCreate, MessageOut

router = APIRouter(tags=["deals"])


async def _assert_deal_participant(deal: Deal, current_user: User, db: AsyncSession):
    """Raise 403 if the user is not party to this deal and not admin."""
    if current_user.role == "admin":
        return
    user_companies = list(await db.scalars(
        select(Company).where(Company.owner_id == current_user.id)
    ))
    company_ids = {c.id for c in user_companies}
    if deal.buyer_company_id not in company_ids and deal.exporter_company_id not in company_ids:
        if current_user.role != "finance_partner":
            raise HTTPException(status_code=403, detail="You are not a participant in this deal")


@router.get("/deals", response_model=list[DealOut])
async def deals(
    exporter_company_id: int | None = None,
    buyer_company_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: users see only their own deals (admin sees all)."""
    stmt = select(Deal).order_by(Deal.id)
    if current_user.role in ("admin", "finance_partner"):
        if exporter_company_id is not None:
            stmt = stmt.where(Deal.exporter_company_id == exporter_company_id)
        if buyer_company_id is not None:
            stmt = stmt.where(Deal.buyer_company_id == buyer_company_id)
    else:
        if exporter_company_id is not None:
            stmt = stmt.where(Deal.exporter_company_id == exporter_company_id)
        elif buyer_company_id is not None:
            stmt = stmt.where(Deal.buyer_company_id == buyer_company_id)
        else:
            user_companies = list(await db.scalars(
                select(Company).where(Company.owner_id == current_user.id)
            ))
            company_ids = [c.id for c in user_companies]
            if not company_ids:
                return []
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    Deal.buyer_company_id.in_(company_ids),
                    Deal.exporter_company_id.in_(company_ids),
                )
            )
    return list(await db.scalars(stmt))


@router.get("/deals/{deal_id}", response_model=DealOut)
async def deal(
    deal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(item, current_user, db)
    return item


@router.post("/deals", response_model=DealOut, status_code=201)
async def create_deal(
    payload: DealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("buyer", "exporter", "supplier", "admin"):
        raise HTTPException(status_code=403, detail="Only buyers, exporters, and admins can create deals")
    deal = Deal(**payload.model_dump())
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


@router.patch("/deals/{deal_id}/status", response_model=DealOut)
async def update_deal_status(
    deal_id: int,
    payload: DealStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(item, current_user, db)
    item.status = payload.status
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/deals/{deal_id}/messages", response_model=list[MessageOut])
async def messages(
    deal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(item, current_user, db)
    return list(await db.scalars(select(Message).where(Message.deal_id == deal_id).order_by(Message.id)))


@router.post("/deals/{deal_id}/messages", response_model=MessageOut)
async def create_message(
    deal_id: int,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(item, current_user, db)
    msg = Message(deal_id=deal_id, **payload.model_dump())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/escrow", response_model=list[EscrowOut])
async def escrow(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return escrow records scoped to the current user's companies."""
    if current_user.role in ("admin", "finance_partner"):
        return list(await db.scalars(select(EscrowTransaction).order_by(EscrowTransaction.id)))
    user_companies = list(await db.scalars(
        select(Company).where(Company.owner_id == current_user.id)
    ))
    company_ids = [c.id for c in user_companies]
    if not company_ids:
        return []
    from sqlalchemy import or_
    stmt = select(EscrowTransaction).where(
        or_(
            EscrowTransaction.payer_company_id.in_(company_ids),
            EscrowTransaction.recipient_company_id.in_(company_ids),
        )
    ).order_by(EscrowTransaction.id)
    return list(await db.scalars(stmt))


@router.post("/deals/{deal_id}/escrow", response_model=EscrowOut)
async def create_escrow(
    deal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await _assert_deal_participant(deal, current_user, db)
    existing = await db.scalar(select(EscrowTransaction).where(EscrowTransaction.deal_id == deal_id))
    if existing:
        return existing
    escrow = EscrowTransaction(
        deal_id=deal.id,
        payment_reference=f"HL-ESC-{deal.id:05d}",
        amount=deal.total_amount,
        currency=deal.currency,
        fees=round(deal.total_amount * 0.015, 2),
        payer_company_id=deal.buyer_company_id,
        recipient_company_id=deal.exporter_company_id,
        status="pending_deposit",
    )
    db.add(escrow)
    await db.commit()
    await db.refresh(escrow)
    return escrow


@router.patch("/escrow/{escrow_id}/status", response_model=EscrowOut)
async def update_escrow(
    escrow_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(EscrowTransaction, escrow_id)
    if not item:
        raise HTTPException(status_code=404, detail="Escrow not found")
    deal = await db.get(Deal, item.deal_id)
    if deal:
        await _assert_deal_participant(deal, current_user, db)
    item.status = status
    if deal:
        deal.escrow_status = status
        if status == "funded":
            deal.status = "funds_in_escrow"
        if status == "release_requested":
            deal.status = "release_requested"
        if status == "released":
            deal.status = "completed"
    await db.commit()
    await db.refresh(item)
    return item
