import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Package, 
  Heart, 
  Truck,
  LayoutGrid,
  ChevronRight,
  LogOut,
  TrendingUp
} from 'lucide-react-native';
import { MainThemeLayout, SectionHeader, StatCard } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useAuthStore } from '@/stores/authStore';
import { useAllBookings } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const ADMIN_MENU = [
  { icon: Users, label: 'Manajemen User', route: '/admin/users', color: colors.primary[500] },
  { icon: Calendar, label: 'Manajemen Booking', route: '/admin/bookings', color: colors.secondary[500] },
  { icon: Package, label: 'Manajemen Peralatan', route: '/admin/equipment', color: colors.success[500] },
  { icon: Heart, label: 'Manajemen Donasi', route: '/admin/donations', color: colors.warning[500] },
  { icon: Truck, label: 'Manajemen Penjemputan', route: '/admin/pickups', color: colors.info[500] },
  { icon: LayoutGrid, label: 'Manajemen Program', route: '/admin/programs', color: colors.primary[700], adminOrPengurusOnly: true },
  { icon: TrendingUp, label: 'Manajemen Berita', route: '/admin/news', color: colors.secondary[700], adminOrPengurusOnly: true },
];

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: allBookings } = useAllBookings();
  const roleLabel =
    user?.role === 'pengurus' ? 'Pengurus' :
    user?.role === 'relawan' ? 'Relawan' :
    'Admin';
  const isAdminRole = user?.role === 'admin' || user?.role === 'superadmin';
  const menuItems = ADMIN_MENU.filter((item: any) => {
    if (item.route === '/admin/users' && !isAdminRole) return false;
    if (item.adminOrPengurusOnly && user?.role === 'relawan') return false;
    return true;
  });
  const completedAchievement = String((allBookings || []).filter((b: any) => b.status === 'completed').length);
  const bookingToday = String(
    (allBookings || []).filter((b: any) => {
      if (!b.bookingDate) return false;
      const d = new Date(b.bookingDate);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <MainThemeLayout
      title={`${roleLabel} Dashboard`}
      subtitle="Kelola operasional aplikasi"
      showBackButton
      onBackPress={() => router.push('/(tabs)/profile')}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.adminCard}>
          <View style={styles.adminInfo}>
            <View style={styles.avatar}>
              <Users size={32} color={colors.white} />
            </View>
            <View style={styles.adminText}>
              <Text style={styles.adminName}>{user?.full_name}</Text>
              <Text style={styles.adminEmail}>{user?.email}</Text>
              <Badge
                label={user?.role?.toUpperCase() || 'ADMIN'}
                variant="error"
                size="sm"
                style={styles.roleBadge}
              />
            </View>
          </View>
        </Card>

        <SectionHeader title="Statistik" />
        <View style={styles.statsGrid}>
          <StatCard
            title="Total User"
            value="124"
            icon={<Users size={24} color={colors.primary[500]} />}
            color={colors.primary[500]}
          />
          <StatCard
            title="Booking Hari Ini"
            value={bookingToday}
            icon={<Calendar size={24} color={colors.secondary[500]} />}
            color={colors.secondary[500]}
          />
          <StatCard
            title="Donasi Bulan Ini"
            value="Rp 15.2M"
            icon={<Heart size={24} color={colors.success[500]} />}
            color={colors.success[500]}
          />
          <StatCard
            title="Achievement Selesai"
            value={completedAchievement}
            icon={<Truck size={24} color={colors.warning[500]} />}
            color={colors.warning[500]}
          />
        </View>

        <SectionHeader title={`Menu ${roleLabel}`} />
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <item.icon size={24} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Kembali ke App"
            variant="secondary"
            onPress={() => router.push('/(tabs)')}
            style={styles.backButton}
          />
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  adminCard: {
    marginBottom: 24,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminText: {
    flex: 1,
  },
  adminName: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: 4,
  },
  adminEmail: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
  },
  statsGrid: {
    marginBottom: 24,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    ...typography.body1,
    fontWeight: '500',
    color: colors.gray[800],
  },
  logoutContainer: {
    marginTop: 32,
  },
  backButton: {
    marginBottom: 12,
  },
});
