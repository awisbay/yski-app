import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Gavel, Search, Clock, ChevronRight, TrendingUp, Users } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { useAuctions, useMyBids } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FILTER_TABS = [
  { key: 'active', label: 'Aktif' },
  { key: 'my-bids', label: 'Tawaran Saya' },
];

export default function AuctionsScreen() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: auctionsData, isLoading: auctionsLoading } = useAuctions({ search: searchQuery });
  const { data: myBidsData, isLoading: myBidsLoading } = useMyBids();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Berakhir';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} hari lagi`;
    return `${hours} jam lagi`;
  };

  const renderAuctionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/auctions/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.auctionCard}>
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0].image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Gavel size={40} color={colors.primary[300]} />
            </View>
          )}
          <View style={styles.timeBadge}>
            <Clock size={12} color={colors.white} />
            <Text style={styles.timeText}>{formatTimeLeft(item.endTime)}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Harga Saat Ini</Text>
              <Text style={styles.currentPrice}>{formatCurrency(item.currentPrice)}</Text>
            </View>
            <View style={styles.bidCount}>
              <Users size={14} color={colors.gray[500]} />
              <Text style={styles.bidCountText}>{item.bidCount || 0} bid</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.startingPrice}>
              Mulai: {formatCurrency(item.startingPrice)}
            </Text>
            <ChevronRight size={20} color={colors.gray[400]} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const isLoading = activeTab === 'active' ? auctionsLoading : myBidsLoading;
  const items = activeTab === 'active' 
    ? auctionsData?.items || [] 
    : myBidsData?.items || [];

  return (
    <ScreenWrapper>
      <Header
        title="Lelang Barang"
        showBackButton
        rightElement={
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari lelang..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <>
          <Skeleton height={280} borderRadius={12} />
          <Skeleton height={280} borderRadius={12} />
        </>
      ) : items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderAuctionItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon={Gavel}
          title={activeTab === 'active' ? "Tidak ada lelang aktif" : "Belum ada tawaran"}
          description={
            activeTab === 'active'
              ? "Lelang akan segera tersedia"
              : "Anda belum melakukan tawaran pada lelang apapun"
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.gray[800],
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  activeTab: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    ...typography.body2,
    color: colors.gray[600],
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  auctionCard: {
    marginBottom: 16,
    overflow: 'hidden',
    padding: 0,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  title: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginBottom: 4,
  },
  currentPrice: {
    ...typography.h3,
    color: colors.success[600],
  },
  bidCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    ...typography.caption,
    color: colors.gray[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  startingPrice: {
    ...typography.caption,
    color: colors.gray[500],
  },
});
