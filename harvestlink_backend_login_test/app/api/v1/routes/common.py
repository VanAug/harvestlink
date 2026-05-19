from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Deal
from app.schemas.schemas import DashboardOut


async def eligibility(company_id: int, db: AsyncSession):
    total_value = await db.scalar(select(func.coalesce(func.sum(Deal.total_amount), 0)).where(Deal.exporter_company_id == company_id))
    total_volume = await db.scalar(select(func.coalesce(func.sum(Deal.quantity), 0)).where(Deal.exporter_company_id == company_id))
    total_deals = await db.scalar(select(func.count(Deal.id)).where(Deal.exporter_company_id == company_id))
    completed = await db.scalar(select(func.count(Deal.id)).where(Deal.exporter_company_id == company_id, Deal.status == "completed"))
    score = min(100, (total_deals or 0) * 15 + float(total_value or 0) / 1000)
    eligible = round(float(total_value or 0) * 0.25, 2)
    return DashboardOut(
        company_id=company_id,
        total_deals=total_deals or 0,
        completed_deals=completed or 0,
        total_trade_value=float(total_value or 0),
        total_volume=float(total_volume or 0),
        financing_eligible_amount=eligible,
        trade_score=round(score, 2),
    )
