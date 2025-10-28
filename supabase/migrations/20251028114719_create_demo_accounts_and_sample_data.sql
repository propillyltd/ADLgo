/*
  # Create Demo Accounts and Sample Data

  1. Demo Accounts Creation
    - Demo customer: customer@demo.com / password: demo123456
    - Demo partner: partner@demo.com / password: demo123456
    
  2. Sample Data
    - Customer profile with complete information
    - Partner profile with approved verification status
    - Sample delivery orders with different statuses
    - Sample bids from partner on orders
    - Sample messages between customer and partner
    - Sample order tracking entries
    - Sample bill payments
    - Sample partner earnings
    - Sample ratings

  IMPORTANT: Users must register these accounts through the app with the passwords above.
  This migration only prepares placeholder data structures.
*/

-- Note: Since we cannot create auth users directly via SQL migration,
-- we will create placeholder comments for the demo credentials.
-- Users need to register these accounts via the app UI.

-- Demo Account Credentials:
-- Customer Account: Email: customer@demo.com, Password: demo123456
-- Partner Account: Email: partner@demo.com, Password: demo123456

-- The following inserts will be activated once users register with these credentials
-- For now, we'll create sample data for existing users if needed

-- Check if we have at least one customer user to create sample data
DO $$
DECLARE
  v_customer_id uuid;
  v_partner_id uuid;
  v_order_id_1 uuid;
  v_order_id_2 uuid;
  v_order_id_3 uuid;
  v_bid_id_1 uuid;
