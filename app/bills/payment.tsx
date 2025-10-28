import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function BillPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const getProviderPlaceholder = () => {
    switch (params.category) {
      case 'airtime':
      case 'data':
        return 'Select Network (MTN, Airtel, Glo, 9mobile)';
      case 'dstv':
        return 'DSTV / GOtv';
      case 'electric':
        return 'Select Provider (IKEDC, EKEDC, etc.)';
      default:
        return 'Select Provider';
    }
  };

  const getAccountPlaceholder = () => {
    switch (params.category) {
      case 'airtime':
      case 'data':
        return 'Phone Number';
      case 'dstv':
        return 'Smart Card Number';
      case 'electric':
        return 'Meter Number';
      default:
        return 'Account Number';
    }
  };

  const handlePayment = async () => {
    if (!provider || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bill_payments').insert({
        user_id: user!.id,
        category: params.category as string,
        provider,
        account_number: accountNumber,
        amount: amountValue,
        payment_status: 'completed',
        transaction_reference: `TXN-${Date.now()}`,
      });

      if (error) throw error;

      Alert.alert('Success', 'Payment completed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{params.title}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Provider</Text>
          <TextInput
            style={styles.input}
            placeholder={getProviderPlaceholder()}
            value={provider}
            onChangeText={setProvider}
          />

          <Text style={styles.label}>{getAccountPlaceholder()}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${getAccountPlaceholder()}`}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />

          {params.category === 'airtime' && (
            <View style={styles.quickAmounts}>
              <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
              <View style={styles.quickAmountsGrid}>
                {['100', '200', '500', '1000', '2000', '5000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(amt)}
                  >
                    <Text style={styles.quickAmountText}>₦{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{params.title}</Text>
          </View>
          {provider && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>{provider}</Text>
            </View>
          )}
          {accountNumber && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Account:</Text>
              <Text style={styles.summaryValue}>{accountNumber}</Text>
            </View>
          )}
          {amount && (
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabelBold}>Total Amount:</Text>
              <Text style={styles.summaryValueBold}>₦{parseFloat(amount).toLocaleString()}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Text>
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
  content: {
    padding: 24,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  quickAmounts: {
    marginTop: 8,
  },
  quickAmountsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#FEF7E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FDB022',
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    borderTopColor: '#ddd',
    paddingTop: 16,
    marginTop: 8,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDB022',
  },
  payButton: {
    backgroundColor: '#FDB022',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
