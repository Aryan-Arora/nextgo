CREATE TYPE kyc_status AS ENUM ('unsubmitted', 'pending_review', 'verified', 'rejected');

-- Extends the existing document_kind enum so KYC evidence (cancelled
-- cheque, GST certificate) reuses the same private-object-storage pipeline
-- as shipping labels/manifests instead of a second upload path.
ALTER TYPE document_kind ADD VALUE 'kyc_document';

CREATE TABLE seller_kyc (
  seller_id uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  gstin text CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  pan text CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  entity_type text CHECK (entity_type IN ('proprietorship', 'partnership', 'private_limited', 'llp', 'public_limited')),
  registered_address text,
  bank_account_holder text,
  bank_account_number_encrypted bytea,
  bank_ifsc text CHECK (bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  key_reference text,
  status kyc_status NOT NULL DEFAULT 'unsubmitted',
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL),
  CHECK ((bank_account_number_encrypted IS NULL) = (key_reference IS NULL))
);

CREATE INDEX seller_kyc_status_lookup ON seller_kyc (status, submitted_at);

ALTER TABLE seller_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_kyc_tenant_scope ON seller_kyc
  USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
