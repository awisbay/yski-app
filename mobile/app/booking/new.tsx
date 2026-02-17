import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '@/components/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { useBookingSlots, useCreateBooking } from '@/hooks';
import { bookingSchema, type BookingFormData } from '@/lib/validation';
import { useBookingStore } from '@/stores/bookingStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00'];

export default function NewBookingScreen() {
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const bookingStore = useBookingStore();
  const createMutation = useCreateBooking();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingDate: new Date(Date.now() + 86400000),
      timeSlot: '',
      pickupAddress: '',
      dropoffAddress: '',
      notes: '',
    },
  });

  const selectedDate = watch('bookingDate');
  const selectedSlot = watch('timeSlot');
  const dateString = selectedDate.toISOString().split('T')[0];

  const { data: slotsData, isLoading: slotsLoading } = useBookingSlots(dateString);
  const availableSlots = slotsData?.slots || TIME_SLOTS.reduce((acc, slot) => ({
    ...acc,
    [slot]: true,
  }), {});

  const onSubmit = async (data: BookingFormData) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      await createMutation.mutateAsync({
        booking_date: data.bookingDate.toISOString().split('T')[0],
        time_slot: data.timeSlot,
        pickup_address: data.pickupAddress,
        dropoff_address: data.dropoffAddress,
        notes: data.notes,
      });
      router.replace('/booking');
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setValue('bookingDate', date);
      setValue('timeSlot', ''); // Reset time slot when date changes
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate;
  };

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title="Booking Baru"
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
            <Text style={styles.stepTitle}>Pilih Tanggal & Waktu</Text>
            <Text style={styles.stepDescription}>
              Pilih tanggal dan slot waktu yang tersedia untuk booking armada
            </Text>

            {/* Date Selection */}
            <Card style={styles.dateCard}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={styles.dateRow}>
                  <Calendar size={24} color={colors.primary[600]} />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Tanggal</Text>
                    <Text style={styles.dateValue}>
                      {selectedDate.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.gray[400]} />
                </View>
              </TouchableOpacity>
            </Card>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={getMinDate()}
                maximumDate={getMaxDate()}
                onChange={onDateChange}
              />
            )}

            {/* Time Slot Selection */}
            <Text style={styles.sectionTitle}>Pilih Slot Waktu</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isAvailable = availableSlots[slot] !== false;
                const isSelected = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotButton,
                      !isAvailable && styles.slotDisabled,
                      isSelected && styles.slotSelected,
                    ]}
                    onPress={() => isAvailable && setValue('timeSlot', slot)}
                    disabled={!isAvailable}
                  >
                    <Clock
                      size={16}
                      color={
                        isSelected
                          ? colors.white
                          : isAvailable
                          ? colors.gray[700]
                          : colors.gray[400]
                      }
                    />
                    <Text
                      style={[
                        styles.slotText,
                        !isAvailable && styles.slotTextDisabled,
                        isSelected && styles.slotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.timeSlot && (
              <Text style={styles.errorText}>{errors.timeSlot.message}</Text>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Detail Alamat</Text>
            <Text style={styles.stepDescription}>
              Masukkan alamat penjemputan dan tujuan pengiriman
            </Text>

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

            <Controller
              control={control}
              name="dropoffAddress"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Alamat Tujuan"
                  placeholder="Masukkan alamat lengkap..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  leftIcon={<MapPin size={20} color={colors.gray[400]} />}
                  error={errors.dropoffAddress?.message}
                />
              )}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Konfirmasi Booking</Text>
            <Text style={styles.stepDescription}>
              Periksa kembali detail booking Anda sebelum konfirmasi
            </Text>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Detail Booking</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tanggal</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Waktu</Text>
                <Text style={styles.summaryValue}>{selectedSlot}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.summaryLabel}>Alamat Penjemputan</Text>
              <Text style={styles.summaryAddress}>{watch('pickupAddress')}</Text>
              
              <Text style={[styles.summaryLabel, { marginTop: 12 }]}>Alamat Tujuan</Text>
              <Text style={styles.summaryAddress}>{watch('dropoffAddress')}</Text>
            </Card>

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
                />
              )}
            />

            <View style={styles.infoBox}>
              <AlertCircle size={20} color={colors.primary[600]} />
              <Text style={styles.infoText}>
                Dengan mengkonfirmasi, Anda setuju dengan syarat dan ketentuan yang berlaku.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={step === 3 ? 'Konfirmasi Booking' : 'Lanjut'}
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
  dateCard: {
    marginBottom: 24,
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
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotDisabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.5,
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
  slotTextDisabled: {
    color: colors.gray[400],
  },
  slotTextSelected: {
    color: colors.white,
  },
  errorText: {
    ...typography.caption,
    color: colors.error[600],
    marginTop: 8,
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
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  summaryAddress: {
    ...typography.body2,
    color: colors.gray[700],
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
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
