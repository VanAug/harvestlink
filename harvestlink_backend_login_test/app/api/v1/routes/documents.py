from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Company, TradeDocument, User
from app.schemas.schemas import TradeDocumentCreate, TradeDocumentOut
from app.core.config import settings
import httpx

router = APIRouter(tags=["documents"])
UPLOAD_DIR = Path("/tmp/uploads/documents")


async def _assert_document_owner(doc: TradeDocument, current_user: User, db: AsyncSession):
    """Raise 403 if the document's owning company does not belong to the current user."""
    if current_user.role == "admin":
        return
    if doc.owner_type == "company":
        company = await db.get(Company, doc.owner_id)
        if company and company.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only manage documents for your own company")
    # For deal/offer documents we allow participants — deal-level checks cover this.


@router.get("/documents", response_model=list[TradeDocumentOut])
async def documents(
    owner_type: str | None = None,
    owner_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(TradeDocument).order_by(TradeDocument.id)
    if owner_type:
        stmt = stmt.where(TradeDocument.owner_type == owner_type)
    if owner_id:
        stmt = stmt.where(TradeDocument.owner_id == owner_id)
    return list(await db.scalars(stmt))


@router.post("/documents", response_model=TradeDocumentOut)
async def create_document(
    payload: TradeDocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    current_user: User = Depends(get_current_user),
):
    # Ownership check for company documents
    if owner_type == "company":
        company = await db.get(Company, owner_id)
        if company and company.owner_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You can only upload documents for your own company")

    sanitized_name = Path(file.filename).name
    unique_name = f"{uuid4().hex}_{sanitized_name}"
    contents = await file.read()

    file_url: str | None = None

    # 1. Try Vercel Blob storage first (persistent — works in serverless production)
    if settings.VERCEL_BLOB_UPLOAD_URL and settings.VERCEL_BLOB_TOKEN:
        try:
            headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}"}
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    settings.VERCEL_BLOB_UPLOAD_URL,
                    headers=headers,
                    files={"file": (unique_name, contents)},
                )
            if resp.is_success:
                data = resp.json()
                if data and isinstance(data, dict) and data.get("url"):
                    file_url = data["url"]
                elif settings.VERCEL_BLOB_BASE_URL:
                    file_url = f"{settings.VERCEL_BLOB_BASE_URL.rstrip('/')}/{unique_name}"
        except Exception:
            pass  # Fall through to local storage

    # 2. Fall back to local /tmp (dev / non-serverless environments only)
    if file_url is None:
        try:
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            output_path = UPLOAD_DIR / unique_name
            output_path.write_bytes(contents)
            base = f"{request.base_url.scheme}://{request.base_url.netloc}"
            file_url = f"{base}/uploads/documents/{unique_name}"
        except OSError:
            raise HTTPException(
                status_code=500,
                detail=(
                    "File storage unavailable. "
                    "Configure VERCEL_BLOB_UPLOAD_URL and VERCEL_BLOB_TOKEN environment variables "
                    "to enable persistent document uploads."
                ),
            )

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
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await db.get(TradeDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    await _assert_document_owner(document, current_user, db)

    # Delete physical file if stored locally
    if document.file_url and "/uploads/documents/" in document.file_url:
        uploaded_name = document.file_url.split("/uploads/documents/")[-1]
        file_path = UPLOAD_DIR / uploaded_name
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass
    else:
        # Attempt blob deletion
        try:
            if settings.VERCEL_BLOB_DELETE_URL and settings.VERCEL_BLOB_TOKEN:
                headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}", "Content-Type": "application/json"}
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.request("DELETE", settings.VERCEL_BLOB_DELETE_URL, headers=headers, json={"url": document.file_url})
            elif settings.VERCEL_BLOB_UPLOAD_URL and settings.VERCEL_BLOB_TOKEN:
                headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}", "Content-Type": "application/json"}
                filename = document.file_url.rsplit("/", 1)[-1]
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.request("DELETE", settings.VERCEL_BLOB_UPLOAD_URL, headers=headers, json={"file": filename, "url": document.file_url})
        except Exception:
            pass

    await db.delete(document)
    await db.commit()
    return {"detail": "Document deleted"}
