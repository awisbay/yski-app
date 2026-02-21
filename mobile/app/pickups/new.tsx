import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Camera, Image as ImageIcon, ChevronLeft, ChevronRight, Wallet, Package } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { MapPicker } from '@/components/MapPicker';
import { useAuthStore } from '@/stores/authStore';
import { useCreatePickup, useUploadPickupPhoto } from '@/hooks';
import { colors } from '@/constants/colors';

type PickupType = 'zakat' | 'jelantah' | 'sedekah' | 'barang_bekas' | 'lain_lain';

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

const PICKUP_TYPES: Array<{ key: PickupType; label: string; icon: any; color: string; isMoney: boolean }> = [
  { key: 'zakat', label: 'Zakat', icon: Wallet, color: '#F59E0B', isMoney: true },
  { key: 'jelantah', label: 'Jelantah', icon: Package, color: '#0EA5E9', isMoney: false },
  { key: 'sedekah', label: 'Sedekah', icon: Wallet, color: '#22C55E', isMoney: true },
  { key: 'barang_bekas', label: 'Barang Bekas', icon: Package, color: '#6366F1', isMoney: false },
  { key: 'lain_lain', label: 'Lain-lain', icon: Package, color: '#14B8A6', isMoney: false },
];

function formatRupiahInput(raw: string) {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function NewPickupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const createPickup = useCreatePickup();
  const uploadPickupPhoto = useUploadPickupPhoto();

  const [step, setStep] = useState(1);
  const [pickupType, setPickupType] = useState<PickupType>('zakat');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [requesterName, setRequesterName] = useState(user?.full_name || '');
  const [requesterPhone, setRequesterPhone] = useState(user?.phone || '');

  const [amountInput, setAmountInput] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [itemPhoto, setItemPhoto] = useState<PickedPhoto | null>(null);

  const currentType = useMemo(
    () => PICKUP_TYPES.find((t) => t.key === pickupType) || PICKUP_TYPES[0],
    [pickupType]
  );

  const isSubmitting = createPickup.isPending || uploadPickupPhoto.isPending;

  const handlePickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin kamera dibutuhkan', 'Aktifkan izin kamera untuk mengambil foto barang.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: false });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setItemPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `pickup-camera-${Date.now()}.jpg`,
    });
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin galeri dibutuhkan', 'Aktifkan izin galeri untuk memilih foto barang.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setItemPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `pickup-gallery-${Date.now()}.jpg`,
    });
  };

  const validateStep = () => {
    if (step === 1) return true;
    if (step === 2) {
      if (!pickupAddress || pickupLat == null || pickupLng == null) {
        Alert.alert('Lokasi belum lengkap', 'Pilih lokasi penjemputan dari peta terlebih dahulu.');
        return false;
      }
      if (!requesterName.trim() || requesterName.trim().length < 3) {
        Alert.alert('Nama belum valid', 'Isi nama pemohon minimal 3 karakter.');
        return false;
      }
      if (!requesterPhone.trim() || requesterPhone.replace(/[^0-9]/g, '').length < 10) {
        Alert.alert('No HP belum valid', 'Isi nomor HP minimal 10 digit angka.');
        return false;
      }
      return true;
    }

    if (currentType.isMoney) {
      const amount = Number(amountInput.replace(/\./g, ''));
      if (!Number.isFinite(amount) || amount <= 0) {
        Alert.alert('Nominal belum valid', 'Masukkan nominal zakat/sedekah yang valid.');
        return false;
      }
    } else {
      if (!itemPhoto) {
        Alert.alert('Foto belum ada', 'Unggah foto barang/jelantah terlebih dahulu.');
        return false;
      }
      if (!itemDescription.trim()) {
        Alert.alert('Keterangan belum lengkap', 'Tambahkan keterangan barang (contoh: jelantah 5 liter, TV 1 unit).');
        return false;
      }
    }

    return true;
  };

  const handleNextOrSubmit = async () => {
    if (!validateStep()) return;

    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }

    try {
      let itemPhotoUrl: string | null = null;
      if (!currentType.isMoney && itemPhoto) {
        const form = new FormData();
        form.append('file', {
          uri: itemPhoto.uri,
          name: itemPhoto.fileName,
          type: itemPhoto.mimeType,
        } as any);
        const uploaded = await uploadPickupPhoto.mutateAsync(form);
        itemPhotoUrl = uploaded?.data?.photo_url || null;
      }

      await createPickup.mutateAsync({
        pickup_type: pickupType,
        requester_name: requesterName.trim(),
        requester_phone: requesterPhone.replace(/[^0-9]/g, ''),
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        amount: currentType.isMoney ? Number(amountInput.replace(/\./g, '')) : null,
        item_description: currentType.isMoney ? null : itemDescription.trim(),
        item_photo_url: currentType.isMoney ? null : itemPhotoUrl,
        notes: notes.trim() || null,
      });

      Alert.alert('Berhasil', 'Permintaan penjemputan sudah dikirim. Tim kami akan memprosesnya.', [
        { text: 'OK', onPress: () => router.replace('/pickups') },
      ]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? String(d)).join(', ')
        : 'Tidak dapat mengirim permintaan penjemputan.';
      Alert.alert('Gagal', message);
    }
  };

  return (
    <MainThemeLayout
      title="Penjemputan Donasi"
      subtitle="Isi data penjemputan dengan cepat"
      showBackButton
      onBackPress={() => {
        if (step > 1) {
          setStep((prev) => prev - 1);
          return;
        }
        router.back();
      }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepRow}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= n && styles.stepCircleActive]}>
                  <Text style={[styles.stepLabel, step >= n && styles.stepLabelActive]}>{n}</Text>
                </View>
                {n < 3 ? <View style={[styles.stepLine, step > n && styles.stepLineActive]} /> : null}
              </View>
            ))}
          </View>

          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Pilih Jenis Penjemputan</Text>
              <View style={styles.typeGrid}>
                {PICKUP_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = pickupType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      activeOpacity={0.85}
                      style={[
                        styles.typeCard,
                        isActive && { borderColor: type.color, backgroundColor: `${type.color}10` },
                      ]}
                      onPress={() => setPickupType(type.key)}
                    >
                      <View style={[styles.typeIconWrap, { backgroundColor: `${type.color}20` }]}>
                        <Icon size={20} color={type.color} />
                      </View>
                      <Text style={styles.typeName}>{type.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Lokasi Penjemputan</Text>
              <TouchableOpacity
                style={styles.mapButton}
                activeOpacity={0.85}
                onPress={() => setShowMapPicker(true)}
              >
                <MapPin size={17} color={colors.primary[700]} />
                <Text style={styles.mapButtonText}>{pickupAddress ? 'Ubah Lokasi di Peta' : 'Cari Lokasi di Peta'}</Text>
              </TouchableOpacity>

              <View style={styles.locationCard}>
                <Text style={styles.locationLabel}>Alamat Terpilih</Text>
                <Text style={styles.locationValue}>{pickupAddress || 'Belum memilih lokasi.'}</Text>
              </View>

              <Text style={styles.inputLabel}>Nama Pemohon</Text>
              <TextInput
                value={requesterName}
                onChangeText={setRequesterName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={colors.gray[400]}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Nomor HP</Text>
              <TextInput
                value={requesterPhone}
                onChangeText={(text) => setRequesterPhone(text.replace(/[^0-9]/g, ''))}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor={colors.gray[400]}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.helperText}>
                Gunakan pencarian lokasi seperti Google Maps, atau tekan tombol lokasi saat ini di peta untuk tag posisi Anda.
              </Text>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.sectionTitle}>Detail Penjemputan {currentType.label}</Text>

              {currentType.isMoney ? (
                <View>
                  <Text style={styles.inputLabel}>Nominal (Rp)</Text>
                  <TextInput
                    value={amountInput}
                    onChangeText={(text) => setAmountInput(formatRupiahInput(text))}
                    keyboardType="number-pad"
                    placeholder="Contoh: 100.000"
                    placeholderTextColor={colors.gray[400]}
                    style={styles.input}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Foto Barang</Text>
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.photoBtn} onPress={handlePickFromCamera}>
                      <Camera size={16} color={colors.primary[700]} />
                      <Text style={styles.photoBtnText}>Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtn} onPress={handlePickFromGallery}>
                      <ImageIcon size={16} color={colors.primary[700]} />
                      <Text style={styles.photoBtnText}>Galeri</Text>
                    </TouchableOpacity>
                  </View>

                  {itemPhoto ? <Image source={{ uri: itemPhoto.uri }} style={styles.previewImage} /> : null}

                  <Text style={styles.inputLabel}>Keterangan Barang</Text>
                  <TextInput
                    value={itemDescription}
                    onChangeText={setItemDescription}
                    placeholder="Contoh: Jelantah 5 liter, TV 1 unit, kipas 1 unit"
                    placeholderTextColor={colors.gray[400]}
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}

              <Text style={styles.inputLabel}>Catatan (Opsional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Catatan tambahan untuk tim penjemputan"
                placeholderTextColor={colors.gray[400]}
                style={[styles.input, styles.multilineInput]}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}> 
          <TouchableOpacity
            style={[styles.navBtn, styles.backBtn]}
            onPress={() => (step > 1 ? setStep((prev) => prev - 1) : router.back())}
            activeOpacity={0.85}
          >
            <ChevronLeft size={18} color={colors.primary[700]} />
            <Text style={styles.backText}>Kembali</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleNextOrSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.nextText}>{step < 3 ? 'Lanjut' : 'Submit Penjemputan'}</Text>
                <ChevronRight size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <MapPicker
        visible={showMapPicker}
        title="Lokasi Penjemputan"
        initialCoords={
          pickupLat != null && pickupLng != null
            ? { latitude: pickupLat, longitude: pickupLng }
            : undefined
        }
        onClose={() => setShowMapPicker(false)}
        onConfirm={(loc) => {
          setPickupAddress(loc.address);
          setPickupLat(loc.latitude);
          setPickupLng(loc.longitude);
          setShowMapPicker(false);
        }}
      />
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  stepCircleActive: { backgroundColor: colors.primary[600] },
  stepLabel: { fontSize: 12, fontWeight: '800', color: colors.gray[500] },
  stepLabelActive: { color: colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.gray[200], marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.primary[400] },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.gray[900], marginBottom: 12 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 12,
    gap: 10,
  },
  typeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: { fontSize: 13, fontWeight: '700', color: colors.gray[900] },

  mapButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mapButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary[700] },
  locationCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
  },
  locationLabel: { fontSize: 11, fontWeight: '700', color: colors.gray[500], marginBottom: 4 },
  locationValue: { fontSize: 13, color: colors.gray[800], lineHeight: 18 },
  helperText: { marginTop: 10, fontSize: 12, lineHeight: 18, color: colors.gray[500] },

  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.gray[600], marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    backgroundColor: colors.white,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.gray[900],
  },
  multilineInput: {
    height: 96,
    paddingTop: 10,
  },

  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: colors.gray[100],
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  nextBtn: {
    flex: 1.8,
    backgroundColor: colors.primary[600],
  },
  backText: { fontSize: 14, fontWeight: '700', color: colors.primary[700] },
  nextText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
