/*
  # Create Delivery Proof Table

  1. New Tables
    - `delivery_proof`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to delivery_orders, unique)
      - `partner_id` (uuid, foreign key to profiles)
      - `photo_url` (text, URL to proof photo)
      - `notes` (text, optional delivery notes)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on delivery_proof table
    - Partners can insert proof for their own deliveries
    - Partners can view their own delivery proofs
    - Customers can view proof for their orders
    - Only the assigned partner can create proof for a delivery

  3. Indexes
    - Index on delivery_proof.order_id for efficient lookup
    - Index on delivery_proof.partner_id for partner proof history
*/

-- Create delivery_proof table
CREATE TABLE IF NOT EXISTS delivery_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES delivery_orders(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_proof_order_id ON delivery_proof(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proof_partner_id ON delivery_proof(partner_id);

-- Enable RLS on delivery_proof table
ALTER TABLE delivery_proof ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can insert proof for their assigned deliveries
CREATE POLICY "Partners can insert proof for their deliveries"
  ON delivery_proof FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_proof.order_id
      AND delivery_orders.partner_id IN (
        SELECT user_id FROM partner_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Partners can view their own delivery proofs
CREATE POLICY "Partners can view own delivery proofs"
  ON delivery_proof FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

-- Policy: Customers can view proof for their orders
CREATE POLICY "Customers can view proof for their orders"
  ON delivery_proof FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_proof.order_id
      AND delivery_orders.customer_id = auth.uid()
    )
  );