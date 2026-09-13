CREATE TYPE order_state AS ENUM ('draft', 'new', 'ready_to_ship', 'booked', 'cancelled', 'returned');
CREATE TYPE payment_mode AS ENUM ('prepaid', 'cod');

CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL, contact_name text NOT NULL, phone text NOT NULL CHECK (phone ~ '^[0-9+() -]{7,24}$'), email citext,
  address_line_1 text NOT NULL, address_line_2 text, city text NOT NULL, state text NOT NULL,
  pincode char(6) NOT NULL CHECK (pincode ~ '^[0-9]{6}$'), country_code char(2) NOT NULL DEFAULT 'IN',
  is_return_address boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true, cutoff_time time,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (seller_id, name)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  full_name text NOT NULL, email citext, phone text NOT NULL CHECK (phone ~ '^[0-9+() -]{7,24}$'),
  address_line_1 text NOT NULL, address_line_2 text, city text NOT NULL, state text NOT NULL,
  pincode char(6) NOT NULL CHECK (pincode ~ '^[0-9]{6}$'), country_code char(2) NOT NULL DEFAULT 'IN',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  sku text NOT NULL, name text NOT NULL, description text, hsn_code text, unit_price_paise integer NOT NULL DEFAULT 0 CHECK (unit_price_paise >= 0),
  weight_g integer CHECK (weight_g > 0), length_mm integer CHECK (length_mm > 0), width_mm integer CHECK (width_mm > 0), height_mm integer CHECK (height_mm > 0),
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (seller_id, sku)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT, customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number text NOT NULL, external_reference text, state order_state NOT NULL DEFAULT 'draft', payment_mode payment_mode NOT NULL DEFAULT 'prepaid',
  cod_amount_paise integer NOT NULL DEFAULT 0 CHECK (cod_amount_paise >= 0), subtotal_paise integer NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0), total_weight_g integer NOT NULL DEFAULT 0 CHECK (total_weight_g >= 0), notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz,
  UNIQUE (seller_id, order_number), UNIQUE NULLS NOT DISTINCT (seller_id, external_reference),
  CHECK ((payment_mode = 'cod' AND cod_amount_paise > 0) OR (payment_mode = 'prepaid' AND cod_amount_paise = 0))
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL, sku text NOT NULL, name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 10000), unit_price_paise integer NOT NULL CHECK (unit_price_paise >= 0), weight_g integer NOT NULL DEFAULT 0 CHECK (weight_g >= 0), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX warehouses_seller_lookup ON warehouses (seller_id, is_active);
CREATE INDEX customers_seller_lookup ON customers (seller_id, created_at DESC);
CREATE INDEX products_seller_lookup ON products (seller_id, is_active, sku);
CREATE INDEX orders_seller_lookup ON orders (seller_id, state, created_at DESC);
CREATE INDEX order_items_order_lookup ON order_items (order_id);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY warehouses_tenant_scope ON warehouses USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY customers_tenant_scope ON customers USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY products_tenant_scope ON products USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY orders_tenant_scope ON orders USING (seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid);
CREATE POLICY order_items_tenant_scope ON order_items USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.seller_id = NULLIF(current_setting('app.seller_id', true), '')::uuid));
