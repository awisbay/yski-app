import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function DonationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Donasi"
      subtitle="Riwayat donasi Anda"
      description={`Halaman detail donasi #${String(id || '').slice(-6).toUpperCase()} siap untuk dilanjutkan.`}
      actionLabel="Kembali ke Donasi"
      actionRoute="/donations"
    />
  );
}
