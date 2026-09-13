-- Canonical pincode-prefix -> zone mapping. Rate cards already carry a free-text
-- zone_code; this table is what lets the admin "Zone mapping" screen assign a
-- destination prefix to a zone in a way rating can actually look up, instead of
-- every rate card author guessing the same string by convention.
CREATE TABLE courier_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code text NOT NULL,
  destination_prefix text NOT NULL CHECK (destination_prefix ~ '^[0-9]{1,6}$'),
  label text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (destination_prefix)
);

CREATE INDEX courier_zones_zone_lookup ON courier_zones (zone_code, destination_prefix);
