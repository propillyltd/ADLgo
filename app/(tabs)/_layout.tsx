import { Tabs } from 'expo-router';
import { Home, Package, CreditCard, User, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/lib/constants';

export default function TabsLayout() {
  const { profile } = useAuth();
  const isPartner = profile?.role === 'partner' || profile?.role === 'both';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          borderTopColor: COLORS.background.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ size, color }) => <Package size={size} color={color} />,
        }}
      />
      {isPartner && (
        <Tabs.Screen
          name="deliveries"
          options={{
            title: 'Deliveries',
            tabBarIcon: ({ size, color }) => <Truck size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ size, color }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
