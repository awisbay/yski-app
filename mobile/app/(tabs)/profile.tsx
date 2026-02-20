import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  User,
  ChevronRight,
  LogOut, 
  Shield, 
  FileText, 
  HelpCircle, 
  Settings,
  Mail,
  Phone,
  MapPin,
  Bell
} from 'lucide-react-native';
import { MainThemeLayout, SectionHeader } from '@/components/ui';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const MENU_ITEMS = [
  { icon: User, label: 'Edit Profil', route: '/profile/edit' },
  { icon: Shield, label: 'Ubah Password', route: '/profile/password' },
  { icon: Bell, label: 'Notifikasi', route: '/notifications/settings' },
  { icon: FileText, label: 'Syarat & Ketentuan', route: '/terms' },
  { icon: HelpCircle, label: 'Bantuan', route: '/help' },
  { icon: Settings, label: 'Pengaturan', route: '/settings' },
];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <MainThemeLayout title="Profil" subtitle="Akun dan pengaturan Anda">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={colors.primary[600]} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.full_name || 'Pengguna'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.badgeContainer}>
                <Badge
                  label={user?.role || 'user'}
                  variant={user?.role === 'admin' ? 'error' : 'primary'}
                  size="sm"
                />
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            {user?.phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={colors.gray[500]} />
                <Text style={styles.contactText}>{user.phone}</Text>
              </View>
            )}
          </View>
        </Card>

        {isAdmin && (
          <>
            <SectionHeader title="Admin" />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(admin)')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.error[100] }]}>
                <Shield size={20} color={colors.error[600]} />
              </View>
              <Text style={styles.menuLabel}>Dashboard Admin</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </>
        )}

        <SectionHeader title="Menu" />
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index === MENU_ITEMS.length - 1 && styles.menuItemLast]}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.menuIcon}>
              <item.icon size={20} color={colors.gray[600]} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        ))}

        <View style={styles.logoutContainer}>
          <Button
            title="Keluar"
            variant="secondary"
            leftIcon={<LogOut size={20} color={colors.error[600]} />}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 24,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    ...typography.h3,
    marginBottom: 4,
  },
  email: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 8,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  contactInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    ...typography.body2,
    color: colors.gray[600],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    ...typography.body1,
    color: colors.gray[800],
  },
  logoutContainer: {
    marginTop: 32,
  },
  logoutButton: {
    borderColor: colors.error[200],
  },
  version: {
    ...typography.caption,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 24,
  },
});
