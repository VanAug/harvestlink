from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import TradeDocument
from app.schemas.schemas import TradeDocumentCreate, TradeDocumentOut

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=list[TradeDocumentOut])
async def documents(owner_type: str | None = None, owner_id: int | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(TradeDocument).order_by(TradeDocument.id)
    if owner_type:
        stmt = stmt.where(TradeDocument.owner_type == owner_type)
    if owner_id:
        stmt = stmt.where(TradeDocument.owner_id == owner_id)
    return list(await db.scalars(stmt))


@router.post("/documents", response_model=TradeDocumentOut)
async def create_document(payload: TradeDocumentCreate, db: AsyncSession = Depends(get_db)):
    item = TradeDocument(**payload.model_dump(), status="submitted")
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
