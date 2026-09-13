-- Team invitations -----------------------------------------------------
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
CREATE TABLE seller_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  email citext NOT NULL, role seller_role NOT NULL, token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL, accepted_at timestamptz, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, email, status)
);
CREATE INDEX seller_invitations_seller_lookup ON seller_invitations (seller_id, status);
ALTER TABLE seller_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_invitations_tenant_scope ON seller_invitations USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);

-- Password reset -------------------------------------------------------
CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_resets_user_lookup ON password_resets (user_id, created_at DESC);

-- Session device/IP visibility for the "recent sign-ins" list -----------
ALTER TABLE sessions ADD COLUMN user_agent text;
ALTER TABLE sessions ADD COLUMN ip_address text;

-- TOTP for platform admins ----------------------------------------------
ALTER TABLE platform_admins ADD COLUMN totp_secret_encrypted bytea;
ALTER TABLE platform_admins ADD COLUMN totp_key_reference text;
ALTER TABLE platform_admins ADD COLUMN totp_enrolled_at timestamptz;

-- Short-lived challenge issued after password verification when MFA is
-- required but the request hasn't supplied a valid TOTP code yet. Separate
-- table (not a session) so a half-authenticated request can never be
-- mistaken for a real one by any code path that only checks `sessions`.
CREATE TABLE admin_mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
