import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { useEquipmentDetail } from '@/hooks';
import { colors } from '@/constants/colors';

export default function EquipmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useEquipmentDetail(id || '');

  return (
    <MainThemeLayout title="Detail Peralatan" subtitle="Cek ketersediaan sebelum pinjam" showBackButton>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}><ActivityIndicator color={colors.primary[600]} /></View>
        ) : !item ? (
          <View style={styles.centered}><Text style={styles.muted}>Peralatan tidak ditemukan.</Text></View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 122 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.photoWrap}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photoFallback}><Package size={40} color={colors.secondary[600]} /></View>
                )}
              </View>

              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>

              <View style={styles.stockCard}>
                <View style={styles.stockRow}>
                  <CheckCircle2 size={18} color={colors.success[600]} />
                  <Text style={styles.stockText}>Stok tersedia: {item.availableStock}</Text>
                </View>
                <View style={styles.stockRow}>
                  <AlertCircle size={18} color={colors.gray[500]} />
                  <Text style={styles.stockText}>Total stok: {item.totalStock}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Deskripsi</Text>
              <Text style={styles.description}>{item.description || 'Belum ada deskripsi.'}</Text>
            </ScrollView>

            {item.availableStock > 0 ? (
              <TouchableOpacity
                style={[styles.borrowBtn, { bottom: insets.bottom + 12 }]}
                onPress={() => router.push(`/equipment/${item.id}/loan`)}
                activeOpacity={0.85}
              >
                <Text style={styles.borrowBtnText}>Pinjam</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.unavailableBox, { bottom: insets.bottom + 12 }]}>
                <Text style={styles.unavailableText}>Stok sedang kosong</Text>
              </View>
            )}
          </>
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.gray[500] },
  scrollContent: { paddingBottom: 122 },
  photoWrap: {
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    marginBottom: 12,
  },
  photo: { width: '100%', height: '100%' },
  photoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: colors.gray[900] },
  category: { marginTop: 4, fontSize: 12, color: colors.gray[500], fontWeight: '600' },
  stockCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
    gap: 10,
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockText: { fontSize: 13, color: colors.gray[700], fontWeight: '600' },
  sectionTitle: { marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: '800', color: colors.gray[700] },
  description: { fontSize: 14, color: colors.gray[700], lineHeight: 20 },
  borrowBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowBtnText: { fontSize: 15, fontWeight: '800', color: colors.white },
  unavailableBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: { fontSize: 14, fontWeight: '700', color: colors.gray[600] },
});
