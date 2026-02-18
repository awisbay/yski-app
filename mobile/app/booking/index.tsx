import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Plus, Calendar, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, FilterTabBar, Skeleton, BookingCardSkeleton } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { useMyBookings, useCancelBooking } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

export default function BookingListScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: bookings, isLoading, refetch } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const filteredBookings = bookings?.filter((booking: any) => {
    switch (activeTab) {
      case 'active':
        return booking.status === 'confirmed' || booking.status === 'pending';
      case 'completed':
        return booking.status === 'completed';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  }) || [];

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/booking/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Badge 
            label={item.status}
            variant={
              item.status === 'confirmed' ? 'success' :
              item.status === 'pending' ? 'warning' :
              item.status === 'completed' ? 'secondary' :
              'error'
            }
          />
          <Text style={styles.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.bookingInfo}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.gray[500]} />
            <Text style={styles.infoText}>
              {new Date(item.bookingDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.gray[500]} />
            <Text style={styles.infoText}>{item.timeSlot}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.gray[500]} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
        </View>

        {(item.status === 'confirmed' || item.status === 'pending') && (
          <View style={styles.actionRow}>
            <Button
              title="Batalkan"
              variant="secondary"
              size="sm"
              onPress={() => handleCancel(item.id)}
              isLoading={cancelMutation.isPending}
              style={styles.cancelButton}
            />
            <ChevronRight size={20} color={colors.gray[400]} />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <Header
        title="Booking Saya"
        showBackButton={false}
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/booking/new')}
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
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </>
      ) : filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon={Calendar}
          title="Belum ada booking"
          description={
            activeTab === 'all'
              ? "Anda belum membuat booking. Mulai dengan membuat booking pertama."
              : `Tidak ada booking ${activeTab === 'active' ? 'aktif' : activeTab === 'completed' ? 'yang selesai' : 'yang dibatalkan'}.`
          }
          action={{
            label: 'Buat Booking',
            onPress: () => router.push('/booking/new'),
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
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    ...typography.caption,
    color: colors.gray[500],
  },
  bookingInfo: {
    gap: 8,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cancelButton: {
    flex: 0,
  },
});
