import React, { useState, Component } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, Mail, LogOut, CreditCard, Bell, Shield, HelpCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';
import type { Profile } from '@/lib/types';

interface MenuItemProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
}

interface ProfileCardProps {
  profile: Profile | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// MenuItem Component
const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  title,
  subtitle,
  value,
  onPress,
  accessibilityLabel,
  accessibilityHint
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
  >
    <View style={styles.menuItemLeft}>
      <Icon size={20} color={COLORS.text.secondary} />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemText}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {value && <Text style={styles.menuItemValue}>{value}</Text>}
    <Text style={styles.menuItemArrow}>›</Text>
  </TouchableOpacity>
);

// ProfileCard Component
const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => (
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
);

// Error Boundary Component
class ErrorBoundary extends Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile screen error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Please try refreshing the app</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function ProfileScreen() {
   const router = useRouter();
   const { profile, signOut } = useAuth();
   const [isLoading, setIsLoading] = useState(false);
   const [navigationError, setNavigationError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setNavigationError(null);
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setNavigationError('Failed to sign out. Please try again.');
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = async (route: string, fallbackMessage: string) => {
    try {
      setIsLoading(true);
      setNavigationError(null);
      await router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigationError(`Failed to navigate to ${route}`);
      Alert.alert('Navigation Error', fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account settings</Text>
        </View>

        <ProfileCard profile={profile} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <MenuItem
            icon={User}
            title="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing functionality will be implemented')}
            accessibilityLabel="Edit profile information"
            accessibilityHint="Opens profile editing screen"
          />

          <MenuItem
            icon={Phone}
            title="Phone Number"
            value={profile?.phone ?? 'Add phone'}
            onPress={() => Alert.alert('Phone Number', 'Phone number editing functionality will be implemented')}
            accessibilityLabel="Edit phone number"
            accessibilityHint="Opens phone number editing screen"
          />

          <MenuItem
            icon={Mail}
            title="Email Address"
            value={profile?.email}
            onPress={() => Alert.alert('Email Address', 'Email editing functionality will be implemented')}
            accessibilityLabel="View email address"
            accessibilityHint="Displays current email address"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation('/payments', 'Payment methods screen not available')}
            accessibilityLabel="Navigate to payment methods"
            accessibilityHint="Opens screen to manage your payment methods"
          >
            <View style={styles.menuItemLeft}>
              <CreditCard size={20} color={COLORS.text.secondary} />
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation('/notifications', 'Notifications screen not available')}
            accessibilityLabel="Navigate to notifications settings"
            accessibilityHint="Opens screen to manage your notification preferences"
          >
            <View style={styles.menuItemLeft}>
              <Bell size={20} color={COLORS.text.secondary} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation('/kyc', 'KYC verification screen not available')}
            accessibilityLabel="Navigate to KYC verification"
            accessibilityHint="Opens screen to complete your identity verification"
          >
            <View style={styles.menuItemLeft}>
              <Shield size={20} color={COLORS.text.secondary} />
              <Text style={styles.menuItemText}>KYC Verification</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation('/support', 'Support screen not available')}
            accessibilityLabel="Navigate to help and support"
            accessibilityHint="Opens screen to get help and contact support"
          >
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
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
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
});
