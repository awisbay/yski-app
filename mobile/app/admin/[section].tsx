import { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Calendar, Clock, MapPin, Navigation2, CheckCircle2, XCircle, Flag, Package, Plus, Minus, Camera, Image as ImageIcon, Truck, Wallet } from 'lucide-react-native';
import { MainThemeLayout, RoutePlaceholderScreen } from '@/components/ui';
import {
  useAllBookings,
  useApproveBooking,
  useRejectBooking,
  useUpdateBookingStatus,
  useAllDonations,
  useVerifyDonation,
  useAllPickups,
  useReviewPickup,
  useStartPickup,
  useCompletePickup,
} from '@/hooks';
import {
  useAllEquipmentLoans,
  useEquipmentList,
  useApproveLoan,
  useRejectLoan,
  useMarkLoanBorrowed,
  useMarkLoanReturned,
  useUpdateEquipment,
  useCreateEquipment,
  useUploadEquipmentPhoto,
} from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { API_ORIGIN } from '@/constants/config';
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
  confirmed: 'Dikonfirmasi',
  approved: 'Disetujui',
  in_progress: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const EQUIPMENT_CATEGORIES = ['kesehatan', 'elektronik', 'lain-lain'] as const;

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
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

async function fetchPickupEta(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{ distanceKm: number; durationMin: number } | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      '?overview=false';
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(5, Math.round((route.duration / 60) * 1.4)),
    };
  } catch {
    return null;
  }
}

function formatLoanDateRange(start?: string, end?: string | null) {
  const startText = start ? new Date(start).toLocaleDateString('id-ID') : '-';
  const endText = end ? new Date(end).toLocaleDateString('id-ID') : 'Belum ditentukan';
  return `${startText} - ${endText}`;
}

function BookingManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const isOperationalRole = ['admin', 'superadmin', 'pengurus', 'relawan'].includes(user?.role || '');

  const { data: bookings, isLoading, refetch } = useAllBookings();
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();
  const updateStatusMutation = useUpdateBookingStatus();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

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
    const reason = (rejectReasons[id] || '').trim();
    if (reason.length < 3) {
      Alert.alert('Alasan wajib diisi', 'Masukkan minimal 3 karakter alasan penolakan.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, reason });
      setRejectingId(null);
      setRejectReasons((prev) => ({ ...prev, [id]: '' }));
      refetch();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menolak booking ini.');
    }
  };

  const handleComplete = async (booking: any) => {
    try {
      if (booking.status === 'approved' || booking.status === 'confirmed') {
        await updateStatusMutation.mutateAsync({ id: booking.id, status: 'in_progress' });
      }
      await updateStatusMutation.mutateAsync({ id: booking.id, status: 'completed' });
      refetch();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengonfirmasi booking selesai.');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'pending';
    const canComplete =
      item.status === 'approved' || item.status === 'confirmed' || item.status === 'in_progress';

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
            {item.bookingDate ? new Date(item.bookingDate).toLocaleDateString('id-ID') : '-'} · {
              (item.timeSlots && item.timeSlots.length > 0) ? item.timeSlots.join(', ') : (item.timeSlot || '-')
            }
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
          <View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => setRejectingId(rejectingId === item.id ? null : item.id)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <XCircle size={15} color={colors.error[600]} />
                <Text style={styles.rejectText}>Tolak</Text>
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

            {rejectingId === item.id && (
              <View style={styles.rejectReasonWrap}>
                <TextInput
                  value={rejectReasons[item.id] || ''}
                  onChangeText={(text) => setRejectReasons((prev) => ({ ...prev, [item.id]: text }))}
                  placeholder="Tulis alasan penolakan..."
                  placeholderTextColor={colors.gray[400]}
                  style={styles.rejectReasonInput}
                  multiline
                />
                <View style={styles.rejectReasonActions}>
                  <TouchableOpacity
                    style={styles.rejectCancelBtn}
                    onPress={() => setRejectingId(null)}
                    disabled={rejectMutation.isPending}
                  >
                    <Text style={styles.rejectCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectSubmitBtn}
                    onPress={() => handleReject(item.id)}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.rejectSubmitText}>Kirim Penolakan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {canComplete && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleComplete(item)}
            disabled={updateStatusMutation.isPending}
            activeOpacity={0.85}
          >
            {updateStatusMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Flag size={15} color={colors.white} />
                <Text style={styles.completeText}>Konfirmasi Selesai</Text>
              </>
            )}
          </TouchableOpacity>
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

const PICKUP_TYPE_META: Record<string, { label: string; icon: any; color: string; isMoney: boolean }> = {
  zakat: { label: 'Zakat', icon: Wallet, color: '#F59E0B', isMoney: true },
  jelantah: { label: 'Jelantah', icon: Package, color: '#0EA5E9', isMoney: false },
  sedekah: { label: 'Sedekah', icon: Wallet, color: '#22C55E', isMoney: true },
  barang_bekas: { label: 'Barang Bekas', icon: Package, color: '#6366F1', isMoney: false },
  lain_lain: { label: 'Lain-lain', icon: Package, color: '#14B8A6', isMoney: false },
};

const PICKUP_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  awaiting_confirmation: 'Dikonfirmasi Nanti',
  accepted: 'Jemput Sekarang',
  in_progress: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function formatPickupCurrency(amount?: number | string | null) {
  if (amount == null) return '-';
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parsed);
}

function PickupManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus', 'relawan'].includes(user?.role || '');
  const { data: pickups, isLoading, refetch } = useAllPickups();
  const reviewPickup = useReviewPickup();
  const startPickup = useStartPickup();
  const completePickup = useCompletePickup();

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Penjemputan" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Akses halaman ini khusus admin/pengurus/relawan.</Text></View>
      </MainThemeLayout>
    );
  }

  const incoming = (pickups || []).filter((item: any) => item.status === 'pending' || item.status === 'awaiting_confirmation');

  const handleConfirmLater = async (pickup: any) => {
    try {
      await reviewPickup.mutateAsync({
        id: pickup.id,
        data: {
          action: 'confirm_later',
          follow_up_message: 'Penjemputan akan dikonfirmasi lagi nanti.',
        },
      });
      refetch();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyimpan status konfirmasi nanti.');
    }
  };

  const handlePickupNow = async (pickup: any) => {
    if (pickup?.pickupLat == null || pickup?.pickupLng == null) {
      Alert.alert('Lokasi pickup tidak lengkap', 'Lokasi user belum memiliki koordinat yang valid.');
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Izin lokasi dibutuhkan', 'Aktifkan izin lokasi agar estimasi waktu jemput bisa dihitung.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fromLat = current.coords.latitude;
      const fromLng = current.coords.longitude;

      const eta = await fetchPickupEta(fromLat, fromLng, Number(pickup.pickupLat), Number(pickup.pickupLng));
      if (!eta) {
        Alert.alert('Estimasi gagal', 'Tidak bisa menghitung estimasi perjalanan saat ini.');
        return;
      }

      await reviewPickup.mutateAsync({
        id: pickup.id,
        data: {
          action: 'accept_now',
          responder_lat: fromLat,
          responder_lng: fromLng,
          eta_minutes: eta.durationMin,
          eta_distance_km: eta.distanceKm,
        },
      });
      refetch();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat memproses jemput sekarang.');
    }
  };

  const handleFinishPickup = async (pickup: any) => {
    try {
      if (pickup.status !== 'in_progress') {
        await startPickup.mutateAsync(pickup.id);
      }
      await completePickup.mutateAsync({
        id: pickup.id,
        data: {
          notes: 'Penjemputan selesai dikonfirmasi petugas.',
        },
      });
      refetch();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat mengubah status menjadi selesai.');
    }
  };

  return (
    <MainThemeLayout
      title="Manajemen Penjemputan"
      subtitle={`${incoming.length} permintaan perlu ditindak`}
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
            data={pickups || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const typeMeta = PICKUP_TYPE_META[item.pickupType] || PICKUP_TYPE_META.lain_lain;
              const Icon = typeMeta.icon;
              const isIncoming = item.status === 'pending' || item.status === 'awaiting_confirmation';
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.pickupTypeWrap}>
                      <View style={[styles.pickupTypeIcon, { backgroundColor: `${typeMeta.color}20` }]}>
                        <Icon size={14} color={typeMeta.color} />
                      </View>
                      <Text style={styles.code}>{typeMeta.label}</Text>
                    </View>
                    <Text style={[styles.status, isIncoming ? styles.statusPending : styles.statusNonPending]}>
                      {PICKUP_STATUS_LABEL[item.status] || item.status}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowText}>Nama: {item.requesterName || '-'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>No HP: {item.requesterPhone || '-'}</Text>
                  </View>
                  <View style={styles.row}>
                    <MapPin size={14} color={colors.primary[600]} />
                    <Text style={styles.rowText} numberOfLines={2}>{item.pickupAddress || '-'}</Text>
                  </View>

                  {typeMeta.isMoney ? (
                    <View style={styles.row}>
                      <Wallet size={14} color={colors.primary[600]} />
                      <Text style={styles.rowText}>Nominal: {formatPickupCurrency(item.amount)}</Text>
                    </View>
                  ) : (
                    <>
                      {item.itemDescription ? (
                        <View style={styles.row}>
                          <Package size={14} color={colors.primary[600]} />
                          <Text style={styles.rowText} numberOfLines={2}>{item.itemDescription}</Text>
                        </View>
                      ) : null}
                      {item.itemPhotoUrl ? (
                        <Image source={{ uri: item.itemPhotoUrl }} style={styles.pickupPreviewImage} />
                      ) : null}
                    </>
                  )}

                  {item.status === 'accepted' && item.etaMinutes ? (
                    <View style={styles.row}>
                      <Clock size={14} color={colors.primary[600]} />
                      <Text style={styles.rowText}>Estimasi tiba: ±{item.etaMinutes} menit ({item.etaDistanceKm || '-'} km)</Text>
                    </View>
                  ) : null}

                  {isIncoming ? (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleConfirmLater(item)}
                        disabled={reviewPickup.isPending || startPickup.isPending || completePickup.isPending}
                      >
                        <Text style={styles.rejectText}>Dikonfirmasi Lagi Nanti</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handlePickupNow(item)}
                        disabled={reviewPickup.isPending || startPickup.isPending || completePickup.isPending}
                      >
                        <Text style={styles.approveText}>Jemput Sekarang</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {(item.status === 'awaiting_confirmation' || item.status === 'accepted' || item.status === 'in_progress') ? (
                    <TouchableOpacity
                      style={[styles.completeBtn, (startPickup.isPending || completePickup.isPending) && { opacity: 0.7 }]}
                      onPress={() => handleFinishPickup(item)}
                      disabled={startPickup.isPending || completePickup.isPending}
                      activeOpacity={0.85}
                    >
                      {(startPickup.isPending || completePickup.isPending) ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <CheckCircle2 size={15} color={colors.white} />
                          <Text style={styles.completeText}>Selesaikan Penjemputan</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Belum ada permintaan penjemputan.</Text>
              </View>
            }
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

function normalizeDonationProofUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function DonationManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');
  const { data: donations, isLoading, refetch } = useAllDonations();
  const verifyDonation = useVerifyDonation();

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Donasi" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola donasi.</Text></View>
      </MainThemeLayout>
    );
  }

  const incoming = (donations || []).filter((d: any) =>
    d.paymentStatus === 'pending' || d.paymentStatus === 'awaiting_verification'
  );

  return (
    <MainThemeLayout
      title="Manajemen Donasi"
      subtitle={`${incoming.length} donasi masuk menunggu konfirmasi`}
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
            data={incoming}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const proofUrl = normalizeDonationProofUrl(item.proofUrl);
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.code}>#{String(item.donationCode || item.id).slice(-8).toUpperCase()}</Text>
                    <Text style={[styles.status, styles.statusPending]}>
                      Menunggu Konfirmasi
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowText}>Donatur: {item.donorName || '-'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Nominal: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(item.amount || 0))}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowText}>Tanggal: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}</Text>
                  </View>

                  {proofUrl ? (
                    <View style={styles.donationProofWrap}>
                      <Image source={{ uri: proofUrl }} style={styles.donationProofImage} />
                      <Text style={styles.loanRequestMeta}>Bukti transfer terupload</Text>
                    </View>
                  ) : (
                    <Text style={styles.loanRequestMeta}>Belum ada bukti transfer.</Text>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn, verifyDonation.isPending && { opacity: 0.7 }]}
                      disabled={verifyDonation.isPending}
                      onPress={async () => {
                        try {
                          await verifyDonation.mutateAsync({ id: item.id, status: 'cancelled' });
                          refetch();
                        } catch (err: any) {
                          Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menolak donasi.');
                        }
                      }}
                    >
                      <XCircle size={15} color={colors.error[600]} />
                      <Text style={styles.rejectText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn, verifyDonation.isPending && { opacity: 0.7 }]}
                      disabled={verifyDonation.isPending}
                      onPress={async () => {
                        try {
                          await verifyDonation.mutateAsync({ id: item.id, status: 'paid' });
                          refetch();
                        } catch (err: any) {
                          Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat mengkonfirmasi donasi.');
                        }
                      }}
                    >
                      <CheckCircle2 size={15} color={colors.success[700]} />
                      <Text style={styles.approveText}>Konfirmasi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Belum ada donasi yang menunggu konfirmasi.</Text>
              </View>
            }
          />
        )}
      </View>
    </MainThemeLayout>
  );
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

  if (key === 'equipment') {
    return <EquipmentManagementScreen />;
  }

  if (key === 'donations') {
    return <DonationManagementScreen />;
  }

  if (key === 'pickups') {
    return <PickupManagementScreen />;
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

function EquipmentManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'superadmin', 'pengurus'].includes(user?.role || '');
  const { data: equipment, isLoading: eqLoading } = useEquipmentList();
  const { data: loans, isLoading: loanLoading, refetch } = useAllEquipmentLoans();
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();
  const markLoanBorrowed = useMarkLoanBorrowed();
  const markLoanReturned = useMarkLoanReturned();
  const updateEquipment = useUpdateEquipment();
  const createEquipment = useCreateEquipment();
  const uploadEquipmentPhoto = useUploadEquipmentPhoto();
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<(typeof EQUIPMENT_CATEGORIES)[number]>('kesehatan');
  const [newTotalStock, setNewTotalStock] = useState('1');
  const [newDescription, setNewDescription] = useState('');
  const [newPhoto, setNewPhoto] = useState<PickedPhoto | null>(null);
  const [activeTab, setActiveTab] = useState<'posting' | 'approval' | 'active'>('approval');

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Peralatan" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola peralatan.</Text></View>
      </MainThemeLayout>
    );
  }

  const pendingLoans = (loans || []).filter((l: any) => l.status === 'pending');
  const activeBorrowLoans = (loans || []).filter((l: any) =>
    l.status === 'approved' || l.status === 'borrowed'
  );

  const onAdjustStock = async (item: any, delta: number) => {
    const current = Number(stockDrafts[item.id] ?? item.availableStock ?? 0);
    const next = Math.max(0, Math.min(Number(item.totalStock || 0), current + delta));
    setStockDrafts((prev) => ({ ...prev, [item.id]: String(next) }));
    try {
      await updateEquipment.mutateAsync({ id: item.id, data: { available_stock: next } });
    } catch {
      Alert.alert('Gagal', 'Tidak dapat update stok saat ini.');
    }
  };

  const toPickedPhoto = (asset: ImagePicker.ImagePickerAsset): PickedPhoto => {
    const fallbackName = `equipment_${Date.now()}.jpg`;
    return {
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || fallbackName,
    };
  };

  const onPickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin dibutuhkan', 'Mohon izinkan akses kamera terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.length) return;
    setNewPhoto(toPickedPhoto(result.assets[0]));
  };

  const onPickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin dibutuhkan', 'Mohon izinkan akses galeri terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.length) return;
    setNewPhoto(toPickedPhoto(result.assets[0]));
  };

  const onCreateEquipment = async () => {
    const total = Number(newTotalStock || '0');
    if (!newName.trim()) {
      Alert.alert('Validasi', 'Nama peralatan wajib diisi.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      Alert.alert('Validasi', 'Total stok harus lebih dari 0.');
      return;
    }
    try {
      let uploadedPhotoUrl: string | null = null;
      if (newPhoto) {
        const formData = new FormData();
        formData.append('file', {
          uri: newPhoto.uri,
          name: newPhoto.fileName,
          type: newPhoto.mimeType,
        } as any);
        const uploadRes = await uploadEquipmentPhoto.mutateAsync(formData);
        uploadedPhotoUrl = uploadRes?.data?.photo_url || null;
      }

      await createEquipment.mutateAsync({
        name: newName.trim(),
        category: newCategory,
        description: newDescription.trim() || null,
        photo_url: uploadedPhotoUrl,
        total_stock: total,
        available_stock: total,
        condition: 'good',
      });
      setNewName('');
      setNewDescription('');
      setNewPhoto(null);
      setNewTotalStock('1');
      setNewCategory('kesehatan');
      Alert.alert('Berhasil', 'Peralatan baru berhasil ditambahkan.');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menambah peralatan.');
    }
  };

  return (
    <MainThemeLayout
      title="Manajemen Peralatan"
      subtitle={`${pendingLoans.length} menunggu approval · ${activeBorrowLoans.length} aktif`}
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'posting' && styles.tabBtnActive]}
            onPress={() => setActiveTab('posting')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, activeTab === 'posting' && styles.tabBtnTextActive]}>
              Posting Barang
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'approval' && styles.tabBtnActive]}
            onPress={() => setActiveTab('approval')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, activeTab === 'approval' && styles.tabBtnTextActive]}>
              Approve Peminjaman
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>
              Sedang Dipinjam
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'posting' && (
          <>
            <Text style={styles.sectionSmall}>Tambah Peralatan</Text>
            <View style={styles.createCard}>
              <TextInput
                style={styles.formInput}
                placeholder="Nama peralatan"
                placeholderTextColor={colors.gray[400]}
                value={newName}
                onChangeText={setNewName}
              />
              <View style={styles.categoryRow}>
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryChip, newCategory === category && styles.categoryChipActive]}
                    onPress={() => setNewCategory(category)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.categoryChipText, newCategory === category && styles.categoryChipTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="Total stok"
                placeholderTextColor={colors.gray[400]}
                keyboardType="number-pad"
                value={newTotalStock}
                onChangeText={(txt) => setNewTotalStock(txt.replace(/[^0-9]/g, ''))}
              />
              <View style={styles.photoActionRow}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={onPickFromCamera} activeOpacity={0.85}>
                  <Camera size={15} color={colors.primary[700]} />
                  <Text style={styles.photoActionText}>Ambil Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={onPickFromLibrary} activeOpacity={0.85}>
                  <ImageIcon size={15} color={colors.primary[700]} />
                  <Text style={styles.photoActionText}>Pilih Galeri</Text>
                </TouchableOpacity>
              </View>
              {newPhoto ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: newPhoto.uri }} style={styles.previewImage} />
                  <TouchableOpacity onPress={() => setNewPhoto(null)}>
                    <Text style={styles.previewRemove}>Hapus foto</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TextInput
                style={[styles.formInput, { minHeight: 70 }]}
                placeholder="Deskripsi (opsional)"
                placeholderTextColor={colors.gray[400]}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.createBtn, (createEquipment.isPending || uploadEquipmentPhoto.isPending) && { opacity: 0.75 }]}
                onPress={onCreateEquipment}
                disabled={createEquipment.isPending || uploadEquipmentPhoto.isPending}
                activeOpacity={0.85}
              >
                {(createEquipment.isPending || uploadEquipmentPhoto.isPending) ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Plus size={15} color={colors.white} />
                    <Text style={styles.createBtnText}>Tambah Peralatan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionSmall, { marginTop: 12 }]}>Update Ketersediaan Barang</Text>
            {eqLoading ? (
              <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
            ) : (
              <FlatList
                data={equipment || []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 90 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const draft = stockDrafts[item.id] ?? String(item.availableStock ?? 0);
                  return (
                    <View style={styles.stockCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Package size={16} color={colors.primary[700]} />
                        <Text style={styles.stockName}>{item.name}</Text>
                      </View>
                      <Text style={styles.stockMeta}>Tersedia {draft} / Total {item.totalStock}</Text>
                      <View style={styles.stockActionRow}>
                        <TouchableOpacity style={styles.stockBtn} onPress={() => onAdjustStock(item, -1)}><Minus size={14} color={colors.primary[700]} /></TouchableOpacity>
                        <TextInput
                          style={styles.stockInput}
                          keyboardType="number-pad"
                          value={draft}
                          onChangeText={(txt) => setStockDrafts((prev) => ({ ...prev, [item.id]: txt.replace(/[^0-9]/g, '') }))}
                          onBlur={async () => {
                            const parsed = Math.max(0, Math.min(Number(item.totalStock || 0), Number(stockDrafts[item.id] ?? item.availableStock ?? 0)));
                            setStockDrafts((prev) => ({ ...prev, [item.id]: String(parsed) }));
                            await updateEquipment.mutateAsync({ id: item.id, data: { available_stock: parsed } });
                          }}
                        />
                        <TouchableOpacity style={styles.stockBtn} onPress={() => onAdjustStock(item, +1)}><Plus size={14} color={colors.primary[700]} /></TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </>
        )}

        {activeTab === 'approval' && (
          <>
            <Text style={styles.sectionSmall}>Request Peminjaman</Text>
            {loanLoading ? (
              <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
            ) : (
              <FlatList
                data={pendingLoans}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 90 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View style={styles.loanRequestCard}>
                    <Text style={styles.loanRequestTitle}>{item.equipment?.name || 'Peralatan'}</Text>
                    <Text style={styles.loanRequestMeta}>{item.borrowerName} · {item.borrowerPhone}</Text>
                    <Text style={styles.loanRequestMeta}>
                      {formatLoanDateRange(item.borrowDate, item.returnDate)}
                    </Text>
                    {item.borrowLocation ? <Text style={styles.loanRequestMeta}>Lokasi: {item.borrowLocation}</Text> : null}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn, (rejectLoan.isPending || approveLoan.isPending) && { opacity: 0.7 }]}
                        disabled={rejectLoan.isPending || approveLoan.isPending}
                        onPress={async () => {
                          try {
                            await rejectLoan.mutateAsync(item.id);
                            refetch();
                          } catch (err: any) {
                            Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menolak request saat ini.');
                          }
                        }}
                      >
                        <XCircle size={15} color={colors.error[600]} />
                        <Text style={styles.rejectText}>Tolak</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn, (approveLoan.isPending || rejectLoan.isPending) && { opacity: 0.7 }]}
                        disabled={approveLoan.isPending || rejectLoan.isPending}
                        onPress={async () => {
                          try {
                            await approveLoan.mutateAsync(item.id);
                            refetch();
                          } catch (err: any) {
                            Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyetujui request saat ini.');
                          }
                        }}
                      >
                        <CheckCircle2 size={15} color={colors.success[700]} />
                        <Text style={styles.approveText}>Setujui</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada request pending.</Text>}
              />
            )}
          </>
        )}

        {activeTab === 'active' && (
          <>
            <Text style={styles.sectionSmall}>Barang Dipinjam Saat Ini</Text>
            {loanLoading ? (
              <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
            ) : (
              <FlatList
                data={activeBorrowLoans}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 90 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View style={styles.loanRequestCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.loanRequestTitle}>{item.equipment?.name || 'Peralatan'}</Text>
                      <Text style={[styles.status, item.status === 'borrowed' ? styles.statusNonPending : styles.statusPending]}>
                        {item.status === 'borrowed' ? 'Dipinjam' : 'Disetujui'}
                      </Text>
                    </View>
                    <Text style={styles.loanRequestMeta}>Peminjam: {item.borrowerName} · {item.borrowerPhone}</Text>
                    <Text style={styles.loanRequestMeta}>
                      Durasi: {formatLoanDateRange(item.borrowDate, item.returnDate)}
                    </Text>
                    {item.borrowLocation ? <Text style={styles.loanRequestMeta}>Lokasi: {item.borrowLocation}</Text> : null}

                    {item.status === 'approved' ? (
                      <TouchableOpacity
                        style={[styles.completeBtn, markLoanBorrowed.isPending && { opacity: 0.7 }]}
                        disabled={markLoanBorrowed.isPending}
                        onPress={async () => {
                          try {
                            await markLoanBorrowed.mutateAsync(item.id);
                            refetch();
                          } catch (err: any) {
                            Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat mengubah status dipinjam.');
                          }
                        }}
                      >
                        {markLoanBorrowed.isPending ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <Flag size={15} color={colors.white} />
                            <Text style={styles.completeText}>Tandai Sedang Dipinjam</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.completeBtn, markLoanReturned.isPending && { opacity: 0.7 }]}
                        disabled={markLoanReturned.isPending}
                        onPress={async () => {
                          try {
                            await markLoanReturned.mutateAsync(item.id);
                            refetch();
                          } catch (err: any) {
                            Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat konfirmasi pengembalian.');
                          }
                        }}
                      >
                        {markLoanReturned.isPending ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <CheckCircle2 size={15} color={colors.white} />
                            <Text style={styles.completeText}>Konfirmasi Dikembalikan</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada barang yang sedang dipinjam.</Text>}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </MainThemeLayout>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[600],
    textAlign: 'center',
  },
  tabBtnTextActive: {
    color: colors.white,
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
  sectionSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gray[700],
    marginBottom: 8,
  },
  createCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.gray[800],
    backgroundColor: colors.white,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  categoryChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[600],
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[700],
  },
  previewWrap: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  previewRemove: {
    fontSize: 12,
    color: colors.error[600],
    fontWeight: '700',
  },
  createBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  loanRequestCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 8,
  },
  loanRequestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  loanRequestMeta: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 2,
  },
  donationProofWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 8,
    backgroundColor: colors.white,
    gap: 6,
  },
  donationProofImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  stockCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 8,
  },
  stockName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[800],
  },
  stockMeta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.gray[500],
  },
  stockActionRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[800],
    backgroundColor: colors.white,
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
  pickupTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupTypeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  pickupPreviewImage: {
    height: 150,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: colors.gray[100],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  rejectReasonWrap: {
    marginTop: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[100],
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  rejectReasonInput: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.gray[800],
    textAlignVertical: 'top',
    backgroundColor: colors.white,
  },
  rejectReasonActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rejectCancelBtn: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  rejectCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  rejectSubmitBtn: {
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[600],
  },
  rejectSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
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
  completeBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
