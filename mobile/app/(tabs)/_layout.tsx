import { Tabs } from 'expo-router';
import { Calendar, Package, Heart, Truck, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
          href: '/booking',
        }}
      />
      <Tabs.Screen
        name="donations"
        options={{
          title: 'Donasi',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
          href: '/donations',
        }}
      />
      <Tabs.Screen
        name="pickups"
        options={{
          title: 'Jemput',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
          href: '/pickups',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
