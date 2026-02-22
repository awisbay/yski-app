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
import { LayoutGrid, Plus } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { usePrograms } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function AdminProgramsScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');

  const { data: programs, isLoading } = usePrograms({ status: 'active', limit: 100 });

  const orderedPrograms = useMemo(
    () => [...(programs || [])].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [programs]
  );

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Program" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola program.</Text></View>
      </MainThemeLayout>
    );
  }

  const renderProgram = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.programCard}
      onPress={() => router.push(`/admin/programs-form?id=${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.orderTag}>
        <Text style={styles.orderTagText}>#{item.displayOrder || 0}</Text>
      </View>
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbFallback}><LayoutGrid size={24} color={colors.primary[600]} /></View>
        )}
      </View>
      <Text style={styles.programTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Manajemen Program"
      subtitle="Kelola program aktif untuk homepage"
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <View style={styles.content}>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={140} borderRadius={14} />
            <Skeleton height={140} borderRadius={14} />
          </View>
        ) : (
          <FlatList
            data={orderedPrograms}
            keyExtractor={(item) => item.id}
            renderItem={renderProgram}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada program aktif.</Text>}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/admin/programs-form')}
        activeOpacity={0.85}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.fabText}>Buat Program</Text>
      </TouchableOpacity>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
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
  programCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    padding: 10,
    position: 'relative',
  },
  orderTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    minWidth: 28,
    height: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
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
  programTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 17,
    minHeight: 34,
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
