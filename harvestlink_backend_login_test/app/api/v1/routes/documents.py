from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import TradeDocument
from app.schemas.schemas import TradeDocumentCreate, TradeDocumentOut

router = APIRouter(tags=["documents"])
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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


@router.post("/documents/upload", response_model=TradeDocumentOut)
async def upload_document(
    request: Request,
    owner_type: str = Form(...),
    owner_id: int = Form(...),
    document_type: str = Form(...),
    title: str = Form(...),
    notes: str | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    sanitized_name = Path(file.filename).name
    unique_name = f"{uuid4().hex}_{sanitized_name}"
    output_path = UPLOAD_DIR / unique_name

    try:
        contents = await file.read()
        output_path.write_bytes(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to save uploaded file: {exc}")

    file_url = f"{request.base_url.scheme}://{request.base_url.netloc}/uploads/documents/{unique_name}"
    item = TradeDocument(
        owner_type=owner_type,
        owner_id=owner_id,
        document_type=document_type,
        title=title,
        file_url=file_url,
        notes=notes,
        status="submitted",
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    document = await db.get(TradeDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.file_url and "/uploads/documents/" in document.file_url:
        uploaded_name = document.file_url.split("/uploads/documents/")[-1]
        file_path = UPLOAD_DIR / uploaded_name
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

    await db.delete(document)
    await db.commit()
    return {"detail": "Document deleted"}
