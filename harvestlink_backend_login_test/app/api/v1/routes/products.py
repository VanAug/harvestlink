from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import settings
from app.core.security import get_current_user, get_optional_user
from app.core.notifications import notify_admin, create_notification
from app.core.verification import require_verified_exporter
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
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Product marketplace with role-based visibility.

    - Unauthenticated users / buyers / finance partners: see only approved products.
    - Exporters: see approved products + their own pending/rejected ones.
    - Admins: see all products.
    """
    stmt = select(Product).order_by(Product.id)

    role = current_user.role if current_user else ""

    # Treat both "approved" and legacy "active" as the public-visible status
    visible_statuses = ["approved", "active"]

    if role == "admin":
        # Admin sees everything – optionally filter by status
        if status:
            stmt = stmt.where(Product.status == status)
    elif role in ("exporter", "supplier"):
        # Exporters see visible products + their own
        user_companies = list(await db.scalars(
            select(Company).where(Company.owner_id == current_user.id)
        ))
        company_ids = [c.id for c in user_companies]
        if company_ids:
            stmt = stmt.where(
                or_(
                    Product.status.in_(visible_statuses),
                    Product.company_id.in_(company_ids),
                )
            )
        else:
            stmt = stmt.where(Product.status.in_(visible_statuses))
    else:
        # Unauthenticated, buyers, finance partners: visible only
        stmt = stmt.where(Product.status.in_(visible_statuses))

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
async def product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """View a single product with role-based visibility. Unauthenticated users can see approved/active products."""
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")

    visible_statuses = ["approved", "active"]

    # Public users can see approved/active products
    if item.status in visible_statuses:
        return item

    role = current_user.role if current_user else ""
    # Admins can see anything
    if role == "admin":
        return item
    # Exporters can see their own unapproved products
    if role in ("exporter", "supplier"):
        company = await db.get(Company, item.company_id)
        if company and company.owner_id == current_user.id:
            return item

    raise HTTPException(status_code=403, detail="Product is not yet approved")


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
    await require_verified_exporter(current_user, db, payload.company_id)
    item = Product(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)

    # Notify: new product listed — alert admin for moderation review
    await notify_admin(
        db,
        title="New Product Listed",
        message=f"New product '{item.name}' ({item.category}, {item.available_quantity} {item.unit}) has been listed by {item.supplier_name} and is awaiting review.",
        notification_type="new_product",
    )

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
    if current_user.role not in ("admin"):
        await require_verified_exporter(current_user, db)

    old_status = item.status
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)

    if item.status == "pending" and old_status != "pending":
        await notify_admin(
            db,
            title="Product Returned for Review",
            message=f"Product '{item.name}' has been updated and is awaiting admin review.",
            notification_type="product_returned_for_review",
        )

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


@router.patch("/products/{product_id}/unarchive", response_model=ProductOut)
async def unarchive_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated: exporter who owns the product. Restore from archived to pending."""
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    company = await db.get(Company, item.company_id)
    if company and company.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only unarchive your own products")
    if item.status != "archived":
        raise HTTPException(status_code=400, detail="Product is not archived")
    item.status = "pending"
    await db.commit()
    await db.refresh(item)

    await notify_admin(
        db,
        title="Product Returned for Review",
        message=f"Product '{item.name}' has been restored and is awaiting admin review.",
        notification_type="product_returned_for_review",
    )

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


# --- Admin product moderation endpoints ---

@router.get("/admin/products/pending", response_model=list[ProductOut])
async def admin_pending_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: view all pending and rejected products."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    stmt = select(Product).where(Product.status.in_(["pending", "active"])).order_by(Product.id)
    return list(await db.scalars(stmt))


@router.patch("/admin/products/{product_id}/approve", response_model=ProductOut)
async def admin_approve_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: approve a product listing."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    item.status = "approved"
    await db.commit()
    await db.refresh(item)

    company = await db.get(Company, item.company_id)
    if company:
        await create_notification(
            db,
            user_id=company.owner_id,
            title="Product Approved",
            message=f"Your product '{item.name}' has been approved and is now live.",
            notification_type="product_approved",
        )

    return item


@router.patch("/admin/products/{product_id}/reject", response_model=ProductOut)
async def admin_reject_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: reject a product listing."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    item.status = "rejected"
    await db.commit()
    await db.refresh(item)

    company = await db.get(Company, item.company_id)
    if company:
        await create_notification(
            db,
            user_id=company.owner_id,
            title="Product Rejected",
            message=f"Your product '{item.name}' has been rejected by admin. Please review and resubmit if needed.",
            notification_type="product_rejected",
        )

    return item