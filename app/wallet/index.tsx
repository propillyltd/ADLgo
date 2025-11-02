import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet, Plus, History, CreditCard, Banknote } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { WalletTransaction, UserWallet, AsyncState } from '@/lib/types';
import ErrorBoundary from '@/lib/errorBoundary';

export default function WalletScreen() {
   const router = useRouter();
   const { profile } = useAuth();
   const [walletState, setWalletState] = useState<AsyncState<UserWallet>>({
     data: null,
     loading: true,
     error: null,
   });
   const [transactionsState, setTransactionsState] = useState<AsyncState<WalletTransaction[]>>({
     data: [],
     loading: true,
     error: null,
   });
   const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = useCallback(async () => {
    if (!profile) {
      setWalletState({ data: null, loading: false, error: 'User not authenticated' });
      setTransactionsState({ data: [], loading: false, error: 'User not authenticated' });
      return;
    }

    try {
      setWalletState(prev => ({ ...prev, loading: true, error: null }));
      setTransactionsState(prev => ({ ...prev, loading: true, error: null }));

      // Load wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw walletError;
      }

      if (wallet) {
        setWalletState({ data: wallet, loading: false, error: null });
      } else {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({ user_id: profile.id, balance: 0 })
          .select()
          .single();

        if (createError) {
          setWalletState({ data: null, loading: false, error: 'Failed to create wallet' });
        } else {
          setWalletState({ data: newWallet, loading: false, error: null });
        }
      }

      // Load recent transactions
      const { data: txns, error: txnsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txnsError) {
        setTransactionsState({ data: [], loading: false, error: 'Failed to load transactions' });
      } else {
        setTransactionsState({ data: txns || [], loading: false, error: null });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setWalletState(prev => ({ ...prev, loading: false, error: errorMessage }));
      setTransactionsState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [profile]);

  const handleAddMoney = useCallback(async () => {
    try {
      setIsActionLoading(true);
      // Navigate to add money screen (to be implemented)
      Alert.alert(
        'Add Money',
        'Add money functionality will be implemented soon. You can add funds to your wallet to pay for deliveries.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling add money:', error);
      Alert.alert('Error', 'Failed to process add money request');
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleViewHistory = useCallback(async () => {
    try {
      setIsActionLoading(true);
      await router.push('/wallet/history');
    } catch (error) {
      console.error('Error navigating to history:', error);
      Alert.alert('Error', 'Failed to open transaction history');
    } finally {
      setIsActionLoading(false);
    }
  }, [router]);

  // Show loading state
  if (walletState.loading || transactionsState.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  // Show error state
  if (walletState.error || transactionsState.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load wallet</Text>
        <Text style={styles.errorText}>
          {walletState.error || transactionsState.error}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={loadWalletData}
          accessibilityLabel="Retry loading wallet"
          accessibilityHint="Attempts to reload wallet data"
        >
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Wallet size={32} color={COLORS.primary} />
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          ₦{walletState.data?.balance.toLocaleString() || '0'}
        </Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={[styles.actionButton, isActionLoading && styles.disabledButton]}
            onPress={handleAddMoney}
            disabled={isActionLoading}
            accessibilityLabel="Add money to wallet"
            accessibilityHint="Opens add money interface"
          >
            <Plus size={20} color={COLORS.text.primary} />
            <Text style={styles.actionButtonText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, isActionLoading && styles.disabledButton]}
            onPress={handleViewHistory}
            disabled={isActionLoading}
            accessibilityLabel="View transaction history"
            accessibilityHint="Opens detailed transaction history"
          >
            <History size={20} color={COLORS.text.primary} />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/payments')}
            accessibilityLabel="Add payment card"
            accessibilityHint="Navigate to add new payment card"
          >
            <CreditCard size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Add Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/payments')}
            accessibilityLabel="Add bank account"
            accessibilityHint="Navigate to add bank account for transfers"
          >
            <Banknote size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Bank Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactionsState.data && transactionsState.data.length > 0 ? (
          transactionsState.data.map((txn: WalletTransaction) => (
            <View key={txn.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{txn.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(txn.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                txn.type === 'credit' ? styles.creditAmount : styles.debitAmount
              ]}
              accessibilityLabel={`Transaction amount ${txn.type === 'credit' ? 'credit' : 'debit'} ${txn.amount} naira`}
              >
                {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.noTransactions}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your transaction history will appear here once you make payments or receive funds.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
    </ErrorBoundary>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  balanceCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  creditAmount: {
    color: COLORS.success,
  },
  debitAmount: {
    color: COLORS.error,
  },
  noTransactions: {
    textAlign: 'center',
    color: COLORS.text.secondary,
    fontSize: 14,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
});