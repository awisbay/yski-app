import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Package, CheckCircle2, Clock3 } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { Badge } from '@/components/Badge';
import { useEquipmentList, useEquipmentStats, useMyLoans } from '@/hooks';
import { colors } from '@/constants/colors';

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'kesehatan', label: 'Kesehatan' },
  { key: 'elektronik', label: 'Elektronik' },
  { key: 'lain-lain', label: 'Lain-lain' },
];

export default function EquipmentScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: equipment, isLoading } = useEquipmentList();
  const { data: stats } = useEquipmentStats();
  const { data: myLoans } = useMyLoans();

  const filteredEquipment = useMemo(
    () => (equipment || []).filter((item: any) => activeCategory === 'all' || item.category === activeCategory),
    [equipment, activeCategory]
  );

  const renderItem = ({ item }: { item: any }) => {
    const available = (item.availableStock ?? 0) > 0;

    return (
      <TouchableOpacity style={styles.itemCard} onPress={() => router.push(`/equipment/${item.id}`)} activeOpacity={0.85}>
        <View style={styles.thumbWrap}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbFallback}>
              <Package size={26} color={colors.secondary[600]} />
            </View>
          )}
        </View>

        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category}</Text>

        <View style={styles.metaRow}>
          <Badge label={available ? 'Tersedia' : 'Kosong'} variant={available ? 'success' : 'error'} size="sm" />
          <Text style={styles.stockText}>{item.availableStock}/{item.totalStock}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout title="Peralatan" subtitle="Pinjam peralatan yang tersedia" showBackButton>
      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <CheckCircle2 size={16} color={colors.primary[600]} />
            <Text style={styles.statValue}>{stats?.available ?? 0}</Text>
            <Text style={styles.statLabel}>Stok Tersedia</Text>
          </View>
          <View style={styles.statCard}>
            <Clock3 size={16} color={colors.secondary[600]} />
            <Text style={styles.statValue}>{(myLoans || []).filter((l: any) => l.status !== 'rejected').length}</Text>
            <Text style={styles.statLabel}>Peminjaman Saya</Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setActiveCategory(c.key)}
              style={[styles.chip, activeCategory === c.key && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, activeCategory === c.key && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ gap: 10, marginTop: 10 }}>
            <Skeleton height={150} borderRadius={14} />
            <Skeleton height={150} borderRadius={14} />
          </View>
        ) : (
          <FlatList
            data={filteredEquipment}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada peralatan di kategori ini.</Text>}
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[100],
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  chipTextActive: {
    color: colors.white,
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  gridContent: {
    paddingBottom: 100,
    gap: 10,
  },
  itemCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 10,
    gap: 6,
  },
  thumbWrap: {
    height: 82,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
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
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[900],
    minHeight: 34,
  },
  itemCategory: {
    fontSize: 11,
    color: colors.gray[500],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray[500],
    marginTop: 24,
  },
});
