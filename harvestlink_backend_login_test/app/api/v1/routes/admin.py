from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Company, Deal, EscrowTransaction, FinancingRequest, Product, RFQ, User
from app.schemas.schemas import StatsOut

router = APIRouter(tags=["admin"])


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
