import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Package, MapPin, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';

type Order = {
  id: string;
  order_number: string;
  status: string;
  bid_status: string;
  pickup_address: string;
  dropoff_address: string;
  total_cost: number;
  created_at: string;
  estimated_delivery_time: string | null;
};

export default function OrdersScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('delivery_orders')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['pending', 'accepted', 'pickup_confirmed', 'in_transit']);
      } else if (filter === 'completed') {
        query = query.eq('status', 'delivered');
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FDB022';
      case 'accepted': return '#2196F3';
      case 'pickup_confirmed': return '#9C27B0';
      case 'in_transit': return '#FF9800';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/delivery/create')}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterButtonText, filter === 'active' && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterButtonText, filter === 'completed' && styles.filterButtonTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.ordersList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'active' ? 'You have no active deliveries' : 'Start by creating a new delivery'}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/delivery/create')}
            >
              <Text style={styles.emptyButtonText}>Create Delivery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => {
                if (order.status === 'pending' && order.bid_status === 'open_for_bids') {
                  router.push(`/bids/${order.id}`);
                } else {
                  router.push(`/tracking/${order.id}`);
                }
              }}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderLocation}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.orderLocationText} numberOfLines={1}>
                  {order.pickup_address}
                </Text>
              </View>

              <View style={styles.orderLocation}>
                <MapPin size={16} color={COLORS.error} />
                <Text style={styles.orderLocationText} numberOfLines={1}>
                  {order.dropoff_address}
                </Text>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.orderTime}>
                  <Clock size={14} color={COLORS.text.secondary} />
                  <Text style={styles.orderTimeText}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.orderAmount}>₦{order.total_cost.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: COLORS.text.primary,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  orderCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.border,
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTimeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
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
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
