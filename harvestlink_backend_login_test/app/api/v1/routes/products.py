from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import Company, Product, User
from app.schemas.schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(tags=["products"])


@router.get("/products", response_model=list[ProductOut])
async def products(
    q: str | None = None,
    country: str | None = None,
    category: str | None = None,
    company_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Public: browse the product marketplace."""
    stmt = select(Product).order_by(Product.id)
    if q:
        stmt = stmt.where(or_(Product.name.ilike(f"%{q}%"), Product.category.ilike(f"%{q}%"), Product.supplier_name.ilike(f"%{q}%")))
    if country:
        stmt = stmt.where(Product.country_of_origin == country)
    if category:
        stmt = stmt.where(Product.category == category)
    if company_id:
        stmt = stmt.where(Product.company_id == company_id)
    return list(await db.scalars(stmt))


@router.get("/products/{product_id}", response_model=ProductOut)
async def product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Public: view a single product."""
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@router.post("/products", response_model=ProductOut)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated exporters only."""
    if current_user.role not in ("exporter", "supplier", "admin"):
        raise HTTPException(status_code=403, detail="Only exporters can create product listings")
    company = await db.get(Company, payload.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Exporter company not found")
    if company.type != "exporter":
        raise HTTPException(status_code=400, detail="Products can only be created for exporter companies")
    if company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only add products for your own company")
    item = Product(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: exporter who owns the product."""
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    company = await db.get(Company, item.company_id)
    if company and company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only edit your own products")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/products/{product_id}/archive", response_model=ProductOut)
async def archive_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: exporter who owns the product."""
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    company = await db.get(Company, item.company_id)
    if company and company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only archive your own products")
    item.status = "archived"
    await db.commit()
    await db.refresh(item)
    return item

@router.post("/products/{product_id}/image", response_model=ProductOut)
async def upload_product_image(
    product_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from pathlib import Path
    from uuid import uuid4
    from app.api.v1.routes.documents import upload_to_cloudinary, upload_to_local, _init_cloudinary

    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    company = await db.get(Company, item.company_id)
    if company and company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only upload images for your own products")

    unique_name = f"product_{product_id}_{uuid4().hex}_{Path(file.filename).name}"
    contents = await file.read()
    file_url = None

    # 1. Try Cloudinary (persistent, works in production)
    try:
        _init_cloudinary()
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            contents,
            public_id=unique_name.rsplit(".", 1)[0],
            folder="harvestlink/products",
        )
        file_url = result["secure_url"]
    except RuntimeError:
        pass
    except Exception:
        pass

    # 2. Fall back to local disk
    if file_url is None:
        upload_dir = Path("/tmp/uploads/products")
        try:
            upload_dir.mkdir(parents=True, exist_ok=True)
            (upload_dir / unique_name).write_bytes(contents)
            base = f"{request.base_url.scheme}://{request.base_url.netloc}"
            file_url = f"{base}/uploads/products/{unique_name}"
        except OSError:
            raise HTTPException(status_code=500, detail="Image storage unavailable. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.")

    item.image_url = file_url
    await db.commit()
    await db.refresh(item)
    return item
