CREATE TYPE shipment_state AS ENUM ('booked', 'in_transit', 'out_for_delivery', 'delivered', 'ndr', 'rto', 'cancelled');

CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT, provider_id uuid NOT NULL REFERENCES courier_providers(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES courier_services(id) ON DELETE RESTRICT, awb text NOT NULL UNIQUE,
  state shipment_state NOT NULL DEFAULT 'booked', chargeable_weight_g integer NOT NULL CHECK (chargeable_weight_g > 0),
  shipping_charge_paise integer NOT NULL CHECK (shipping_charge_paise >= 0), quote_snapshot jsonb NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 200), booked_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, order_id), UNIQUE (seller_id, idempotency_key)
);

CREATE TABLE shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  state shipment_state NOT NULL, occurred_at timestamptz NOT NULL, location text, description text NOT NULL,
  source text NOT NULL CHECK (source IN ('booking', 'courier_webhook', 'courier_poll', 'manual')), raw_payload jsonb,
  source_event_id text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE NULLS NOT DISTINCT (shipment_id, source, source_event_id)
);

CREATE INDEX shipments_seller_lookup ON shipments (seller_id, state, created_at DESC);
CREATE INDEX shipment_events_shipment_lookup ON shipment_events (shipment_id, occurred_at DESC);
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipments_tenant_scope ON shipments USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY shipment_events_tenant_scope ON shipment_events USING (EXISTS (SELECT 1 FROM shipments s WHERE s.id = shipment_events.shipment_id AND s.seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid));
