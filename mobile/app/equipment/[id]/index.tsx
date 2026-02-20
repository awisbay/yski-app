import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Peralatan"
      subtitle="Informasi item"
      description={`Detail peralatan dengan ID ${id} sekarang sudah memiliki route aktif.`}
      actionLabel="Kembali ke Peralatan"
      actionRoute="/equipment"
    />
  );
}
