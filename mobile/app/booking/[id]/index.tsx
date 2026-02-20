import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Booking"
      subtitle="Informasi booking"
      description={`Detail booking ${id} sekarang sudah tersedia sebagai halaman route.`}
      actionLabel="Kembali ke Booking"
      actionRoute="/booking"
    />
  );
}
