import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, FileText, CheckCircle, XCircle, Clock, Upload } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface KycDoc {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string;
  document_url: string;
  verification_status: string;
  created_at: string;
}

export default function KYCVerificationScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [kycStatus, setKycStatus] = useState('not_started');
  const [documents, setDocuments] = useState<KycDoc[]>([]);
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    if (!profile) return;

    try {
      // Load KYC status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status, role')
        .eq('id', profile.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setKycStatus(profileData.kyc_status || 'not_started');
        setIsPartner(profileData.role === 'partner' || profileData.role === 'both');
      }

      // Load existing documents
      const { data: docs } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (docs) {
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
  };

  const handleDocumentUpload = (documentType: string) => {
    Alert.alert(
      'Document Upload',
      `Upload functionality for ${documentType} will be implemented`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Upload',
          onPress: () => simulateDocumentUpload(documentType)
        }
      ]
    );
  };

  const simulateDocumentUpload = async (documentType: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: profile.id,
          document_type: documentType,
          document_number: `SIM-${Date.now()}`,
          document_url: `https://example.com/${documentType}.jpg`,
          selfie_url: 'https://example.com/selfie.jpg',
          status: 'pending'
        });

      if (!error) {
        Alert.alert('Success', `${documentType} uploaded successfully!`);
        loadKYCData(); // Refresh data
      }
    } catch (error) {
      console.error('Error simulating upload:', error);
    }
  };

  const handleFacialRecognition = () => {
    Alert.alert(
      'Facial Recognition',
      'Facial recognition verification will be implemented with camera integration',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate Verification',
          onPress: simulateFacialVerification
        }
      ]
    );
  };

  const simulateFacialVerification = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('kyc_verification')
        .insert({
          user_id: profile.id,
          verification_type: 'facial_recognition',
          verification_data: { simulated: true },
          confidence_score: 95.5,
          status: 'completed'
        });

      if (!error) {
        Alert.alert('Success', 'Facial recognition completed successfully!');
      }
    } catch (error) {
      console.error('Error simulating facial verification:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color={COLORS.success} />;
      case 'rejected':
        return <XCircle size={20} color={COLORS.error} />;
      case 'pending':
      case 'under_review':
        return <Clock size={20} color={COLORS.warning} />;
      default:
        return <Upload size={20} color={COLORS.text.secondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'pending':
      case 'under_review':
        return COLORS.warning;
      default:
        return COLORS.text.secondary;
    }
  };

  const requiredDocuments = [
    {
      type: 'nin',
      title: 'National Identity Number (NIN)',
      description: 'Upload your NIN slip or verification',
      required: true
    },
    {
      type: 'government_id',
      title: 'Government ID',
      description: 'National ID, Passport, or Driver\'s License',
      required: true
    },
    ...(isPartner ? [{
      type: 'drivers_license',
      title: 'Driver\'s License',
      description: 'Valid driver\'s license for delivery partners',
      required: true
    }] : [])
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <Text style={styles.headerSubtitle}>Complete your identity verification</Text>
      </View>

      {/* KYC Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Verification Status</Text>
          {getStatusIcon(kycStatus)}
        </View>
        <Text style={[styles.statusText, { color: getStatusColor(kycStatus) }]}>
          {kycStatus === 'not_started' && 'Not Started'}
          {kycStatus === 'pending' && 'Pending Review'}
          {kycStatus === 'under_review' && 'Under Review'}
          {kycStatus === 'approved' && 'Verified'}
          {kycStatus === 'rejected' && 'Rejected - Please reapply'}
        </Text>
        {kycStatus === 'approved' && (
          <Text style={styles.verifiedText}>
            ✅ Your account is fully verified. You can now use all features.
          </Text>
        )}
      </View>

      {/* Facial Recognition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facial Recognition</Text>
        <TouchableOpacity style={styles.facialCard} onPress={handleFacialRecognition}>
          <Camera size={32} color={COLORS.primary} />
          <View style={styles.facialText}>
            <Text style={styles.facialTitle}>Verify Your Face</Text>
            <Text style={styles.facialDescription}>
              Take a selfie for biometric verification
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Document Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        {requiredDocuments.map((doc) => {
          const existingDoc = documents.find(d => d.document_type === doc.type);
          return (
            <TouchableOpacity
              key={doc.type}
              style={styles.documentCard}
              onPress={() => handleDocumentUpload(doc.type)}
            >
              <View style={styles.documentHeader}>
                <FileText size={24} color={COLORS.primary} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentDescription}>{doc.description}</Text>
                </View>
                {existingDoc && getStatusIcon(existingDoc.verification_status)}
              </View>
              {existingDoc && (
                <Text style={[styles.documentStatus, { color: getStatusColor(existingDoc.verification_status) }]}>
                  Status: {existingDoc.verification_status.replace('_', ' ').toUpperCase()}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Partner Requirements */}
      {isPartner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner Requirements</Text>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerTitle}>Additional Verification Needed</Text>
            <Text style={styles.partnerText}>
              As a delivery partner, you must complete all KYC requirements before you can accept delivery jobs.
            </Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirement}>• Valid NIN verification</Text>
              <Text style={styles.requirement}>• Government ID verification</Text>
              <Text style={styles.requirement}>• Driver's license verification</Text>
              <Text style={styles.requirement}>• Facial recognition verification</Text>
              <Text style={styles.requirement}>• Vehicle registration (existing)</Text>
              <Text style={styles.requirement}>• Insurance verification (existing)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Why KYC Verification?</Text>
        <Text style={styles.infoText}>
          • Ensures platform security and trust{'\n'}
          • Required for financial transactions{'\n'}
          • Enables partner job acceptance{'\n'}
          • Complies with regulatory requirements{'\n'}
          • Protects against fraud and abuse
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
  statusCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  verifiedText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 8,
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
  facialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  facialText: {
    marginLeft: 16,
    flex: 1,
  },
  facialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  facialDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  documentCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  documentStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  partnerCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  partnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  partnerText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  requirementsList: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    padding: 12,
  },
  requirement: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  infoCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});