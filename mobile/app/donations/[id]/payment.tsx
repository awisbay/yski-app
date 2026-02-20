import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Upload, CircleCheckBig, Clock3 } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { useDonationDetail, useUploadDonationProof } from '@/hooks';
import { API_ORIGIN } from '@/constants/config';
import { colors } from '@/constants/colors';

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

function normalizeProofUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

export default function DonationPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const donationId = String(id || '');
  const { data: donation, isLoading } = useDonationDetail(donationId);
  const uploadProof = useUploadDonationProof();
  const [picked, setPicked] = useState<PickedPhoto | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);

  const amountText = useMemo(() => formatCurrency(Number(donation?.amount || 0)), [donation?.amount]);

  const pickFromCamera = async () => {
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
    const asset = result.assets[0];
    setPicked({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `proof_${Date.now()}.jpg`,
    });
  };

  const pickFromGallery = async () => {
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
    const asset = result.assets[0];
    setPicked({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `proof_${Date.now()}.jpg`,
    });
  };

  const submitProof = async () => {
    if (!donationId) return;
    if (!picked) {
      Alert.alert('Validasi', 'Pilih/ambil foto bukti transfer terlebih dahulu.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: picked.uri,
        name: picked.fileName,
        type: picked.mimeType,
      } as any);
      await uploadProof.mutateAsync({ id: donationId, formData });
      Alert.alert('Berhasil', 'Bukti transfer berhasil diupload dan menunggu verifikasi admin/pengurus.');
      router.replace('/donations');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Upload bukti transfer gagal.');
    }
  };

  return (
    <MainThemeLayout title="Konfirmasi Transfer" subtitle="Upload bukti pembayaran" showBackButton>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
        ) : !donation ? (
          <View style={styles.centered}><Text style={styles.emptyText}>Donasi tidak ditemukan.</Text></View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Instruksi Transfer</Text>
              <Text style={styles.amount}>{amountText}</Text>
              <Text style={styles.meta}>Kode: {donation.donationCode || donation.id}</Text>
              <View style={styles.bankBox}>
                <Text style={styles.bankTitle}>Transfer ke rekening yayasan</Text>
                <Text style={styles.bankText}>Bank Syariah Indonesia (BSI)</Text>
                <Text style={styles.bankText}>No. Rek: 1234567890</Text>
                <Text style={styles.bankText}>a.n. Yayasan Sahabat Khairat Indonesia</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              {donation.paymentStatus === 'paid' ? (
                <>
                  <CircleCheckBig size={16} color={colors.success[600]} />
                  <Text style={[styles.statusText, { color: colors.success[700] }]}>
                    Donasi anda Diterima, Jazakumullah khairan, Barakallahu Fiik
                  </Text>
                </>
              ) : donation.paymentStatus === 'cancelled' ? (
                <>
                  <Clock3 size={16} color={colors.error[600]} />
                  <Text style={[styles.statusText, { color: colors.error[700] }]}>
                    Donasi ditolak admin/pengurus
                  </Text>
                </>
              ) : (
                <>
                  <Clock3 size={16} color={colors.warning[600]} />
                  <Text style={[styles.statusText, { color: colors.warning[700] }]}>
                    Menunggu Konfirmasi
                  </Text>
                </>
              )}
            </View>

            {normalizeProofUrl(donation.proofUrl) ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: normalizeProofUrl(donation.proofUrl)! }} style={styles.previewImage} />
                <Text style={styles.previewLabel}>Bukti transfer yang sudah diupload</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera} activeOpacity={0.85}>
                <Camera size={15} color={colors.primary[700]} />
                <Text style={styles.actionText}>Ambil Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery} activeOpacity={0.85}>
                <ImageIcon size={15} color={colors.primary[700]} />
                <Text style={styles.actionText}>Pilih Galeri</Text>
              </TouchableOpacity>
            </View>

            {picked ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: picked.uri }} style={styles.previewImage} />
                <Text style={styles.previewLabel}>Preview bukti transfer baru</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, uploadProof.isPending && { opacity: 0.7 }]}
              onPress={submitProof}
              disabled={uploadProof.isPending}
              activeOpacity={0.85}
            >
              {uploadProof.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Upload size={16} color={colors.white} />
                  <Text style={styles.submitText}>Upload Bukti Transfer</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.gray[500] },
  scrollContent: { paddingBottom: 90, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 14,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.gray[900], marginBottom: 6 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.primary[700], marginBottom: 4 },
  meta: { fontSize: 12, color: colors.gray[500], marginBottom: 10 },
  bankBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    padding: 10,
    gap: 2,
  },
  bankTitle: { fontSize: 12, fontWeight: '700', color: colors.primary[700], marginBottom: 3 },
  bankText: { fontSize: 12, color: colors.gray[700] },
  statusRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  previewWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    padding: 10,
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  previewLabel: { fontSize: 12, color: colors.gray[500] },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  submitText: { fontSize: 14, fontWeight: '800', color: colors.white },
});