BEGIN
  -- Get first customer user
  SELECT id INTO v_customer_id FROM profiles WHERE role = 'customer' LIMIT 1;
  
  -- Only proceed if we have a customer
  IF v_customer_id IS NOT NULL THEN
    
    -- Create or get a partner profile for demo
    -- First check if any partner exists
    SELECT user_id INTO v_partner_id FROM partner_profiles WHERE verification_status = 'approved' LIMIT 1;
    
    -- If no approved partner, create a partner profile for an existing user (if they have role partner or both)
    IF v_partner_id IS NULL THEN
      SELECT id INTO v_partner_id FROM profiles WHERE role IN ('partner', 'both') LIMIT 1;
      
      IF v_partner_id IS NOT NULL THEN
        -- Create partner profile
        INSERT INTO partner_profiles (
          user_id,
          vehicle_type,
          vehicle_registration,
          verification_status,
          is_online,
          bank_name,
          account_number,
          account_name,
          total_earnings,
          pending_payout,
          completed_deliveries,
          average_rating,
          insurance_provider,
          insurance_policy_number,
          insurance_expiry_date,
          drivers_license
        ) VALUES (
          v_partner_id,
          'motorcycle',
          'LAG-123-XY',
          'approved',
          true,
          'GTBank',
          '0123456789',
          'Demo Partner',
          45000,
          5000,
          12,
          4.8,
          'AIICO Insurance',
          'INS-2024-001',
          '2025-12-31',
          'LAG-DL-12345'
        ) ON CONFLICT (user_id) DO UPDATE SET
          verification_status = 'approved',
          is_online = true,
          completed_deliveries = 12,
          average_rating = 4.8;
      END IF;
    END IF;

    -- Create sample delivery orders if we have both customer and partner
    IF v_partner_id IS NOT NULL THEN
      
      -- Order 1: Completed delivery
      INSERT INTO delivery_orders (
        order_number,
        customer_id,
        partner_id,
        delivery_type,
        status,
        bid_status,
        pickup_address,
        dropoff_address,
        recipient_name,
        recipient_phone,
        package_length,
        package_weight,
        declared_value,
        is_fragile,
        distance_km,
        estimated_duration_minutes,
        base_fee,
        fragile_handling_fee,
        total_cost,
        payment_status,
        vehicle_type,
        estimated_delivery_time,
        actual_delivery_time
      ) VALUES (
        'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
        v_customer_id,
        v_partner_id,
        'package',
        'delivered',
        'bid_accepted',
        '10 Admiralty Way, Lekki Phase 1, Lagos',
        '23 Awolowo Road, Ikoyi, Lagos',
        'John Doe',
        '08012345678',
        null,
        2.5,
        50000,
        false,
        8.5,
        45,
        500,
        0,
        1350,
        'completed',
        'bike',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'
      ) RETURNING id INTO v_order_id_1;

      -- Add tracking for completed order
      INSERT INTO order_tracking (order_id, status, notes) VALUES
        (v_order_id_1, 'pending', 'Order created, open for partner bids'),
        (v_order_id_1, 'accepted', 'Partner accepted delivery'),
        (v_order_id_1, 'pickup_confirmed', 'Package picked up from sender'),
        (v_order_id_1, 'in_transit', 'On the way to destination'),
        (v_order_id_1, 'delivered', 'Package delivered successfully');

      -- Add rating for completed order
      INSERT INTO ratings (
        order_id,
        customer_id,
        partner_id,
        rating_by_customer,
        comment_by_customer
      ) VALUES (
        v_order_id_1,
        v_customer_id,
        v_partner_id,
        5,
        'Excellent service! Fast and professional delivery.'
      );

      -- Add partner earning for completed order
      INSERT INTO partner_earnings (
        partner_id,
        order_id,
        amount,
        status
      ) VALUES (
        v_partner_id,
        v_order_id_1,
        1080,
        'completed'
      );

      -- Order 2: In transit
      INSERT INTO delivery_orders (
        order_number,
        customer_id,
        partner_id,
        delivery_type,
        status,
        bid_status,
        pickup_address,
        dropoff_address,
        recipient_name,
        recipient_phone,
        package_length,
        package_weight,
        declared_value,
        is_fragile,
        distance_km,
        estimated_duration_minutes,
        base_fee,
        fragile_handling_fee,
        total_cost,
        payment_status,
        vehicle_type,
        estimated_delivery_time
      ) VALUES (
        'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
        v_customer_id,
        v_partner_id,
        'package',
        'in_transit',
        'bid_accepted',
        '5 Ajose Adeogun Street, Victoria Island, Lagos',
        '42 Ademola Adetokunbo Crescent, Wuse 2, Abuja',
        'Jane Smith',
        '08087654321',
        null,
        1.2,
        25000,
        true,
        12.3,
        60,
        500,
        50,
        1550,
        'completed',
        'bike',
        NOW() + INTERVAL '30 minutes'
      ) RETURNING id INTO v_order_id_2;

      -- Add tracking for in-transit order
      INSERT INTO order_tracking (order_id, status, notes) VALUES
        (v_order_id_2, 'pending', 'Order created, open for partner bids'),
        (v_order_id_2, 'accepted', 'Partner accepted delivery'),
        (v_order_id_2, 'pickup_confirmed', 'Package picked up from sender'),
        (v_order_id_2, 'in_transit', 'On the way to destination');

      -- Add messages for in-transit order
      INSERT INTO messages (order_id, sender_id, receiver_id, message, is_read) VALUES
        (v_order_id_2, v_customer_id, v_partner_id, 'Hi, please handle with care, it''s fragile.', true),
        (v_order_id_2, v_partner_id, v_customer_id, 'Sure thing! Package is secure and on its way.', true),
        (v_order_id_2, v_customer_id, v_partner_id, 'Thank you! Please call when you arrive.', true);

      -- Order 3: Open for bids
      INSERT INTO delivery_orders (
        order_number,
        customer_id,
        delivery_type,
        status,
        bid_status,
        pickup_address,
        dropoff_address,
        recipient_name,
        recipient_phone,
        package_length,
        package_weight,
        is_fragile,
        distance_km,
        estimated_duration_minutes,
        base_fee,
        total_cost,
        payment_status,
        vehicle_type,
        estimated_delivery_time,
        bidding_window_minutes
      ) VALUES (
        'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
        v_customer_id,
        'package',
        'pending',
        'open_for_bids',
        '15 Ozumba Mbadiwe Avenue, Victoria Island, Lagos',
        '8 Gerrard Road, Ikoyi, Lagos',
        'Mike Johnson',
        '08098765432',
        null,
        0.5,
        false,
        5.2,
        30,
        500,
        800,
        'pending',
        'bike',
        NOW() + INTERVAL '2 hours',
        30
      ) RETURNING id INTO v_order_id_3;

      -- Add tracking for pending order
      INSERT INTO order_tracking (order_id, status, notes) VALUES
        (v_order_id_3, 'pending', 'Order created, open for partner bids');

      -- Add sample bids for pending order
      INSERT INTO delivery_bids (
        order_id,
        partner_id,
        bid_amount,
        vehicle_type,
        estimated_pickup_time,
        message,
        status
      ) VALUES
        (v_order_id_3, v_partner_id, 650, 'bike', 15, 'I can pick up within 15 minutes. Fast and reliable service!', 'pending'),
        (v_order_id_3, v_partner_id, 700, 'van', 25, 'I have a van for safer transport if needed.', 'pending')
      RETURNING id INTO v_bid_id_1;

      -- Add sample bill payments
      INSERT INTO bill_payments (
        user_id,
        category,
        provider,
        account_number,
        amount,
        payment_status,
        transaction_reference
      ) VALUES
        (v_customer_id, 'airtime', 'MTN', '08012345678', 1000, 'completed', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 10))),
        (v_customer_id, 'data', 'Airtel', '08087654321', 2000, 'completed', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 10))),
        (v_customer_id, 'electric', 'EKEDC', '1234567890', 5000, 'completed', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 10)));

    END IF;
  END IF;
END $$;