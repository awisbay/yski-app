import { RoutePlaceholderScreen } from '@/components/ui';

export default function HelpScreen() {
  return (
    <RoutePlaceholderScreen
      title="Bantuan"
      subtitle="Pusat bantuan pengguna"
      actionLabel="Kembali ke Profil"
      actionRoute="/(tabs)/profile"
    />
  );
}
