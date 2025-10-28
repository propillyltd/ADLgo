/*
  # Create Bidding System for Delivery Orders

  1. New Tables
    - `delivery_bids`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to delivery_orders)
      - `partner_id` (uuid, foreign key to profiles)
      - `bid_amount` (numeric, the partner's proposed price)
      - `vehicle_type` (text, bike/van/truck)
      - `estimated_pickup_time` (integer, minutes until pickup)
      - `message` (text, optional message from partner)
      - `status` (text, pending/accepted/rejected/withdrawn)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications to delivery_orders table
    - Add `bid_status` column (text, open_for_bids/bids_closed/bid_accepted)
    - Add `selected_bid_id` column (uuid, foreign key to delivery_bids)
    - Add `vehicle_type` column (text, bike/van/truck)
    - Add `bidding_window_minutes` column (integer, custom per delivery type)

  3. Security
    - Enable RLS on delivery_bids table
    - Partners can create bids for open orders
    - Partners can view their own bids
    - Customers can view all bids for their orders
    - Only customers can accept/reject bids for their orders
    - Partners can withdraw their pending bids

  4. Indexes
    - Index on delivery_bids.order_id for efficient bid lookup
    - Index on delivery_bids.partner_id for partner bid history
    - Index on delivery_bids.status for filtering active bids
*/

-- Create delivery_bids table
CREATE TABLE IF NOT EXISTS delivery_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount numeric NOT NULL CHECK (bid_amount > 0),
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'van', 'truck')),
  estimated_pickup_time integer NOT NULL CHECK (estimated_pickup_time > 0),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to delivery_orders table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_orders' AND column_name = 'bid_status'
  ) THEN
    ALTER TABLE delivery_orders ADD COLUMN bid_status text DEFAULT 'open_for_bids' CHECK (bid_status IN ('open_for_bids', 'bids_closed', 'bid_accepted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_orders' AND column_name = 'selected_bid_id'
  ) THEN
    ALTER TABLE delivery_orders ADD COLUMN selected_bid_id uuid REFERENCES delivery_bids(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_orders' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE delivery_orders ADD COLUMN vehicle_type text DEFAULT 'bike' CHECK (vehicle_type IN ('bike', 'van', 'truck'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_orders' AND column_name = 'bidding_window_minutes'
  ) THEN
    ALTER TABLE delivery_orders ADD COLUMN bidding_window_minutes integer DEFAULT 30 CHECK (bidding_window_minutes > 0);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_bids_order_id ON delivery_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_partner_id ON delivery_bids(partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_status ON delivery_bids(status);

-- Enable RLS on delivery_bids table
ALTER TABLE delivery_bids ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can create bids for orders that are open for bidding
CREATE POLICY "Partners can create bids for open orders"
  ON delivery_bids FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_bids.order_id
      AND delivery_orders.bid_status = 'open_for_bids'
      AND delivery_orders.status = 'pending'
    )
    AND EXISTS (
      SELECT 1 FROM partner_profiles
      WHERE partner_profiles.user_id = auth.uid()
      AND partner_profiles.verification_status = 'approved'
    )
  );

-- Policy: Partners can view their own bids
CREATE POLICY "Partners can view own bids"
  ON delivery_bids FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

-- Policy: Customers can view all bids for their orders
CREATE POLICY "Customers can view bids for their orders"
  ON delivery_bids FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_bids.order_id
      AND delivery_orders.customer_id = auth.uid()
    )
  );

-- Policy: Partners can update their own pending bids (withdraw or edit)
CREATE POLICY "Partners can update own pending bids"
  ON delivery_bids FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid() AND status IN ('pending', 'withdrawn'));

-- Policy: Customers can update bid status for their orders (accept/reject)
CREATE POLICY "Customers can update bid status for their orders"
  ON delivery_bids FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_bids.order_id
      AND delivery_orders.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_bids.order_id
      AND delivery_orders.customer_id = auth.uid()
    )
    AND status IN ('pending', 'accepted', 'rejected')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_bids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_delivery_bids_timestamp
  BEFORE UPDATE ON delivery_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_bids_updated_at();