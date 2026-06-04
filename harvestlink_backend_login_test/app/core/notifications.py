"""Notification service for creating in-app notifications and future email dispatch."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Company, Notification, User


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
) -> Notification:
    """Create an in-app notification for a specific user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    # Future: dispatch email here via a background task
    return notification


async def notify_company_owner(
    db: AsyncSession,
    company_id: int,
    title: str,
    message: str,
    notification_type: str,
) -> Notification | None:
    """Create a notification for the owner of a company."""
    company = await db.get(Company, company_id)
    if not company:
        return None
    return await create_notification(
        db,
        user_id=company.owner_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )


async def notify_admin(
    db: AsyncSession,
    title: str,
    message: str,
    notification_type: str,
) -> list[Notification]:
    """Create a notification for all admin users."""
    admins = await db.scalars(select(User).where(User.role == "admin"))
    notifications = []
    for admin in admins:
        n = await create_notification(
            db,
            user_id=admin.id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        notifications.append(n)
    return notifications


async def notify_rfq_responders(
    db: AsyncSession,
    rfq_id: int,
    title: str,
    message: str,
    notification_type: str,
) -> list[Notification]:
    """Notify all exporters who submitted offers on an RFQ when its status changes."""
    from app.models.models import Offer
    offers = await db.scalars(select(Offer).where(Offer.rfq_id == rfq_id))
    notifications = []
    for offer in offers:
        n = await notify_company_owner(
            db,
            company_id=offer.exporter_company_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        if n:
            notifications.append(n)
    return notifications