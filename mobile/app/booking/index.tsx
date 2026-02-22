import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Calendar, MapPin, Clock, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { BookingCardSkeleton } from '@/components/ui';
import { Badge } from '@/components/Badge';
import { useMyBookings, useCancelBooking } from '@/hooks';
import { colors } from '@/constants/colors';

const FILTERS = [
  { key: 'all',       label: 'Semua'     },
  { key: 'active',    label: 'Aktif'     },
  { key: 'completed', label: 'Selesai'   },
  { key: 'cancelled', label: 'Dibatalkan'},
];

const STATUS_VARIANT: Record<string, any> = {
  confirmed: 'success',
  approved:  'success',
  pending:   'warning',
  in_progress: 'secondary',
  completed: 'secondary',
  rejected: 'error',
  cancelled: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Dikonfirmasi',
  approved: 'Disetujui',
  pending:   'Menunggu',
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

function formatBookingDates(item: any): string {
  const dates = Array.isArray(item.bookingDates) && item.bookingDates.length
    ? item.bookingDates
    : item.bookingDate
    ? [item.bookingDate]
    : [];
  if (!dates.length) return '-';
  return dates
    .map((d: string) => {
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return d;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    })
    .join(', ');
}

export default function BookingListScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: bookings, isLoading } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const filtered = bookings?.filter((b: any) => {
    if (activeFilter === 'all')       return true;
    if (activeFilter === 'active')    return b.status === 'confirmed' || b.status === 'approved' || b.status === 'pending' || b.status === 'in_progress';
    if (activeFilter === 'completed') return b.status === 'completed';
    if (activeFilter === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  }) ?? [];

  const handleCancel = async (id: string) => {
    try { await cancelMutation.mutateAsync(id); } catch {}
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.status === 'confirmed' || item.status === 'approved' || item.status === 'pending' || item.status === 'in_progress';
    const canCancel = item.status === 'pending';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/booking/${item.id}`)}
        activeOpacity={0.85}
      >
        {/* accent strip */}
        <View style={[
          styles.cardAccent,
          { backgroundColor: isActive ? colors.primary[500] : colors.gray[300] },
        ]} />

        <View style={styles.cardBody}>
          {/* top row */}
          <View style={styles.cardTopRow}>
            <Badge
              label={STATUS_LABEL[item.status] ?? item.status}
              variant={STATUS_VARIANT[item.status] ?? 'default'}
            />
            <Text style={styles.cardId}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>

          {/* info rows */}
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary[50] }]}>
                <Calendar size={13} color={colors.primary[600]} />
              </View>
              <Text style={styles.infoText}>
                {formatBookingDates(item)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary[50] }]}>
                <Clock size={13} color={colors.primary[600]} />
              </View>
              <Text style={styles.infoText}>
                {item.isFullDay ? '1 Hari (Semua Jam)' : ((item.timeSlots && item.timeSlots.length > 0) ? item.timeSlots.join(', ') : (item.timeSlot || '-'))}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF1F2' }]}>
                <MapPin size={13} color="#E11D48" />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{item.pickupAddress}</Text>
            </View>
            {item.status === 'rejected' && (
              <View style={styles.rejectedBox}>
                <Text style={styles.rejectedLabel}>Alasan ditolak:</Text>
                <Text style={styles.rejectedValue} numberOfLines={2}>
                  {item.rejectionReason || 'Tidak ada catatan alasan.'}
                </Text>
              </View>
            )}
          </View>

          {/* footer */}
          <View style={styles.cardFooter}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? <ActivityIndicator size="small" color={colors.error[600]} />
                  : <Text style={styles.cancelBtnText}>Batalkan</Text>
                }
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <ChevronRight size={18} color={colors.gray[400]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Green Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Saya</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/booking/new')}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── White panel ── */}
      <View style={styles.panel}>
        {isLoading ? (
          <View style={{ padding: 20, gap: 12 }}>
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </View>
        ) : filtered.length > 0 ? (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          /* Empty state */
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Calendar size={36} color={colors.primary[400]} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'Belum ada booking' : `Tidak ada booking ${
                activeFilter === 'active' ? 'aktif' :
                activeFilter === 'completed' ? 'selesai' : 'dibatalkan'
              }`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Buat booking pertama Anda sekarang'
                : 'Coba filter lain untuk melihat booking lainnya'}
            </Text>
            {activeFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/booking/new')}
                activeOpacity={0.85}
              >
                <Plus size={15} color={colors.white} />
                <Text style={styles.emptyBtnText}>Buat Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
        onPress={() => router.push('/booking/new')}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[700] },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700', color: colors.white,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter bar (on green bg)
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterPillActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)',
  },
  filterTextActive: {
    color: colors.primary[700],
  },

  // White panel
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  list: {
    padding: 16,
  },

  // Booking card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1, borderColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  cardId: { fontSize: 11, color: colors.gray[400], fontWeight: '600' },
  infoList: { gap: 8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  infoText: { fontSize: 13, color: colors.gray[700], flex: 1, lineHeight: 18 },
  rejectedBox: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[100],
  },
  rejectedLabel: { fontSize: 11, fontWeight: '700', color: colors.error[700], marginBottom: 2 },
  rejectedValue: { fontSize: 12, color: colors.error[700], lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.gray[50], paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: colors.error[400],
    backgroundColor: colors.error[50],
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: colors.error[600] },

  // Empty state
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10,
  },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 12, marginTop: 8,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  // FAB
  fab: {
    position: 'absolute', right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.primary[600],
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
