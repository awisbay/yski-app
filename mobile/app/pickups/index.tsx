import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Plus, Truck, MapPin, Wallet, Package, Clock, ChevronRight } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useMyPickups, useCancelPickup } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
] as const;

const PICKUP_TYPES: Record<string, { label: string; icon: any; color: string; isMoney: boolean }> = {
  zakat: { label: 'Zakat', icon: Wallet, color: '#F59E0B', isMoney: true },
  jelantah: { label: 'Jelantah', icon: Package, color: '#0EA5E9', isMoney: false },
  sedekah: { label: 'Sedekah', icon: Wallet, color: '#22C55E', isMoney: true },
  barang_bekas: { label: 'Barang Bekas', icon: Package, color: '#6366F1', isMoney: false },
  lain_lain: { label: 'Lain-lain', icon: Package, color: '#14B8A6', isMoney: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  awaiting_confirmation: 'Dikonfirmasi Nanti',
  accepted: 'Jemput Sekarang',
  scheduled: 'Terjadwal',
  in_progress: 'Dalam Perjalanan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  pending: { fg: colors.warning[700], bg: colors.warning[100] },
  awaiting_confirmation: { fg: colors.warning[700], bg: colors.warning[100] },
  accepted: { fg: colors.primary[700], bg: colors.primary[100] },
  scheduled: { fg: colors.primary[700], bg: colors.primary[100] },
  in_progress: { fg: colors.secondary[700], bg: colors.secondary[100] },
  completed: { fg: colors.success[700], bg: colors.success[100] },
  cancelled: { fg: colors.error[700], bg: colors.error[100] },
};

function formatCurrency(amount?: number | null) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
}

