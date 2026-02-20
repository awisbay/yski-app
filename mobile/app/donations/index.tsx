import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Plus, Heart, Clock3, CheckCircle2, FileWarning } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { useMyDonations } from '@/hooks';
import { colors } from '@/constants/colors';

function getDonationState(paymentStatus?: string) {
  if (paymentStatus === 'paid') {
    return { label: 'Terverifikasi', color: colors.success[600], icon: CheckCircle2 };
  }
  if (paymentStatus === 'awaiting_verification') {
    return { label: 'Menunggu Verifikasi', color: colors.warning[600], icon: Clock3 };
  }
  return { label: 'Menunggu Bukti Transfer', color: colors.error[600], icon: FileWarning };
}

export default function DonationsScreen() {
  const { data: donations, isLoading } = useMyDonations();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);

  return (
    <MainThemeLayout title="Donasi" subtitle="Transfer manual (sementara)" showBackButton>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Heart size={24} color={colors.primary[600]} />
          </View>
          <Text style={styles.heroTitle}>Bantu Sesama Lewat Donasi</Text>
          <Text style={styles.heroSubtitle}>
            Klik tombol di bawah untuk langsung lanjut ke input nominal donasi.
          </Text>
          <TouchableOpacity
            style={styles.bigDonateBtn}
            onPress={() => router.push('/donations/new')}
            activeOpacity={0.85}
          >
            <Plus size={18} color={colors.white} />
            <Text style={styles.bigDonateText}>Donasi Sekarang</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Riwayat Donasi Saya</Text>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={86} borderRadius={12} />
            <Skeleton height={86} borderRadius={12} />
          </View>
        ) : (
          <FlatList
            data={donations || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 90, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: { item: any }) => {
              const state = getDonationState(item.paymentStatus);
              const StatusIcon = state.icon;
              return (
                <TouchableOpacity
                  style={styles.itemCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/donations/${item.id}/payment`)}
                >
                  <View style={styles.itemRow}>
                    <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: `${state.color}18` }]}>
                      <StatusIcon size={13} color={state.color} />
                      <Text style={[styles.statusText, { color: state.color }]}>{state.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    {new Date(item.createdAt).toLocaleDateString('id-ID')} · {item.donationCode || `#${item.id.slice(-6).toUpperCase()}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Belum ada riwayat donasi.</Text>
              </View>
            }
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroCard: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    padding: 16,
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  bigDonateBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 230,
  },
  bigDonateText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gray[700],
    marginBottom: 8,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray[500],
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray[500],
  },
});
