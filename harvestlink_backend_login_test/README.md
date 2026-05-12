# HarvestLink Backend for Login + Testing

This backend matches the HarvestLink frontend flow and includes demo accounts, companies, products, RFQs, offers, deals, escrow, and financing data.

## Run locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend runs at:

```bash
http://localhost:8000
```

API docs:

```bash
http://localhost:8000/docs
```

## Frontend .env

In your HarvestLink frontend, set:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Demo logins

Password for all accounts:

```bash
password123
```

Accounts:

```bash
admin@harvestlink.test
exporter@greenvalley.co.ke
sales@abyssiniacoffee.et
ops@riftflowers.co.ke
procurement@gulffresh.ae
sourcing@dutchfresh.nl
finance@tradecapital.test
```

## Main endpoints

```bash
POST /api/v1/auth/login
GET  /api/v1/companies
GET  /api/v1/exporters
GET  /api/v1/buyers
GET  /api/v1/products
GET  /api/v1/rfqs
GET  /api/v1/rfqs/{rfq_id}/offers
GET  /api/v1/deals
GET  /api/v1/deals/{deal_id}
GET  /api/v1/deals/{deal_id}/messages
GET  /api/v1/escrow
GET  /api/v1/financing
GET  /api/v1/financing/eligibility/{company_id}
GET  /api/v1/dashboard/{company_id}
GET  /api/v1/admin/overview
```

## Notes

This is demo-ready and uses SQLite by default for easy testing. For production, switch to PostgreSQL, add Alembic migrations, stronger RBAC enforcement, real escrow integration, and real payment provider integrations.
