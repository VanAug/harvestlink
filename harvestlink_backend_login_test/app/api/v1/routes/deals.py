from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Deal, EscrowTransaction, Message
from app.schemas.schemas import DealOut, DealStatusUpdate, EscrowOut, MessageCreate, MessageOut

router = APIRouter(tags=["deals"])


@router.get("/deals", response_model=list[DealOut])
async def deals(exporter_company_id: int | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Deal).order_by(Deal.id)
    if exporter_company_id:
        stmt = stmt.where(Deal.exporter_company_id == exporter_company_id)
    return list(await db.scalars(stmt))


@router.get("/deals/{deal_id}", response_model=DealOut)
async def deal(deal_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    return item


@router.patch("/deals/{deal_id}/status", response_model=DealOut)
async def update_deal_status(deal_id: int, payload: DealStatusUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    item.status = payload.status
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/deals/{deal_id}/messages", response_model=list[MessageOut])
async def messages(deal_id: int, db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Message).where(Message.deal_id == deal_id).order_by(Message.id)))


@router.post("/deals/{deal_id}/messages", response_model=MessageOut)
async def create_message(deal_id: int, payload: MessageCreate, db: AsyncSession = Depends(get_db)):
    msg = Message(deal_id=deal_id, **payload.model_dump())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/escrow", response_model=list[EscrowOut])
async def escrow(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(EscrowTransaction).order_by(EscrowTransaction.id)))


@router.post("/deals/{deal_id}/escrow", response_model=EscrowOut)
async def create_escrow(deal_id: int, db: AsyncSession = Depends(get_db)):
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
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
async def update_escrow(escrow_id: int, status: str, db: AsyncSession = Depends(get_db)):
    item = await db.get(EscrowTransaction, escrow_id)
    if not item:
        raise HTTPException(status_code=404, detail="Escrow not found")
    item.status = status
    deal = await db.get(Deal, item.deal_id)
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
