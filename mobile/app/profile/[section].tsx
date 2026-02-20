import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

const TITLE_MAP: Record<string, string> = {
  edit: 'Edit Profil',
  password: 'Ubah Password',
};

export default function ProfileSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = String(section || 'menu');

  return (
    <RoutePlaceholderScreen
      title={TITLE_MAP[key] || 'Menu Profil'}
      subtitle="Pengaturan akun"
      description={`Halaman profil /${key} sudah aktif di routing dan siap diimplementasi.`}
      actionLabel="Kembali ke Profil"
      actionRoute="/(tabs)/profile"
    />
  );
}
