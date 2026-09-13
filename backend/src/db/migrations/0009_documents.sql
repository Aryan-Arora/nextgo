CREATE TYPE document_kind AS ENUM ('shipping_label', 'manifest', 'invoice', 'evidence');
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE, kind document_kind NOT NULL, storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL, size_bytes bigint, status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), ready_at timestamptz
);
CREATE INDEX documents_seller_lookup ON documents (seller_id, kind, created_at DESC);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_tenant_scope ON documents USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
