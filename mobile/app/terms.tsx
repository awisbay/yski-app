import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MainThemeLayout } from '@/components/ui';
import { Card } from '@/components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const TERMS_SECTIONS = [
  {
    title: '1. Ruang Lingkup Layanan',
    body: 'YSKI menyediakan layanan sosial-kemanusiaan melalui aplikasi seperti donasi, booking layanan pick-up, peminjaman peralatan, penjemputan, dan lelang sosial.',
  },
  {
    title: '2. Akun Pengguna',
    body: 'Pengguna wajib memberikan data yang benar, terbaru, dan dapat dipertanggungjawabkan. Pengguna bertanggung jawab menjaga kerahasiaan akun dan aktivitas pada akun tersebut.',
  },
  {
    title: '3. Kewajiban dan Larangan',
    body: 'Dilarang menyalahgunakan layanan, memasukkan data palsu, melakukan spam, penipuan, atau aktivitas yang melanggar hukum dan ketertiban umum.',
  },
  {
    title: '4. Donasi dan Verifikasi',
    body: 'Donasi diproses berdasarkan mekanisme verifikasi internal. Status donasi dapat berubah menjadi menunggu konfirmasi, diterima, atau ditolak oleh admin/pengurus.',
  },
  {
    title: '5. Booking, Penjemputan, dan Peralatan',
    body: 'Setiap request booking, penjemputan, dan peminjaman peralatan mengikuti kapasitas operasional dan persetujuan admin/pengurus. YSKI berhak menyetujui, menjadwalkan ulang, atau menolak dengan alasan operasional.',
  },
  {
    title: '6. Lelang Sosial',
    body: 'Penawaran (bid) mengikuti ketentuan lelang yang berlaku. Pemenang wajib menyelesaikan pembayaran dan proses verifikasi sesuai alur aplikasi.',
  },
  {
    title: '7. Privasi dan Keamanan Data',
    body: 'Data pengguna digunakan untuk operasional layanan, komunikasi, dan peningkatan kualitas layanan YSKI. Pengelolaan data mengikuti kebijakan privasi yang berlaku.',
  },
  {
    title: '8. Batas Tanggung Jawab',
    body: 'YSKI berupaya menjaga layanan tetap andal, namun tidak menjamin aplikasi bebas gangguan setiap saat. Gangguan akibat faktor di luar kendali wajar bukan menjadi tanggung jawab penuh YSKI.',
  },
  {
    title: '9. Perubahan Ketentuan',
    body: 'Syarat dan ketentuan dapat diperbarui sewaktu-waktu. Versi terbaru yang dipublikasikan dalam aplikasi dianggap sebagai ketentuan yang berlaku.',
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <MainThemeLayout title="Syarat & Ketentuan" subtitle="Kebijakan penggunaan layanan YSKI" showBackButton>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Ringkasan YSKI</Text>
          <Text style={styles.infoText}>Yayasan Sahabat Khairat Indonesia adalah lembaga dakwah, sosial, dan kemanusiaan dengan fokus layanan umat.</Text>
          <Text style={styles.infoMeta}>Referensi: website resmi sahabatkhairat.or.id</Text>
        </Card>

        {TERMS_SECTIONS.map((section) => (
          <Card key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </Card>
        ))}

        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Kontak Resmi</Text>
          <Text style={styles.contactLine}>Email: admin@sahabatkhairat.or.id</Text>
          <Text style={styles.contactLine}>Telepon: +62 812 2943 2022</Text>
          <Text style={styles.contactLine}>Alamat: Perum. Vila Mutiara Cinere (VMC) Blok F2 No. 7, Grogol, Kec. Limo, Kota Depok</Text>
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
  infoCard: {
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  infoTitle: {
    ...typography.body1,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 6,
  },
  infoText: {
    ...typography.body2,
    color: colors.gray[700],
    lineHeight: 20,
  },
  infoMeta: {
    ...typography.caption,
    color: colors.primary[700],
    marginTop: 8,
    fontWeight: '700',
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  sectionTitle: {
    ...typography.body2,
    color: colors.gray[900],
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionBody: {
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
    lineHeight: 18,
  },
});
