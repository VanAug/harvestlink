from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import LoginRequest, RegisterRequest, Token, UserOut
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id, user.role, user.email)
    return Token(access_token=token, role=user.role, user_id=user.id, email=user.email, full_name=user.full_name)

@router.post("/register", response_model=Token)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=payload.email, full_name=payload.full_name, password_hash=hash_password(payload.password), role=payload.role, status="active")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role, user.email)
    return Token(access_token=token, role=user.role, user_id=user.id, email=user.email, full_name=user.full_name)

@router.get("/users", response_model=list[UserOut])
async def users(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(User).order_by(User.id))
    return list(result)
