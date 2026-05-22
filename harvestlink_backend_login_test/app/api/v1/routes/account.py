from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import EmailVerification, PasswordReset, User
from app.schemas.schemas import EmailVerificationRequest, EmailVerificationSendRequest, PasswordResetConfirm, PasswordResetRequest

router = APIRouter(tags=["account"])


@router.post("/auth/email/verify-request")
async def request_email_verification(payload: EmailVerificationSendRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.scalar(select(EmailVerification).where(EmailVerification.user_id == user.id))
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
    return {"message": "Verification email sent", "token": token, "email": user.email}


@router.post("/auth/email/verify")
async def verify_email(payload: EmailVerificationRequest, db: AsyncSession = Depends(get_db)):
    verification = await db.scalar(select(EmailVerification).where(EmailVerification.token == payload.token))
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid token")
    if datetime.utcnow() > verification.expires_at:
        raise HTTPException(status_code=400, detail="Token expired")

    user = await db.get(User, verification.user_id)
    if user:
        user.status = "verified"

    verification.is_verified = True
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/auth/password-reset/request")
async def request_password_reset(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user:
        return {"message": "If account exists, reset link will be sent"}

    existing = await db.scalar(select(PasswordReset).where(PasswordReset.user_id == user.id))
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
    return {"message": "If account exists, reset link will be sent", "token": token}


@router.post("/auth/password-reset/confirm")
async def confirm_password_reset(payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    reset = await db.scalar(select(PasswordReset).where(PasswordReset.token == payload.token))
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid token")
    if datetime.utcnow() > reset.expires_at:
        raise HTTPException(status_code=400, detail="Token expired")

    user = await db.get(User, reset.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    user.password_hash = pwd_context.hash(payload.new_password)
    await db.delete(reset)
    await db.commit()
    return {"message": "Password reset successfully"}
