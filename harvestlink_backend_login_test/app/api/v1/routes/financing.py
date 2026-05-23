from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.common import eligibility
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import FinancingRequest, User
from app.schemas.schemas import DashboardOut, FinancingCreate, FinancingOut

router = APIRouter(tags=["financing"])


@router.get("/dashboard/{company_id}", response_model=DashboardOut)
async def dashboard(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await eligibility(company_id, db)


@router.get("/financing/eligibility/{company_id}", response_model=DashboardOut)
async def finance_eligibility(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await eligibility(company_id, db)


@router.get("/financing", response_model=list[FinancingOut])
async def financing(
    exporter_company_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(FinancingRequest).order_by(FinancingRequest.id)
    if exporter_company_id:
        stmt = stmt.where(FinancingRequest.exporter_company_id == exporter_company_id)
    return list(await db.scalars(stmt))


@router.post("/financing", response_model=FinancingOut)
async def create_financing(
    payload: FinancingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
