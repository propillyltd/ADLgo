import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Clock, User, Truck, Star, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';

type Bid = {
  id: string;
  partner_id: string;
  bid_amount: number;
  vehicle_type: string;
  estimated_pickup_time: number;
  message: string | null;
  status: string;
  created_at: string;
  partner_profile: {
    full_name: string;
    avatar_url: string;
  };
  partner_stats: {
    completed_deliveries: number;
    average_rating: number;
  };
};

type Order = {
  id: string;
  order_number: string;
  pickup_address: string;
  dropoff_address: string;
  total_cost: number;
  bid_status: string;
  status: string;
};

export default function OrderBidsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBids();

    const subscription = supabase
      .channel('bid_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_bids',
          filter: `order_id=eq.${params.orderId}`,
        },
        () => {
          loadBids();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadBids = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', params.orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (orderData) setOrder(orderData);

      const { data: bidsData, error: bidsError } = await supabase
        .from('delivery_bids')
        .select(`
          *,
          partner_profile:profiles!delivery_bids_partner_id_fkey(full_name, avatar_url),
          partner_stats:partner_profiles!partner_profiles_user_id_fkey(completed_deliveries, average_rating)
        `)
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;
      setBids(bidsData || []);
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptBid = async (bidId: string, partnerId: string) => {
    Alert.alert(
      'Accept Bid',
      'Are you sure you want to accept this bid? This will close bidding and assign the partner to your delivery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await supabase.from('delivery_bids').update({ status: 'accepted' }).eq('id', bidId);

              await supabase
                .from('delivery_bids')
                .update({ status: 'rejected' })
                .eq('order_id', params.orderId)
                .neq('id', bidId)
                .eq('status', 'pending');

              await supabase
                .from('delivery_orders')
                .update({
                  partner_id: partnerId,
                  selected_bid_id: bidId,
                  bid_status: 'bid_accepted',
                  status: 'accepted',
                })
                .eq('id', params.orderId);

              await supabase.from('order_tracking').insert({
                order_id: params.orderId,
                status: 'accepted',
                notes: 'Bid accepted, partner assigned',
              });

              Alert.alert('Success', 'Bid accepted! The partner has been assigned to your delivery.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error accepting bid:', error);
              Alert.alert('Error', error.message || 'Failed to accept bid');
            }
          },
        },
      ]
    );
  };

  const handleRejectBid = async (bidId: string) => {
    Alert.alert('Reject Bid', 'Are you sure you want to reject this bid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('delivery_bids').update({ status: 'rejected' }).eq('id', bidId);

            Alert.alert('Success', 'Bid rejected');
            loadBids();
          } catch (error: any) {
            console.error('Error rejecting bid:', error);
            Alert.alert('Error', error.message || 'Failed to reject bid');
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBids();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'withdrawn':
        return COLORS.text.secondary;
      default:
        return COLORS.warning;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading bids...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bids for Order</Text>
      </View>

      {order && (
        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>#{order.order_number}</Text>
          <View style={styles.orderLocation}>
            <MapPin size={14} color={COLORS.primary} />
            <Text style={styles.orderLocationText} numberOfLines={1}>
              {order.pickup_address}
            </Text>
          </View>
          <View style={styles.orderLocation}>
            <MapPin size={14} color={COLORS.error} />
            <Text style={styles.orderLocationText} numberOfLines={1}>
              {order.dropoff_address}
            </Text>
          </View>
          <Text style={styles.orderBudget}>Budget: ₦{order.total_cost.toLocaleString()}</Text>
        </View>
      )}

      <ScrollView
        style={styles.bidsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.bidsCount}>
          {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'} Received
        </Text>

        {bids.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>No bids yet</Text>
            <Text style={styles.emptySubtitle}>Partners will start bidding soon</Text>
          </View>
        ) : (
          bids.map((bid) => (
            <View key={bid.id} style={styles.bidCard}>
              <View style={styles.bidHeader}>
                <Image
                  source={{
                    uri:
                      bid.partner_profile?.avatar_url ||
                      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
                  }}
                  style={styles.partnerAvatar}
                />
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{bid.partner_profile?.full_name || 'Partner'}</Text>
                  <View style={styles.partnerStats}>
                    <View style={styles.statItem}>
                      <Star size={12} color={COLORS.warning} />
                      <Text style={styles.statText}>{bid.partner_stats?.average_rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                    <Text style={styles.statSeparator}>•</Text>
                    <Text style={styles.statText}>{bid.partner_stats?.completed_deliveries || 0} deliveries</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bid.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(bid.status) }]}>
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.bidDetails}>
                <View style={styles.bidDetailRow}>
                  <View style={styles.bidDetailItem}>
                    <DollarSign size={16} color={COLORS.success} />
                    <Text style={styles.bidAmount}>₦{bid.bid_amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.bidDetailItem}>
                    <Truck size={16} color={COLORS.text.secondary} />
                    <Text style={styles.bidDetailText}>{bid.vehicle_type}</Text>
                  </View>
                  <View style={styles.bidDetailItem}>
                    <Clock size={16} color={COLORS.text.secondary} />
                    <Text style={styles.bidDetailText}>{bid.estimated_pickup_time} min</Text>
                  </View>
                </View>

                {bid.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Message:</Text>
                    <Text style={styles.messageText}>{bid.message}</Text>
                  </View>
                )}
              </View>

              {bid.status === 'pending' && order?.bid_status === 'open_for_bids' && (
                <View style={styles.bidActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptBid(bid.id, bid.partner_id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectBid(bid.id)}>
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
    marginBottom: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  orderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderLocationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  orderBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  bidsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bidsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bidCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  partnerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statSeparator: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bidDetails: {
    marginBottom: 12,
  },
  bidDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bidDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  bidDetailText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  bidActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.background.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
