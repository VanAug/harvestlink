from pathlib import Path
from uuid import uuid4
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import cloudinary
import cloudinary.uploader

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Company, TradeDocument, User
from app.schemas.schemas import TradeDocumentCreate, TradeDocumentOut
from app.core.config import settings

router = APIRouter(tags=["documents"])
UPLOAD_DIR = Path("/tmp/uploads/documents")

# Extensions that should use resource_type="raw" (documents, not images)
_RAW_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".zip", ".rar", ".7z"}

# Image extensions that can use resource_type="image" (default)
_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".tif"}


def _init_cloudinary() -> bool:
    """Configure the Cloudinary module if credentials are present."""
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        return True
    return False


def _detect_resource_type(filename: str) -> str:
    """Return 'raw' for documents, 'image' for images, 'auto' otherwise."""
    ext = Path(filename).suffix.lower()
    if ext in _RAW_EXTENSIONS:
        return "raw"
    if ext in _IMAGE_EXTENSIONS:
        return "image"
    return "auto"


def _cloudinary_public_id(file_path: str) -> str | None:
    """Extract the Cloudinary public_id from a full Cloudinary URL."""
    # Cloudinary URLs look like:
    # https://res.cloudinary.com/<cloud_name>/<type>/<resource_type>/<transform>/<version>/<public_id>.<ext>
    # For raw files the URL pattern is different:
    # https://res.cloudinary.com/<cloud_name>/raw/upload/v<version>/<public_id>.<ext>
    # We extract the public_id by taking everything between the version and the extension.
    m = re.search(r"/v\d+/(.+)\.\w+$", file_path)
    if m:
        return m.group(1)
    return None


async def upload_to_cloudinary(file_bytes: bytes, filename: str, folder: str = "harvestlink/documents") -> str:
    """Upload a file to Cloudinary with the correct resource_type and return the secure URL."""
    if not _init_cloudinary():
        raise RuntimeError("Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.")

    resource_type = _detect_resource_type(filename)
    public_id = Path(filename).stem  # filename without extension

    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        resource_type=resource_type,
        folder=folder,
    )
    return result["secure_url"]


async def upload_to_local(file_bytes: bytes, relative_path: str, base_url: str) -> str:
    """Fallback: store file on local disk and return a local URL."""
    full_path = UPLOAD_DIR / relative_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(file_bytes)
    return f"{base_url}/uploads/documents/{relative_path}"


async def _assert_document_owner(doc: TradeDocument, current_user: User, db: AsyncSession):
    """Raise 403 if the document's owning company does not belong to the current user."""
    if current_user.role == "admin":
        return
    if doc.owner_type == "company":
        company = await db.get(Company, doc.owner_id)
        if company and company.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only manage documents for your own company")


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

    # 1. Try Cloudinary (persistent, works in production)
    try:
        file_url = await upload_to_cloudinary(contents, unique_name, folder="harvestlink/documents")
    except RuntimeError:
        pass  # Cloudinary not configured, fall through
    except Exception:
        pass  # Upload failed, fall through to local

    # 2. Fall back to local disk
    if file_url is None:
        base = f"{request.base_url.scheme}://{request.base_url.netloc}"
        try:
            file_url = await upload_to_local(contents, unique_name, base)
        except OSError:
            raise HTTPException(
                status_code=500,
                detail="File storage unavailable. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
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

    # Try to delete from Cloudinary if URL points there
    if document.file_url and "res.cloudinary.com" in document.file_url:
        try:
            _init_cloudinary()
            public_id = _cloudinary_public_id(document.file_url)
            if public_id:
                # Determine resource_type from URL
                resource_type = "raw" if "/raw/upload/" in document.file_url else "image"
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception:
            pass
    # Delete local file if stored locally
    elif document.file_url and "/uploads/documents/" in document.file_url:
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