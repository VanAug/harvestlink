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
import os

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"

app = FastAPI(title=settings.APP_NAME, version="1.0.0", description="Backend for testing HarvestLink frontend login and demo data.")

# Do not attempt to create or mount the uploads directory at import time — some
# deployment platforms (like Vercel) provide a read-only filesystem during import.
# We'll try to create and mount the uploads directory during startup. If that fails
# we'll continue running and rely on external blob storage for file uploads.
logger = logging.getLogger("uvicorn.error")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock this down to specific origins once working
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup():
    # Attempt to create and mount uploads directory at runtime. If the filesystem
    # is read-only, this will raise OSError and we'll skip mounting so the app
    # does not fail on import/deploy. Uploads will then use external blob storage.
    try:
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        # Only mount if the directory exists and is a directory
        if UPLOADS_DIR.exists() and UPLOADS_DIR.is_dir():
            app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
            logger.info(f"Mounted uploads at /uploads -> {UPLOADS_DIR}")
    except OSError as exc:
        logger.warning(f"Unable to create or mount uploads directory; continuing without local uploads: {exc}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
