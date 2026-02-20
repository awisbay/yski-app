import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Heart, Calendar, CheckCircle, Clock, ChevronRight, Sparkles } from 'lucide-react-native';
import { Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useMyDonations, useDonationSummary } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'completed', label: 'Selesai' },
];

const DONATION_TYPES: Record<string, { label: string; color: string }> = {
  infaq: { label: 'Infaq', color: colors.primary[500] },
  sedekah: { label: 'Sedekah', color: colors.success[500] },
  wakaf: { label: 'Wakaf', color: colors.secondary[500] },
  zakat: { label: 'Zakat', color: colors.warning[500] },
};

export default function DonationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const { data: donations, isLoading } = useMyDonations();
  const { data: summary } = useDonationSummary();

  const allDonations = donations || [];
  const completedStatuses = ['completed', 'paid'];
  const pendingStatuses = ['pending', 'unpaid'];

  const stats = useMemo(() => {
    const completedCount = allDonations.filter((item: any) => completedStatuses.includes(item.status)).length;
    const pendingCount = allDonations.filter((item: any) => pendingStatuses.includes(item.status)).length;

    return {
      totalCount: summary?.totalCount ?? summary?.total_donations ?? allDonations.length,
      totalAmount: summary?.totalAmount ?? summary?.total_amount ?? 0,
      completedCount,
      pendingCount,
    };
  }, [allDonations, summary]);

  const filteredDonations = allDonations.filter((donation: any) => {
    if (activeTab === 'pending') return pendingStatuses.includes(donation.status);
    if (activeTab === 'completed') return completedStatuses.includes(donation.status);
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderDonationItem = ({ item }: { item: any }) => {
    const typeInfo = DONATION_TYPES[item.donationType] || { label: item.donationType, color: colors.gray[500] };
    const isCompleted = completedStatuses.includes(item.status);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/donations/${item.id}`)}
        activeOpacity={0.85}
      >
        <Card style={styles.donationCard}>
          <View style={[styles.cardAccent, { backgroundColor: isCompleted ? colors.success[500] : colors.warning[500] }]} />
          <View style={styles.donationHeader}>
            <View style={styles.donationType}>
              <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                <Heart size={16} color={typeInfo.color} />
              </View>
              <View>
                <Text style={styles.typeLabel}>{typeInfo.label}</Text>
                <Text style={styles.donationId}>#{item.id.slice(-6).toUpperCase()}</Text>
              </View>
            </View>
            <Badge
              label={isCompleted ? 'Selesai' : 'Menunggu'}
              variant={isCompleted ? 'success' : 'warning'}
            />
          </View>

          <View style={styles.donationAmount}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          </View>

          <View style={styles.donationFooter}>
            <View style={styles.infoRow}>
              <Calendar size={14} color={colors.gray[400]} />
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('id-ID')}
              </Text>
            </View>
            {!isCompleted ? (
              <View style={styles.infoRow}>
                <Clock size={14} color={colors.warning[500]} />
                <Text style={[styles.statusText, { color: colors.warning[600] }]}>
                  Menunggu pembayaran
                </Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <CheckCircle size={14} color={colors.success[500]} />
                <Text style={[styles.statusText, { color: colors.success[600] }]}>
                  Pembayaran diterima
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.greetingLabel}>Mari berbagi lebih banyak</Text>
            <Text style={styles.pageTitle}>Donasi Saya</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/donations/new')}
          >
            <Plus size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCount}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Donasi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedCount}</Text>
            <Text style={styles.statLabel}>Donasi{'\n'}Selesai</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pendingCount}</Text>
            <Text style={styles.statLabel}>Menunggu{'\n'}Pembayaran</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Sparkles size={18} color={colors.primary[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Total Nominal Terdonasi</Text>
            <Text style={styles.summaryValue}>{formatCurrency(stats.totalAmount)}</Text>
          </View>
          <TouchableOpacity
            style={styles.summaryCta}
            onPress={() => router.push('/donations/new')}
            activeOpacity={0.85}
          >
            <Text style={styles.summaryCtaText}>Donasi Lagi</Text>
            <ChevronRight size={14} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterWrap}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, activeTab === tab.key && styles.filterChipActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.filterLabel, activeTab === tab.key && styles.filterLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <Skeleton height={130} borderRadius={16} />
            <Skeleton height={130} borderRadius={16} />
            <Skeleton height={130} borderRadius={16} />
          </View>
        ) : filteredDonations.length > 0 ? (
          <FlatList
            data={filteredDonations}
            renderItem={renderDonationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Heart}
              title="Belum ada donasi"
              description={
                activeTab === 'all'
                  ? 'Mulai berbagi kebaikan dengan donasi pertama Anda'
                  : `Tidak ada donasi ${activeTab === 'pending' ? 'yang menunggu' : 'yang selesai'}.`
              }
              action={{
                label: 'Buat Donasi',
                onPress: () => router.push('/donations/new'),
              }}
            />
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitleWrap: {
    flex: 1,
  },
  greetingLabel: {
    ...typography.caption,
    color: colors.primary[200],
    fontWeight: '600',
    marginBottom: 4,
  },
  pageTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h5,
    color: colors.white,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.primary[200],
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 6,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.gray[500],
  },
  summaryValue: {
    ...typography.h6,
    color: colors.primary[700],
    fontWeight: '700',
    marginTop: 2,
  },
  summaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  summaryCtaText: {
    ...typography.caption,
    color: colors.primary[600],
    fontWeight: '700',
  },
  filterWrap: {
    marginBottom: 12,
    maxHeight: 42,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterLabel: {
    ...typography.body2,
    color: colors.gray[700],
    fontWeight: '600',
  },
  filterLabelActive: {
    color: colors.white,
  },
  loadingWrap: {
    paddingHorizontal: 20,
    gap: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  donationCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.gray[900],
  },
  donationId: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  donationAmount: {
    marginBottom: 12,
  },
  amount: {
    ...typography.h5,
    color: colors.gray[900],
  },
  donationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    ...typography.caption,
    color: colors.gray[500],
  },
  statusText: {
    ...typography.caption,
    fontWeight: '500',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
