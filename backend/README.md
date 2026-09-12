# NEXGO backend

The local-first API foundation for both seller and platform-admin domains.

## Run locally

```bash
docker compose -f compose.backend.yml up -d
cp backend/.env.example backend/.env
cd backend && npm install
npm run migrate
npm run dev
```

Health check: `http://localhost:4010/health`.

## Current scope

- Seller identity: signup, login, logout, encrypted session tokens, owner membership.
- Tenant-safe seller identity endpoint: `GET /v1/seller/me`.
- Separate platform-admin guard with `GET /v1/admin/me` and an initial seller
  lifecycle list route. Creating/promoting an admin is intentionally an
  audited operations task, not a public signup flow.
- PostgreSQL schema migrations, audit events, seller RLS policies.
- Local PostgreSQL, Redis, MinIO, and Mailpit services.

The next implementation slice is warehouses and manual orders, followed by the mock courier adapter and the Ship Now booking flow.
