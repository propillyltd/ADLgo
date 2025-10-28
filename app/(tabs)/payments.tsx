import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '@/lib/constants';

export default function PaymentsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments & Bills</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/bills')}
      >
        <Text style={styles.buttonText}>Pay Bills</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  button: {
    margin: 24,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
