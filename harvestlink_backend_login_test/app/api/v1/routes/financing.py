from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.common import eligibility
from app.db.session import get_db
from app.models.models import FinancingRequest
from app.schemas.schemas import DashboardOut, FinancingCreate, FinancingOut, FinancingStatusUpdate

router = APIRouter(tags=["financing"])


@router.get("/dashboard/{company_id}", response_model=DashboardOut)
async def dashboard(company_id: int, db: AsyncSession = Depends(get_db)):
    return await eligibility(company_id, db)


@router.get("/financing/eligibility/{company_id}", response_model=DashboardOut)
async def finance_eligibility(company_id: int, db: AsyncSession = Depends(get_db)):
    return await eligibility(company_id, db)


@router.get("/financing", response_model=list[FinancingOut])
async def financing(exporter_company_id: int | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(FinancingRequest).order_by(FinancingRequest.id)
    if exporter_company_id:
        stmt = stmt.where(FinancingRequest.exporter_company_id == exporter_company_id)
    return list(await db.scalars(stmt))


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


@router.patch("/financing/{request_id}/status", response_model=FinancingOut)
async def update_financing_status(request_id: int, payload: FinancingStatusUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(FinancingRequest, request_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financing request not found")
    item.status = payload.status
    await db.commit()
    await db.refresh(item)
    return item
