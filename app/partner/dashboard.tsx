import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Map, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Job = {
  id: string;
  order_number: string;
  pickup_address: string;
  dropoff_address: string;
  total_cost: number;
  distance_km: number;
  estimated_duration_minutes: number;
  delivery_type: string;
};

type PartnerProfile = {
  is_online: boolean;
  total_earnings: number;
  pending_payout: number;
  average_rating: number;
  completed_deliveries: number;
};

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (partnerData) {
        setPartnerProfile(partnerData);
        setIsOnline(partnerData.is_online);
      }

      const { data: jobs, error: jobsError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('status', 'pending')
        .eq('bid_status', 'open_for_bids')
        .limit(10);

      if (jobsError) throw jobsError;
      setAvailableJobs(jobs || []);

      const today = new Date().toISOString().split('T')[0];
      const { data: todayEarningsData } = await supabase
        .from('partner_earnings')
        .select('amount')
        .eq('partner_id', user!.id)
        .gte('created_at', today);

      const todayTotal = todayEarningsData?.reduce((sum: number, e: any) => sum + parseFloat(e.amount.toString()), 0) || 0;
      setTodayEarnings(todayTotal);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const { data: weekEarningsData } = await supabase
        .from('partner_earnings')
        .select('amount')
        .eq('partner_id', user!.id)
        .gte('created_at', weekStart.toISOString());

      const weekTotal = weekEarningsData?.reduce((sum: number, e: any) => sum + parseFloat(e.amount.toString()), 0) || 0;
      setWeekEarnings(weekTotal);

    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async (value: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ is_online: value })
        .eq('user_id', user!.id);

      if (error) throw error;
      setIsOnline(value);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  const acceptJob = async (jobId: string) => {
    router.push(`/bids/submit?orderId=${jobId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Partner Dashboard</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Bell size={24} color="#333" />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' }}
            style={styles.avatar}
          />
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg' }}
            style={styles.statusAvatar}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Your Status</Text>
            <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#ddd', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.statusDescription}>
          Toggle to update your availability for jobs.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Available Jobs</Text>

      {availableJobs.length === 0 ? (
        <View style={styles.emptyJobs}>
          <Text style={styles.emptyText}>No jobs available at the moment</Text>
        </View>
      ) : (
        availableJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobType}>{job.delivery_type} Delivery</Text>
              <Text style={styles.jobNumber}>#{job.order_number}</Text>
            </View>

            <View style={styles.jobLocation}>
              <MapPin size={16} color="#FDB022" />
              <Text style={styles.jobLocationText}>{job.pickup_address}</Text>
            </View>

            <View style={styles.jobLocation}>
              <MapPin size={16} color="#FF5252" />
              <Text style={styles.jobLocationText}>{job.dropoff_address}</Text>
            </View>

            <View style={styles.jobDetails}>
              <View style={styles.jobDetailItem}>
                <DollarSign size={16} color="#4CAF50" />
                <Text style={styles.jobDetailText}>₦{job.total_cost.toLocaleString()}</Text>
              </View>
              {job.distance_km && (
                <View style={styles.jobDetailItem}>
                  <Map size={16} color="#666" />
                  <Text style={styles.jobDetailText}>{job.distance_km} km</Text>
                </View>
              )}
              {job.estimated_duration_minutes && (
                <Text style={styles.jobEta}>ETA: {job.estimated_duration_minutes} min</Text>
              )}
            </View>

            <View style={styles.jobActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => acceptJob(job.id)}
              >
                <Text style={styles.acceptButtonText}>Place Bid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => router.push(`/tracking/${job.id}`)}
              >
                <Text style={styles.declineButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Text style={styles.earningsTitle}>Your Earnings</Text>
          <DollarSign size={24} color="#FDB022" />
        </View>

        <View style={styles.earningsGrid}>
          <View style={styles.earningItem}>
            <Text style={styles.earningAmount}>₦{todayEarnings.toLocaleString()}</Text>
            <Text style={styles.earningLabel}>Today</Text>
          </View>
          <View style={styles.earningItem}>
            <Text style={styles.earningAmount}>₦{weekEarnings.toLocaleString()}</Text>
            <Text style={styles.earningLabel}>This Week</Text>
          </View>
        </View>

        <View style={styles.earningsSummary}>
          <Text style={styles.completedOrders}>
            {partnerProfile?.completed_deliveries || 0} Orders Completed
          </Text>
        </View>

        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Navigation Map</Text>
          <Map size={24} color="#333" />
        </View>
        <View style={styles.mapPlaceholder}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/2422493/pexels-photo-2422493.jpeg' }}
            style={styles.mapImage}
          />
        </View>
        <TouchableOpacity style={styles.openMapButton}>
          <Text style={styles.openMapButtonText}>Open Map Navigation</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusCard: {
    marginHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusBadgeOnline: {
    backgroundColor: '#E8F5E9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusTextOnline: {
    color: '#4CAF50',
  },
  statusDescription: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyJobs: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  jobCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  jobNumber: {
    fontSize: 12,
    color: '#666',
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jobLocationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  jobDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  jobEta: {
    fontSize: 12,
    color: '#666',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#FDB022',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  earningsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FEF7E8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  earningItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FDB022',
    marginBottom: 4,
  },
  earningLabel: {
    fontSize: 12,
    color: '#666',
  },
  earningsSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  completedOrders: {
    fontSize: 14,
    color: '#666',
  },
  viewDetailsButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  mapCard: {
    marginHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mapPlaceholder: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    marginBottom: 16,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  openMapButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  openMapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
