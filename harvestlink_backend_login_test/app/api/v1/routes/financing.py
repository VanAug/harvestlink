from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.common import eligibility
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Company, FinancingRequest, User
from app.schemas.schemas import DashboardOut, FinancingCreate, FinancingOut, FinancingStatusUpdate

router = APIRouter(tags=["financing"])

PENDING_FINANCE_STATUSES = ("submitted", "under_review")
VALID_FINANCE_STATUSES = {"submitted", "under_review", "approved", "rejected"}


async def owned_companies(current_user: User, db: AsyncSession, company_type: str | None = None) -> list[Company]:
    stmt = select(Company).where(Company.owner_id == current_user.id)
    if company_type:
        stmt = stmt.where(Company.type == company_type)
    return list(await db.scalars(stmt.order_by(Company.id)))


async def assert_owned_company(
    company_id: int,
    current_user: User,
    db: AsyncSession,
    company_type: str | None = None,
) -> Company:
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company_type and company.type != company_type:
        raise HTTPException(status_code=400, detail=f"Company must be a {company_type}")
    if company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only access your own company data")
    return company


@router.get("/dashboard/{company_id}", response_model=DashboardOut)
async def dashboard(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        await assert_owned_company(company_id, current_user, db)
    return await eligibility(company_id, db)


@router.get("/financing/eligibility/{company_id}", response_model=DashboardOut)
async def finance_eligibility(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        await assert_owned_company(company_id, current_user, db)
    return await eligibility(company_id, db)


@router.get("/financing", response_model=list[FinancingOut])
async def financing(
    exporter_company_id: int | None = None,
    scope: str = Query("mine", pattern="^(mine|review|all)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(FinancingRequest).order_by(FinancingRequest.id)

    if current_user.role == "admin":
        if exporter_company_id:
            stmt = stmt.where(FinancingRequest.exporter_company_id == exporter_company_id)
        return list(await db.scalars(stmt))

    if current_user.role == "finance_partner":
        finance_companies = await owned_companies(current_user, db, "finance_partner")
        finance_company_ids = [company.id for company in finance_companies]
        if not finance_company_ids:
            return []

        if scope == "review":
            stmt = stmt.where(
                or_(
                    FinancingRequest.finance_partner_company_id.in_(finance_company_ids),
                    FinancingRequest.finance_partner_company_id.is_(None),
                ),
                FinancingRequest.status.in_(PENDING_FINANCE_STATUSES),
            )
        else:
            stmt = stmt.where(FinancingRequest.finance_partner_company_id.in_(finance_company_ids))

        if exporter_company_id:
            stmt = stmt.where(FinancingRequest.exporter_company_id == exporter_company_id)
        return list(await db.scalars(stmt))

    exporter_companies = await owned_companies(current_user, db, "exporter")
    exporter_company_ids = [company.id for company in exporter_companies]
    if not exporter_company_ids:
        return []

    if exporter_company_id:
        if exporter_company_id not in exporter_company_ids:
            raise HTTPException(status_code=403, detail="You can only view your own financing requests")
        stmt = stmt.where(FinancingRequest.exporter_company_id == exporter_company_id)
    else:
        stmt = stmt.where(FinancingRequest.exporter_company_id.in_(exporter_company_ids))

    return list(await db.scalars(stmt))


@router.post("/financing", response_model=FinancingOut)
async def create_financing(
    payload: FinancingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await assert_owned_company(payload.exporter_company_id, current_user, db, "exporter")
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
async def update_financing_status(
    request_id: int,
    payload: FinancingStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.status not in VALID_FINANCE_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid financing status")
    if current_user.role not in ("finance_partner", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only finance partners can review financing")

    item = await db.get(FinancingRequest, request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Financing request not found")

    if current_user.role == "finance_partner":
        finance_companies = await owned_companies(current_user, db, "finance_partner")
        finance_company_ids = [company.id for company in finance_companies]
        if not finance_company_ids:
            raise HTTPException(status_code=403, detail="Create a finance partner company before reviewing requests")

        if item.finance_partner_company_id and item.finance_partner_company_id not in finance_company_ids:
            raise HTTPException(status_code=403, detail="This financing request belongs to another finance partner")

        if not item.finance_partner_company_id:
            item.finance_partner_company_id = finance_company_ids[0]

    item.status = payload.status
    await db.commit()
    await db.refresh(item)
    return item
