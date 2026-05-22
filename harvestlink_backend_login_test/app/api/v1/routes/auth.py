from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    security_scheme,
    get_current_admin_user,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, RegisterRequest, Token, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id, user.role, user.email)
    return Token(access_token=token, role=user.role, user_id=user.id, email=user.email, full_name=user.full_name)

@router.post("/register", response_model=Token)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    allowed_roles = {"buyer", "exporter", "finance_partner"}
    if payload.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Choose buyer, exporter, or finance_partner")
    email = payload.email.lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password), role=payload.role, status="active")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role, user.email)
    return Token(access_token=token, role=user.role, user_id=user.id, email=user.email, full_name=user.full_name)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user

@router.get("/validate", response_model=UserOut)
async def validate_token(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=list[UserOut])
async def users(current_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(User).order_by(User.id))
    return list(result)
