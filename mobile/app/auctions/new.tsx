import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainThemeLayout } from '@/components/ui';
import { Camera, Image as ImageIcon, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useCreateAuction, useUploadAuctionPhoto } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

function formatRupiahInput(raw: string) {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function NewAuctionScreen() {
  const user = useAuthStore((state) => state.user);
  const canManage = ['admin', 'pengurus'].includes(user?.role || '');

  const insets = useSafeAreaInsets();
  const createAuction = useCreateAuction();
  const uploadPhoto = useUploadAuctionPhoto();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);

  const isSubmitting = createAuction.isPending || uploadPhoto.isPending;

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin kamera dibutuhkan', 'Aktifkan izin kamera terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: false });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `auction-camera-${Date.now()}.jpg`,
    });
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin galeri dibutuhkan', 'Aktifkan izin galeri terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `auction-gallery-${Date.now()}.jpg`,
    });
  };

  const submit = async () => {
    if (!canManage) {
      Alert.alert('Akses ditolak', 'Hanya admin/pengurus yang dapat menambah barang lelang.');
      return;
    }
    const price = Number(startingPrice.replace(/\./g, ''));
    if (title.trim().length < 3) {
      Alert.alert('Nama barang belum valid', 'Masukkan nama barang minimal 3 karakter.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Tawaran awal belum valid', 'Masukkan nominal tawaran awal yang benar.');
      return;
    }
    if (!photo) {
      Alert.alert('Foto belum ada', 'Upload foto barang yang akan dilelang.');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', {
        uri: photo.uri,
        name: photo.fileName,
        type: photo.mimeType,
      } as any);
      const uploaded = await uploadPhoto.mutateAsync(form);
      const photoUrl = uploaded?.data?.photo_url;

      await createAuction.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        starting_price: price,
        min_increment: 5000,
        image_url: photoUrl,
      });

      Alert.alert('Berhasil', 'Barang lelang berhasil ditambahkan.', [
        { text: 'OK', onPress: () => router.replace('/auctions') },
      ]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? String(d)).join(', ')
        : 'Tidak dapat menambahkan barang lelang.';
      Alert.alert('Gagal', message);
    }
  };

  return (
    <MainThemeLayout
      title="Tambah Barang Lelang"
      subtitle="Form upload barang lelang"
      showBackButton
      onBackPress={() => router.back()}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}>
          <Text style={styles.label}>Foto Barang</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera}>
              <Camera size={16} color={colors.primary[700]} />
              <Text style={styles.photoBtnText}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <ImageIcon size={16} color={colors.primary[700]} />
              <Text style={styles.photoBtnText}>Galeri</Text>
            </TouchableOpacity>
          </View>

          {photo ? <Image source={{ uri: photo.uri }} style={styles.previewImage} /> : null}

          <Text style={styles.label}>Nama Barang</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Sepeda Lipat"
            placeholderTextColor={colors.gray[400]}
          />

          <Text style={styles.label}>Tawaran Awal (Rp)</Text>
          <TextInput
            style={styles.input}
            value={startingPrice}
            onChangeText={(text) => setStartingPrice(formatRupiahInput(text))}
            keyboardType="number-pad"
            placeholder="Contoh: 250.000"
            placeholderTextColor={colors.gray[400]}
          />

          <Text style={styles.label}>Deskripsi Barang</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholder="Jelaskan kondisi barang lelang"
            placeholderTextColor={colors.gray[400]}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} onPress={submit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitText}>Simpan Barang Lelang</Text>
                <ChevronRight size={16} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  previewImage: {
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.gray[900],
  },
  multilineInput: { height: 100, paddingTop: 10 },
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
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitText: { fontSize: 14, fontWeight: '800', color: colors.white },
});
