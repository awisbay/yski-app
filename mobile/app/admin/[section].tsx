import { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, MapPin, Navigation2, CheckCircle2, XCircle } from 'lucide-react-native';
import { MainThemeLayout, RoutePlaceholderScreen } from '@/components/ui';
import { useAllBookings, useApproveBooking, useRejectBooking } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

const TITLE_MAP: Record<string, string> = {
  users: 'Manajemen User',
  bookings: 'Manajemen Booking',
  equipment: 'Manajemen Peralatan',
  donations: 'Manajemen Donasi',
  pickups: 'Manajemen Penjemputan',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  in_progress: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

async function fetchRouteEstimate(booking: any): Promise<{ distanceKm: number; durationMin: number } | null> {
  if (
    booking?.pickupLat == null ||
    booking?.pickupLng == null ||
    booking?.dropoffLat == null ||
    booking?.dropoffLng == null
  ) {
    return null;
  }

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${booking.pickupLng},${booking.pickupLat};${booking.dropoffLng},${booking.dropoffLat}` +
      '?overview=false';
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round((route.duration / 60) * 1.4),
    };
  } catch {
    return null;
  }
}

function BookingManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const isOperationalRole = ['admin', 'superadmin', 'pengurus', 'relawan'].includes(user?.role || '');

  const { data: bookings, isLoading, refetch } = useAllBookings();
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();

  const pendingCount = useMemo(
    () => (bookings || []).filter((b: any) => b.status === 'pending').length,
    [bookings]
  );

  if (!isOperationalRole) {
    router.replace('/(tabs)');
    return null;
  }

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      refetch();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyetujui booking ini.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      refetch();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menolak booking ini.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.code}>#{String(item.bookingCode || item.id).slice(-8).toUpperCase()}</Text>
          <Text style={[styles.status, isPending ? styles.statusPending : styles.statusNonPending]}>
            {STATUS_LABEL[item.status] || item.status}
          </Text>
        </View>

        <View style={styles.row}>
          <Calendar size={14} color={colors.primary[600]} />
          <Text style={styles.rowText}>
            {item.bookingDate ? new Date(item.bookingDate).toLocaleDateString('id-ID') : '-'} · {item.timeSlot || '-'}
          </Text>
        </View>

        <View style={styles.row}>
          <MapPin size={14} color="#E11D48" />
          <Text style={styles.rowText} numberOfLines={2}>Origin: {item.pickupAddress || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Navigation2 size={14} color={colors.secondary[600]} />
          <Text style={styles.rowText} numberOfLines={2}>Destination: {item.dropoffAddress || '-'}</Text>
        </View>

        <View style={styles.row}>
          <Clock size={14} color={colors.primary[600]} />
          <BookingEta booking={item} />
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleReject(item.id)}
              disabled={rejectMutation.isPending || approveMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.error[600]} />
              ) : (
                <>
                  <XCircle size={15} color={colors.error[600]} />
                  <Text style={styles.rejectText}>Tolak</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item.id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.success[700]} />
              ) : (
                <>
                  <CheckCircle2 size={15} color={colors.success[700]} />
                  <Text style={styles.approveText}>Setujui</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <MainThemeLayout
      title="Manajemen Booking"
      subtitle={`${pendingCount} booking menunggu persetujuan`}
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : (
          <FlatList
            data={bookings || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Belum ada booking masuk.</Text>
              </View>
            }
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

function BookingEta({ booking }: { booking: any }) {
  const [text, setText] = useState('Menghitung estimasi...');

  useEffect(() => {
    let isCancelled = false;
    fetchRouteEstimate(booking).then((route) => {
      if (isCancelled) return;
      if (!route) {
        setText('Jarak/waktu belum tersedia (pastikan titik peta diisi).');
        return;
      }
      setText(`${route.distanceKm} km · ±${route.durationMin} menit (estimasi)`);
    });

    return () => {
      isCancelled = true;
    };
  }, [booking]);

  return <Text style={styles.rowText}>{text}</Text>;
}

export default function AdminSectionScreen() {
  const user = useAuthStore((state) => state.user);
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = String(section || 'dashboard');

  const isOperationalRole = ['admin', 'superadmin', 'pengurus', 'relawan'].includes(user?.role || '');
  if (!isOperationalRole) {
    router.replace('/(tabs)');
    return null;
  }

  if (key === 'bookings') {
    return <BookingManagementScreen />;
  }

  return (
    <RoutePlaceholderScreen
      title={TITLE_MAP[key] || 'Admin'}
      subtitle="Menu administrasi"
      description={`Halaman admin /${key} telah disiapkan agar routing tombol tidak error.`}
      actionLabel="Kembali ke Dashboard"
      actionRoute="/(admin)"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  centered: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  code: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPending: {
    color: colors.warning[700],
    backgroundColor: colors.warning[100],
  },
  statusNonPending: {
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 7,
  },
  rowText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  approveBtn: {
    borderColor: colors.success[200],
    backgroundColor: colors.success[50],
  },
  rejectBtn: {
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  approveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success[700],
  },
  rejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error[600],
  },
});
