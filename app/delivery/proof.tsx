import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';

export default function DeliveryProofScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSelectImage = () => {
    Alert.alert(
      'Upload Proof',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => Alert.alert('Camera', 'Camera integration requires expo-camera setup'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => Alert.alert('Gallery', 'Gallery integration requires expo-image-picker setup'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSubmitProof = async () => {
    if (!proofImage) {
      Alert.alert('Error', 'Please upload a proof image');
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.from('delivery_proof').insert({
        order_id: params.orderId,
        partner_id: user!.id,
        image_url: proofImage,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      await supabase
        .from('delivery_orders')
        .update({ status: 'delivered' })
        .eq('id', params.orderId);

      await supabase.from('order_tracking').insert({
        order_id: params.orderId,
        status: 'delivered',
        notes: 'Delivery completed with proof',
      });

      Alert.alert('Success', 'Delivery proof submitted successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', error.message || 'Failed to submit proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Delivery Proof</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Take a clear photo of the delivered package or get a signature from the recipient as proof of delivery.
        </Text>

        <View style={styles.uploadContainer}>
          {proofImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: proofImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProofImage(null)}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={handleSelectImage}>
              <Camera size={48} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>Take Photo or Upload</Text>
              <Text style={styles.uploadButtonHint}>Tap to add delivery proof</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any relevant notes about the delivery..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for Good Proof:</Text>
          <Text style={styles.tipItem}>• Ensure the photo is clear and well-lit</Text>
          <Text style={styles.tipItem}>• Include the package and location</Text>
          <Text style={styles.tipItem}>• Get recipient signature if possible</Text>
          <Text style={styles.tipItem}>• Include any identifying markers</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (uploading || !proofImage) && styles.submitButtonDisabled]}
          onPress={handleSubmitProof}
          disabled={uploading || !proofImage}
        >
          <Upload size={20} color={COLORS.text.primary} />
          <Text style={styles.submitButtonText}>
            {uploading ? 'Submitting...' : 'Submit Proof'}
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
  content: {
    padding: 24,
  },
  instructions: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadContainer: {
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.background.border,
    borderStyle: 'dashed',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 12,
  },
  uploadButtonHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.error,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text.primary,
    minHeight: 100,
  },
  tips: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
