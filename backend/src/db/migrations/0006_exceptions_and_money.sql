CREATE TYPE ndr_state AS ENUM ('open', 'reattempt_requested', 'rto_requested', 'resolved');
CREATE TYPE wallet_entry_type AS ENUM ('credit', 'debit', 'hold', 'release', 'adjustment');

CREATE TABLE ndr_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE RESTRICT, state ndr_state NOT NULL DEFAULT 'open',
  reason_code text NOT NULL, reason_detail text, opened_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  entry_type wallet_entry_type NOT NULL, amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  reference_type text NOT NULL, reference_id text NOT NULL, idempotency_key text NOT NULL,
  description text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, idempotency_key)
);

CREATE INDEX ndr_cases_seller_state ON ndr_cases (seller_id, state, opened_at DESC);
CREATE INDEX wallet_entries_seller_created ON wallet_entries (seller_id, created_at DESC);
ALTER TABLE ndr_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ndr_cases_tenant_scope ON ndr_cases USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY wallet_entries_tenant_scope ON wallet_entries USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
