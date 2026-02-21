import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search, Gavel } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { useAuctions } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

const FILTERS = [
  { key: 'ready', label: 'Ready' },
  { key: 'bidding', label: 'Dalam Penawaran' },
  { key: 'sold', label: 'Terjual' },
] as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function AuctionsScreen() {
  const user = useAuthStore((state) => state.user);
  const isManager = ['admin', 'pengurus'].includes(user?.role || '');

  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['key']>('ready');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAuctions({ status: activeFilter, search });
  const items = data?.items || [];

  const headerSubtitle = useMemo(() => {
    if (activeFilter === 'ready') return 'Barang siap untuk diajukan bid';
    if (activeFilter === 'bidding') return 'Sedang dipantau admin/pengurus';
    return 'Barang yang sudah terjual';
  }, [activeFilter]);

  return (
    <MainThemeLayout
      title="Lelang Barang"
      subtitle={headerSubtitle}
      showBackButton
      rightElement={
        isManager ? (
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/auctions/new')}>
            <Plus size={21} color={colors.white} />
          </TouchableOpacity>
        ) : undefined
      }
    >
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.gray[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Cari nama barang lelang..."
            placeholderTextColor={colors.gray[400]}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.grid}>
            <Skeleton height={220} borderRadius={14} />
            <Skeleton height={220} borderRadius={14} />
            <Skeleton height={220} borderRadius={14} />
            <Skeleton height={220} borderRadius={14} />
          </View>
        ) : items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnRow}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/auctions/${item.id}`)}
              >
                <View style={styles.imageWrap}>
                  {item.images?.length > 0 && item.images[0]?.imageUrl ? (
                    <Image source={{ uri: item.images[0].imageUrl }} style={styles.image} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Gavel size={24} color={colors.primary[400]} />
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.priceLabel}>Penawaran Saat Ini</Text>
                  <Text style={styles.price}>{formatCurrency(item.currentPrice)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}><Gavel size={30} color={colors.primary[500]} /></View>
            <Text style={styles.emptyTitle}>Belum ada barang</Text>
            <Text style={styles.emptyDesc}>Belum ada barang lelang untuk kategori ini.</Text>
            {isManager && activeFilter === 'ready' ? (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/auctions/new')}>
                <Plus size={15} color={colors.white} />
                <Text style={styles.emptyBtnText}>Tambah Barang Lelang</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchBox: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.gray[800] },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  filterTextActive: { color: colors.white },
  grid: { gap: 10 },
  listContent: { paddingBottom: 95 },
  columnRow: { justifyContent: 'space-between', marginBottom: 10 },
  card: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  imageWrap: { height: 120, backgroundColor: colors.gray[50] },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10 },
  title: { fontSize: 13, fontWeight: '700', color: colors.gray[900], minHeight: 36 },
  priceLabel: { marginTop: 6, fontSize: 10, color: colors.gray[500], fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '800', color: colors.success[700], marginTop: 2 },

  emptyWrap: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.white,
    padding: 22,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.gray[900] },
  emptyDesc: { marginTop: 6, textAlign: 'center', fontSize: 13, color: colors.gray[600] },
  emptyBtn: {
    marginTop: 14,
    height: 42,
    borderRadius: 11,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  emptyBtnText: { color: colors.white, fontSize: 12, fontWeight: '800' },
});
