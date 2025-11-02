import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard, Plus, Banknote, Smartphone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { PaymentMethod, AsyncState } from '@/lib/types';
import ErrorBoundary from '@/lib/errorBoundary';

export default function PaymentMethodsScreen() {
   const router = useRouter();
   const { profile } = useAuth();
   const [paymentMethodsState, setPaymentMethodsState] = useState<AsyncState<PaymentMethod[]>>({
     data: [],
     loading: true,
     error: null,
   });
   const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    if (!profile) {
      setPaymentMethodsState({ data: [], loading: false, error: 'User not authenticated' });
      return;
    }

    try {
      setPaymentMethodsState(prev => ({ ...prev, loading: true, error: null }));

      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', profile.id)
        .order('is_default', { ascending: false });

      if (error) {
        throw error;
      }

      setPaymentMethodsState({ data: methods || [], loading: false, error: null });
    } catch (error) {
      console.error('Error loading payment methods:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment methods';
      setPaymentMethodsState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [profile]);

  const handleAddCard = useCallback(async () => {
    try {
      setIsActionLoading(true);
      Alert.alert(
        'Add Card',
        'Card addition functionality will be implemented. You can securely add debit/credit cards for payments.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling add card:', error);
      Alert.alert('Error', 'Failed to process add card request');
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleAddBankAccount = useCallback(async () => {
    try {
      setIsActionLoading(true);
      Alert.alert(
        'Add Bank Account',
        'Bank account addition functionality will be implemented. You can link your bank account for transfers.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling add bank account:', error);
      Alert.alert('Error', 'Failed to process add bank account request');
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return '•••• •••• •••• ' + number.slice(-4);
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard size={24} color={COLORS.primary} />;
      case 'bank':
        return <Banknote size={24} color={COLORS.primary} />;
      case 'wallet':
        return <Smartphone size={24} color={COLORS.primary} />;
      default:
        return <CreditCard size={24} color={COLORS.primary} />;
    }
  };

  // Show loading state
  if (paymentMethodsState.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  // Show error state
  if (paymentMethodsState.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to load payment methods</Text>
        <Text style={styles.errorText}>{paymentMethodsState.error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={loadPaymentMethods}
          accessibilityLabel="Retry loading payment methods"
          accessibilityHint="Attempts to reload payment methods data"
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <Text style={styles.headerSubtitle}>Manage your payment options</Text>
      </View>

      {/* Add Payment Method Options */}
      <View style={styles.addMethodsSection}>
        <Text style={styles.sectionTitle}>Add Payment Method</Text>
        <View style={styles.addMethodsGrid}>
          <TouchableOpacity
            style={[styles.addMethodCard, isActionLoading && styles.disabledCard]}
            onPress={handleAddCard}
            disabled={isActionLoading}
            accessibilityLabel="Add new payment card"
            accessibilityHint="Opens interface to add debit or credit card"
          >
            <CreditCard size={32} color={COLORS.primary} />
            <Text style={styles.addMethodText}>Add Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addMethodCard, isActionLoading && styles.disabledCard]}
            onPress={handleAddBankAccount}
            disabled={isActionLoading}
            accessibilityLabel="Add bank account"
            accessibilityHint="Opens interface to link bank account"
          >
            <Banknote size={32} color={COLORS.primary} />
            <Text style={styles.addMethodText}>Bank Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Existing Payment Methods */}
      <View style={styles.existingMethodsSection}>
        <Text style={styles.sectionTitle}>Your Payment Methods</Text>
        {paymentMethodsState.data && paymentMethodsState.data.length > 0 ? (
          paymentMethodsState.data.map((method: PaymentMethod) => (
            <View key={method.id} style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodHeader}>
                {getPaymentMethodIcon(method.type)}
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>
                    {method.account_name || method.provider}
                  </Text>
                  <Text style={styles.paymentMethodNumber}>
                    {maskAccountNumber(method.account_number)}
                  </Text>
                </View>
                {method.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.paymentMethodActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  accessibilityLabel={`Edit ${method.type} payment method`}
                  accessibilityHint="Opens edit interface for this payment method"
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  accessibilityLabel={`Remove ${method.type} payment method`}
                  accessibilityHint="Removes this payment method from your account"
                >
                  <Text style={styles.actionButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noMethodsContainer}>
            <Text style={styles.noMethodsText}>No payment methods added yet</Text>
            <Text style={styles.noMethodsSubtext}>
              Add a payment method to make transactions easier and faster.
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  addMethodsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  addMethodsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  addMethodCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
  },
  addMethodText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginTop: 12,
    textAlign: 'center',
  },
  existingMethodsSection: {
    paddingHorizontal: 24,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  paymentMethodNumber: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: COLORS.text.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  noMethodsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noMethodsText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  noMethodsSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 24,
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
  disabledCard: {
    opacity: 0.6,
  },
});