export default function PickupsScreen() {
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]['key']>('all');
  const { data: pickups, isLoading } = useMyPickups();
  const cancelMutation = useCancelPickup();

  const summary = useMemo(() => {
    const list = pickups || [];
    return {
      total: list.length,
      active: list.filter((p: any) => ['pending', 'awaiting_confirmation', 'accepted', 'scheduled', 'in_progress'].includes(p.status)).length,
      completed: list.filter((p: any) => ['completed', 'cancelled'].includes(p.status)).length,
    };
  }, [pickups]);

  const filteredPickups = useMemo(() => {
    const list = pickups || [];
    if (activeTab === 'active') {
      return list.filter((pickup: any) => ['pending', 'awaiting_confirmation', 'accepted', 'scheduled', 'in_progress'].includes(pickup.status));
    }
    if (activeTab === 'completed') {
      return list.filter((pickup: any) => ['completed', 'cancelled'].includes(pickup.status));
    }
    return list;
  }, [pickups, activeTab]);

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync({ id, reason: 'Dibatalkan oleh pengguna' });
    } catch (error) {
      console.error('Failed to cancel pickup:', error);
    }
  };

  const renderPickupItem = ({ item }: { item: any }) => {
    const typeInfo = PICKUP_TYPES[item.pickupType] || { label: item.pickupType, icon: Truck, color: colors.gray[500], isMoney: false };
    const TypeIcon = typeInfo.icon;
    const statusTone = STATUS_COLORS[item.status] || { fg: colors.gray[700], bg: colors.gray[100] };

    return (
      <TouchableOpacity onPress={() => router.push(`/pickups/${item.id}`)} activeOpacity={0.86}>
        <Card style={styles.pickupCard}>
          <View style={styles.cardAccent} />
          <View style={styles.cardContent}>
            <View style={styles.pickupHeader}>
              <View style={styles.pickupType}>
                <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                  <TypeIcon size={18} color={typeInfo.color} />
                </View>
                <View>
                  <Text style={styles.typeLabel}>{typeInfo.label}</Text>
                  <Text style={styles.pickupId}>#{String(item.requestCode || item.id).slice(-6).toUpperCase()}</Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}> 
                <Text style={[styles.statusText, { color: statusTone.fg }]}>{STATUS_LABEL[item.status] || item.status}</Text>
              </View>
            </View>

            <View style={styles.pickupInfo}>
              <View style={styles.infoRow}>
                <MapPin size={15} color={colors.gray[500]} />
                <Text style={styles.infoText} numberOfLines={1}>{item.pickupAddress}</Text>
              </View>

              {typeInfo.isMoney ? (
                <View style={styles.infoRow}>
                  <Wallet size={15} color={colors.gray[500]} />
                  <Text style={styles.infoText}>Nominal: {formatCurrency(item.amount)}</Text>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Package size={15} color={colors.gray[500]} />
                  <Text style={styles.infoText} numberOfLines={1}>{item.itemDescription || '-'}</Text>
                </View>
              )}

              {item.status === 'accepted' && item.etaMinutes ? (
                <View style={[styles.infoRow, styles.highlightRow]}>
                  <Clock size={15} color={colors.primary[700]} />
                  <Text style={[styles.infoText, { color: colors.primary[700], fontWeight: '700' }]}>Estimasi tiba ±{item.etaMinutes} menit</Text>
                </View>
              ) : null}

              {item.status === 'awaiting_confirmation' ? (
                <Text style={styles.awaitingText}>Penjemputan akan dikonfirmasi lagi nanti.</Text>
              ) : null}

              {!typeInfo.isMoney && item.itemPhotoUrl ? (
                <Image source={{ uri: item.itemPhotoUrl }} style={styles.previewImage} />
              ) : null}
            </View>

            {(item.status === 'pending' || item.status === 'awaiting_confirmation') && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? <ActivityIndicator size="small" color={colors.error[600]} /> : <Text style={styles.cancelText}>Batalkan</Text>}
                </TouchableOpacity>
                <ChevronRight size={20} color={colors.gray[400]} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout
      title="Penjemputan"
      subtitle="Kelola semua request pickup Anda"
      rightElement={
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/pickups/new')}>
          <Plus size={22} color={colors.white} />
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{summary.total}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Aktif</Text>
            <Text style={styles.summaryValue}>{summary.active}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Selesai</Text>
            <Text style={styles.summaryValue}>{summary.completed}</Text>
          </View>
        </View>

        <View style={styles.filterWrap}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <>
            <Skeleton height={190} borderRadius={14} />
            <Skeleton height={190} borderRadius={14} />
            <Skeleton height={190} borderRadius={14} />
          </>
        ) : filteredPickups.length > 0 ? (
          <FlatList
            data={filteredPickups}
            renderItem={renderPickupItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="Belum ada penjemputan"
            description={
              activeTab === 'all'
                ? 'Buat penjemputan zakat, jelantah, sedekah, barang bekas, atau lain-lain'
                : `Tidak ada penjemputan ${activeTab === 'active' ? 'aktif' : 'yang selesai'}.`
            }
            action={{ label: 'Buat Penjemputan', onPress: () => router.push('/pickups/new') }}
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
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

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[700],
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary[800],
  },

  filterWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    padding: 4,
    gap: 4,
    marginBottom: 10,
  },
  filterPill: {
    flex: 1,
    borderRadius: 9,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
  },
  filterTextActive: {
    color: colors.primary[700],
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pickupCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
  },
  cardAccent: {
    height: 4,
    backgroundColor: colors.primary[500],
  },
  cardContent: {
    padding: 14,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pickupType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.gray[900],
  },
  pickupId: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pickupInfo: {
    gap: 8,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightRow: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  infoText: {
    ...typography.body2,
    color: colors.gray[700],
    flex: 1,
  },
  awaitingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning[700],
    backgroundColor: colors.warning[100],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewImage: {
    height: 140,
    borderRadius: 10,
    marginTop: 2,
    backgroundColor: colors.gray[100],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginTop: 4,
  },
  cancelBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 94,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error[600],
  },
});
