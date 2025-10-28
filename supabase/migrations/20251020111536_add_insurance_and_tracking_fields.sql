/*
  # Add Insurance and Vehicle Tracking Compliance Fields

  1. Modifications
    - Add insurance_provider to partner_profiles
    - Add insurance_policy_number to partner_profiles
    - Add insurance_expiry_date to partner_profiles  
    - Add vehicle_tracker_id to partner_profiles
    - Add drivers_license to partner_profiles (text field for license number)

  2. Important Notes
    - These fields are required for Nigerian delivery partner compliance
    - Insurance verification will be implemented in the partner verification flow
    - Vehicle tracking integration will use tracker_id for real-time location
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_profiles' AND column_name = 'insurance_provider'
  ) THEN
    ALTER TABLE partner_profiles ADD COLUMN insurance_provider text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_profiles' AND column_name = 'insurance_policy_number'
  ) THEN
    ALTER TABLE partner_profiles ADD COLUMN insurance_policy_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_profiles' AND column_name = 'insurance_expiry_date'
  ) THEN
    ALTER TABLE partner_profiles ADD COLUMN insurance_expiry_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_profiles' AND column_name = 'vehicle_tracker_id'
  ) THEN
    ALTER TABLE partner_profiles ADD COLUMN vehicle_tracker_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_profiles' AND column_name = 'drivers_license'
  ) THEN
    ALTER TABLE partner_profiles ADD COLUMN drivers_license text;
  END IF;
END $$;
