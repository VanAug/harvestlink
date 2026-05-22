from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import TradeDocument
from app.schemas.schemas import TradeDocumentCreate, TradeDocumentOut
from app.core.config import settings
import httpx

router = APIRouter(tags=["documents"])
# Use the system temporary directory on platforms like Vercel where the project
# filesystem is read-only. /tmp is writable for the lifetime of the function
# invocation. Do NOT call mkdir() at module import time.
UPLOAD_DIR = Path("/tmp/uploads/documents")


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

    contents = await file.read()

    # Try to save locally first (create dirs at runtime). If the filesystem is read-only
    # or creation fails, upload to Vercel Blob when configured.
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        output_path = UPLOAD_DIR / unique_name
        output_path.write_bytes(contents)
        file_url = f"{request.base_url.scheme}://{request.base_url.netloc}/uploads/documents/{unique_name}"
    except OSError:
        # fallback to blob storage if configured
        if settings.VERCEL_BLOB_UPLOAD_URL and settings.VERCEL_BLOB_TOKEN:
            try:
                headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}"}
                async with httpx.AsyncClient() as client:
                    files = {"file": (unique_name, contents)}
                    resp = await client.post(settings.VERCEL_BLOB_UPLOAD_URL, headers=headers, files=files)
                if not resp.is_success:
                    raise HTTPException(status_code=500, detail=f"Vercel Blob upload failed: {resp.status_code} {resp.text}")
                data = resp.json()
                # Prefer an explicit URL returned by the blob endpoint, else try base url + name
                if data and isinstance(data, dict) and data.get("url"):
                    file_url = data.get("url")
                elif settings.VERCEL_BLOB_BASE_URL:
                    file_url = f"{settings.VERCEL_BLOB_BASE_URL.rstrip('/')}/{unique_name}"
                else:
                    # Last resort: include raw response body
                    file_url = resp.text
            except Exception as exc:
                raise HTTPException(status_code=500, detail=f"Unable to save uploaded file to blob: {exc}")
        else:
            raise HTTPException(status_code=500, detail="Unable to save uploaded file: storage unavailable")
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

    # If the document is stored locally under /uploads/documents/, delete the file
    if document.file_url and "/uploads/documents/" in document.file_url:
        uploaded_name = document.file_url.split("/uploads/documents/")[-1]
        file_path = UPLOAD_DIR / uploaded_name
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass
    else:
        # Attempt to delete from blob storage when configured. Try a DELETE to the
        # configured VERCEL_BLOB_DELETE_URL if present, otherwise send a DELETE to
        # VERCEL_BLOB_UPLOAD_URL with JSON body containing the file name/url.
        try:
            if settings.VERCEL_BLOB_DELETE_URL and settings.VERCEL_BLOB_TOKEN:
                headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}", "Content-Type": "application/json"}
                async with httpx.AsyncClient() as client:
                    await client.request("DELETE", settings.VERCEL_BLOB_DELETE_URL, headers=headers, json={"url": document.file_url})
            elif settings.VERCEL_BLOB_UPLOAD_URL and settings.VERCEL_BLOB_TOKEN:
                # Fallback: some blob endpoints accept DELETE against the upload URL
                headers = {"Authorization": f"Bearer {settings.VERCEL_BLOB_TOKEN}", "Content-Type": "application/json"}
                filename = document.file_url.rsplit("/", 1)[-1]
                async with httpx.AsyncClient() as client:
                    await client.request("DELETE", settings.VERCEL_BLOB_UPLOAD_URL, headers=headers, json={"file": filename, "url": document.file_url})
        except Exception:
            # Do not block deletion of DB record if blob deletion fails; log and continue
            pass

    await db.delete(document)
    await db.commit()
    return {"detail": "Document deleted"}
