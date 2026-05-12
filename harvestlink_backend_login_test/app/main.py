from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.seed.seed import seed

app = FastAPI(title=settings.APP_NAME, version="1.0.0", description="Backend for testing HarvestLink frontend login and demo data.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup():
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
