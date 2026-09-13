CREATE TYPE pincode_rule_type AS ENUM ('allowed', 'blocked');

CREATE TABLE courier_pincode_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  destination_prefix text NOT NULL CHECK (destination_prefix ~ '^[0-9]{1,6}$'),
  rule_type pincode_rule_type NOT NULL,
  note text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, destination_prefix, rule_type)
);
CREATE INDEX courier_pincode_rules_lookup ON courier_pincode_rules (service_id, destination_prefix, rule_type);
