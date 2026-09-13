CREATE TYPE pickup_state AS ENUM ('requested', 'scheduled', 'completed', 'cancelled');
CREATE TABLE pickup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT, state pickup_state NOT NULL DEFAULT 'requested',
  requested_for date NOT NULL, courier_provider_id uuid REFERENCES courier_providers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  pickup_request_id uuid REFERENCES pickup_requests(id) ON DELETE SET NULL, document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE manifest_shipments (manifest_id uuid NOT NULL REFERENCES manifests(id) ON DELETE CASCADE, shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT, PRIMARY KEY (manifest_id, shipment_id));
CREATE INDEX pickup_requests_seller_lookup ON pickup_requests (seller_id, state, requested_for DESC);
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY; ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pickup_requests_tenant_scope ON pickup_requests USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY manifests_tenant_scope ON manifests USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
