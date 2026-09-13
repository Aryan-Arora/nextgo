# NEXGO engineering handoff

Read this before changing backend code. The project is a multi-tenant Indian shipping
platform with a seller portal and a separate platform-admin portal. It is a local-first
production build, not an MVP mock.

## Current state

- Branch: `backend/seller-admin-foundation`.
- API: Fastify/TypeScript in `backend/`, local port 4010.
- Local services: PostgreSQL 16, Redis, MinIO, Mailpit in `compose.backend.yml`.
- Start: `docker compose -f compose.backend.yml up -d`; `cd backend && npm run migrate`;
  run `npm run dev` and `npm run worker` in separate terminals.
- Main database is PostgreSQL; AWS target is RDS PostgreSQL. Never replace it with a
  frontend mock database.

## Implemented and verified

1. Seller sign-up/login/logout and separate admin login.
2. Tenant-scoped seller data: warehouse, customer, product, order, order item.
3. Admin courier service catalogue, seller eligibility, COD controls, rate cards.
4. Admin destination-pincode allow/block rules. Quote and booking enforce these rules.
5. Quote calculation, shipment booking idempotency, AWB, tracking state/event timeline.
6. HMAC-signed courier webhook ingestion and duplicate-event prevention.
7. NDR reattempt/RTO actions and append-only wallet-ledger schema.
8. Channel connection/job records and a Postgres-backed worker.
9. **(Engineer B)** Seller KYC: submission (GSTIN/PAN/entity/bank details, bank
   account number AES-256-GCM encrypted at rest, never returned to any client
   including the submitting seller), admin review queue, approve/reject with
   audit trail. `src/routes/kyc.ts`, `src/lib/crypto.ts`, migration `0010`.
10. **(Engineer B)** Admin seller lifecycle: paginated/filterable seller list
    with KYC-status join, seller detail (KYC + members + wallet balance +
    shipment breakdown), and state transitions (onboarding→active requires
    KYC `verified` first — enforced server-side, not just in the UI).
    `src/routes/adminOperations.ts`.
11. **(Engineer B)** Courier zone mapping: destination-pincode-prefix → zone
    reference table backing the admin "Zone mapping" screen. Migration `0011`.
12. **(Engineer B)** Platform-wide shipment and NDR queues (cross-tenant,
    admin-only, filterable by state/seller) — same file as #10.
13. **(Engineer B)** Admin role gating beyond the single platform-admin check:
    `requireCommercialAdmin` (couriers/rates/zones — super_admin/ops_admin
    only) and new `requireAccountAdmin` (seller state + KYC decisions —
    super_admin/ops_admin/finance_admin). Verified against a real
    `support_admin` account: read access stays open, writes 403 correctly.
    `src/lib/adminAuth.ts` (extracted from `admin.ts` so both new route files
    and the original share one guard implementation instead of three).

## Non-negotiable rules

- Every seller-owned record needs `seller_id`, server-side ownership checks, and RLS.
- Do not trust seller IDs, prices, courier credentials, shipment status, or roles from UI.
- Monetary data is append-only. Never update a wallet balance directly.
- Bookings and all external webhooks must be idempotent.
- Do not log secrets, PII, passwords, raw payment data, or courier credentials.
- Provider credentials must be encrypted; use AWS KMS/Secrets Manager in production.
- Never deploy local `.env` values or the Docker database to production.

## Two engineers / two-week execution plan

### Engineer A — integrations and seller operations

Days 1–3: real courier adapter interface, one company/Delhivery sandbox adapter,
serviceability, provider booking confirmation lookup, label/manifest jobs.

Days 4–6: MinIO private-file layer, Shopify OAuth/webhook/sync adapter, worker retries
and dead-letter handling.

Days 7–8: seller frontend wiring for login, orders, quotes, booking, shipments, NDR.

Days 9–10: integration tests for duplicate orders, duplicate booking, webhook replay,
and cross-seller access.

### Engineer B — admin, money, and hardening

Days 1–3: admin seller lifecycle, KYC, courier pincode/zone UI/API, platform shipment
and NDR queues. **Done 2026-09-13** — see items 9–13 above. Pincode allow/block rules
were already covered by Engineer A's earlier admin.ts work; zone *mapping* (the
reference table a rate card's `zone_code` should resolve against) was the piece
still missing and is now in migration `0011`.

Days 4–6: wallet recharge architecture, Razorpay sandbox webhook, COD reconciliation,
invoice metadata and finance approvals. **Next up.**

Days 7–8: team invitations, password reset, session revocation, TOTP for admin/finance,
CSRF and rate limiting.

Days 9–10: admin UI wiring, audit/job/webhook visibility, staging checklist and restore
test.

## Day-10 acceptance target

A seller can sign up, create/sync an order, receive a real sandbox quote, book exactly
once, download a private label, track shipment, resolve NDR, and view a reproducible
ledger. An admin can approve sellers, control rates/services/pincodes, inspect platform
operations, and audit privileged actions. Production payment/courier credentials remain
client-controlled until AWS staging is ready.
