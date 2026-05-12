# HarvestLink Frontend - Updated for Demo Backend

This package maintains the original bright HarvestLink look and feel, then updates the screens to connect to the new HarvestLink demo backend structure.

## Included UI

- Home / landing page
- Product marketplace
- Supplier discovery
- RFQ market
- RFQ detail and quote form
- Deal rooms
- Escrow and payments
- Trade financing
- Buyer, supplier, and admin dashboards
- Login and register UI
- Verification pages
- Pricing page

## Backend Integration

The frontend is configured to call the demo backend endpoints:

```bash
GET /api/v1/products
GET /api/v1/companies
GET /api/v1/rfqs
GET /api/v1/deals
GET /api/v1/deals/1/messages
GET /api/v1/escrow
GET /api/v1/financing
GET /api/v1/financing/eligibility/1
GET /api/v1/admin/overview
POST /api/v1/auth/login
```

The API client is located here:

```bash
src/lib/api.js
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the backend URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Demo Login

Use the backend demo login:

```bash
exporter@greenvalley.co.ke
password123
```

Other backend demo accounts:

```bash
admin@harvestlink.test
procurement@gulffresh.ae
finance@tradecapital.test
```

## Notes

The UI keeps fallback demo data. This means the frontend still works for presentations even if the backend is not running. When the backend is running, it loads seeded data from the database.
