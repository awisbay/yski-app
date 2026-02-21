import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MapPin, Clock, Wallet, Package, Phone, User } from 'lucide-react-native';
import { usePickupDetail } from '@/hooks';
import { colors } from '@/constants/colors';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  awaiting_confirmation: 'Dikonfirmasi Lagi Nanti',
  accepted: 'Jemput Sekarang',
  scheduled: 'Terjadwal',
  in_progress: 'Dalam Perjalanan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.warning[600],
  awaiting_confirmation: colors.warning[700],
  accepted: colors.primary[600],
  scheduled: colors.primary[600],
  in_progress: colors.secondary[600],
  completed: colors.success[600],
  cancelled: colors.error[600],
};

const MONEY_TYPES = ['zakat', 'sedekah'];

function formatCurrency(value?: number | null) {
  if (value == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value));
}

export default function PickupDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pickup, isLoading, isError } = usePickupDetail(id || '');

  const isMoneyType = MONEY_TYPES.includes(String(pickup?.pickupType || ''));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Penjemputan</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.panel}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary[600]} />
            <Text style={styles.loadingText}>Memuat detail penjemputan...</Text>
          </View>
        ) : isError || !pickup ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorTitle}>Detail penjemputan tidak ditemukan</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
              <View style={styles.statusCard}>
                <Text style={styles.pickupCode}>#{String(pickup.requestCode || pickup.id).slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[pickup.status] || colors.gray[500]}20` }]}> 
                  <Text style={[styles.statusText, { color: STATUS_COLOR[pickup.status] || colors.gray[600] }]}> 
                    {STATUS_LABEL[pickup.status] || pickup.status}
                  </Text>
                </View>
              </View>

              {pickup.status === 'awaiting_confirmation' ? (
                <View style={styles.infoNotice}>
                  <Text style={styles.infoNoticeText}>Penjemputan akan dikonfirmasi lagi nanti.</Text>
                </View>
              ) : null}

              {pickup.status === 'accepted' && pickup.etaMinutes ? (
                <View style={[styles.infoNotice, { backgroundColor: colors.primary[50], borderColor: colors.primary[100] }]}>
                  <Text style={[styles.infoNoticeText, { color: colors.primary[700] }]}>Tunggu petugas, estimasi tiba ±{pickup.etaMinutes} menit.</Text>
                </View>
              ) : null}

              <View style={styles.detailCard}>
                <View style={styles.row}>
                  <MapPin size={15} color={colors.primary[600]} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Lokasi Penjemputan</Text>
                    <Text style={styles.value}>{pickup.pickupAddress || '-'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <User size={15} color={colors.primary[600]} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Nama Pemohon</Text>
                    <Text style={styles.value}>{pickup.requesterName || '-'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <Phone size={15} color={colors.primary[600]} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Nomor HP</Text>
                    <Text style={styles.value}>{pickup.requesterPhone || '-'}</Text>
                  </View>
                </View>

                {pickup.etaDistanceKm ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                      <Clock size={15} color={colors.primary[600]} />
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.label}>Estimasi Jarak</Text>
                        <Text style={styles.value}>{pickup.etaDistanceKm} km</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Jenis Penjemputan</Text>
                <Text style={styles.noteValue}>{String(pickup.pickupType || '-').replace('_', ' ')}</Text>

                {isMoneyType ? (
                  <>
                    <Text style={[styles.noteTitle, { marginTop: 14 }]}>Nominal</Text>
                    <View style={styles.inlineRow}>
                      <Wallet size={14} color={colors.gray[500]} />
                      <Text style={styles.noteValue}>{formatCurrency(pickup.amount)}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.noteTitle, { marginTop: 14 }]}>Keterangan Barang</Text>
                    <View style={styles.inlineRow}>
                      <Package size={14} color={colors.gray[500]} />
                      <Text style={styles.noteValue}>{pickup.itemDescription || '-'}</Text>
                    </View>
                    {pickup.itemPhotoUrl ? <Image source={{ uri: pickup.itemPhotoUrl }} style={styles.previewImage} /> : null}
                  </>
                )}

                <Text style={[styles.noteTitle, { marginTop: 14 }]}>Catatan</Text>
                <Text style={styles.noteValue}>{pickup.notes || '-'}</Text>
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}> 
              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => router.replace('/pickups')}
                activeOpacity={0.85}
              >
                <Text style={styles.backToListText}>Kembali ke Penjemputan</Text>
              </TouchableOpacity>
            </View>
          </>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: { padding: 16, gap: 12 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 10, fontSize: 13, color: colors.gray[500] },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], textAlign: 'center' },

  statusCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupCode: { fontSize: 13, fontWeight: '700', color: colors.gray[800] },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoNotice: {
    borderWidth: 1,
    borderColor: colors.warning[100],
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.warning[50],
  },
  infoNoticeText: { fontSize: 13, fontWeight: '700', color: colors.warning[700] },

  detailCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  rowTextWrap: { flex: 1 },
  label: { fontSize: 11, color: colors.gray[500], marginBottom: 3, fontWeight: '600' },
  value: { fontSize: 14, color: colors.gray[900], lineHeight: 19, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray[100], marginHorizontal: 14 },

  noteCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
  },
  noteTitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteValue: { fontSize: 14, color: colors.gray[900], lineHeight: 20, fontWeight: '500' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    marginTop: 10,
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
    paddingTop: 12,
  },
  backToListBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToListText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
