/*
  # Initial Database Schema for ADLgo Delivery Platform

  1. New Tables
    - `profiles`
      - User profile information for all users
      - Includes role management (customer/partner/admin)
      - KYC status tracking

    - `partner_profiles`
      - Extended information for delivery partners
      - Vehicle details and verification status
      - Earnings and performance tracking

    - `delivery_orders`
      - Core delivery order management
      - Pickup/dropoff information
      - Pricing and status tracking
      - Bidding system support

    - `delivery_bids`
      - Partner bids on delivery orders
      - Bid amount and timing
      - Status tracking

    - `order_tracking`
      - Order status history
      - Location tracking
      - Timeline of events

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Restrict access based on user roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'both', 'admin')),
  kyc_status text DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'under_review', 'approved', 'rejected')),
  verification_level text DEFAULT 'basic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create partner_profiles table
CREATE TABLE IF NOT EXISTS partner_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car', 'van', 'truck')),
  vehicle_number text,
  vehicle_registration text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  availability_status text DEFAULT 'unavailable' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  is_online boolean DEFAULT false,
  bank_name text,
  account_number text,
  account_name text,
  total_earnings numeric DEFAULT 0,
  pending_payout numeric DEFAULT 0,
  completed_deliveries integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create delivery_orders table
CREATE TABLE IF NOT EXISTS delivery_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES partner_profiles(user_id) ON DELETE SET NULL,
  delivery_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'pickup_confirmed', 'in_transit', 'delivered', 'cancelled')),
  bid_status text DEFAULT 'open_for_bids' CHECK (bid_status IN ('open_for_bids', 'bids_closed', 'bid_accepted')),
  selected_bid_id uuid,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'van', 'truck')),
  bidding_window_minutes integer DEFAULT 30,
  auto_accept_threshold numeric,
  min_bid_decrement numeric DEFAULT 50,
  current_lowest_bid numeric,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  package_length text,
  package_weight numeric,
  declared_value numeric,
  is_fragile boolean DEFAULT false,
  distance_km numeric NOT NULL,
  estimated_duration_minutes integer NOT NULL,
  base_fee numeric NOT NULL,
  fragile_handling_fee numeric DEFAULT 0,
  total_cost numeric NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create delivery_bids table
CREATE TABLE IF NOT EXISTS delivery_bids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES delivery_orders(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES partner_profiles(user_id) ON DELETE CASCADE NOT NULL,
  bid_amount numeric NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'van', 'truck')),
  estimated_pickup_time integer NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  bid_expiry timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(order_id, partner_id)
);

-- Create order_tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES delivery_orders(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Partner Profiles Policies
CREATE POLICY "Partners can view own profile"
  ON partner_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own profile"
  ON partner_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can insert own profile"
  ON partner_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can view partner profiles for bidding"
  ON partner_profiles FOR SELECT
  TO authenticated
  USING (verification_status = 'approved');

-- Delivery Orders Policies
CREATE POLICY "Customers can view own orders"
  ON delivery_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Partners can view orders available for bidding"
  ON delivery_orders FOR SELECT
  TO authenticated
  USING (
    bid_status = 'open_for_bids' OR
    partner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM delivery_bids
      WHERE delivery_bids.order_id = delivery_orders.id
      AND delivery_bids.partner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create orders"
  ON delivery_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers and assigned partners can update orders"
  ON delivery_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = partner_id)
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = partner_id);

-- Delivery Bids Policies
CREATE POLICY "Partners can view own bids"
  ON delivery_bids FOR SELECT
  TO authenticated
  USING (auth.uid() = partner_id);

CREATE POLICY "Customers can view bids on their orders"
  ON delivery_bids FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = delivery_bids.order_id
      AND delivery_orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Partners can create bids"
  ON delivery_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update own bids"
  ON delivery_bids FOR UPDATE
  TO authenticated
  USING (auth.uid() = partner_id)
  WITH CHECK (auth.uid() = partner_id);

-- Order Tracking Policies
CREATE POLICY "Users can view tracking for their orders"
  ON order_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = order_tracking.order_id
      AND (delivery_orders.customer_id = auth.uid() OR delivery_orders.partner_id = auth.uid())
    )
  );

CREATE POLICY "Partners can insert tracking updates"
  ON order_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_orders
      WHERE delivery_orders.id = order_tracking.order_id
      AND delivery_orders.partner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_verification ON partner_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer ON delivery_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_partner ON delivery_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_bid_status ON delivery_orders(bid_status);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_order ON delivery_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bids_partner ON delivery_bids(partner_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON partner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at BEFORE UPDATE ON delivery_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_bids_updated_at BEFORE UPDATE ON delivery_bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
