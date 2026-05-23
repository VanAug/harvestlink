from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import send_email_verification, send_password_reset
from app.db.session import get_db
from app.models.models import EmailVerification, PasswordReset, User
from app.schemas.schemas import (
    EmailVerificationRequest,
    EmailVerificationSendRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
)

router = APIRouter(tags=["account"])


@router.post("/auth/email/verify-request")
async def request_email_verification(
    payload: EmailVerificationSendRequest, db: AsyncSession = Depends(get_db)
):
    email = payload.email.lower()
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove any existing token for this user
    existing = await db.scalar(
        select(EmailVerification).where(EmailVerification.user_id == user.id)
    )
    if existing:
        await db.delete(existing)

    token = secrets.token_urlsafe(32)
    verification = EmailVerification(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(verification)
    await db.commit()

    # Send the verification email; surface a warning if delivery fails but
    # don't fail the request — the token is stored so the user can retry.
    sent = await send_email_verification(user.email, user.full_name, token)

    return {
        "message": "Verification email sent" if sent else "Verification link created (email delivery unavailable — check RESEND_API_KEY)",
        "email": user.email,
        # Only expose the token when email is not configured (dev/testing)
        "_dev_token": token if not sent else None,
    }


@router.post("/auth/email/verify")
async def verify_email(
    payload: EmailVerificationRequest, db: AsyncSession = Depends(get_db)
):
    verification = await db.scalar(
        select(EmailVerification).where(EmailVerification.token == payload.token)
    )
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if datetime.utcnow() > verification.expires_at:
        raise HTTPException(status_code=400, detail="Verification token has expired — please request a new one")

    user = await db.get(User, verification.user_id)
    if user:
        user.status = "verified"

    verification.is_verified = True
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/auth/password-reset/request")
async def request_password_reset(
    payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    # Always return a generic message to prevent email enumeration
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user:
        return {"message": "If an account with that email exists, a reset link has been sent"}

    existing = await db.scalar(
        select(PasswordReset).where(PasswordReset.user_id == user.id)
    )
    if existing:
        await db.delete(existing)

    token = secrets.token_urlsafe(32)
    reset = PasswordReset(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(reset)
    await db.commit()

    sent = await send_password_reset(user.email, user.full_name, token)

    return {
        "message": "If an account with that email exists, a reset link has been sent",
        # Expose token in dev when email is not configured
        "_dev_token": token if not sent else None,
    }


@router.post("/auth/password-reset/confirm")
async def confirm_password_reset(
    payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
):
    reset = await db.scalar(
        select(PasswordReset).where(PasswordReset.token == payload.token)
    )
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or already used reset token")
    if datetime.utcnow() > reset.expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired — please request a new one")

    user = await db.get(User, reset.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user.password_hash = pwd_context.hash(payload.new_password)
    await db.delete(reset)
    await db.commit()
    return {"message": "Password reset successfully"}
