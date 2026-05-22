from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.models import Company, Deal, EscrowTransaction, FinancingRequest, Product, RFQ, User
from app.schemas.schemas import CompanyOut, CompanyVerificationUpdate, RoleUpdate, StatsOut, UserOut

router = APIRouter(tags=["admin"])


@router.get("/admin/overview", response_model=StatsOut)
async def overview(current_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
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


@router.get("/admin/users", response_model=list[UserOut])
async def admin_users(current_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(User).order_by(User.id))
    return list(result)


@router.patch("/admin/users/{user_id}/role", response_model=UserOut)
async def admin_update_user_role(
    user_id: int,
    payload: RoleUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    allowed_roles = {"buyer", "exporter", "finance_partner", "admin"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/admin/companies/{company_id}/verification", response_model=CompanyOut)
async def admin_update_company_verification(
    company_id: int,
    payload: CompanyVerificationUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    company.verification_status = payload.verification_status
    await db.commit()
    await db.refresh(company)
    return company
