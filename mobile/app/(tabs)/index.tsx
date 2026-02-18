import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar, 
  Package, 
  Heart, 
  Truck, 
  ChevronRight,
  Bell,
  MapPin,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, Skeleton } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useDonationStore } from '@/stores/donationStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMyBookings, useBookingSlots, usePrograms, useNews } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';

const MENU_ITEMS = [
  { icon: Calendar, label: 'Booking', route: '/booking', color: colors.primary[500] },
  { icon: Package, label: 'Peralatan', route: '/equipment', color: colors.secondary[500] },
  { icon: Heart, label: 'Donasi', route: '/donations', color: colors.success[500] },
  { icon: Truck, label: 'Jemput', route: '/pickups', color: colors.warning[500] },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useMyBookings();
  const { data: programs, isLoading: programsLoading } = usePrograms({ limit: 3 });
  const { data: news, isLoading: newsLoading } = useNews({ limit: 2 });
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings()]);
    setRefreshing(false);
  };

  const activeBookings = bookings?.filter((b: any) => b.status === 'confirmed' || b.status === 'pending') || [];
  const nextBooking = activeBookings[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleMenuPress = (route: string) => {
    router.push(route);
  };

  return (
    <ScreenWrapper
      refreshable
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Selamat Datang,</Text>
          <Text style={styles.userName}>{user?.full_name || 'Pengguna'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={24} color={colors.gray[700]} />
          {unreadCount > 0 && (
            <Badge 
              label={unreadCount.toString()} 
              variant="error" 
              size="sm"
              style={styles.notificationBadge}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
            <Calendar size={20} color={colors.primary[600]} />
          </View>
          <Text style={styles.statValue}>{activeBookings.length}</Text>
          <Text style={styles.statLabel}>Booking Aktif</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.success[100] }]}>
            <Heart size={20} color={colors.success[600]} />
          </View>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Total Donasi</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.secondary[100] }]}>
            <Package size={20} color={colors.secondary[600]} />
          </View>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Peminjaman</Text>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.route)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <item.icon size={28} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Booking */}
      <SectionHeader 
        title="Booking Berikutnya" 
        right={
          <TouchableOpacity onPress={() => router.push('/booking')}>
            <Text style={styles.link}>Lihat Semua</Text>
          </TouchableOpacity>
        }
      />
      
      {bookingsLoading ? (
        <Skeleton height={120} borderRadius={12} />
      ) : nextBooking ? (
        <Card style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Badge 
              label={nextBooking.status} 
              variant={nextBooking.status === 'confirmed' ? 'success' : 'warning'}
            />
            <Text style={styles.bookingId}>#{nextBooking.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.bookingInfo}>
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.gray[500]} />
              <Text style={styles.infoText}>
                {new Date(nextBooking.bookingDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color={colors.gray[500]} />
              <Text style={styles.infoText}>{nextBooking.timeSlot}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.gray[500]} />
              <Text style={styles.infoText} numberOfLines={1}>
                {nextBooking.pickupAddress}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Belum ada booking"
          description="Mulai dengan membuat booking pertama Anda"
          action={{
            label: 'Buat Booking',
            onPress: () => router.push('/booking/new'),
          }}
          compact
        />
      )}

      {/* Featured Programs */}
      <SectionHeader 
        title="Program Unggulan"
        right={
          <TouchableOpacity onPress={() => router.push('/programs')}>
            <Text style={styles.link}>Lihat Semua</Text>
          </TouchableOpacity>
        }
      />
      
      {programsLoading ? (
        <Skeleton height={200} borderRadius={12} />
      ) : programs?.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.programsScroll}
        >
          {programs.map((program: any) => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => router.push(`/programs/${program.id}`)}
            >
              <View style={styles.programImage}>
                <Heart size={32} color={colors.primary[300]} />
              </View>
              <View style={styles.programContent}>
                <Badge label={program.category} variant="primary" size="sm" />
                <Text style={styles.programTitle} numberOfLines={2}>{program.title}</Text>
                <Text style={styles.programDescription} numberOfLines={2}>
                  {program.description}
                </Text>
                <ProgressBar 
                  progress={program.collectedAmount / program.targetAmount}
                  style={styles.programProgress}
                />
                <View style={styles.programStats}>
                  <Text style={styles.programRaised}>
                    {formatCurrency(program.collectedAmount)}
                  </Text>
                  <Text style={styles.programTarget}>
                    dari {formatCurrency(program.targetAmount)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Belum ada program"
          description="Program akan segera tersedia"
          compact
        />
      )}

      {/* Latest News */}
      <SectionHeader 
        title="Berita Terbaru"
        right={
          <TouchableOpacity onPress={() => router.push('/news')}>
            <Text style={styles.link}>Lihat Semua</Text>
          </TouchableOpacity>
        }
      />
      
      {newsLoading ? (
        <>
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
        </>
      ) : news?.length > 0 ? (
        news.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsItem}
            onPress={() => router.push(`/news/${item.id}`)}
          >
            <View style={styles.newsImage} />
            <View style={styles.newsContent}>
              <Badge label={item.category} variant="secondary" size="sm" />
              <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.newsDate}>
                {new Date(item.publishedAt).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Belum ada berita"
          description="Berita akan segera tersedia"
          compact
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.body2,
    color: colors.gray[500],
  },
  userName: {
    ...typography.h3,
    color: colors.gray[900],
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    width: '23%',
    alignItems: 'center',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    ...typography.caption,
    color: colors.gray[700],
    fontWeight: '500',
  },
  link: {
    ...typography.button,
    color: colors.primary[600],
  },
  bookingCard: {
    marginBottom: 24,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    ...typography.caption,
    color: colors.gray[500],
  },
  bookingInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    ...typography.body2,
    color: colors.gray[700],
    flex: 1,
  },
  programsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  programCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programImage: {
    height: 120,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  programContent: {
    padding: 12,
  },
  programTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 8,
    marginBottom: 4,
  },
  programDescription: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 12,
  },
  programProgress: {
    marginBottom: 8,
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  programRaised: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.success[600],
  },
  programTarget: {
    ...typography.caption,
    color: colors.gray[500],
  },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  newsTitle: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[900],
    marginTop: 4,
    marginBottom: 4,
  },
  newsDate: {
    ...typography.caption,
    color: colors.gray[500],
  },
});
