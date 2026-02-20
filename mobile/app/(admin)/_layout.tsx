import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const isOperationalRole =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'pengurus' ||
    user?.role === 'relawan';

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (!isOperationalRole) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
