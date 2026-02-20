import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Gift, Building, Moon, ChevronLeft, ChevronRight, Wallet, Info } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useCreateDonation } from '@/hooks';
import { donationAmountSchema, type DonationAmountFormData } from '@/lib/validation';
import { useDonationStore } from '@/stores/donationStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const DONATION_TYPES = [
  { key: 'infaq', label: 'Infaq', icon: Gift, description: 'Infak untuk kegiatan sosial', color: colors.primary[500] },
  { key: 'sedekah', label: 'Sedekah', icon: Heart, description: 'Sedekah untuk yang membutuhkan', color: colors.success[500] },
  { key: 'wakaf', label: 'Wakaf', icon: Building, description: 'Wakaf untuk pembangunan', color: colors.secondary[500] },
  { key: 'zakat', label: 'Zakat', icon: Moon, description: 'Zakat mal/fitrah', color: colors.warning[500] },
];

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function NewDonationScreen() {
  const [step, setStep] = useState(1);
  const donationStore = useDonationStore();
  const createMutation = useCreateDonation();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonationAmountFormData>({
    resolver: zodResolver(donationAmountSchema),
    defaultValues: {
      donationType: (donationStore.selectedType || 'infaq') as 'infaq' | 'sedekah' | 'wakaf' | 'zakat',
      amount: donationStore.selectedAmount || 100000,
    },
  });

  const selectedType = watch('donationType');
  const selectedAmount = watch('amount');
  const customAmount = !PRESET_AMOUNTS.includes(selectedAmount);

  const onSubmit = async (data: DonationAmountFormData) => {
    if (step === 1) {
      donationStore.setSelectedType(data.donationType);
      donationStore.setSelectedAmount(data.amount);
      setStep(2);
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        donation_type: data.donationType,
        amount: data.amount,
        payment_method: 'manual_transfer',
      });
      
      // Navigate to payment instructions
      router.push(`/donations/${result.data.id}/payment`);
    } catch (error) {
      console.error('Donation failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainThemeLayout
      title="Donasi Baru"
      subtitle="Lengkapi donasi Anda"
      showBackButton
      onBackPress={() => {
        if (step > 1) {
          setStep(step - 1);
        } else {
          router.back();
        }
      }}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pilih Jenis Donasi</Text>
            <Text style={styles.stepDescription}>
              Pilih jenis donasi yang ingin Anda berikan
            </Text>

            <Controller
              control={control}
              name="donationType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.typesGrid}>
                  {DONATION_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeCard,
                        value === type.key && { borderColor: type.color, backgroundColor: type.color + '08' },
                      ]}
                      onPress={() => onChange(type.key)}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                        <type.icon size={24} color={type.color} />
                      </View>
                      <Text style={[styles.typeLabel, value === type.key && { color: type.color }]}>
                        {type.label}
                      </Text>
                      <Text style={styles.typeDescription} numberOfLines={2}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            <Text style={styles.sectionTitle}>Pilih Nominal</Text>

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <>
                  <View style={styles.amountsGrid}>
                    {PRESET_AMOUNTS.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.amountButton,
                          value === amount && styles.amountButtonSelected,
                        ]}
                        onPress={() => onChange(amount)}
                      >
                        <Text
                          style={[
                            styles.amountText,
                            value === amount && styles.amountTextSelected,
                          ]}
                        >
                          {formatCurrency(amount)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.customAmountContainer}>
                    <Text style={styles.customAmountLabel}>Atau masukkan nominal lain</Text>
                    <Input
                      placeholder="Rp 0"
                      keyboardType="number-pad"
                      value={customAmount ? value.toString() : ''}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                        onChange(num);
                      }}
                      leftIcon={<Wallet size={20} color={colors.gray[400]} />}
                      error={errors.amount?.message}
                    />
                  </View>
                </>
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Konfirmasi Donasi</Text>
            <Text style={styles.stepDescription}>
              Periksa kembali detail donasi Anda
            </Text>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Detail Donasi</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jenis Donasi</Text>
                <Text style={styles.summaryValue}>
                  {DONATION_TYPES.find(t => t.key === selectedType)?.label}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nominal</Text>
                <Text style={[styles.summaryValue, styles.amountValue]}>
                  {formatCurrency(selectedAmount)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Metode Pembayaran</Text>
                <Text style={styles.summaryValue}>Transfer Manual</Text>
              </View>
            </Card>

            <View style={styles.infoBox}>
              <Info size={20} color={colors.primary[600]} />
              <Text style={styles.infoText}>
                Setelah konfirmasi, Anda akan mendapatkan instruksi pembayaran melalui transfer bank.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={step === 2 ? 'Konfirmasi Donasi' : 'Lanjut'}
            onPress={handleSubmit(onSubmit as any)}
            isLoading={createMutation.isPending}
            rightIcon={step < 2 ? <ChevronRight size={20} color={colors.white} /> : undefined}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    ...typography.h3,
    marginBottom: 8,
  },
  stepDescription: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 24,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  typeDescription: {
    ...typography.caption,
    color: colors.gray[500],
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  amountButton: {
    width: '31%',
    paddingVertical: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: colors.primary[500],
  },
  amountText: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[700],
  },
  amountTextSelected: {
    color: colors.white,
  },
  customAmountContainer: {
    marginBottom: 24,
  },
  customAmountLabel: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.gray[500],
  },
  summaryValue: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[900],
  },
  amountValue: {
    color: colors.success[600],
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    ...typography.body2,
    color: colors.gray[700],
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
