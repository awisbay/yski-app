import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function DonationPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Pembayaran Donasi"
      subtitle="Instruksi transfer"
      description={`Instruksi pembayaran donasi #${String(id || '').slice(-6).toUpperCase()} siap ditampilkan di halaman ini.`}
      actionLabel="Kembali ke Donasi"
      actionRoute="/donations"
    />
  );
}
