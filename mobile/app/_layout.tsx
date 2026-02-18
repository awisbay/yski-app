import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { setupNotificationListeners } from '@/services/notifications';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const hydrate = useAuthStore((state) => state.hydrate);
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const notificationListenerCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function prepare() {
      await hydrate();
      await initializeNotifications();
      setIsReady(true);
    }
    prepare();

    // Setup push notification listeners
    notificationListenerCleanup.current = setupNotificationListeners(
      (notification) => {
        // Handle received notification
        const data = notification.request.content.data;
        addNotification({
          id: notification.request.identifier,
          userId: '', // Will be filled from backend
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          type: (data?.type as 'info' | 'success' | 'warning') || 'info',
          referenceType: data?.referenceType as string | undefined,
          referenceId: data?.referenceId as string | undefined,
          read: false,
          createdAt: new Date(),
        });
      },
      (response) => {
        // Handle notification tap - navigate to relevant screen
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
        // Navigation logic can be added here
      }
    );

    return () => {
      notificationListenerCleanup.current?.();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
