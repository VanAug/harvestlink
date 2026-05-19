from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.models import Company, Product
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
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@router.post("/products", response_model=ProductOut)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    company = await db.get(Company, payload.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Exporter company not found")
    if company.type != "exporter":
        raise HTTPException(status_code=400, detail="Products can only be created for exporter companies")
    item = Product(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, payload: ProductUpdate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/products/{product_id}/archive", response_model=ProductOut)
async def archive_product(product_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Product, product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    item.status = "archived"
    await db.commit()
    await db.refresh(item)
    return item
