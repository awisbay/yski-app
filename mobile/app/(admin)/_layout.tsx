import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Only admin and pengurus can access admin layout
  if (user?.role !== 'admin' && user?.role !== 'pengurus') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory-2" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Laporan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
