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
import { Calendar, Clock, MapPin, Navigation2, CheckCircle2, XCircle, Flag, Package, Plus, Minus, Camera, Image as ImageIcon } from 'lucide-react-native';
import { MainThemeLayout, RoutePlaceholderScreen } from '@/components/ui';
import { useAllBookings, useApproveBooking, useRejectBooking, useUpdateBookingStatus } from '@/hooks';
import { useAllEquipmentLoans, useEquipmentList, useApproveLoan, useRejectLoan, useUpdateEquipment, useCreateEquipment, useUploadEquipmentPhoto } from '@/hooks';
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

function BookingManagementScreen() {
  const user = useAuthStore((state) => state.user);
  const isOperationalRole = ['admin', 'superadmin', 'pengurus', 'relawan'].includes(user?.role || '');

  const { data: bookings, isLoading, refetch } = useAllBookings();
  const approveMutation = useApproveBooking();
  const rejectMutation = useRejectBooking();
  const updateStatusMutation = useUpdateBookingStatus();

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
  const updateEquipment = useUpdateEquipment();
  const createEquipment = useCreateEquipment();
  const uploadEquipmentPhoto = useUploadEquipmentPhoto();
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<(typeof EQUIPMENT_CATEGORIES)[number]>('kesehatan');
  const [newTotalStock, setNewTotalStock] = useState('1');
  const [newDescription, setNewDescription] = useState('');
  const [newPhoto, setNewPhoto] = useState<PickedPhoto | null>(null);

  if (!canManage) {
    return (
      <MainThemeLayout title="Manajemen Peralatan" subtitle="Akses terbatas" showBackButton onBackPress={() => router.replace('/(admin)')}>
        <View style={styles.centered}><Text style={styles.emptyText}>Hanya admin/pengurus yang dapat mengelola peralatan.</Text></View>
      </MainThemeLayout>
    );
  }

  const pendingLoans = (loans || []).filter((l: any) => l.status === 'pending');

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
      subtitle={`${pendingLoans.length} request menunggu approval`}
      showBackButton
      onBackPress={() => router.replace('/(admin)')}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
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

        <Text style={styles.sectionSmall}>Request Peminjaman</Text>
        {loanLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
        ) : (
          <FlatList
            data={pendingLoans}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 260 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.loanRequestCard}>
                <Text style={styles.loanRequestTitle}>{item.equipment?.name || 'Peralatan'}</Text>
                <Text style={styles.loanRequestMeta}>{item.borrowerName} · {item.borrowerPhone}</Text>
                <Text style={styles.loanRequestMeta}>
                  {new Date(item.borrowDate).toLocaleDateString('id-ID')} - {new Date(item.returnDate).toLocaleDateString('id-ID')}
                </Text>
                {item.borrowLocation ? <Text style={styles.loanRequestMeta}>Lokasi: {item.borrowLocation}</Text> : null}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={async () => { await rejectLoan.mutateAsync(item.id); refetch(); }}>
                    <XCircle size={15} color={colors.error[600]} />
                    <Text style={styles.rejectText}>Tolak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={async () => { await approveLoan.mutateAsync(item.id); refetch(); }}>
                    <CheckCircle2 size={15} color={colors.success[700]} />
                    <Text style={styles.approveText}>Setujui</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada request pending.</Text>}
          />
        )}

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
