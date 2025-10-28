import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MapPin, Package, User, Phone, DollarSign, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS, DELIVERY_TYPES, VEHICLE_TYPES } from '@/lib/constants';
import { calculateDeliveryFee, generateOrderNumber } from '@/lib/api';

export default function CreateDeliveryScreen() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [deliveryType, setDeliveryType] = useState('standard');
  const [vehicleType, setVehicleType] = useState('bike');
  const [isFragile, setIsFragile] = useState(false);

  const estimatedDistance = 5;
  const estimatedCost = calculateDeliveryFee(estimatedDistance, deliveryType);
  const insuranceFee = isFragile ? Math.round(estimatedCost * 0.1) : 0;
  const totalCost = estimatedCost + insuranceFee;

  const handleCreateOrder = async () => {
    if (!profile) {
      Alert.alert('Error', 'Please wait while we load your profile');
      return;
    }

    if (!pickupAddress || !dropoffAddress || !recipientName || !recipientPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const orderNumber = generateOrderNumber();
      const estimatedDelivery = new Date();
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 2);

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert({
          order_number: orderNumber,
          customer_id: profile.id,
          vehicle_type: vehicleType,
          delivery_type: deliveryType,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          package_length: packageDescription,
          package_weight: packageWeight ? parseFloat(packageWeight) : null,
          declared_value: declaredValue ? parseFloat(declaredValue) : null,
          is_fragile: isFragile,
          distance_km: estimatedDistance,
          estimated_duration_minutes: 60,
          base_fee: estimatedCost,
          fragile_handling_fee: insuranceFee,
          total_cost: totalCost,
          status: 'pending',
          payment_status: 'pending',
          bid_status: 'open_for_bids',
          estimated_delivery_time: estimatedDelivery.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('order_tracking').insert({
        order_id: data.id,
        status: 'pending',
        notes: 'Order created, open for partner bids',
      });

      Alert.alert('Success', 'Delivery order created successfully!', [
        {
          text: 'Track Order',
          onPress: () => router.replace(`/tracking/${data.id}`),
        },
        {
          text: 'View Orders',
          onPress: () => router.replace('/(tabs)/orders'),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Unable to load profile. Please try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Delivery</Text>
      </View>

      <Text style={styles.sectionTitle}>Vehicle Type</Text>
      <View style={styles.deliveryTypeContainer}>
        {VEHICLE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.deliveryTypeCard,
              vehicleType === type.id && styles.deliveryTypeCardActive,
            ]}
            onPress={() => setVehicleType(type.id)}
          >
            <Text style={styles.deliveryTypeIcon}>{type.icon}</Text>
            <Text style={styles.deliveryTypeName}>{type.name}</Text>
            <Text style={styles.deliveryTypeDuration}>{type.capacity}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Delivery Type</Text>
      <View style={styles.deliveryTypeContainer}>
        {DELIVERY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.deliveryTypeCard,
              deliveryType === type.id && styles.deliveryTypeCardActive,
            ]}
            onPress={() => setDeliveryType(type.id)}
          >
            <Text style={styles.deliveryTypeIcon}>{type.icon}</Text>
            <Text style={styles.deliveryTypeName}>{type.name}</Text>
            <Text style={styles.deliveryTypeDuration}>{type.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Pickup & Delivery</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pickup Address *</Text>
        <View style={styles.inputWithIcon}>
          <MapPin size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder="Enter pickup location"
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Delivery Address *</Text>
        <View style={styles.inputWithIcon}>
          <MapPin size={20} color={COLORS.error} />
          <TextInput
            style={styles.input}
            placeholder="Enter delivery location"
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recipient Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Name *</Text>
        <View style={styles.inputWithIcon}>
          <User size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Phone *</Text>
        <View style={styles.inputWithIcon}>
          <Phone size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="080XXXXXXXX"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Package Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Package Description</Text>
        <View style={styles.inputWithIcon}>
          <Package size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="e.g., Electronics, Documents"
            value={packageDescription}
            onChangeText={setPackageDescription}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estimated Weight (kg)</Text>
        <TextInput
          style={styles.inputPlain}
          placeholder="Enter weight"
          value={packageWeight}
          onChangeText={setPackageWeight}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Declared Value (₦)</Text>
        <View style={styles.inputWithIcon}>
          <DollarSign size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            placeholder="Item value for insurance"
            value={declaredValue}
            onChangeText={setDeclaredValue}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsFragile(!isFragile)}
      >
        <View style={[styles.checkbox, isFragile && styles.checkboxChecked]}>
          {isFragile && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Fragile - Handle with care (+10% insurance)</Text>
      </TouchableOpacity>

      <View style={styles.costBreakdown}>
        <Text style={styles.costTitle}>Cost Breakdown</Text>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Delivery Fee ({estimatedDistance}km)</Text>
          <Text style={styles.costValue}>₦{estimatedCost.toLocaleString()}</Text>
        </View>
        {insuranceFee > 0 && (
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Insurance Fee</Text>
            <Text style={styles.costValue}>₦{insuranceFee.toLocaleString()}</Text>
          </View>
        )}
        <View style={[styles.costRow, styles.costTotal]}>
          <Text style={styles.costLabelBold}>Total Cost</Text>
          <Text style={styles.costValueBold}>₦{totalCost.toLocaleString()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={handleCreateOrder}
        disabled={loading}
      >
        <Text style={styles.createButtonText}>
          {loading ? 'Creating Order...' : 'Create Delivery Order'}
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 8,
  },
  deliveryTypeCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deliveryTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  deliveryTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deliveryTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  deliveryTypeDuration: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  inputGroup: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
  inputPlain: {
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.background.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  costBreakdown: {
    marginHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  costTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  costValue: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  costTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.background.border,
    paddingTop: 12,
    marginTop: 8,
  },
  costLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  costValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  createButton: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
