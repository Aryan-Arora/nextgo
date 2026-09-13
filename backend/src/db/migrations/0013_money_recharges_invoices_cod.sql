CREATE TYPE wallet_recharge_status AS ENUM ('created', 'succeeded', 'failed');
CREATE TABLE wallet_recharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0), status wallet_recharge_status NOT NULL DEFAULT 'created',
  provider_order_id text NOT NULL UNIQUE, provider_payment_id text, created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX wallet_recharges_seller_lookup ON wallet_recharges (seller_id, created_at DESC);
ALTER TABLE wallet_recharges ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_recharges_tenant_scope ON wallet_recharges USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);

-- Sequential, gapless invoice numbering: the counter increments in the same
-- transaction as the invoice row insert, so a failed/rolled-back invoice
-- never leaves a hole in the series (a real GST compliance requirement, not
-- a style preference).
CREATE TABLE invoice_sequences (
  seller_id uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  next_number integer NOT NULL DEFAULT 1 CHECK (next_number > 0)
);

CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'void');
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE, period_start date NOT NULL, period_end date NOT NULL,
  subtotal_paise bigint NOT NULL CHECK (subtotal_paise >= 0), gst_paise bigint NOT NULL CHECK (gst_paise >= 0),
  total_paise bigint NOT NULL CHECK (total_paise >= 0), shipment_count integer NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft', document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  issued_by uuid REFERENCES users(id) ON DELETE SET NULL, issued_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start), CHECK (total_paise = subtotal_paise + gst_paise)
);
CREATE INDEX invoices_seller_lookup ON invoices (seller_id, period_start DESC);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_scope ON invoices USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);

-- COD cash is collected by the courier on delivery and never enters the
-- prepaid wallet_entries ledger — this cycle is its own reconciliation
-- record of what's owed back to the seller net of shipping charges, with
-- its own approve/remit trail rather than being folded into wallet_entries.
CREATE TYPE cod_remittance_status AS ENUM ('pending', 'approved', 'remitted');
CREATE TABLE cod_remittance_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  cycle_start date NOT NULL, cycle_end date NOT NULL, shipment_count integer NOT NULL DEFAULT 0,
  cod_collected_paise bigint NOT NULL DEFAULT 0 CHECK (cod_collected_paise >= 0),
  charges_deducted_paise bigint NOT NULL DEFAULT 0 CHECK (charges_deducted_paise >= 0),
  net_remitted_paise bigint NOT NULL DEFAULT 0 CHECK (net_remitted_paise >= 0),
  status cod_remittance_status NOT NULL DEFAULT 'pending', bank_reference text,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL, approved_at timestamptz,
  remitted_by uuid REFERENCES users(id) ON DELETE SET NULL, remitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cycle_end >= cycle_start), CHECK (net_remitted_paise = cod_collected_paise - charges_deducted_paise),
  UNIQUE (seller_id, cycle_start, cycle_end)
);
CREATE INDEX cod_remittance_cycles_seller_lookup ON cod_remittance_cycles (seller_id, status, cycle_start DESC);
ALTER TABLE cod_remittance_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY cod_remittance_cycles_tenant_scope ON cod_remittance_cycles USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
