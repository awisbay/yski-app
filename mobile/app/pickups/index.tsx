import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Plus, Truck, MapPin, Wallet, Package, Clock, ChevronRight } from 'lucide-react-native';
import { MainThemeLayout, FilterTabBar, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useMyPickups, useCancelPickup } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
];

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

function formatCurrency(amount?: number | null) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));
}

export default function PickupsScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: pickups, isLoading } = useMyPickups();
  const cancelMutation = useCancelPickup();

  const filteredPickups = pickups?.filter((pickup: any) => {
    switch (activeTab) {
      case 'active':
        return ['pending', 'awaiting_confirmation', 'accepted', 'scheduled', 'in_progress'].includes(pickup.status);
      case 'completed':
        return ['completed', 'cancelled'].includes(pickup.status);
      default:
        return true;
    }
  }) || [];

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

    return (
      <TouchableOpacity
        onPress={() => router.push(`/pickups/${item.id}`)}
        activeOpacity={0.82}
      >
        <Card style={styles.pickupCard}>
          <View style={styles.pickupHeader}>
            <View style={styles.pickupType}>
              <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                <TypeIcon size={20} color={typeInfo.color} />
              </View>
              <View>
                <Text style={styles.typeLabel}>{typeInfo.label}</Text>
                <Text style={styles.pickupId}>#{String(item.requestCode || item.id).slice(-6).toUpperCase()}</Text>
              </View>
            </View>
            <Badge
              label={STATUS_LABEL[item.status] || item.status}
              variant={
                item.status === 'completed' ? 'success' :
                item.status === 'accepted' || item.status === 'scheduled' || item.status === 'in_progress' ? 'primary' :
                item.status === 'pending' || item.status === 'awaiting_confirmation' ? 'warning' :
                'error'
              }
            />
          </View>

          <View style={styles.pickupInfo}>
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.gray[500]} />
              <Text style={styles.infoText} numberOfLines={1}>{item.pickupAddress}</Text>
            </View>

            {typeInfo.isMoney ? (
              <View style={styles.infoRow}>
                <Wallet size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>Nominal: {formatCurrency(item.amount)}</Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <Package size={16} color={colors.gray[500]} />
                <Text style={styles.infoText} numberOfLines={1}>{item.itemDescription || '-'}</Text>
              </View>
            )}

            {item.status === 'accepted' && item.etaMinutes ? (
              <View style={styles.infoRow}>
                <Clock size={16} color={colors.primary[500]} />
                <Text style={[styles.infoText, { color: colors.primary[700] }]}>Estimasi petugas tiba ±{item.etaMinutes} menit</Text>
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
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.cancelText}>Batalkan</Text>
              </TouchableOpacity>
              <ChevronRight size={20} color={colors.gray[400]} />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout
      title="Penjemputan"
      subtitle="Zakat, jelantah, sedekah, barang bekas"
      rightElement={
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/pickups/new')}
        >
          <Plus size={22} color={colors.white} />
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        <FilterTabBar
          tabs={FILTER_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {isLoading ? (
          <>
            <Skeleton height={180} borderRadius={12} />
            <Skeleton height={180} borderRadius={12} />
            <Skeleton height={180} borderRadius={12} />
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
            action={{
              label: 'Buat Penjemputan',
              onPress: () => router.push('/pickups/new'),
            }}
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pickupCard: {
    marginBottom: 12,
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
    gap: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.gray[900],
  },
  pickupId: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  pickupInfo: {
    gap: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginTop: 4,
    backgroundColor: colors.gray[100],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cancelBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error[600],
  },
});
