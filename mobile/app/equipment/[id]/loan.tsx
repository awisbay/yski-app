import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function EquipmentLoanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Form Peminjaman"
      subtitle="Ajukan peminjaman alat"
      description={`Form peminjaman untuk item ${id} siap ditambahkan di halaman ini.`}
      actionLabel="Kembali ke Peralatan"
      actionRoute="/equipment"
    />
  );
}
