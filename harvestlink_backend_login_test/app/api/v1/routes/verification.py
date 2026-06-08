"""Exporter verification workflow routes."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, get_current_admin_user
from app.core.notifications import create_notification
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserOut, VerificationStatusOut, VerificationSubmitIn

router = APIRouter(tags=["verification"])


@router.get("/verification/status", response_model=VerificationStatusOut)
async def get_verification_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current exporter verification status for the authenticated user."""
    if current_user.role not in ("exporter", "supplier"):
        raise HTTPException(status_code=403, detail="Only exporters have a verification status")
    
    reviewed_by_name = None
    if current_user.exporter_verification_reviewed_by_admin_id:
        admin = await db.get(User, current_user.exporter_verification_reviewed_by_admin_id)
        if admin:
            reviewed_by_name = admin.full_name

    return VerificationStatusOut(
        status=current_user.exporter_verification_status,
        submitted_at=current_user.exporter_verification_submitted_at,
        reviewed_at=current_user.exporter_verification_reviewed_at,
        reviewed_by=reviewed_by_name,
    )


@router.post("/verification/submit", response_model=VerificationStatusOut)
async def submit_verification(
    payload: VerificationSubmitIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an exporter verification request. Only exporters/suppliers can submit."""
    if current_user.role not in ("exporter", "supplier"):
        raise HTTPException(status_code=403, detail="Only exporters can submit verification requests")

    if current_user.exporter_verification_status == "approved":
        raise HTTPException(status_code=400, detail="Your account is already verified")

    current_user.exporter_verification_status = "pending"
    current_user.exporter_verification_submitted_at = datetime.now(timezone.utc)
    current_user.exporter_verification_reviewed_at = None
    current_user.exporter_verification_reviewed_by_admin_id = None
    await db.commit()
    await db.refresh(current_user)

    # Notify: all admins that a new verification request was submitted
    admins = await db.scalars(select(User).where(User.role == "admin"))
    for admin in admins:
        await create_notification(
            db,
            user_id=admin.id,
            title="Exporter Verification Submitted",
            message=f"{current_user.full_name} ({current_user.email}) has submitted an exporter verification request.",
            notification_type="verification_submitted",
        )

    return VerificationStatusOut(
        status=current_user.exporter_verification_status,
        submitted_at=current_user.exporter_verification_submitted_at,
    )


@router.get("/admin/verification/pending", response_model=list[UserOut])
async def admin_pending_verifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Admin: list all users pending exporter verification."""
    users = await db.scalars(
        select(User)
        .where(
            User.role.in_(["exporter", "supplier"]),
            User.exporter_verification_status == "pending",
        )
        .order_by(User.exporter_verification_submitted_at.desc().nullslast())
    )
    return list(users)


@router.post("/admin/verification/{user_id}/approve", response_model=UserOut)
async def admin_approve_verification(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Admin: approve an exporter verification request."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ("exporter", "supplier"):
        raise HTTPException(status_code=400, detail="User is not an exporter")

    user.exporter_verification_status = "approved"
    user.exporter_verification_reviewed_at = datetime.now(timezone.utc)
    user.exporter_verification_reviewed_by_admin_id = current_user.id
    await db.commit()
    await db.refresh(user)

    # Notify the exporter that they've been approved
    await create_notification(
        db,
        user_id=user.id,
        title="Exporter Verification Approved",
        message=f"Your exporter account has been verified and approved by {current_user.full_name}. You can now create products, respond to RFQs, and participate in deals.",
        notification_type="verification_approved",
    )

    return user


@router.post("/admin/verification/{user_id}/reject", response_model=UserOut)
async def admin_reject_verification(
    user_id: int,
    payload: VerificationSubmitIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Admin: reject an exporter verification request."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ("exporter", "supplier"):
        raise HTTPException(status_code=400, detail="User is not an exporter")

    user.exporter_verification_status = "rejected"
    user.exporter_verification_reviewed_at = datetime.now(timezone.utc)
    user.exporter_verification_reviewed_by_admin_id = current_user.id
    await db.commit()
    await db.refresh(user)

    reason = payload.notes or "No reason provided"
    # Notify the exporter that they've been rejected
    await create_notification(
        db,
        user_id=user.id,
        title="Exporter Verification Rejected",
        message=f"Your exporter verification request was rejected by {current_user.full_name}. Reason: {reason}",
        notification_type="verification_rejected",
    )

    return user