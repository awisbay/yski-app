import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Lelang"
      subtitle="Informasi barang lelang"
      description={`Detail lelang ${id} siap dikembangkan tanpa risiko route not found.`}
      actionLabel="Kembali ke Lelang"
      actionRoute="/auctions"
    />
  );
}
