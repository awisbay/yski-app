import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { HandHeart, Info } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { useCreateDonation } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function NewDonationScreen() {
  const user = useAuthStore((state) => state.user);
  const createDonation = useCreateDonation();
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState('');

  const displayAmount = useMemo(() => {
    if (customAmount.trim().length > 0) {
      return Number(customAmount.replace(/[^0-9]/g, '') || '0');
    }
    return amount;
  }, [amount, customAmount]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);

  const onSubmit = async () => {
    if (!displayAmount || displayAmount < 10000) {
      Alert.alert('Validasi', 'Minimal donasi Rp 10.000.');
      return;
    }

    try {
      const res = await createDonation.mutateAsync({
        donation_type: 'sedekah',
        amount: displayAmount,
        donor_name: user?.full_name || 'Hamba Allah',
        donor_email: user?.email || null,
        donor_phone: user?.phone || null,
        payment_method: 'manual_transfer',
      });
      router.replace(`/donations/${res.data.id}/payment`);
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.detail || 'Tidak dapat membuat donasi saat ini.');
    }
  };

  return (
    <MainThemeLayout title="Nominal Donasi" subtitle="Transfer manual (sementara)" showBackButton>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <HandHeart size={22} color={colors.primary[600]} />
            </View>
            <Text style={styles.heroTitle}>Masukkan Nominal Donasi</Text>
            <Text style={styles.heroSub}>Kategori donasi disederhanakan, langsung ke nominal.</Text>
          </View>

          <View style={styles.grid}>
            {PRESET_AMOUNTS.map((value) => {
              const selected = customAmount.trim().length === 0 && amount === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.amountBtn, selected && styles.amountBtnActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setCustomAmount('');
                    setAmount(value);
                  }}
                >
                  <Text style={[styles.amountText, selected && styles.amountTextActive]}>
                    {formatCurrency(value)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Atau nominal lain</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 150000"
            placeholderTextColor={colors.gray[400]}
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={(txt) => setCustomAmount(txt.replace(/[^0-9]/g, ''))}
          />

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Donasi</Text>
            <Text style={styles.totalValue}>{formatCurrency(displayAmount)}</Text>
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color={colors.primary[700]} />
            <Text style={styles.infoText}>
              Setelah lanjut, Anda akan melihat instruksi transfer dan upload bukti pembayaran untuk diverifikasi admin/pengurus.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, createDonation.isPending && { opacity: 0.75 }]}
            onPress={onSubmit}
            disabled={createDonation.isPending}
            activeOpacity={0.85}
          >
            {createDonation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Lanjut Konfirmasi Transfer</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    padding: 14,
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: colors.gray[600],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  amountBtn: {
    width: '48.5%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[700],
  },
  amountTextActive: {
    color: colors.white,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[700],
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
    color: colors.gray[800],
    fontSize: 14,
    backgroundColor: colors.white,
  },
  totalCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    padding: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary[700],
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray[700],
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
