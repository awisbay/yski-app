import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Package, Search, Filter, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { MainThemeLayout, SectionHeader, FilterTabBar, Skeleton } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useEquipmentList, useEquipmentStats, useMyLoans } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'vehicle', label: 'Kendaraan' },
  { key: 'tools', label: 'Peralatan' },
  { key: 'electronics', label: 'Elektronik' },
];

export default function EquipmentScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: equipment, isLoading } = useEquipmentList();
  const { data: stats } = useEquipmentStats();
  const { data: myLoans } = useMyLoans();

  const filteredEquipment = equipment?.filter((item: any) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  }) || [];

  const renderEquipmentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/equipment/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.equipmentCard}>
        <View style={styles.equipmentHeader}>
          <View style={[styles.equipmentIcon, { backgroundColor: colors.secondary[100] }]}>
            <Package size={24} color={colors.secondary[600]} />
          </View>
          <View style={styles.equipmentInfo}>
            <Text style={styles.equipmentName}>{item.name}</Text>
            <Text style={styles.equipmentCategory}>{item.category}</Text>
          </View>
          <Badge
            label={item.availableStock > 0 ? 'Tersedia' : 'Kosong'}
            variant={item.availableStock > 0 ? 'success' : 'error'}
            size="sm"
          />
        </View>
        
        <View style={styles.equipmentFooter}>
          <Text style={styles.stockText}>
            Stok: {item.availableStock}/{item.totalStock}
          </Text>
          {item.availableStock > 0 && (
            <Button
              title="Pinjam"
              size="sm"
              onPress={() => router.push(`/equipment/${item.id}/loan`)}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Peralatan"
      subtitle="Pinjam alat yang tersedia"
      showBackButton
      rightElement={
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color={colors.white} />
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalEquipment || 0}</Text>
              <Text style={styles.statLabel}>Total Item</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.availableCount || 0}</Text>
              <Text style={styles.statLabel}>Tersedia</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{myLoans?.length || 0}</Text>
              <Text style={styles.statLabel}>Dipinjam</Text>
            </View>
          </View>
        )}

        {myLoans && myLoans.length > 0 && (
          <>
            <SectionHeader title="Peminjaman Saya" />
            {myLoans.slice(0, 2).map((loan: any) => (
              <Card key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanEquipment}>{loan.equipmentName}</Text>
                  <Badge
                    label={loan.status}
                    variant={loan.status === 'active' ? 'primary' : loan.status === 'returned' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
                <View style={styles.loanInfo}>
                  <View style={styles.infoRow}>
                    <Clock size={14} color={colors.gray[400]} />
                    <Text style={styles.infoText}>
                      {new Date(loan.loanDate).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  {loan.dueDate && (
                    <View style={styles.infoRow}>
                      <AlertCircle size={14} color={colors.warning[500]} />
                      <Text style={[styles.infoText, { color: colors.warning[600] }]}>
                        Jatuh tempo: {new Date(loan.dueDate).toLocaleDateString('id-ID')}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        <SectionHeader title="Daftar Peralatan" />

        <FilterTabBar
          tabs={CATEGORIES}
          activeTab={activeCategory}
          onChange={setActiveCategory}
        />

        {isLoading ? (
          <>
            <Skeleton height={140} borderRadius={12} />
            <Skeleton height={140} borderRadius={12} />
            <Skeleton height={140} borderRadius={12} />
          </>
        ) : filteredEquipment.length > 0 ? (
          <FlatList
            data={filteredEquipment}
            renderItem={renderEquipmentItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="Tidak ada peralatan"
            description="Belum ada peralatan yang tersedia di kategori ini"
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    ...typography.h3,
    color: colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[500],
  },
  loanCard: {
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanEquipment: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
  },
  loanInfo: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...typography.caption,
    color: colors.gray[500],
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  equipmentCard: {
    marginBottom: 12,
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  equipmentCategory: {
    ...typography.caption,
    color: colors.gray[500],
  },
  equipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  stockText: {
    ...typography.body2,
    color: colors.gray[600],
  },
});
