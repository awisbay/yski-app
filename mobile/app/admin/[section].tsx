import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

const TITLE_MAP: Record<string, string> = {
  users: 'Manajemen User',
  bookings: 'Manajemen Booking',
  equipment: 'Manajemen Peralatan',
  donations: 'Manajemen Donasi',
  pickups: 'Manajemen Penjemputan',
};

export default function AdminSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = String(section || 'dashboard');

  return (
    <RoutePlaceholderScreen
      title={TITLE_MAP[key] || 'Admin'}
      subtitle="Menu administrasi"
      description={`Halaman admin /${key} telah disiapkan agar routing tombol tidak error.`}
      actionLabel="Kembali ke Dashboard Admin"
      actionRoute="/(admin)"
    />
  );
}
