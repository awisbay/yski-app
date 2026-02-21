import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainThemeLayout } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useRequestLoan } from '@/hooks';
import { colors } from '@/constants/colors';

type LoanDurationMode = 'manual' | 'undetermined';

export default function EquipmentLoanScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const requestLoan = useRequestLoan();

  const [durationMode, setDurationMode] = useState<LoanDurationMode>('manual');
  const [durationDaysInput, setDurationDaysInput] = useState('7');
  const [notes, setNotes] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const borrowDate = useMemo(() => new Date(), []);
  const returnDate = useMemo(() => {
    if (durationMode !== 'manual') return null;
    const durationDays = Number(durationDaysInput);
    if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d;
  }, [durationMode, durationDaysInput]);

  const tagCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin lokasi dibutuhkan', 'Aktifkan izin lokasi untuk menandai lokasi peminjam.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });

      const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const first = geocoded[0];
      const formatted = first
        ? [first.street, first.subregion, first.city, first.region].filter(Boolean).join(', ')
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLocationAddress(formatted);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengambil lokasi saat ini.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!locationAddress || !coords) {
      Alert.alert('Lokasi belum ditandai', 'Silakan tag lokasi peminjam terlebih dahulu.');
      return;
    }
    if (durationMode === 'manual') {
      const durationDays = Number(durationDaysInput);
      if (!Number.isFinite(durationDays) || durationDays <= 0) {
        Alert.alert('Durasi tidak valid', 'Masukkan jumlah hari peminjaman minimal 1 hari.');
        return;
      }
      if (!returnDate) {
        Alert.alert('Durasi tidak valid', 'Tanggal kembali tidak dapat dihitung. Periksa input durasi.');
        return;
      }
    }

    try {
      await requestLoan.mutateAsync({
        equipmentId: id,
        data: {
          equipment_id: id,
          borrower_name: user?.full_name || '-',
          borrower_phone: user?.phone || '-',
          borrow_date: borrowDate.toISOString(),
          return_date: returnDate ? returnDate.toISOString() : null,
          borrow_location: locationAddress,
          borrow_lat: String(coords.lat),
          borrow_lng: String(coords.lng),
          notes,
        },
      });
      Alert.alert('Berhasil', 'Request peminjaman sudah dikirim untuk dikonfirmasi admin/pengurus.');
      router.replace('/equipment');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Request peminjaman gagal diproses.');
    }
  };

  return (
    <MainThemeLayout title="Form Peminjaman" subtitle="Lengkapi data peminjaman" showBackButton>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Text style={styles.label}>Durasi Peminjaman</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.85}
            onPress={() => setDurationMode('manual')}
          >
            <View style={[styles.radioOuter, durationMode === 'manual' && styles.radioOuterActive]}>
              {durationMode === 'manual' ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioLabel}>Tentukan durasi (hari)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.85}
            onPress={() => setDurationMode('undetermined')}
          >
            <View style={[styles.radioOuter, durationMode === 'undetermined' && styles.radioOuterActive]}>
              {durationMode === 'undetermined' ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioLabel}>Belum ditentukan</Text>
          </TouchableOpacity>
        </View>

        {durationMode === 'manual' && (
          <TextInput
            style={styles.input}
            value={durationDaysInput}
            onChangeText={(text) => setDurationDaysInput(text.replace(/[^0-9]/g, ''))}
            placeholder="Masukkan berapa hari"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
          />
        )}

        <View style={styles.dateCard}>
          <Text style={styles.dateText}>Mulai: {borrowDate.toLocaleDateString('id-ID')}</Text>
          <Text style={styles.dateText}>
            Kembali: {returnDate ? returnDate.toLocaleDateString('id-ID') : 'Belum ditentukan'}
          </Text>
        </View>

        <Text style={styles.label}>Lokasi Peminjam</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={tagCurrentLocation} activeOpacity={0.85}>
          {isLocating ? <ActivityIndicator color={colors.primary[600]} /> : <Text style={styles.locationBtnText}>Tag Lokasi Saat Ini</Text>}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={locationAddress}
          onChangeText={setLocationAddress}
          placeholder="Lokasi akan muncul di sini"
          placeholderTextColor={colors.gray[400]}
          multiline
        />

        <Text style={styles.label}>Catatan (Opsional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 90 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Contoh: dipakai untuk kegiatan sosial RT"
          placeholderTextColor={colors.gray[400]}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, requestLoan.isPending && { opacity: 0.75 }]}
          onPress={handleSubmit}
          disabled={requestLoan.isPending}
          activeOpacity={0.85}
        >
          {requestLoan.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Submit Peminjaman</Text>}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 28 },
  label: { fontSize: 13, fontWeight: '700', color: colors.gray[700], marginBottom: 8, marginTop: 8 },
  radioGroup: {
    gap: 10,
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOuterActive: {
    borderColor: colors.primary[600],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[600],
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
  dateCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
    marginBottom: 8,
    gap: 6,
  },
  dateText: { fontSize: 13, color: colors.gray[700], fontWeight: '600' },
  locationBtn: {
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  locationBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary[700] },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.gray[800],
    backgroundColor: colors.white,
    marginBottom: 8,
    minHeight: 60,
  },
  submitBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '800', color: colors.white },
});
