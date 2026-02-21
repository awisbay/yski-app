import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MainThemeLayout } from '@/components/ui';
import { Card } from '@/components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const FAQS = [
  {
    q: 'Saya tidak bisa login. Apa yang harus dilakukan?',
    a: 'Pastikan email dan password benar. Jika lupa password, gunakan fitur "Lupa Password" dari halaman login.',
  },
  {
    q: 'Status donasi saya masih menunggu konfirmasi.',
    a: 'Pastikan bukti transfer sudah diunggah dengan jelas. Tim admin/pengurus akan memverifikasi sesuai antrean.',
  },
  {
    q: 'Kenapa booking atau penjemputan saya ditolak?',
    a: 'Penolakan biasanya karena kapasitas tim/armada, validitas data lokasi, atau pertimbangan operasional lapangan.',
  },
  {
    q: 'Bagaimana alur peminjaman peralatan?',
    a: 'Request diajukan oleh pengguna, lalu diproses admin/pengurus. Jika disetujui, stok berkurang; jika dikembalikan dan dikonfirmasi, stok bertambah lagi.',
  },
  {
    q: 'Notifikasi tidak muncul di ponsel saya.',
    a: 'Pastikan izin notifikasi aplikasi aktif di perangkat dan internet stabil. Cek juga halaman Notifikasi untuk sinkron data terbaru.',
  },
  {
    q: 'Bagaimana saya menghubungi tim YSKI?',
    a: 'Gunakan kontak resmi di bawah halaman ini untuk bantuan lebih lanjut.',
  },
];

const PROGRAMS = ['Khairat Care', 'Kurma', 'Litara', 'Sulthani'];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  return (
    <MainThemeLayout title="Bantuan" subtitle="Pusat bantuan pengguna YSKI" showBackButton>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Butuh bantuan cepat?</Text>
          <Text style={styles.heroText}>YSKI memiliki layanan sosial dan kemanusiaan. Pilih pertanyaan yang paling sesuai dengan kendala Anda.</Text>
          <View style={styles.programRow}>
            {PROGRAMS.map((name) => (
              <View key={name} style={styles.programChip}>
                <Text style={styles.programChipText}>{name}</Text>
              </View>
            ))}
          </View>
        </Card>

        {FAQS.map((item, idx) => (
          <Card key={item.q} style={styles.faqCard}>
            <Text style={styles.faqQ}>{idx + 1}. {item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </Card>
        ))}

        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Kontak Bantuan Resmi YSKI</Text>
          <Text style={styles.contactLine}>WhatsApp: +62 812-9900-1265</Text>
          <Text style={styles.contactLine}>WhatsApp: +62 812-9249-1259</Text>
          <Text style={styles.contactLine}>Email: admin@sahabatkhairat.or.id</Text>
          <Text style={styles.contactLine}>Alamat: Perum. Vila Mutiara Cinere (VMC) Blok F2 No.7, Depok</Text>
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
  heroCard: {
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  heroTitle: {
    ...typography.body1,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 4,
  },
  heroText: {
    ...typography.caption,
    color: colors.gray[700],
    lineHeight: 19,
    marginBottom: 10,
  },
  programRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  programChipText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '700',
  },
  faqCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  faqQ: {
    ...typography.body2,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 6,
  },
  faqA: {
    ...typography.caption,
    color: colors.gray[600],
    lineHeight: 19,
  },
  contactCard: {
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.white,
  },
  contactTitle: {
    ...typography.body2,
    color: colors.primary[700],
    fontWeight: '800',
    marginBottom: 8,
  },
  contactLine: {
    ...typography.caption,
    color: colors.gray[700],
    marginBottom: 4,
  },
});
