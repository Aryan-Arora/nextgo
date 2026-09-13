CREATE TYPE integration_state AS ENUM ('disconnected', 'connected', 'error', 'disabled');
CREATE TYPE job_state AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead_letter');

CREATE TABLE channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('shopify', 'woocommerce', 'amazon', 'custom')),
  display_name text NOT NULL, state integration_state NOT NULL DEFAULT 'disconnected',
  encrypted_credentials bytea, key_reference text, sync_cursor text, last_synced_at timestamptz, last_error text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (seller_id, provider, display_name)
);

CREATE TABLE job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  job_type text NOT NULL, state job_state NOT NULL DEFAULT 'queued', attempts integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, result jsonb, error_summary text, queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX channel_connections_seller_lookup ON channel_connections (seller_id, state);
CREATE INDEX job_runs_state_lookup ON job_runs (state, queued_at);
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY channel_connections_tenant_scope ON channel_connections USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY job_runs_tenant_scope ON job_runs USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
