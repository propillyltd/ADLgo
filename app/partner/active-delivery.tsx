import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MapPin, User, Phone, MessageCircle, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type DeliveryOrder = {
  id: string;
  order_number: string;
  customer_id: string;
  pickup_address: string;
  dropoff_address: string;
  recipient_name: string;
  recipient_phone: string;
  status: string;
  total_cost: number;
};

type Customer = {
  full_name: string;
  phone: string;
  avatar_url: string;
};

export default function ActiveDeliveryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', params.orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      setOrder(orderData);

      if (orderData) {
        const { data: customerData } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', orderData.customer_id)
          .maybeSingle();

        if (customerData) setCustomer(customerData);

        if (orderData.status === 'accepted') setCurrentStep(1);
        else if (orderData.status === 'pickup_confirmed') setCurrentStep(2);
        else if (orderData.status === 'in_transit') setCurrentStep(2);
        else if (orderData.status === 'delivered') setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status: newStatus })
        .eq('id', order!.id);

      if (error) throw error;

      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: order!.id,
          status: newStatus,
          notes: `Status updated to ${newStatus}`,
        });

      if (trackingError) console.error('Tracking error:', trackingError);

      await loadOrderDetails();
      Alert.alert('Success', 'Delivery status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleConfirmPickup = () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the package from the sender?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateOrderStatus('pickup_confirmed')
        }
      ]
    );
  };

  const handleStartNavigation = () => {
    updateOrderStatus('in_transit');
    Alert.alert('Navigation', 'Map navigation would open here');
  };

  const handleCompleteDelivery = () => {
    Alert.alert(
      'Complete Delivery',
      'Have you successfully delivered the package to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateOrderStatus('delivered');
            router.back();
          }
        }
      ]
    );
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>In-Progress Delivery</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, currentStep >= 1 && styles.progressCircleActive]}>
            {currentStep > 1 ? (
              <CheckCircle size={24} color="#fff" />
            ) : (
              <Text style={styles.progressNumber}>1</Text>
            )}
          </View>
          <Text style={styles.progressLabel}>Confirm Pickup</Text>
          <Text style={styles.progressDescription}>
            {currentStep === 1 ? 'Awaiting pickup confirmation from store' : 'Package picked up'}
          </Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, currentStep >= 2 && styles.progressCircleActive]}>
            {currentStep > 2 ? (
              <CheckCircle size={24} color="#fff" />
            ) : (
              <Text style={styles.progressNumber}>2</Text>
            )}
          </View>
          <Text style={styles.progressLabel}>Navigate to Drop-off</Text>
          <Text style={styles.progressDescription}>Follow the route to the customer's location</Text>

          {currentStep === 2 && (
            <>
              <View style={styles.locationCard}>
                <MapPin size={20} color="#FF5252" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>Drop-off Location:</Text>
                  <Text style={styles.locationAddress}>{order.dropoff_address}</Text>
                  {order.recipient_name && (
                    <Text style={styles.locationRecipient}>Recipient: {order.recipient_name}</Text>
                  )}
                </View>
              </View>

              <View style={styles.mapPreview}>
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/2422493/pexels-photo-2422493.jpeg' }}
                  style={styles.mapImage}
                />
              </View>

              <TouchableOpacity style={styles.navigationButton} onPress={handleStartNavigation}>
                <Text style={styles.navigationButtonText}>Start Navigation</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, currentStep >= 3 && styles.progressCircleActive]}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
          <Text style={styles.progressLabel}>Delivery Completion</Text>
          <Text style={styles.progressDescription}>Confirm successful delivery to the customer</Text>
        </View>
      </View>

      <View style={styles.customerCard}>
        <Text style={styles.customerCardTitle}>Rate Customer</Text>
        <View style={styles.customerInfo}>
          <Image
            source={{
              uri: customer?.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
            }}
            style={styles.customerAvatar}
          />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customer?.full_name || 'Customer'}</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.star}>⭐</Text>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push(`/chat/${order.id}`)}
        >
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Message Customer</Text>
        </TouchableOpacity>
      </View>

      {currentStep === 1 && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmPickup}>
          <Text style={styles.primaryButtonText}>Confirm Pickup</Text>
        </TouchableOpacity>
      )}

      {currentStep === 2 && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleCompleteDelivery}>
          <Text style={styles.primaryButtonText}>Complete Delivery</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressContainer: {
    padding: 24,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressCircleActive: {
    backgroundColor: '#4CAF50',
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  progressDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginVertical: 8,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  locationRecipient: {
    fontSize: 12,
    color: '#666',
  },
  mapPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    marginTop: 16,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  navigationButton: {
    backgroundColor: '#FDB022',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  navigationButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  customerCard: {
    marginHorizontal: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  customerCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 16,
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    marginHorizontal: 24,
    backgroundColor: '#FDB022',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
