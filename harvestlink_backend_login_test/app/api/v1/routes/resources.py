from fastapi import APIRouter

from app.api.v1.routes import account, admin, companies, deals, documents, financing, products, rfqs, tracking

router = APIRouter(tags=["harvestlink"])

for module in (companies, products, rfqs, deals, financing, documents, admin, tracking, account):
    router.include_router(module.router)
