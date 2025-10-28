import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, Star, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type DeliveryOrder = {
  id: string;
  order_number: string;
  partner_id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  total_cost: number;
  estimated_delivery_time: string;
};

type Partner = {
  full_name: string;
  phone: string;
  avatar_url: string;
  average_rating: number;
};

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    loadOrderData();
    const subscription = supabase
      .channel('order_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${params.orderId}`,
        },
        () => {
          loadOrderData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrderData = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', params.orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      setOrder(orderData);

      if (orderData?.partner_id) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', orderData.partner_id)
          .maybeSingle();

        const { data: partnerProfile } = await supabase
          .from('partner_profiles')
          .select('average_rating')
          .eq('user_id', orderData.partner_id)
          .maybeSingle();

        if (partnerData && partnerProfile) {
          setPartner({
            ...partnerData,
            average_rating: partnerProfile.average_rating,
          });
        }
      }

      const { data: trackingData } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: false });

      if (trackingData) setTracking(trackingData);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const getStatusMessage = () => {
    if (!order) return '';

    switch (order.status) {
      case 'pending':
        return 'Looking for a nearby delivery partner...';
      case 'accepted':
        return `Driver ${partner?.full_name || ''} is on the way to pickup location`;
      case 'pickup_confirmed':
        return `Driver ${partner?.full_name || ''} has picked up your order`;
      case 'in_transit':
        return `Driver ${partner?.full_name || ''} is 5 mins away from your location, approaching your address`;
      case 'delivered':
        return 'Your order has been delivered successfully';
      default:
        return 'Processing your order...';
    }
  };

  const getProgressPercentage = () => {
    if (!order) return 0;

    switch (order.status) {
      case 'pending': return 10;
      case 'accepted': return 30;
      case 'pickup_confirmed': return 60;
      case 'in_transit': return 80;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const handleCancelDelivery = () => {
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel this delivery?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('delivery_orders')
                .update({ status: 'cancelled' })
                .eq('id', order!.id);

              if (error) throw error;
              Alert.alert('Cancelled', 'Your delivery has been cancelled');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel delivery');
            }
          }
        }
      ]
    );
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      const { error } = await supabase.from('ratings').insert({
        order_id: order!.id,
        customer_id: user!.id,
        partner_id: order!.partner_id,
        rating_by_customer: rating,
      });

      if (error) throw error;
      Alert.alert('Success', 'Thank you for your feedback!');
      setShowRating(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
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
        <Text style={styles.headerTitle}>Delivery in Progress</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Your Delivery Status</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live Update</Text>
          </View>
        </View>

        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>

        {order.estimated_delivery_time && (
          <View style={styles.etaContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.etaText}>
              Estimated Arrival: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/2422493/pexels-photo-2422493.jpeg' }}
          style={styles.mapImage}
        />
      </View>

      {partner && (
        <View style={styles.driverCard}>
          <Text style={styles.driverCardTitle}>Driver & Order Details</Text>

          <View style={styles.driverInfo}>
            <Image
              source={{
                uri: partner.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
              }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{partner.full_name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FDB022" fill="#FDB022" />
                <Text style={styles.ratingText}>
                  {partner.average_rating.toFixed(1)} (210 ratings)
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.phoneButton}>
              <Phone size={24} color="#FDB022" />
            </TouchableOpacity>
          </View>

          <View style={styles.deliveryMethod}>
            <Text style={styles.deliveryMethodText}>🚗 Bike Delivery</Text>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order Summary:</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items:</Text>
              <Text style={styles.summaryValue}>3 items (Groceries)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment:</Text>
              <Text style={styles.summaryValue}>💳 Card (**** 4567)</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabelBold}>Estimated Cost:</Text>
              <Text style={styles.summaryValueBold}>₦{order.total_cost.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push(`/chat/${order.id}`)}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Driver</Text>
          </TouchableOpacity>

          {order.status !== 'delivered' && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelDelivery}>
              <X size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel Delivery</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {order.status === 'delivered' && !showRating && (
        <TouchableOpacity
          style={styles.ratingPrompt}
          onPress={() => setShowRating(true)}
        >
          <Text style={styles.ratingPromptTitle}>Rate Your Delivery</Text>
          <Text style={styles.ratingPromptText}>
            Help us improve by sharing your experience.
          </Text>
        </TouchableOpacity>
      )}

      {showRating && (
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate Your Delivery</Text>
          <Text style={styles.ratingSubtitle}>
            Help us improve by sharing your experience.
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Star
                  size={40}
                  color="#FDB022"
                  fill={star <= rating ? '#FDB022' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitRatingButton} onPress={submitRating}>
            <Text style={styles.submitRatingButtonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
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
  statusCard: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  liveBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FDB022',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaText: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  driverCard: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
  },
  driverCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  phoneButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMethod: {
    marginBottom: 16,
  },
  deliveryMethodText: {
    fontSize: 14,
    color: '#666',
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDB022',
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5252',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingPrompt: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#FEF7E8',
    borderRadius: 16,
    padding: 20,
  },
  ratingPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingPromptText: {
    fontSize: 14,
    color: '#666',
  },
  ratingCard: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  submitRatingButton: {
    backgroundColor: '#FDB022',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitRatingButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
});
