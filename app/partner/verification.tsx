import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Truck, FileText, Shield, MapPin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS, VEHICLE_TYPES, INSURANCE_PROVIDERS } from '@/lib/constants';

export default function PartnerVerificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [driversLicense, setDriversLicense] = useState('');
  const [vehicleTrackerId, setVehicleTrackerId] = useState('');

  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setExistingProfile(data);
        setVehicleType(data.vehicle_type || 'bike');
        setVehicleRegistration(data.vehicle_registration || '');
        setDriversLicense(data.drivers_license || '');
        setVehicleTrackerId(data.vehicle_tracker_id || '');
        setInsuranceProvider(data.insurance_provider || '');
        setInsurancePolicyNumber(data.insurance_policy_number || '');
        setInsuranceExpiryDate(data.insurance_expiry_date || '');
        setBankName(data.bank_name || '');
        setAccountNumber(data.account_number || '');
        setAccountName(data.account_name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async () => {
    if (!vehicleType || !vehicleRegistration || !driversLicense) {
      Alert.alert('Error', 'Please fill in all vehicle information');
      return;
    }

    if (!insuranceProvider || !insurancePolicyNumber || !insuranceExpiryDate) {
      Alert.alert('Error', 'Insurance information is required for Nigerian compliance');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Error', 'Please provide bank account details for payouts');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        user_id: user!.id,
        vehicle_type: vehicleType,
        vehicle_registration: vehicleRegistration,
        drivers_license: driversLicense,
        vehicle_tracker_id: vehicleTrackerId,
        insurance_provider: insuranceProvider,
        insurance_policy_number: insurancePolicyNumber,
        insurance_expiry_date: insuranceExpiryDate,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        is_online: false,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('partner_profiles')
          .update(profileData)
          .eq('user_id', user!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partner_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      Alert.alert('Success', 'Partner profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
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
        <Text style={styles.headerTitle}>Partner Verification</Text>
        <Text style={styles.headerSubtitle}>Complete your profile to start delivering</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Truck size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
        </View>

        <Text style={styles.label}>Vehicle Type *</Text>
        <View style={styles.vehicleTypeContainer}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.vehicleTypeCard,
                vehicleType === type.id && styles.vehicleTypeCardActive,
              ]}
              onPress={() => setVehicleType(type.id)}
            >
              <Text style={styles.vehicleTypeIcon}>{type.icon}</Text>
              <Text style={styles.vehicleTypeName}>{type.name}</Text>
              <Text style={styles.vehicleTypeCapacity}>{type.capacity}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Registration Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC-123-XY"
            value={vehicleRegistration}
            onChangeText={setVehicleRegistration}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Driver's License Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter license number"
            value={driversLicense}
            onChangeText={setDriversLicense}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Tracker ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="For GPS tracking integration"
            value={vehicleTrackerId}
            onChangeText={setVehicleTrackerId}
          />
          <Text style={styles.helpText}>
            Enter your GPS tracker device ID for real-time location tracking
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Insurance Information</Text>
        </View>
        <Text style={styles.complianceNote}>
          ⚠️ Insurance is mandatory for all delivery partners in Nigeria
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Insurance Provider *</Text>
          <View style={styles.pickerContainer}>
            {INSURANCE_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.pickerOption,
                  insuranceProvider === provider.id && styles.pickerOptionActive,
                ]}
                onPress={() => setInsuranceProvider(provider.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    insuranceProvider === provider.id && styles.pickerOptionTextActive,
                  ]}
                >
                  {provider.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Policy Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter policy number"
            value={insurancePolicyNumber}
            onChangeText={setInsurancePolicyNumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expiry Date * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2025-12-31"
            value={insuranceExpiryDate}
            onChangeText={setInsuranceExpiryDate}
          />
          <Text style={styles.helpText}>
            Your insurance must be valid to accept delivery jobs
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Bank Account Details</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., GTBank, Access Bank"
            value={bankName}
            onChangeText={setBankName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10 digit account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="As shown on your bank account"
            value={accountName}
            onChangeText={setAccountName}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Submit for Verification'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All information will be verified before your account is activated
        </Text>
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
    paddingBottom: 24,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  complianceNote: {
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vehicleTypeCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  vehicleTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  vehicleTypeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  vehicleTypeCapacity: {
    fontSize: 10,
    color: COLORS.text.secondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  pickerOptionTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  submitButton: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
