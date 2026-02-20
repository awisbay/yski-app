import { RoutePlaceholderScreen } from '@/components/ui';

export default function SettingsScreen() {
  return (
    <RoutePlaceholderScreen
      title="Pengaturan"
      subtitle="Preferensi aplikasi"
      actionLabel="Kembali ke Profil"
      actionRoute="/(tabs)/profile"
    />
  );
}
