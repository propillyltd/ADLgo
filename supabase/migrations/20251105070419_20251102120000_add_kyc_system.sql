/*
  # Add KYC (Know Your Customer) System

  1. New Tables
    - `kyc_documents` - Document uploads for verification
    - `kyc_verification` - Verification records

  2. Enhanced Tables
    - Add KYC fields to profiles and partner_profiles

  3. Security
    - Enable RLS on all new tables
*/

-- Create kyc_documents table  
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('nin', 'government_id', 'passport', 'drivers_license')),
  document_number text NOT NULL,
  document_url text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kyc_verification table
CREATE TABLE IF NOT EXISTS kyc_verification (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facial_image_url text NOT NULL,
  verification_score numeric,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_user_id ON kyc_verification(user_id);

-- Enable RLS
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_documents
CREATE POLICY "Users can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending KYC documents"
  ON kyc_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND verification_status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for kyc_verification
CREATE POLICY "Users can view own verification records"
  ON kyc_verification FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification records"
  ON kyc_verification FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
