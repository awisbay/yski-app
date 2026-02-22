import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Calendar, Clock, MapPin, Navigation2, Phone, User } from 'lucide-react-native';
import { useBookingDetail } from '@/hooks';
import { colors } from '@/constants/colors';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  approved: 'Disetujui',
  confirmed: 'Dikonfirmasi',
  in_progress: 'Sedang Berjalan',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const STATUS_COLOR: Record<string, string> = {
  pending: colors.warning[600],
  approved: colors.success[600],
  confirmed: colors.success[600],
  in_progress: colors.secondary[600],
  completed: colors.secondary[600],
  rejected: colors.error[600],
  cancelled: colors.gray[500],
};

function formatDateList(values?: string[] | null, fallback?: string) {
  const dates = values && values.length ? values : (fallback ? [fallback] : []);
  if (!dates.length) return '-';
  return dates
    .map((raw) => {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    })
    .join(', ');
}

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: booking, isLoading, isError } = useBookingDetail(id || '');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.panel}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary[600]} />
            <Text style={styles.loadingText}>Memuat detail booking...</Text>
          </View>
        ) : isError || !booking ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorTitle}>Detail booking tidak ditemukan</Text>
            <Text style={styles.errorText}>Silakan kembali ke halaman booking dan coba lagi.</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
              <View style={styles.statusCard}>
                <Text style={styles.bookingCode}>#{String(booking.id).slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[booking.status] ?? colors.gray[500]}20` }]}> 
                  <Text style={[styles.statusText, { color: STATUS_COLOR[booking.status] ?? colors.gray[600] }]}> 
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primary[50] }]}> 
                    <Calendar size={14} color={colors.primary[600]} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Tanggal</Text>
                    <Text style={styles.value}>{formatDateList(booking.bookingDates, booking.bookingDate)}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primary[50] }]}> 
                    <Clock size={14} color={colors.primary[600]} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Waktu</Text>
                    <Text style={styles.value}>
                      {booking.isFullDay
                        ? '1 Hari (Semua Jam)'
                        : ((booking.timeSlots && booking.timeSlots.length > 0)
                        ? booking.timeSlots.join(', ')
                        : (booking.timeSlot || '-'))}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: '#FFF1F2' }]}> 
                    <MapPin size={14} color="#E11D48" />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Titik Jemput</Text>
                    <Text style={styles.value}>{booking.pickupAddress || '-'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.secondary[50] }]}> 
                    <Navigation2 size={14} color={colors.secondary[600]} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Titik Tujuan</Text>
                    <Text style={styles.value}>{booking.dropoffAddress || '-'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primary[50] }]}> 
                    <User size={14} color={colors.primary[600]} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>Nama Pemesan</Text>
                    <Text style={styles.value}>{booking.requesterName || '-'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primary[50] }]}> 
                    <Phone size={14} color={colors.primary[600]} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.label}>No. Telepon</Text>
                    <Text style={styles.value}>{booking.requesterPhone || '-'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Keperluan</Text>
                <Text style={styles.noteValue}>{booking.purpose || '-'}</Text>

                <Text style={[styles.noteTitle, { marginTop: 14 }]}>Catatan</Text>
                <Text style={styles.noteValue}>{booking.notes || '-'}</Text>

                {booking.status === 'rejected' && (
                  <>
                    <Text style={[styles.noteTitle, { marginTop: 14 }]}>Alasan Ditolak</Text>
                    <Text style={[styles.noteValue, styles.rejectedReason]}>
                      {booking.rejectionReason || 'Tidak ada catatan alasan.'}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}> 
              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => router.replace('/booking')}
                activeOpacity={0.85}
              >
                <Text style={styles.backToListText}>Kembali ke Booking</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary[700],
  },
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
  content: {
    padding: 16,
    gap: 12,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.gray[500],
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
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
  bookingCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 3,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: colors.gray[900],
    lineHeight: 19,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: 14,
  },
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
  noteValue: {
    fontSize: 14,
    color: colors.gray[900],
    lineHeight: 20,
    fontWeight: '500',
  },
  rejectedReason: {
    color: colors.error[700],
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
  backToListText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
