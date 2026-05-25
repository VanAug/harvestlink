from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.seed.seed import seed
import logging

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Backend for HarvestLink — Global Agricultural Marketplace.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


async def run_migrations(conn):
    """
    Safe incremental migrations — adds columns that the models define
    but that may not yet exist in the live database.
    Uses IF NOT EXISTS / DO NOTHING patterns so it is safe to run on
    every startup (no-op if columns already exist).
    """
    db_url = str(settings.DATABASE_URL)
    is_postgres = "postgresql" in db_url or "asyncpg" in db_url

    if is_postgres:
        migrations = [
            # Added: rejection_reason on companies (admin verification workflow)
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
            # Added: image_url on products (real image upload support)
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);",
        ]
        for sql in migrations:
            try:
                await conn.execute(sql)
                logger.info("Migration OK: %s", sql.split("(")[0].strip())
            except Exception as exc:
                logger.warning("Migration skipped (%s): %s", type(exc).__name__, sql)
    else:
        # SQLite: create_all handles schema, no ALTER TABLE needed
        pass


@app.on_event("startup")
async def startup():
    # Mount local /tmp/uploads for file serving in development.
    # In production, files are stored on Cloudinary and served via its CDN,
    # so the local mount is only needed for dev/fallback.
    has_cloudinary = bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)
    if not has_cloudinary:
        local_uploads = Path("/tmp/uploads/documents")
        try:
            local_uploads.mkdir(parents=True, exist_ok=True)
            app.mount("/uploads", StaticFiles(directory=str(local_uploads)), name="uploads")
            logger.info("Local uploads mounted at /uploads -> %s", local_uploads)
        except OSError as exc:
            logger.warning("Could not mount local uploads directory: %s", exc)
    else:
        logger.info("Cloudinary storage configured — skipping local uploads mount.")

    async with engine.begin() as conn:
        # Create any tables that don't exist yet (safe no-op for existing tables)
        await conn.run_sync(Base.metadata.create_all)
        # Add any new columns to existing tables
        await run_migrations(conn)

    async with AsyncSessionLocal() as db:
        await seed(db)


@app.get("/")
async def root():
    return {
        "message": "HarvestLink backend is running",
        "docs": "/docs",
        "api_base": "/api/v1",
        "demo_password": "password123",
        "demo_logins": [
            "admin@harvestlink.test",
            "exporter@greenvalley.co.ke",
            "procurement@gulffresh.ae",
            "finance@tradecapital.test",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}