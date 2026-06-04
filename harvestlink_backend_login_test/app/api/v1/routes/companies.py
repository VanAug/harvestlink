from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.notifications import notify_admin
from app.db.session import get_db
from app.models.models import Company, User
from app.schemas.schemas import CompanyCreate, CompanyOut, CompanyUpdate

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=list[CompanyOut])
async def companies(type: str | None = None, db: AsyncSession = Depends(get_db)):
    """Public: browse the supplier/exporter directory."""
    stmt = select(Company).order_by(Company.id)
    if type:
        stmt = stmt.where(Company.type == type)
    return list(await db.scalars(stmt))


@router.get("/companies/{company_id}", response_model=CompanyOut)
async def company_by_id(company_id: int, db: AsyncSession = Depends(get_db)):
    """Public: view a single company by ID (for supplier profiles)."""
    item = await db.get(Company, company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Company not found")
    return item


@router.get("/companies/owner/{owner_id}", response_model=list[CompanyOut])
async def companies_by_owner(
    owner_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: users can only fetch their own companies (admin sees any)."""
    if current_user.id != owner_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only view your own companies")
    return list(await db.scalars(select(Company).where(Company.owner_id == owner_id).order_by(Company.id)))


@router.post("/companies", response_model=CompanyOut)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: create a company profile for yourself."""
    if payload.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only create companies for your own account")
    company = Company(**payload.model_dump(), verification_status="pending")
    db.add(company)
    await db.commit()
    await db.refresh(company)

    # Notify: new company registered — alert admin for verification review
    await notify_admin(
        db,
        title="New Company Registered",
        message=f"New {company.type} company '{company.name}' ({company.country}) has registered and is awaiting verification.",
        notification_type="new_company",
    )

    return company


@router.patch("/companies/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: int,
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: owner or admin."""
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only edit your own company profile")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/exporters", response_model=list[CompanyOut])
async def exporters(db: AsyncSession = Depends(get_db)):
    """Public: list all exporter companies."""
    return list(await db.scalars(select(Company).where(Company.type == "exporter").order_by(Company.id)))


@router.get("/buyers", response_model=list[CompanyOut])
async def buyers(db: AsyncSession = Depends(get_db)):
    """Public: list all buyer companies."""
    return list(await db.scalars(select(Company).where(Company.type == "buyer").order_by(Company.id)))
