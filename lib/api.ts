type PaystackResponse = {
  status: boolean;
  message: string;
  data?: any;
};

type VTPassResponse = {
  code: string;
  content: any;
};

const PAYSTACK_SECRET_KEY = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';
const VTPASS_API_KEY = process.env.EXPO_PUBLIC_VTPASS_API_KEY || '';
const VTPASS_PUBLIC_KEY = process.env.EXPO_PUBLIC_VTPASS_PUBLIC_KEY || '';

export const paystackAPI = {
  initializeTransaction: async (email: string, amount: number, reference: string): Promise<PaystackResponse> => {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100,
          reference,
          currency: 'NGN',
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return { status: false, message: 'Failed to initialize payment' };
    }
  },

  verifyTransaction: async (reference: string): Promise<PaystackResponse> => {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Paystack verification error:', error);
      return { status: false, message: 'Failed to verify payment' };
    }
  },
};

export const vtpassAPI = {
  purchaseAirtime: async (
    network: string,
    phone: string,
    amount: number,
    requestId: string
  ): Promise<VTPassResponse> => {
    try {
      const response = await fetch('https://api-service.vtpass.com/api/pay', {
        method: 'POST',
        headers: {
          'api-key': VTPASS_API_KEY,
          'public-key': VTPASS_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          serviceID: network,
          amount,
          phone,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('VTPass airtime error:', error);
      return { code: '016', content: {} };
    }
  },

  purchaseData: async (
    network: string,
    phone: string,
    variationCode: string,
    requestId: string
  ): Promise<VTPassResponse> => {
    try {
      const response = await fetch('https://api-service.vtpass.com/api/pay', {
        method: 'POST',
        headers: {
          'api-key': VTPASS_API_KEY,
          'public-key': VTPASS_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          serviceID: `${network}-data`,
          billersCode: phone,
          variation_code: variationCode,
          phone,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('VTPass data error:', error);
      return { code: '016', content: {} };
    }
  },

  verifySmartCard: async (smartCardNumber: string, serviceID: string): Promise<VTPassResponse> => {
    try {
      const response = await fetch('https://api-service.vtpass.com/api/merchant-verify', {
        method: 'POST',
        headers: {
          'api-key': VTPASS_API_KEY,
          'public-key': VTPASS_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billersCode: smartCardNumber,
          serviceID,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('VTPass verification error:', error);
      return { code: '016', content: {} };
    }
  },

  payElectricity: async (
    meterNumber: string,
    serviceID: string,
    amount: number,
    phone: string,
    requestId: string
  ): Promise<VTPassResponse> => {
    try {
      const response = await fetch('https://api-service.vtpass.com/api/pay', {
        method: 'POST',
        headers: {
          'api-key': VTPASS_API_KEY,
          'public-key': VTPASS_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          serviceID,
          billersCode: meterNumber,
          amount,
          phone,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('VTPass electricity error:', error);
      return { code: '016', content: {} };
    }
  },
};

export const calculateDeliveryFee = (distance: number, deliveryType: string): number => {
  const baseRate = 500;
  const perKmRate = 100;

  const distanceFee = baseRate + (distance * perKmRate);

  const multipliers: { [key: string]: number } = {
    standard: 1,
    express: 1.5,
    same_day: 1.2,
  };

  return Math.round(distanceFee * (multipliers[deliveryType] || 1));
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

export const generateTransactionRef = (): string => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();
};
