export const COLORS = {
  primary: '#FDB022',
  primaryLight: '#FEF7E8',
  secondary: '#2a2a2a',
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FDB022',
  info: '#2196F3',
  text: {
    primary: '#1a1a1a',
    secondary: '#666',
    light: '#999',
  },
  background: {
    primary: '#fff',
    secondary: '#f9f9f9',
    border: '#eee',
  },
};

export const DELIVERY_TYPES = [
  { id: 'standard', name: 'Standard Delivery', duration: '2-3 hours', icon: '🚗' },
  { id: 'express', name: 'Express Delivery', duration: '30-60 mins', icon: '🏍️' },
  { id: 'same_day', name: 'Same Day', duration: '3-6 hours', icon: '📦' },
];

export const VEHICLE_TYPES = [
  { id: 'bike', name: 'Motorcycle', capacity: '20kg', icon: '🏍️' },
  { id: 'van', name: 'Van', capacity: '100kg', icon: '🚐' },
  { id: 'truck', name: 'Truck', capacity: '500kg', icon: '🚚' },
];

export const BILL_CATEGORIES = {
  AIRTIME: 'airtime',
  DATA: 'data',
  DSTV: 'dstv',
  ELECTRIC: 'electric',
};

export const NETWORK_PROVIDERS = [
  { id: 'mtn', name: 'MTN', code: 'mtn-ng' },
  { id: 'airtel', name: 'Airtel', code: 'airtel-ng' },
  { id: 'glo', name: 'Glo', code: 'glo-ng' },
  { id: '9mobile', name: '9mobile', code: 'etisalat-ng' },
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PICKUP_CONFIRMED: 'pickup_confirmed',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const INSURANCE_PROVIDERS = [
  { id: 'aiico', name: 'AIICO Insurance' },
  { id: 'custodian', name: 'Custodian Insurance' },
  { id: 'leadway', name: 'Leadway Assurance' },
  { id: 'nem', name: 'NEM Insurance' },
];
