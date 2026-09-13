CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_code text NOT NULL,
  external_event_id text NOT NULL, payload_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz,
  processing_error text, payload jsonb NOT NULL,
  UNIQUE (provider_code, external_event_id)
);

CREATE INDEX webhook_deliveries_received_lookup ON webhook_deliveries (provider_code, received_at DESC);
