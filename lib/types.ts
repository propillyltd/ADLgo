// TypeScript interfaces for the application

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'partner' | 'both' | 'admin';
  kyc_status?: string;
  verification_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method_id?: string;
  order_id?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank' | 'wallet';
  provider: string;
  account_number: string;
  account_name?: string;
  is_default: boolean;
  is_verified: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrder {
  id: string;
  order_number: string;
  customer_id: string;
  partner_id?: string;
  delivery_type: string;
  status: 'pending' | 'accepted' | 'pickup_confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  bid_status: 'open_for_bids' | 'bids_closed' | 'bid_accepted';
  selected_bid_id?: string;
  vehicle_type: 'bike' | 'van' | 'truck';
  bidding_window_minutes: number;
  auto_accept_threshold?: number;
  min_bid_decrement: number;
  current_lowest_bid?: number;
  pickup_address: string;
  dropoff_address: string;
  recipient_name: string;
  recipient_phone: string;
  package_length?: string;
  package_weight: number;
  declared_value: number;
  is_fragile: boolean;
  distance_km: number;
  estimated_duration_minutes: number;
  base_fee: number;
  fragile_handling_fee: number;
  total_cost: number;
  payment_status: 'pending' | 'completed' | 'failed';
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryBid {
  id: string;
  order_id: string;
  partner_id: string;
  bid_amount: number;
  vehicle_type: 'bike' | 'van' | 'truck';
  estimated_pickup_time: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  bid_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerProfile {
  user_id: string;
  vehicle_type: 'motorcycle' | 'car' | 'van' | 'truck';
  vehicle_registration: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  is_online: boolean;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  total_earnings: number;
  pending_payout: number;
  completed_deliveries: number;
  average_rating: number;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  vehicle_tracker_id?: string;
  drivers_license?: string;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: 'nin' | 'passport' | 'drivers_license' | 'national_id';
  document_number: string;
  document_url: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KycVerification {
  id: string;
  user_id: string;
  facial_image_url: string;
  verification_score: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface AddPaymentMethodForm {
  type: 'card' | 'bank' | 'wallet';
  provider: string;
  account_number: string;
  account_name?: string;
  expiry_date?: string; // For cards
  cvv?: string; // For cards
}

export interface WalletTopUpForm {
  amount: number;
  payment_method_id: string;
  description?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Navigation types
export interface NavigationProps {
  navigation: any; // Replace with proper navigation type when available
  route: any; // Replace with proper route type when available
}

// Component prop types
export interface MenuItemProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
}

export interface ProfileCardProps {
  profile: Profile | null;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Constants
export const PAYMENT_METHOD_TYPES = ['card', 'bank', 'wallet'] as const;
export const VEHICLE_TYPES = ['bike', 'van', 'truck'] as const;
export const ORDER_STATUSES = ['pending', 'accepted', 'pickup_confirmed', 'in_transit', 'delivered', 'cancelled'] as const;
export const BID_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'] as const;
export const KYC_DOCUMENT_TYPES = ['nin', 'passport', 'drivers_license', 'national_id'] as const;