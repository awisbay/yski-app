import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Plus, Heart, Calendar, CheckCircle, Clock, ChevronRight } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, FilterTabBar, StatCard, Skeleton } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
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
  const [activeTab, setActiveTab] = useState('all');
  const { data: donations, isLoading } = useMyDonations();
  const { data: summary } = useDonationSummary();

  const filteredDonations = donations?.filter((donation) => {
    switch (activeTab) {
      case 'pending':
        return donation.status === 'pending';
      case 'completed':
        return donation.status === 'completed';
      default:
        return true;
    }
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderDonationItem = ({ item }: { item: any }) => {
    const typeInfo = DONATION_TYPES[item.donationType] || { label: item.donationType, color: colors.gray[500] };
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/donations/${item.id}`)}
        activeOpacity={0.7}
      >
        <Card style={styles.donationCard}>
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
              label={item.status}
              variant={item.status === 'completed' ? 'success' : 'warning'}
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
            {item.status === 'pending' ? (
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
    <ScreenWrapper>
      <Header
        title="Donasi Saya"
        showBackButton={false}
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/donations/new')}
          >
            <Plus size={24} color={colors.primary[600]} />
          </TouchableOpacity>
        }
      />

      {/* Stats */}
      {summary && (
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Donasi"
            value={summary.totalCount || 0}
            icon={<Heart size={24} color={colors.primary[500]} />}
            color={colors.primary[500]}
          />
          <StatCard
            title="Total Nominal"
            value={formatCurrency(summary.totalAmount || 0)}
            icon={<CheckCircle size={24} color={colors.success[500]} />}
            color={colors.success[500]}
          />
        </View>
      )}

      <FilterTabBar
        tabs={FILTER_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <>
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
        </>
      ) : filteredDonations.length > 0 ? (
        <FlatList
          data={filteredDonations}
          renderItem={renderDonationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon={Heart}
          title="Belum ada donasi"
          description={
            activeTab === 'all'
              ? "Mulai berbagi kebaikan dengan donasi pertama Anda"
              : `Tidak ada donasi ${activeTab === 'pending' ? 'yang menunggu' : 'yang selesai'}.`
          }
          action={{
            label: 'Buat Donasi',
            onPress: () => router.push('/donations/new'),
          }}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  donationCard: {
    marginBottom: 12,
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
    ...typography.h3,
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
});
