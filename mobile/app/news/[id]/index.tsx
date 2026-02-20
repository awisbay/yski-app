import { useLocalSearchParams } from 'expo-router';
import { RoutePlaceholderScreen } from '@/components/ui';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RoutePlaceholderScreen
      title="Detail Berita"
      subtitle="Informasi lengkap"
      description={`Konten berita dengan ID ${id} siap ditampilkan di halaman detail ini.`}
      actionLabel="Kembali ke Berita"
      actionRoute="/news"
    />
  );
}
