import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Clock, MessageSquare, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS, VEHICLE_TYPES } from '@/lib/constants';

type Order = {
  id: string;
  order_number: string;
  pickup_address: string;
  dropoff_address: string;
  distance_km: number;
  vehicle_type: string;
  package_length: string;
  package_weight: number;
  delivery_type: string;
  total_cost: number;
};

export default function SubmitBidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bidAmount, setBidAmount] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [estimatedPickupTime, setEstimatedPickupTime] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', params.orderId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOrder(data);
        setVehicleType(data.vehicle_type || 'bike');
        setBidAmount(Math.round(data.total_cost * 0.8).toString());
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || !estimatedPickupTime) {
      Alert.alert('Error', 'Please fill in bid amount and estimated pickup time');
      return;
    }

    const bidAmountNum = parseFloat(bidAmount);
    const pickupTimeNum = parseInt(estimatedPickupTime);

    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    if (isNaN(pickupTimeNum) || pickupTimeNum <= 0) {
      Alert.alert('Error', 'Please enter a valid pickup time');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('delivery_bids').insert({
        order_id: params.orderId,
        partner_id: user!.id,
        bid_amount: bidAmountNum,
        vehicle_type: vehicleType,
        estimated_pickup_time: pickupTimeNum,
        message: message.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Your bid has been submitted!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      Alert.alert('Error', error.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Bid</Text>
      </View>

      <View style={styles.orderCard}>
        <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
        <View style={styles.orderLocation}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.orderLocationText}>{order.pickup_address}</Text>
        </View>
        <View style={styles.orderLocation}>
          <MapPin size={16} color={COLORS.error} />
          <Text style={styles.orderLocationText}>{order.dropoff_address}</Text>
        </View>
        <View style={styles.orderDetails}>
          <Text style={styles.orderDetailText}>Distance: {order.distance_km} km</Text>
          <Text style={styles.orderDetailText}>Type: {order.delivery_type}</Text>
          <Text style={styles.orderDetailText}>Customer Budget: ₦{order.total_cost.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Bid</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bid Amount (₦) *</Text>
        <View style={styles.inputWithIcon}>
          <DollarSign size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your bid amount"
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.hint}>Suggested: ₦{Math.round(order.total_cost * 0.8).toLocaleString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Vehicle Type</Text>
      <View style={styles.vehicleTypeContainer}>
        {VEHICLE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.vehicleTypeCard,
              vehicleType === type.id && styles.vehicleTypeCardActive,
            ]}
            onPress={() => setVehicleType(type.id)}
          >
            <Text style={styles.vehicleTypeIcon}>{type.icon}</Text>
            <Text style={styles.vehicleTypeName}>{type.name}</Text>
            <Text style={styles.vehicleTypeCapacity}>{type.capacity}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estimated Pickup Time (minutes) *</Text>
        <View style={styles.inputWithIcon}>
          <Clock size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="e.g., 15"
            value={estimatedPickupTime}
            onChangeText={setEstimatedPickupTime}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.hint}>How soon can you reach the pickup location?</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Message (Optional)</Text>
        <View style={styles.inputWithIcon}>
          <MessageSquare size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="Add a note to the customer"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.bidSummary}>
        <Text style={styles.summaryTitle}>Bid Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Your Bid Amount</Text>
          <Text style={styles.summaryValue}>₦{bidAmount || '0'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Vehicle Type</Text>
          <Text style={styles.summaryValue}>{selectedVehicle?.name || 'N/A'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pickup Time</Text>
          <Text style={styles.summaryValue}>{estimatedPickupTime || '0'} min</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmitBid}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting Bid...' : 'Submit Bid'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  orderCard: {
    margin: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  orderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orderLocationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  orderDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.border,
  },
  orderDetailText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  inputGroup: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  vehicleTypeCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  vehicleTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  vehicleTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  vehicleTypeCapacity: {
    fontSize: 10,
    color: COLORS.text.secondary,
  },
  bidSummary: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  submitButton: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
