from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Company
from app.schemas.schemas import CompanyCreate, CompanyOut, CompanyUpdate

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=list[CompanyOut])
async def companies(type: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Company).order_by(Company.id)
    if type:
        stmt = stmt.where(Company.type == type)
    return list(await db.scalars(stmt))


@router.get("/companies/owner/{owner_id}", response_model=list[CompanyOut])
async def companies_by_owner(owner_id: int, db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Company).where(Company.owner_id == owner_id).order_by(Company.id)))


@router.post("/companies", response_model=CompanyOut)
async def create_company(payload: CompanyCreate, db: AsyncSession = Depends(get_db)):
    company = Company(**payload.model_dump(), verification_status="pending")
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.patch("/companies/{company_id}", response_model=CompanyOut)
async def update_company(company_id: int, payload: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/exporters", response_model=list[CompanyOut])
async def exporters(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Company).where(Company.type == "exporter").order_by(Company.id)))


@router.get("/buyers", response_model=list[CompanyOut])
async def buyers(db: AsyncSession = Depends(get_db)):
    return list(await db.scalars(select(Company).where(Company.type == "buyer").order_by(Company.id)))
