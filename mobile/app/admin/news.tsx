import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Newspaper, Plus } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { useNews } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function AdminNewsScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');

  const { data: news, isLoading } = useNews({ limit: 100, is_published: undefined });

  const sortedNews = useMemo(
    () =>
      [...(news || [])].sort((a: any, b: any) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [news]
  );

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Berita" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola berita.</Text></View>
      </MainThemeLayout>
    );
  }

  const renderNews = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => router.push(`/admin/news-form?id=${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbFallback}><Newspaper size={24} color={colors.primary[600]} /></View>
        )}
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.newsMeta} numberOfLines={1}>
        {(item.category || 'general').replace('_', '-')} · {new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Manajemen Berita"
      subtitle="Kelola konten berita untuk semua user"
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <View style={styles.contentWrap}>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={140} borderRadius={14} />
            <Skeleton height={140} borderRadius={14} />
          </View>
        ) : (
          <FlatList
            data={sortedNews}
            keyExtractor={(item) => item.id}
            renderItem={renderNews}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada berita.</Text>}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/news-form')}
        activeOpacity={0.85}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.fabText}>Buat Berita</Text>
      </TouchableOpacity>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: 110,
    gap: 10,
  },
  newsCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    padding: 10,
  },
  thumbWrap: {
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    marginBottom: 8,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 17,
    minHeight: 34,
  },
  newsMeta: {
    marginTop: 4,
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.gray[500],
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    backgroundColor: colors.primary[600],
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
