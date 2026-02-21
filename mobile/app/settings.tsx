import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Bell, Lock, Shield, FileText, Info } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { Card } from '@/components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const SETTING_ITEMS = [
  {
    key: 'password',
    icon: Lock,
    title: 'Keamanan Akun',
    desc: 'Ubah password untuk menjaga keamanan akun Anda.',
    route: '/profile/password',
  },
  {
    key: 'notifications',
    icon: Bell,
    title: 'Notifikasi',
    desc: 'Lihat dan kelola notifikasi yang sama dengan ikon lonceng di beranda.',
    route: '/notifications',
  },
  {
    key: 'terms',
    icon: FileText,
    title: 'Syarat & Ketentuan',
    desc: 'Baca kebijakan penggunaan layanan YSKI.',
    route: '/terms',
  },
  {
    key: 'help',
    icon: Info,
    title: 'Bantuan',
    desc: 'Akses FAQ dan kontak resmi tim YSKI.',
    route: '/help',
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <MainThemeLayout title="Pengaturan" subtitle="Preferensi aplikasi dan keamanan" showBackButton>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.bannerCard}>
          <View style={styles.bannerIconWrap}>
            <Shield size={18} color={colors.primary[700]} />
          </View>
          <Text style={styles.bannerTitle}>Pengaturan Akun YSKI</Text>
          <Text style={styles.bannerText}>Kelola keamanan, notifikasi, dan informasi legal aplikasi dalam satu tempat.</Text>
        </Card>

        {SETTING_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.85}
          >
            <Card style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemIconWrap}>
                  <item.icon size={18} color={colors.primary[600]} />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Card style={styles.versionCard}>
          <Text style={styles.versionTitle}>Tentang Aplikasi</Text>
          <Text style={styles.versionText}>YSKI Mobile App</Text>
          <Text style={styles.versionMeta}>Versi 1.0.0</Text>
          <Text style={styles.versionMeta}>Sumber data profil lembaga: sahabatkhairat.or.id</Text>
        </Card>
      </ScrollView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 110,
    gap: 10,
  },
  bannerCard: {
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    ...typography.body1,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerText: {
    ...typography.caption,
    color: colors.gray[700],
    lineHeight: 19,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body2,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 3,
  },
  itemDesc: {
    ...typography.caption,
    color: colors.gray[600],
    lineHeight: 18,
  },
  versionCard: {
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.white,
  },
  versionTitle: {
    ...typography.body2,
    color: colors.primary[700],
    fontWeight: '800',
    marginBottom: 6,
  },
  versionText: {
    ...typography.caption,
    color: colors.gray[700],
    fontWeight: '700',
    marginBottom: 2,
  },
  versionMeta: {
    ...typography.caption,
    color: colors.gray[500],
    marginBottom: 2,
  },
});
