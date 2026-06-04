from fastapi import APIRouter

from app.api.v1.routes import account, admin, companies, countries, deals, documents, financing, notifications, products, rfqs, tracking

router = APIRouter(tags=["harvestlink"])

for module in (companies, countries, products, rfqs, deals, financing, documents, admin, tracking, account, notifications):
    router.include_router(module.router)
