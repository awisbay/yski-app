import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui';

export default function TabsLayout() {
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
