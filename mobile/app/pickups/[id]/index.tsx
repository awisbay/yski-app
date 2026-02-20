import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function PickupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Penjemputan"
      subtitle="Status penjemputan"
      description={`Halaman detail penjemputan ${id} sudah terdaftar dan tidak akan error saat dibuka.`}
      actionLabel="Kembali ke Penjemputan"
      actionRoute="/pickups"
    />
  );
}
