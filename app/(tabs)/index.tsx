import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, CreditCard, MapPin, TrendingUp, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [activeOrders, setActiveOrders] = useState(0);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!profile) return;

    try {
      const { data: orders } = await supabase
        .from('delivery_orders')
        .select('status')
        .eq('customer_id', profile.id);

      if (orders) {
        const active = orders.filter(o => ['pending', 'accepted', 'in_transit', 'pickup_confirmed'].includes(o.status)).length;
        const completed = orders.filter(o => o.status === 'delivered').length;
        const pending = orders.filter(o => o.status === 'pending').length;

        setActiveOrders(active);
        setStats({ total: orders.length, completed, pending });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const isPartner = profile?.role === 'partner' || profile?.role === 'both';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.full_name || 'User'}!</Text>
          <Text style={styles.subGreeting}>What would you like to do today?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color={COLORS.text.primary} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {activeOrders > 0 && (
        <View style={styles.activeOrderBanner}>
          <View style={styles.activeOrderContent}>
            <Package size={24} color={COLORS.primary} />
            <View style={styles.activeOrderText}>
              <Text style={styles.activeOrderTitle}>
                You have {activeOrders} active {activeOrders === 1 ? 'delivery' : 'deliveries'}
              </Text>
              <Text style={styles.activeOrderSubtitle}>Track your packages in real-time</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.activeOrderButton}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={styles.activeOrderButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/delivery/create')}
        >
          <View style={styles.actionIcon}>
            <Package size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.actionTitle}>Send Package</Text>
          <Text style={styles.actionSubtitle}>Fast & reliable delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/bills')}
        >
          <View style={styles.actionIcon}>
            <CreditCard size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.actionTitle}>Pay Bills</Text>
          <Text style={styles.actionSubtitle}>Airtime, data, DSTV & more</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={styles.actionIcon}>
            <MapPin size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.actionTitle}>Track Order</Text>
          <Text style={styles.actionSubtitle}>Live delivery tracking</Text>
        </TouchableOpacity>

        {isPartner && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/partner/dashboard')}
          >
            <View style={styles.actionIcon}>
              <TrendingUp size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Partner Dashboard</Text>
            <Text style={styles.actionSubtitle}>Manage deliveries</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your Stats</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <View style={styles.promoCard}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg' }}
          style={styles.promoImage}
        />
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>Get 20% off your first delivery</Text>
          <Text style={styles.promoSubtitle}>Use code: FIRST20</Text>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Send Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  activeOrderBanner: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  activeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  activeOrderText: {
    flex: 1,
  },
  activeOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  activeOrderSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  activeOrderButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeOrderButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  promoCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  promoImage: {
    width: '100%',
    height: 150,
  },
  promoContent: {
    padding: 20,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  promoButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
