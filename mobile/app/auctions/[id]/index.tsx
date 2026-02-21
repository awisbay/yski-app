import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Gavel, Camera, Image as ImageIcon } from 'lucide-react-native';
import {
  useAuctionDetail,
  usePlaceBid,
  useApproveAuctionBid,
  useUploadAuctionPaymentProof,
  useVerifyAuctionPayment,
} from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatRupiahInput(raw: string) {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

type PickedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export default function AuctionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const { data: item, isLoading, isError } = useAuctionDetail(id || '');
  const placeBid = usePlaceBid();
  const approveBid = useApproveAuctionBid();
  const uploadProof = useUploadAuctionPaymentProof();
  const verifyPayment = useVerifyAuctionPayment();

  const [bidInput, setBidInput] = useState('');
  const [paymentPhoto, setPaymentPhoto] = useState<PickedPhoto | null>(null);

  const isManager = ['admin', 'pengurus'].includes(user?.role || '');
  const isWinner = !!item && !!user && item.winnerId === user.id;
  const canBid = !!item && ['ready', 'bidding'].includes(item.status);

  const minBid = useMemo(() => {
    if (!item) return 0;
    return Number(item.currentPrice || 0) + Number(item.minIncrement || 0);
  }, [item]);

  const onPlaceBid = async () => {
    if (!item) return;
    const amount = Number(bidInput.replace(/\./g, ''));
    if (!Number.isFinite(amount) || amount < minBid) {
      Alert.alert('Nominal bid tidak valid', `Minimal bid ${formatCurrency(minBid)}.`);
      return;
    }

    try {
      await placeBid.mutateAsync({ itemId: item.id, amount });
      setBidInput('');
    } catch (err: any) {
      Alert.alert('Gagal bid', err?.response?.data?.detail || 'Tidak dapat mengajukan bid.');
    }
  };

  const onApproveBid = async (bidId: string) => {
    if (!item) return;
    try {
      await approveBid.mutateAsync({ itemId: item.id, bidId });
      Alert.alert('Berhasil', 'Bid disetujui. Pemenang diarahkan ke pembayaran.');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat menyetujui bid.');
    }
  };

  const pickProofFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin kamera dibutuhkan', 'Aktifkan izin kamera terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.75 });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setPaymentPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `auction-payment-camera-${Date.now()}.jpg`,
    });
  };

  const pickProofFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin galeri dibutuhkan', 'Aktifkan izin galeri terlebih dahulu.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.75 });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setPaymentPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `auction-payment-gallery-${Date.now()}.jpg`,
    });
  };

  const submitPaymentProof = async () => {
    if (!item || !paymentPhoto) {
      Alert.alert('Bukti belum dipilih', 'Pilih foto bukti transfer terlebih dahulu.');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', {
        uri: paymentPhoto.uri,
        name: paymentPhoto.fileName,
        type: paymentPhoto.mimeType,
      } as any);
      await uploadProof.mutateAsync({ itemId: item.id, formData: form });
      setPaymentPhoto(null);
      Alert.alert('Berhasil', 'Bukti pembayaran berhasil diupload, menunggu konfirmasi admin/pengurus.');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat upload bukti pembayaran.');
    }
  };

  const onVerifyPayment = async (status: 'paid' | 'rejected') => {
    if (!item) return;
    try {
      await verifyPayment.mutateAsync({ itemId: item.id, status });
      Alert.alert('Sukses', status === 'paid' ? 'Pembayaran dikonfirmasi, barang masuk daftar terjual.' : 'Pembayaran ditolak.');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat memverifikasi pembayaran.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Lelang</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.panel}>
        {isLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary[600]} /></View>
        ) : isError || !item ? (
          <View style={styles.center}><Text style={styles.errorText}>Barang lelang tidak ditemukan.</Text></View>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 26 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.imageWrap}>
              {item.images?.length > 0 && item.images[0]?.imageUrl ? (
                <Image source={{ uri: item.images[0].imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}><Gavel size={32} color={colors.primary[400]} /></View>
              )}
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description || 'Tanpa deskripsi barang.'}</Text>

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Penawaran Saat Ini</Text>
              <Text style={styles.priceValue}>{formatCurrency(item.currentPrice)}</Text>
              <Text style={styles.priceMeta}>Tawaran awal {formatCurrency(item.startingPrice)} · Kenaikan min. {formatCurrency(item.minIncrement)}</Text>
            </View>

            {canBid ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Ajukan Bid</Text>
                <TextInput
                  style={styles.input}
                  value={bidInput}
                  onChangeText={(text) => setBidInput(formatRupiahInput(text))}
                  keyboardType="number-pad"
                  placeholder={`Minimal ${formatCurrency(minBid)}`}
                  placeholderTextColor={colors.gray[400]}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={onPlaceBid} disabled={placeBid.isPending}>
                  {placeBid.isPending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.primaryBtnText}>Ajukan Bid</Text>}
                </TouchableOpacity>
              </View>
            ) : null}

            {isWinner && item.status === 'payment_pending' && item.paymentStatus !== 'paid' ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Pembayaran Pemenang</Text>
                <Text style={styles.infoText}>Silakan transfer manual lalu upload bukti pembayaran.</Text>
                <View style={styles.uploadRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={pickProofFromCamera}>
                    <Camera size={15} color={colors.primary[700]} />
                    <Text style={styles.secondaryBtnText}>Kamera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={pickProofFromGallery}>
                    <ImageIcon size={15} color={colors.primary[700]} />
                    <Text style={styles.secondaryBtnText}>Galeri</Text>
                  </TouchableOpacity>
                </View>
                {paymentPhoto ? <Image source={{ uri: paymentPhoto.uri }} style={styles.previewProof} /> : null}
                <TouchableOpacity style={styles.primaryBtn} onPress={submitPaymentProof} disabled={uploadProof.isPending}>
                  {uploadProof.isPending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.primaryBtnText}>Upload Bukti Pembayaran</Text>}
                </TouchableOpacity>
              </View>
            ) : null}

            {isManager && item.status === 'bidding' ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Approve Bid</Text>
                {item.bids?.length ? item.bids.map((bid: any) => (
                  <View key={bid.id} style={styles.bidRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bidName}>{bid.bidderName || 'User'}</Text>
                      <Text style={styles.bidAmount}>{formatCurrency(Number(bid.amount || 0))}</Text>
                    </View>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => onApproveBid(bid.id)}>
                      <Text style={styles.approveBtnText}>Setujui</Text>
                    </TouchableOpacity>
                  </View>
                )) : <Text style={styles.infoText}>Belum ada bid.</Text>}
              </View>
            ) : null}

            {isManager && item.status === 'payment_pending' ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Konfirmasi Pembayaran</Text>
                {item.paymentProofUrl ? <Image source={{ uri: item.paymentProofUrl }} style={styles.previewProof} /> : <Text style={styles.infoText}>Belum ada bukti transfer.</Text>}
                <View style={styles.uploadRow}>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => onVerifyPayment('paid')} disabled={verifyPayment.isPending}>
                    <Text style={styles.primaryBtnText}>Konfirmasi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => onVerifyPayment('rejected')} disabled={verifyPayment.isPending}>
                    <Text style={styles.rejectBtnText}>Tolak</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[700] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.white },
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.gray[700], fontSize: 14 },
  imageWrap: { height: 220, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.gray[100] },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.gray[900] },
  desc: { fontSize: 13, color: colors.gray[600], lineHeight: 20 },
  priceBox: {
    borderWidth: 1,
    borderColor: colors.success[100],
    backgroundColor: colors.success[50],
    borderRadius: 12,
    padding: 12,
  },
  priceLabel: { fontSize: 11, color: colors.success[700], fontWeight: '700' },
  priceValue: { fontSize: 22, fontWeight: '800', color: colors.success[700], marginTop: 4 },
  priceMeta: { fontSize: 12, color: colors.gray[600], marginTop: 4 },

  block: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    gap: 10,
  },
  blockTitle: { fontSize: 14, fontWeight: '800', color: colors.gray[900] },
  infoText: { fontSize: 12, color: colors.gray[600] },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.gray[900],
  },
  primaryBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: colors.white },
  secondaryBtn: {
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
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary[700] },
  uploadRow: { flexDirection: 'row', gap: 8 },
  previewProof: {
    height: 170,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 10,
    padding: 10,
  },
  bidName: { fontSize: 12, fontWeight: '700', color: colors.gray[700] },
  bidAmount: { fontSize: 14, fontWeight: '800', color: colors.gray[900], marginTop: 2 },
  approveBtn: {
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.success[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  rejectBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '800', color: colors.error[700] },
});
