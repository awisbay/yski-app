import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Plus, Truck, Calendar, MapPin, Clock, ChevronRight, Package, Moon, Heart } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, FilterTabBar, Skeleton } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { useMyPickups, useCancelPickup } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
];

const PICKUP_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  zakat: { label: 'Zakat', icon: Moon, color: colors.warning[500] },
  kencleng: { label: 'Kencleng', icon: Package, color: colors.primary[500] },
  donasi: { label: 'Donasi', icon: Heart, color: colors.success[500] },
};

export default function PickupsScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: pickups, isLoading } = useMyPickups();
  const cancelMutation = useCancelPickup();

  const filteredPickups = pickups?.filter((pickup) => {
    switch (activeTab) {
      case 'active':
        return pickup.status === 'pending' || pickup.status === 'scheduled';
      case 'completed':
        return pickup.status === 'completed' || pickup.status === 'cancelled';
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
    const typeInfo = PICKUP_TYPES[item.pickupType] || { label: item.pickupType, icon: Truck, color: colors.gray[500] };
    const TypeIcon = typeInfo.icon;
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/pickups/${item.id}`)}
        activeOpacity={0.7}
      >
        <Card style={styles.pickupCard}>
          <View style={styles.pickupHeader}>
            <View style={styles.pickupType}>
              <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                <TypeIcon size={20} color={typeInfo.color} />
              </View>
              <View>
                <Text style={styles.typeLabel}>{typeInfo.label}</Text>
                <Text style={styles.pickupId}>#{item.id.slice(-6).toUpperCase()}</Text>
              </View>
            </View>
            <Badge
              label={item.status}
              variant={
                item.status === 'completed' ? 'success' :
                item.status === 'scheduled' ? 'primary' :
                item.status === 'pending' ? 'warning' :
                'error'
              }
            />
          </View>

          <View style={styles.pickupInfo}>
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.gray[500]} />
              <Text style={styles.infoText}>
                {item.preferredDate 
                  ? new Date(item.preferredDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Menunggu jadwal'
                }
              </Text>
            </View>
            {item.preferredTimeSlot && (
              <View style={styles.infoRow}>
                <Clock size={16} color={colors.gray[500]} />
                <Text style={styles.infoText}>{item.preferredTimeSlot}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.gray[500]} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.pickupAddress}
              </Text>
            </View>
          </View>

          {(item.status === 'pending' || item.status === 'scheduled') && (
            <View style={styles.actionRow}>
              <Button
                title="Batalkan"
                variant="secondary"
                size="sm"
                onPress={() => handleCancel(item.id)}
                isLoading={cancelMutation.isPending}
              />
              <ChevronRight size={20} color={colors.gray[400]} />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Header
        title="Penjemputan"
        showBackButton={false}
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/pickups/new')}
          >
            <Plus size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        }
      />

      <FilterTabBar
        tabs={FILTER_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <>
          <Skeleton height={160} borderRadius={12} />
          <Skeleton height={160} borderRadius={12} />
          <Skeleton height={160} borderRadius={12} />
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
              ? "Jadwalkan penjemputan zakat, kencleng, atau donasi"
              : `Tidak ada penjemputan ${activeTab === 'active' ? 'aktif' : 'yang selesai'}.`
          }
          action={{
            label: 'Jadwalkan Penjemputan',
            onPress: () => router.push('/pickups/new'),
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
    marginBottom: 12,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
