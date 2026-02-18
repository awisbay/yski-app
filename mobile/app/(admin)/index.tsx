import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Package, 
  Heart, 
  Truck,
  ChevronRight,
  LogOut,
  TrendingUp
} from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, StatCard } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const ADMIN_MENU = [
  { icon: Users, label: 'Manajemen User', route: '/admin/users', color: colors.primary[500] },
  { icon: Calendar, label: 'Manajemen Booking', route: '/admin/bookings', color: colors.secondary[500] },
  { icon: Package, label: 'Manajemen Peralatan', route: '/admin/equipment', color: colors.success[500] },
  { icon: Heart, label: 'Manajemen Donasi', route: '/admin/donations', color: colors.warning[500] },
  { icon: Truck, label: 'Manajemen Penjemputan', route: '/admin/pickups', color: colors.info[500] },
];

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <ScreenWrapper>
      <Header
        title="Admin Dashboard"
        showBackButton
        onBackPress={() => router.push('/(tabs)/profile')}
      />

      {/* Admin Info */}
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

      {/* Stats Overview */}
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
          value="8"
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
          title="Penjemputan Pending"
          value="5"
          icon={<Truck size={24} color={colors.warning[500]} />}
          color={colors.warning[500]}
        />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Menu Admin" />
      <View style={styles.menuContainer}>
        {ADMIN_MENU.map((item) => (
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

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          title="Kembali ke App"
          variant="secondary"
          onPress={() => router.push('/(tabs)')}
          style={styles.backButton}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
