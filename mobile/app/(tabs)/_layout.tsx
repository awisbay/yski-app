import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { TabBar } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { isProfileComplete } from '@/utils/profile';

export default function TabsLayout() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && !isProfileComplete(user)) {
      router.replace('/profile/edit');
    }
  }, [router, user]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Beranda' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profil'  }} />
      {/* These screens exist for file-based routing but aren't tab items */}
      <Tabs.Screen name="booking"   options={{ href: null }} />
      <Tabs.Screen name="donations" options={{ href: null }} />
      <Tabs.Screen name="pickups"   options={{ href: null }} />
      <Tabs.Screen name="auctions"  options={{ href: null }} />
      <Tabs.Screen name="financial" options={{ href: null }} />
    </Tabs>
  );
}
