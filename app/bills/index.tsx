import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Network, Tv, Zap, ChevronRight, CreditCard } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type BillCategory = 'airtime' | 'data' | 'dstv' | 'electric';

type RecentTransaction = {
  id: string;
  category: string;
  provider: string;
  amount: number;
  created_at: string;
};

export default function BillPaymentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleCategoryPress = (category: BillCategory, title: string) => {
    router.push({
      pathname: '/bills/payment',
      params: { category, title },
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airtime':
        return '📱';
      case 'data':
        return '📊';
      case 'dstv':
        return '📺';
      case 'electric':
        return '⚡';
      default:
        return '💰';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Payments</Text>
      </View>

      <Text style={styles.sectionTitle}>Bill Categories</Text>

      <View style={styles.categoriesGrid}>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('airtime', 'Airtime Top-up')}
        >
          <View style={styles.categoryIcon}>
            <Smartphone size={32} color="#FDB022" />
          </View>
          <Text style={styles.categoryText}>Airtime Top-up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('data', 'Data Purchase')}
        >
          <View style={styles.categoryIcon}>
            <Network size={32} color="#FDB022" />
          </View>
          <Text style={styles.categoryText}>Data Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('dstv', 'Cable TV (DSTV)')}
        >
          <View style={styles.categoryIcon}>
            <Tv size={32} color="#FDB022" />
          </View>
          <Text style={styles.categoryText}>Cable TV (DSTV)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress('electric', 'Electricity Bill')}
        >
          <View style={styles.categoryIcon}>
            <Zap size={32} color="#FDB022" />
          </View>
          <Text style={styles.categoryText}>Electricity Bill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentMethodsSection}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>

        <TouchableOpacity style={styles.paymentMethodCard}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png' }}
            style={styles.cardLogo}
          />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodTitle}>Visa Card</Text>
            <Text style={styles.paymentMethodNumber}>•••• 1234 (Expires 12/26)</Text>
          </View>
          <ChevronRight size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.paymentMethodCard}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png' }}
            style={styles.cardLogo}
          />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodTitle}>MasterCard</Text>
            <Text style={styles.paymentMethodNumber}>•••• 5678 (Expires 09/25)</Text>
          </View>
          <ChevronRight size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addPaymentButton}>
          <CreditCard size={20} color="#FDB022" />
          <Text style={styles.addPaymentButtonText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionEmoji}>
                  {getCategoryIcon(transaction.category)}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>
                  {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                </Text>
                <Text style={styles.transactionProvider}>{transaction.provider}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>₦{transaction.amount.toLocaleString()}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  categoryIcon: {
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  paymentMethodsSection: {
    marginTop: 24,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLogo: {
    width: 48,
    height: 32,
    resizeMode: 'contain',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentMethodNumber: {
    fontSize: 12,
    color: '#666',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF7E8',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDB022',
  },
  recentSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FDB022',
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionProvider: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
});
