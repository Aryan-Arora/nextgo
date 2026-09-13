CREATE TYPE courier_account_mode AS ENUM ('platform', 'seller_owned');
CREATE TYPE courier_access_state AS ENUM ('enabled', 'disabled');
CREATE TYPE rate_card_state AS ENUM ('draft', 'active', 'retired');

CREATE TABLE courier_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9-]{2,64}$'),
  name text NOT NULL,
  integration_state text NOT NULL DEFAULT 'sandbox' CHECK (integration_state IN ('sandbox', 'live', 'maintenance', 'disabled')),
  supports_cod boolean NOT NULL DEFAULT false,
  supports_reverse boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courier_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES courier_providers(id) ON DELETE CASCADE,
  code text NOT NULL,
  display_name text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('surface', 'express', 'air', 'reverse')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, code)
);

CREATE TABLE seller_courier_access (
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  account_mode courier_account_mode NOT NULL DEFAULT 'platform',
  state courier_access_state NOT NULL DEFAULT 'enabled',
  cod_enabled boolean NOT NULL DEFAULT false,
  auto_assign_eligible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, service_id)
);

-- Credentials are always encrypted by the application before they reach this table.
-- The actual KMS envelope-key implementation is added when the AWS layer is enabled.
CREATE TABLE seller_courier_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES courier_providers(id) ON DELETE CASCADE,
  encrypted_credentials bytea NOT NULL,
  key_reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'failed', 'revoked')),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, provider_id)
);

CREATE TABLE rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  state rate_card_state NOT NULL DEFAULT 'draft',
  currency char(3) NOT NULL DEFAULT 'INR',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE rate_card_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_card_id uuid NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  zone_code text NOT NULL DEFAULT 'national',
  min_weight_g integer NOT NULL DEFAULT 0 CHECK (min_weight_g >= 0),
  base_weight_g integer NOT NULL DEFAULT 500 CHECK (base_weight_g > 0),
  base_price_paise integer NOT NULL CHECK (base_price_paise >= 0),
  additional_weight_g integer NOT NULL DEFAULT 500 CHECK (additional_weight_g > 0),
  additional_price_paise integer NOT NULL DEFAULT 0 CHECK (additional_price_paise >= 0),
  cod_fee_paise integer NOT NULL DEFAULT 0 CHECK (cod_fee_paise >= 0),
  fuel_surcharge_bps integer NOT NULL DEFAULT 0 CHECK (fuel_surcharge_bps >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rate_card_id, service_id, zone_code, min_weight_g)
);

CREATE INDEX seller_courier_access_lookup ON seller_courier_access (seller_id, state);
CREATE INDEX rate_cards_active_lookup ON rate_cards (seller_id, state, effective_from);
CREATE INDEX rate_card_rates_lookup ON rate_card_rates (rate_card_id, zone_code, service_id);

ALTER TABLE seller_courier_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_courier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_card_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY seller_courier_access_tenant_scope ON seller_courier_access
  USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY seller_courier_credentials_tenant_scope ON seller_courier_credentials
  USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY rate_cards_tenant_scope ON rate_cards
  USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY rate_card_rates_tenant_scope ON rate_card_rates
  USING (EXISTS (
    SELECT 1 FROM rate_cards rc
    WHERE rc.id = rate_card_rates.rate_card_id
      AND rc.seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid
  ));
