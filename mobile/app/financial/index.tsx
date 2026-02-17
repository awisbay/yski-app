import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Wallet, TrendingUp, TrendingDown, FileText, ChevronRight, Calendar, Download } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, StatCard, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { useFinancialDashboard, useFinancialReports } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const chartConfig = {
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const CATEGORY_COLORS = [
  colors.primary[500],
  colors.success[500],
  colors.warning[500],
  colors.secondary[500],
  colors.info[500],
  colors.error[500],
];

export default function FinancialScreen() {
  const { data: dashboard, isLoading: dashboardLoading } = useFinancialDashboard();
  const { data: reportsData, isLoading: reportsLoading } = useFinancialReports();

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Rp 0';
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    }
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCategoryName = (category: string) => {
    const names: Record<string, string> = {
      donasi_masuk: 'Donasi',
      zakat_masuk: 'Zakat',
      lelang_masuk: 'Lelang',
      penyaluran_bantuan: 'Penyaluran',
      operasional: 'Operasional',
      gaji_relawan: 'Gaji Relawan',
    };
    return names[category] || category;
  };

  const preparePieData = (data: any[]) => {
    if (!data || data.length === 0) return null;
    return {
      labels: data.map(d => formatCategoryName(d.category)),
      data: data.map(d => d.percentage / 100),
      colors: CATEGORY_COLORS.slice(0, data.length),
    };
  };

  const incomePieData = preparePieData(dashboard?.incomeByCategory);
  const expensePieData = preparePieData(dashboard?.expenseByCategory);

  const renderReportItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/financial/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportIcon}>
            <FileText size={20} color={colors.primary[600]} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.reportMeta}>
              <Calendar size={14} color={colors.gray[400]} />
              <Text style={styles.reportDate}>
                {new Date(item.periodStart).toLocaleDateString('id-ID', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          {item.isAudited && (
            <Badge label="Teraudit" variant="success" size="sm" />
          )}
        </View>
        
        <View style={styles.reportStats}>
          <View style={styles.statItem}>
            <TrendingUp size={16} color={colors.success[500]} />
            <Text style={styles.statValue}>{formatCurrency(item.totalIncome)}</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingDown size={16} color={colors.error[500]} />
            <Text style={styles.statValue}>{formatCurrency(item.totalExpense)}</Text>
          </View>
        </View>
        
        <View style={styles.reportFooter}>
          <Text style={styles.balanceLabel}>Saldo</Text>
          <Text style={[
            styles.balanceValue,
            { color: (item.totalIncome - item.totalExpense) >= 0 ? colors.success[600] : colors.error[600] }
          ]}>
            {formatCurrency(item.totalIncome - item.totalExpense)}
          </Text>
          <ChevronRight size={20} color={colors.gray[400]} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (dashboardLoading) {
    return (
      <ScreenWrapper>
        <Header title="Laporan Keuangan" showBackButton />
        <Skeleton height={200} borderRadius={12} />
        <Skeleton height={200} borderRadius={12} />
        <Skeleton height={140} borderRadius={12} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Laporan Keuangan" showBackButton />

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Pemasukan"
          value={formatCurrency(dashboard?.totalIncome || 0)}
          icon={<TrendingUp size={24} color={colors.success[500]} />}
          color={colors.success[500]}
        />
        <StatCard
          title="Total Pengeluaran"
          value={formatCurrency(dashboard?.totalExpense || 0)}
          icon={<TrendingDown size={24} color={colors.error[500]} />}
          color={colors.error[500]}
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(dashboard?.balance || 0)}
          icon={<Wallet size={24} color={colors.primary[500]} />}
          color={colors.primary[500]}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Income Breakdown */}
        {incomePieData && (
          <>
            <SectionHeader title="Pemasukan per Kategori" />
            <Card style={styles.chartCard}>
              <PieChart
                data={incomePieData}
                width={300}
                height={180}
                chartConfig={chartConfig}
                accessor="data"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
              <View style={styles.legendContainer}>
                {dashboard?.incomeByCategory?.map((item: any, index: number) => (
                  <View key={item.category} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} />
                    <Text style={styles.legendText}>{formatCategoryName(item.category)}</Text>
                    <Text style={styles.legendValue}>{item.percentage}%</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Expense Breakdown */}
        {expensePieData && (
          <>
            <SectionHeader title="Pengeluaran per Kategori" />
            <Card style={styles.chartCard}>
              <PieChart
                data={expensePieData}
                width={300}
                height={180}
                chartConfig={chartConfig}
                accessor="data"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
              <View style={styles.legendContainer}>
                {dashboard?.expenseByCategory?.map((item: any, index: number) => (
                  <View key={item.category} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} />
                    <Text style={styles.legendText}>{formatCategoryName(item.category)}</Text>
                    <Text style={styles.legendValue}>{item.percentage}%</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Reports List */}
        <SectionHeader title="Laporan Bulanan" />
        {reportsLoading ? (
          <>
            <Skeleton height={140} borderRadius={12} />
            <Skeleton height={140} borderRadius={12} />
          </>
        ) : reportsData?.reports?.length > 0 ? (
          reportsData.reports.map((item: any) => (
            <View key={item.id}>{renderReportItem({ item })}</View>
          ))
        ) : (
          <EmptyState
            icon={FileText}
            title="Belum ada laporan"
            description="Laporan keuangan akan segera tersedia"
            compact
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 8,
  },
  chartCard: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.gray[600],
  },
  legendValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.gray[800],
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDate: {
    ...typography.caption,
    color: colors.gray[500],
  },
  reportStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[700],
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.body2,
    color: colors.gray[500],
    marginRight: 8,
  },
  balanceValue: {
    ...typography.body1,
    fontWeight: '600',
    flex: 1,
  },
});
