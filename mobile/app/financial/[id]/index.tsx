import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function FinancialReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Laporan"
      subtitle="Laporan keuangan"
      description={`Laporan keuangan ${id} kini memiliki halaman detail aktif.`}
      actionLabel="Kembali ke Keuangan"
      actionRoute="/financial"
    />
  );
}
