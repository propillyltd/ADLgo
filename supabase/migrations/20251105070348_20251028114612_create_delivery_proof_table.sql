/*
  # Create Delivery Proof Table

  1. New Tables
    - `delivery_proofs`
      - Stores photo evidence of deliveries
      - Captures recipient signature/confirmation
      - Records delivery timestamp

  2. Security
    - Enable RLS
    - Partners can insert proofs for their deliveries
    - Customers and partners can view proofs for their orders
*/

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES delivery_orders(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES partner_profiles(user_id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  recipient_signature text,
  recipient_name text,
  notes text,
  delivered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can insert delivery proofs"
  ON delivery_proofs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = partner_id AND
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_proofs.order_id
      AND delivery_orders.partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view proofs for their orders"
  ON delivery_proofs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_proofs.order_id
      AND (delivery_orders.customer_id = auth.uid() OR delivery_orders.partner_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_order ON delivery_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_partner ON delivery_proofs(partner_id);
