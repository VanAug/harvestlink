from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Company, Product, RFQ, Offer, Deal, Message, EscrowTransaction, FinancingRequest, User
from app.schemas.schemas import CompanyOut, ProductOut, RFQOut, OfferOut, DealOut, MessageOut, MessageCreate, EscrowOut, FinancingOut, FinancingCreate, DashboardOut, StatsOut

router = APIRouter(tags=["harvestlink"])

@router.get("/companies", response_model=list[CompanyOut])
async def companies(type: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Company).order_by(Company.id)
    if type:
        stmt = stmt.where(Company.type == type)
    return list(await db.scalars(stmt))

@router.get("/exporters", response_model=list[CompanyOut])
async def exporters(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Company).where(Company.type == "exporter").order_by(Company.id)))

@router.get("/buyers", response_model=list[CompanyOut])
async def buyers(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Company).where(Company.type == "buyer").order_by(Company.id)))

@router.get("/products", response_model=list[ProductOut])
async def products(q: str | None = None, country: str | None = None, category: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).order_by(Product.id)
    if q:
        stmt = stmt.where(or_(Product.name.ilike(f"%{q}%"), Product.category.ilike(f"%{q}%"), Product.supplier_name.ilike(f"%{q}%")))
    if country:
        stmt = stmt.where(Product.country_of_origin == country)
    if category:
        stmt = stmt.where(Product.category == category)
    return list(await db.scalars(stmt))

@router.get("/rfqs", response_model=list[RFQOut])
async def rfqs(status: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(RFQ).order_by(RFQ.id)
    if status:
        stmt = stmt.where(RFQ.status == status)
    return list(await db.scalars(stmt))

@router.get("/rfqs/{rfq_id}/offers", response_model=list[OfferOut])
async def rfq_offers(rfq_id: int, db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Offer).where(Offer.rfq_id == rfq_id).order_by(Offer.id)))

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

@router.get("/deals", response_model=list[DealOut])
async def deals(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Deal).order_by(Deal.id)))

@router.get("/deals/{deal_id}", response_model=DealOut)
async def deal(deal_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
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
        if status == "released":
            deal.status = "completed"
    await db.commit()
    await db.refresh(item)
    return item

async def eligibility(company_id: int, db: AsyncSession):
    total_value = await db.scalar(select(func.coalesce(func.sum(Deal.total_amount), 0)).where(Deal.exporter_company_id == company_id))
    total_volume = await db.scalar(select(func.coalesce(func.sum(Deal.quantity), 0)).where(Deal.exporter_company_id == company_id))
    total_deals = await db.scalar(select(func.count(Deal.id)).where(Deal.exporter_company_id == company_id))
    completed = await db.scalar(select(func.count(Deal.id)).where(Deal.exporter_company_id == company_id, Deal.status == "completed"))
    score = min(100, (total_deals or 0) * 15 + float(total_value or 0) / 1000)
    eligible = round(float(total_value or 0) * 0.25, 2)
    return DashboardOut(company_id=company_id, total_deals=total_deals or 0, completed_deals=completed or 0, total_trade_value=float(total_value or 0), total_volume=float(total_volume or 0), financing_eligible_amount=eligible, trade_score=round(score, 2))

@router.get("/dashboard/{company_id}", response_model=DashboardOut)
async def dashboard(company_id: int, db: AsyncSession = Depends(get_db)):
    return await eligibility(company_id, db)

@router.get("/financing/eligibility/{company_id}", response_model=DashboardOut)
async def finance_eligibility(company_id: int, db: AsyncSession = Depends(get_db)):
    return await eligibility(company_id, db)

@router.get("/financing", response_model=list[FinancingOut])
async def financing(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(FinancingRequest).order_by(FinancingRequest.id)))

@router.post("/financing", response_model=FinancingOut)
async def create_financing(payload: FinancingCreate, db: AsyncSession = Depends(get_db)):
    dash = await eligibility(payload.exporter_company_id, db)
    item = FinancingRequest(
        exporter_company_id=payload.exporter_company_id,
        exporter_name=payload.exporter_name,
        requested_amount=payload.requested_amount,
        eligible_amount=dash.financing_eligible_amount,
        currency=payload.currency,
        purpose=payload.purpose,
        linked_deal_id=payload.linked_deal_id,
        score=dash.trade_score,
        status="submitted",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/admin/overview", response_model=StatsOut)
async def overview(db: AsyncSession = Depends(get_db)):
    async def c(model):
        return len(list(await db.scalars(select(model))))
    exporters_count = len(list(await db.scalars(select(Company).where(Company.type == "exporter"))))
    buyers_count = len(list(await db.scalars(select(Company).where(Company.type == "buyer"))))
    return StatsOut(
        users=await c(User),
        companies=await c(Company),
        exporters=exporters_count,
        buyers=buyers_count,
        products=await c(Product),
        rfqs=await c(RFQ),
        deals=await c(Deal),
        escrow_transactions=await c(EscrowTransaction),
        financing_requests=await c(FinancingRequest),
    )
