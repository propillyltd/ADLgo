import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, Mail, LogOut, CreditCard, Bell, Shield, HelpCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={{
            uri: profile?.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg'
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        {profile?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <User size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Phone size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Phone Number</Text>
          </View>
          <Text style={styles.menuItemValue}>{profile?.phone || 'Add phone'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Mail size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Email Address</Text>
          </View>
          <Text style={styles.menuItemValue}>{profile?.email}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <CreditCard size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Payment Methods</Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Bell size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Shield size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Privacy & Security</Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <HelpCircle size={20} color={COLORS.text.secondary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
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
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  menuItemValue: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  menuItemArrow: {
    fontSize: 24,
    color: COLORS.text.secondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.secondary,
    paddingVertical: 32,
  },
});
