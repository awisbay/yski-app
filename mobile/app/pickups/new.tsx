import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck, Package, Moon, Heart, ChevronLeft, ChevronRight, User, Phone, MapPin, Calendar, Info } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '@/components/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { useCreatePickup } from '@/hooks';
import { pickupSchema, type PickupFormData } from '@/lib/validation';
import { usePickupStore } from '@/stores/pickupStore';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const PICKUP_TYPES = [
  { key: 'zakat', label: 'Zakat', icon: Moon, description: 'Penjemputan zakat mal/fitrah', color: colors.warning[500] },
  { key: 'kencleng', label: 'Kencleng', icon: Package, description: 'Penjemputan kencleng/box amal', color: colors.primary[500] },
  { key: 'donasi', label: 'Donasi', icon: Heart, description: 'Penjemputan barang donasi', color: colors.success[500] },
];

const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'];

export default function NewPickupScreen() {
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const user = useAuthStore((state) => state.user);
  const createMutation = useCreatePickup();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PickupFormData>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      pickupType: 'zakat',
      requesterName: user?.fullName || '',
      requesterPhone: user?.phone || '',
      pickupAddress: '',
      preferredDate: null,
      preferredTimeSlot: null,
      notes: '',
    },
  });

  const selectedType = watch('pickupType');
  const selectedDate = watch('preferredDate');

  const onSubmit = async (data: PickupFormData) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      await createMutation.mutateAsync({
        pickup_type: data.pickupType,
        requester_name: data.requesterName,
        requester_phone: data.requesterPhone,
        pickup_address: data.pickupAddress,
        preferred_date: data.preferredDate?.toISOString().split('T')[0],
        preferred_time_slot: data.preferredTimeSlot,
        notes: data.notes,
      });
      router.replace('/pickups');
    } catch (error) {
      console.error('Pickup creation failed:', error);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setValue('preferredDate', date);
    }
  };

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title="Jadwalkan Penjemputan"
        showBackButton
        onBackPress={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            router.back();
          }
        }}
      />

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepWrapper}>
            <View style={[styles.step, step >= s && styles.stepActive]}>
              <Text style={[styles.stepText, step >= s && styles.stepTextActive]}>
                {s}
              </Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pilih Jenis Penjemputan</Text>
            <Text style={styles.stepDescription}>
              Pilih jenis penjemputan yang Anda butuhkan
            </Text>

            <Controller
              control={control}
              name="pickupType"
              render={({ field: { onChange, value } }) => (
                <View style={styles.typesContainer}>
                  {PICKUP_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeCard,
                        value === type.key && { borderColor: type.color, backgroundColor: type.color + '08' },
                      ]}
                      onPress={() => onChange(type.key)}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                        <type.icon size={28} color={type.color} />
                      </View>
                      <Text style={[styles.typeLabel, value === type.key && { color: type.color }]}>
                        {type.label}
                      </Text>
                      <Text style={styles.typeDescription}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Informasi Kontak</Text>
            <Text style={styles.stepDescription}>
              Masukkan informasi kontak dan alamat penjemputan
            </Text>

            <Controller
              control={control}
              name="requesterName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap..."
                  value={value}
                  onChangeText={onChange}
                  leftIcon={<User size={20} color={colors.gray[400]} />}
                  error={errors.requesterName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="requesterPhone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nomor Telepon"
                  placeholder="08xxxxxxxxxx"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  leftIcon={<Phone size={20} color={colors.gray[400]} />}
                  error={errors.requesterPhone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="pickupAddress"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Alamat Penjemputan"
                  placeholder="Masukkan alamat lengkap..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  leftIcon={<MapPin size={20} color={colors.gray[400]} />}
                  error={errors.pickupAddress?.message}
                />
              )}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Jadwal Penjemputan</Text>
            <Text style={styles.stepDescription}>
              Pilih jadwal penjemputan yang diinginkan (opsional)
            </Text>

            <Controller
              control={control}
              name="preferredDate"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={styles.sectionTitle}>Pilih Tanggal (Opsional)</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Card style={styles.dateCard}>
                      <View style={styles.dateRow}>
                        <Calendar size={24} color={colors.primary[600]} />
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateLabel}>Tanggal</Text>
                          <Text style={styles.dateValue}>
                            {value 
                              ? value.toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : 'Pilih tanggal'
                            }
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.gray[400]} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={value || new Date()}
                      mode="date"
                      minimumDate={new Date()}
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}
            />

            <Controller
              control={control}
              name="preferredTimeSlot"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Pilih Waktu (Opsional)</Text>
                  <View style={styles.slotsGrid}>
                    {TIME_SLOTS.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotButton,
                          value === slot && styles.slotSelected,
                        ]}
                        onPress={() => onChange(slot === value ? null : slot)}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            value === slot && styles.slotTextSelected,
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Catatan (Opsional)"
                  placeholder="Tambahkan catatan khusus..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  style={{ marginTop: 16 }}
                />
              )}
            />

            <View style={styles.infoBox}>
              <Info size={20} color={colors.primary[600]} />
              <Text style={styles.infoText}>
                Tim kami akan menghubungi Anda untuk konfirmasi jadwal penjemputan.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={step === 3 ? 'Konfirmasi' : 'Lanjut'}
            onPress={handleSubmit(onSubmit)}
            isLoading={createMutation.isPending}
            rightIcon={step < 3 ? <ChevronRight size={20} color={colors.white} /> : undefined}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: colors.primary[500],
  },
  stepText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.gray[500],
  },
  stepTextActive: {
    color: colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray[200],
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary[500],
  },
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
  typesContainer: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  typeDescription: {
    ...typography.body2,
    color: colors.gray[500],
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateCard: {
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.gray[500],
  },
  dateValue: {
    ...typography.body1,
    fontWeight: '500',
    color: colors.gray[900],
    marginTop: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    width: '48%',
    paddingVertical: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  slotText: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[700],
  },
  slotTextSelected: {
    color: colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
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
