import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Program"
      subtitle="Informasi program"
      description={`Detail program ${id} telah memiliki route aktif.`}
      actionLabel="Kembali ke Program"
      actionRoute="/programs"
    />
  );
}
