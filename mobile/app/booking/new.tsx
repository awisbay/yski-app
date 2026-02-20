import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ArrowLeftRight,
  Info,
  Calendar,
  FileText,
  CheckCircle2,
  Navigation2,
  AlertCircle,
} from 'lucide-react-native';
import { MapPicker, LocationPoint } from '@/components/MapPicker';
import { useCreateBooking, useBookingSlots } from '@/hooks';
import { bookingSchema, type BookingFormData } from '@/lib/validation';
import { colors } from '@/constants/colors';

const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00'];
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const STEPS = [
  { icon: Clock,        label: 'Jadwal'     },
  { icon: MapPin,       label: 'Lokasi'     },
  { icon: CheckCircle2, label: 'Konfirmasi' },
];

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfMonth(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

async function fetchRoute(
  pickup: LocationPoint,
  dropoff: LocationPoint,
): Promise<RouteInfo | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}` +
      `?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const route = data.routes[0];
    // Apply 1.4× multiplier to account for traffic & real-world conditions
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round((route.duration / 60) * 1.4),
    };
  } catch {
    return null;
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function NewBookingScreen() {
  const insets = useSafeAreaInsets();
  const createMutation = useCreateBooking();

  // form
  const { control, trigger, watch, setValue, formState: { errors } } =
    useForm<BookingFormData>({
      resolver: zodResolver(bookingSchema),
      defaultValues: {
        bookingDate: new Date(Date.now() + 86400000),
        timeSlots: [],
        pickupAddress: '',
        dropoffAddress: '',
        purpose: '',
        notes: '',
      },
    });

  const selectedDate  = watch('bookingDate');
  const selectedSlots = watch('timeSlots');
  const dateString    = selectedDate.toISOString().split('T')[0];

  const { data: slotsData } = useBookingSlots(dateString);
  const availableSlots: Record<string, boolean> = useMemo(() => {
    const mapped = TIME_SLOTS.reduce<Record<string, boolean>>((acc, slot) => {
      acc[slot] = true;
      return acc;
    }, {});
    const slots = slotsData?.slots;
    if (Array.isArray(slots)) {
      slots.forEach((entry: any) => {
        if (entry?.time) {
          mapped[entry.time] = entry.available !== false;
        }
      });
    }
    return mapped;
  }, [slotsData]);

  // wizard
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // calendar navigation
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const minDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; }, [today]);
  const maxDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 30); return d; }, [today]);
  const [calMonth, setCalMonth] = useState(new Date(minDate.getFullYear(), minDate.getMonth(), 1));

  // map
  const [pickupLoc,  setPickupLoc]  = useState<LocationPoint | null>(null);
  const [dropoffLoc, setDropoffLoc] = useState<LocationPoint | null>(null);
  const [mapTarget,  setMapTarget]  = useState<'pickup' | 'dropoff' | null>(null);

  // route info
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  useEffect(() => {
    if (!pickupLoc || !dropoffLoc) {
      setRouteInfo(null);
      return;
    }
    let cancelled = false;
    setIsFetchingRoute(true);
    fetchRoute(pickupLoc, dropoffLoc).then((info) => {
      if (!cancelled) {
        setRouteInfo(info);
        setIsFetchingRoute(false);
      }
    });
    return () => { cancelled = true; };
  }, [pickupLoc, dropoffLoc]);

  const handleMapConfirm = (loc: LocationPoint) => {
    if (mapTarget === 'pickup') {
      setPickupLoc(loc);
      setValue('pickupAddress', loc.address);
    } else {
      setDropoffLoc(loc);
      setValue('dropoffAddress', loc.address);
    }
    setMapTarget(null);
  };

  const swapLocations = () => {
    const tmpLoc  = pickupLoc;
    const tmpAddr = watch('pickupAddress');
    setPickupLoc(dropoffLoc);
    setValue('pickupAddress', watch('dropoffAddress'));
    setDropoffLoc(tmpLoc);
    setValue('dropoffAddress', tmpAddr);
  };

  // Per-step validation then advance
  const handleNext = async () => {
    setSubmitError(null);
    if (step === 1) {
      const ok = await trigger(['bookingDate', 'timeSlots']);
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await trigger(['pickupAddress', 'dropoffAddress']);
      if (ok) setStep(3);
    } else {
      const ok = await trigger(['purpose']);
      if (!ok) return;
      // Final submit
      try {
        const slots = watch('timeSlots');
        if (!slots.length) {
          setSubmitError('Pilih minimal 1 slot waktu.');
          return;
        }

        const failures: string[] = [];
        for (const slot of slots) {
          try {
            await createMutation.mutateAsync({
              booking_date:    watch('bookingDate').toISOString().split('T')[0],
              time_slot:       slot,
              pickup_address:  watch('pickupAddress'),
              pickup_lat:      pickupLoc?.latitude,
              pickup_lng:      pickupLoc?.longitude,
              dropoff_address: watch('dropoffAddress'),
              dropoff_lat:     dropoffLoc?.latitude,
              dropoff_lng:     dropoffLoc?.longitude,
              purpose:         watch('purpose'),
              notes:           watch('notes'),
            });
          } catch {
            failures.push(slot);
          }
        }
        if (failures.length > 0) {
          setSubmitError(`Beberapa slot gagal dipesan: ${failures.join(', ')}`);
          return;
        }
        router.replace('/booking');
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        // FastAPI may return detail as an array of validation issue objects
        const message = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg ?? String(d)).join(', ')
          : err?.message ?? 'Gagal membuat booking. Silakan coba lagi.';
        setSubmitError(String(message));
      }
    }
  };

  // Toggle a slot in/out of the selected array
  const toggleSlot = (slot: string) => {
    const current = watch('timeSlots');
    if (current.includes(slot)) {
      setValue('timeSlots', current.filter((s) => s !== slot), { shouldValidate: true });
      return;
    }
    setValue('timeSlots', [...current, slot], { shouldValidate: true });
  };

  const goBack = () => {
    setSubmitError(null);
    step > 1 ? setStep(s => s - 1) : router.back();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep((s) => s - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  // ── calendar render ──
  const calYear  = calMonth.getFullYear();
  const calMon   = calMonth.getMonth();
  const totalDays = daysInMonth(calYear, calMon);
  const firstDay  = firstDayOfMonth(calYear, calMon);

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const handleDayPress = (day: number) => {
    const d = new Date(calYear, calMon, day);
    if (d < minDate || d > maxDate) return;
    setValue('bookingDate', d);
    setValue('timeSlots', []);
  };

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const canGoPrev = calMonth > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canGoNext = calMonth < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  // ── route card ──
  const RouteCard = () => {
    if (!pickupLoc || !dropoffLoc) return null;
    return (
      <View style={styles.routeCard}>
        <View style={styles.routeCardHeader}>
          <Navigation2 size={15} color={colors.primary[600]} />
          <Text style={styles.routeCardTitle}>Estimasi Perjalanan</Text>
        </View>
        {isFetchingRoute ? (
          <View style={styles.routeLoading}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={styles.routeLoadingText}>Menghitung rute…</Text>
          </View>
        ) : routeInfo ? (
          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{routeInfo.distanceKm} km</Text>
              <Text style={styles.routeStatLabel}>Jarak</Text>
            </View>
            <View style={styles.routeStatDivider} />
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>±{routeInfo.durationMin} mnt</Text>
              <Text style={styles.routeStatLabel}>Est. waktu (dgn macet)</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.routeUnavailable}>Tidak dapat menghitung rute</Text>
        )}
      </View>
    );
  };

  // ── shared map thumbnail ──
  const MapThumb = ({
    loc, label, onPress, error,
  }: { loc: LocationPoint | null; label: string; onPress: () => void; error?: string }) => (
    <View style={styles.locFieldWrapper}>
      <Text style={styles.locLabel}>{label}</Text>
      <TouchableOpacity style={styles.mapThumb} onPress={onPress} activeOpacity={0.88}>
        {loc ? (
          <>
            <MapView
              style={StyleSheet.absoluteFill}
              region={{ latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
              scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
              pointerEvents="none"
            >
              <Marker coordinate={{ latitude: loc.latitude, longitude: loc.longitude }} />
            </MapView>
            <View style={styles.mapAddrPill}>
              <MapPin size={11} color={colors.primary[700]} />
              <Text style={styles.mapAddrText} numberOfLines={1}>{loc.address}</Text>
            </View>
          </>
        ) : (
          <View style={styles.mapEmpty}>
            <MapPin size={30} color={colors.primary[300]} />
            <Text style={styles.mapEmptyText}>Ketuk untuk pilih lokasi</Text>
          </View>
        )}
        <View style={styles.mapChangeBtn}>
          <MapPin size={11} color={colors.white} />
          <Text style={styles.mapChangeBtnText}>{loc ? 'Ganti Lokasi' : 'Pilih dari Peta'}</Text>
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Green Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Layanan Pickup</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Progress strip ── */}
      <View style={styles.progressStrip}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${((step - 1) / 2) * 100 + 16.67}%` }]} />
        </View>
        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done   = step > n;
            const active = step === n;
            return (
              <View key={s.label} style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                  <s.icon size={15} color={done || active ? colors.white : colors.gray[400]} />
                </View>
                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.stepCounter}>Langkah {step}/3</Text>
      </View>

      {/* ── White Panel ── */}
      <View style={styles.panel}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ════ STEP 1 ════ */}
          {step === 1 && (
            <View>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Calendar size={18} color={colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Pilih Tanggal Penjemputan</Text>
                </View>

                <View style={styles.calendarCard}>
                  <View style={styles.calNavRow}>
                    <TouchableOpacity
                      style={[styles.calNavBtn, !canGoPrev && { opacity: 0.3 }]}
                      onPress={prevMonth} disabled={!canGoPrev}
                    >
                      <ChevronLeft size={18} color={colors.gray[700]} />
                    </TouchableOpacity>
                    <Text style={styles.calMonthLabel}>
                      {MONTHS[calMon]} {calYear}
                    </Text>
                    <TouchableOpacity
                      style={[styles.calNavBtn, !canGoNext && { opacity: 0.3 }]}
                      onPress={nextMonth} disabled={!canGoNext}
                    >
                      <ChevronRight size={18} color={colors.gray[700]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.calDaysHeader}>
                    {DAYS.map(d => (
                      <Text key={d} style={styles.calDayName}>{d}</Text>
                    ))}
                  </View>

                  <View style={styles.calGrid}>
                    {calCells.map((day, idx) => {
                      if (!day) return <View key={`e-${idx}`} style={styles.calCell} />;
                      const d = new Date(calYear, calMon, day);
                      const isSelected = isSameDay(d, selectedDate);
                      const isDisabled = d < minDate || d > maxDate;
                      const isToday    = isSameDay(d, today);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.calCell,
                            isSelected && styles.calCellSelected,
                            isToday && !isSelected && styles.calCellToday,
                          ]}
                          onPress={() => handleDayPress(day)}
                          disabled={isDisabled}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.calDayText,
                            isDisabled  && styles.calDayDisabled,
                            isSelected  && styles.calDaySelected,
                            isToday && !isSelected && styles.calDayToday,
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Clock size={18} color={colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Pilih Waktu</Text>
                </View>
                <Text style={styles.slotHint}>
                  Pilih satu atau beberapa slot waktu
                </Text>
                <View style={styles.slotsGrid}>
                  {TIME_SLOTS.map(slot => {
                    const isAvail    = availableSlots[slot] !== false;
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotPill,
                          isSelected  && styles.slotPillSelected,
                          !isAvail    && styles.slotPillDisabled,
                        ]}
                        onPress={() => isAvail && toggleSlot(slot)}
                        disabled={!isAvail}
                        activeOpacity={0.75}
                      >
                        {isSelected
                          ? <CheckCircle2 size={15} color={colors.white} />
                          : <Clock size={15} color={isAvail ? colors.primary[600] : colors.gray[400]} />
                        }
                        <Text style={[
                          styles.slotText,
                          isSelected && styles.slotTextSelected,
                          !isAvail   && styles.slotTextDisabled,
                        ]}>
                          {slot}
                        </Text>
                        {!isAvail && <Text style={styles.slotFullBadge}>Penuh</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedSlots.length > 0 && (
                  <View style={styles.slotSummary}>
                    <Clock size={13} color={colors.primary[600]} />
                    <Text style={styles.slotSummaryText}>
                      Dipilih: {selectedSlots.join(', ')}
                    </Text>
                  </View>
                )}
                {errors.timeSlots && (
                  <Text style={styles.fieldError}>{errors.timeSlots.message}</Text>
                )}
              </View>
            </View>
          )}

          {/* ════ STEP 2 ════ */}
          {step === 2 && (
            <View>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <MapPin size={18} color={colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Detail Lokasi</Text>
                </View>

                <MapThumb
                  loc={pickupLoc}
                  label="ALAMAT PENJEMPUTAN"
                  onPress={() => setMapTarget('pickup')}
                  error={errors.pickupAddress?.message}
                />

                <View style={styles.swapRow}>
                  <View style={styles.swapLine} />
                  <TouchableOpacity style={styles.swapBtn} onPress={swapLocations}>
                    <ArrowLeftRight size={16} color={colors.white} />
                  </TouchableOpacity>
                  <View style={styles.swapLine} />
                </View>

                <MapThumb
                  loc={dropoffLoc}
                  label="ALAMAT TUJUAN"
                  onPress={() => setMapTarget('dropoff')}
                  error={errors.dropoffAddress?.message}
                />
              </View>

              {/* Route card */}
              <RouteCard />

              <View style={styles.infoBox}>
                <Info size={18} color={colors.primary[600]} />
                <Text style={styles.infoText}>
                  Layanan ini <Text style={{ fontWeight: '700' }}>sepenuhnya gratis</Text> untuk
                  masyarakat yang membutuhkan, didukung oleh{' '}
                  <Text style={{ fontWeight: '700' }}>Yayasan Sahabat Khairat Indonesia</Text>.
                  Tim kami akan melakukan verifikasi sebelum menyetujui jadwal.
                </Text>
              </View>
            </View>
          )}

          {/* ════ STEP 3 ════ */}
          {step === 3 && (
            <View>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <FileText size={18} color={colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Konfirmasi Booking</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Periksa kembali detail sebelum konfirmasi
                </Text>

                {/* Summary card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary[50] }]}>
                      <Calendar size={14} color={colors.primary[600]} />
                    </View>
                    <View style={styles.summaryTextCol}>
                      <Text style={styles.summaryLbl}>Tanggal</Text>
                      <Text style={styles.summaryVal}>
                        {selectedDate.toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.primary[50] }]}>
                      <Clock size={14} color={colors.primary[600]} />
                    </View>
                    <View style={styles.summaryTextCol}>
                      <Text style={styles.summaryLbl}>Waktu</Text>
                      <Text style={styles.summaryVal}>{selectedSlots.join(', ')}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#FFF1F2' }]}>
                      <MapPin size={14} color="#E11D48" />
                    </View>
                    <View style={styles.summaryTextCol}>
                      <Text style={styles.summaryLbl}>Titik Jemput</Text>
                      <Text style={styles.summaryVal}>{watch('pickupAddress')}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.secondary[50] }]}>
                      <MapPin size={14} color={colors.secondary[600]} />
                    </View>
                    <View style={styles.summaryTextCol}>
                      <Text style={styles.summaryLbl}>Titik Tujuan</Text>
                      <Text style={styles.summaryVal}>{watch('dropoffAddress')}</Text>
                    </View>
                  </View>

                  {/* Route summary row */}
                  {routeInfo && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#F0FDF4' }]}>
                          <Navigation2 size={14} color="#16A34A" />
                        </View>
                        <View style={styles.summaryTextCol}>
                          <Text style={styles.summaryLbl}>Estimasi Perjalanan</Text>
                          <Text style={styles.summaryVal}>
                            {routeInfo.distanceKm} km · ±{routeInfo.durationMin} menit (termasuk estimasi macet)
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Notes */}
                <Text style={styles.notesLabel}>Keperluan</Text>
                <Controller
                  control={control}
                  name="purpose"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.purposeInput}
                      placeholder="Contoh: Pindahan rumah, angkut barang UMKM, dll."
                      placeholderTextColor={colors.gray[400]}
                      value={value || ''}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.purpose && (
                  <Text style={styles.fieldError}>{errors.purpose.message}</Text>
                )}

                <Text style={styles.notesLabel}>Catatan (Opsional)</Text>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Tambahkan catatan khusus untuk tim kami…"
                      placeholderTextColor={colors.gray[400]}
                      value={value || ''}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  )}
                />

                {/* Submit error */}
                {submitError && (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color={colors.error[600]} />
                    <Text style={styles.errorBoxText}>{submitError}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoBox}>
                <Info size={18} color={colors.primary[600]} />
                <Text style={styles.infoText}>
                  Dengan mengkonfirmasi, Anda menyetujui{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary[600] }}>
                    Syarat &amp; Ketentuan
                  </Text>{' '}
                  layanan Yayasan Sahabat Khairat Indonesia.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Sticky Footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.footerSecondaryBtn}
            onPress={goBack}
            activeOpacity={0.85}
          >
            <ChevronLeft size={18} color={colors.primary[700]} />
            <Text style={styles.footerSecondaryBtnText}>Kembali</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.footerBtn, createMutation.isPending && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.footerBtnText}>
                {step === 3 ? 'Konfirmasi Pemesanan' : 'Lanjutkan'}
              </Text>
              <ChevronRight size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Layanan pickup gratis — didukung YSKI
        </Text>
      </View>

      {/* ── MapPicker Modal ── */}
      <MapPicker
        visible={mapTarget !== null}
        title={mapTarget === 'pickup' ? 'Titik Penjemputan' : 'Titik Tujuan'}
        initialCoords={
          mapTarget === 'pickup' && pickupLoc
            ? { latitude: pickupLoc.latitude, longitude: pickupLoc.longitude }
            : mapTarget === 'dropoff' && dropoffLoc
            ? { latitude: dropoffLoc.latitude, longitude: dropoffLoc.longitude }
            : undefined
        }
        onClose={() => setMapTarget(null)}
        onConfirm={handleMapConfirm}
      />
    </View>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[700] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '700', color: colors.white,
  },

  // Progress
  progressStrip: {
    backgroundColor: colors.primary[800],
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
  },
  progressBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: colors.primary[300],
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: { alignItems: 'center', gap: 5 },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepActive: { backgroundColor: colors.primary[500] },
  stepDone:   { backgroundColor: colors.primary[400] },
  stepLabel: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  stepLabelActive: { color: colors.white },
  stepCounter: {
    fontSize: 11, color: 'rgba(255,255,255,0.45)',
    textAlign: 'right', marginTop: 10, fontWeight: '500',
  },

  // Panel
  panel: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: { padding: 20 },

  // Section
  sectionBlock: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.gray[900],
  },
  sectionSubtitle: {
    fontSize: 13, color: colors.gray[500], marginBottom: 16, marginTop: -8,
  },

  // Calendar
  calendarCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  calNavRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  calNavBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.gray[200],
  },
  calMonthLabel: {
    fontSize: 14, fontWeight: '700', color: colors.gray[900],
  },
  calDaysHeader: {
    flexDirection: 'row', marginBottom: 6,
  },
  calDayName: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700',
    color: colors.gray[400],
  },
  calGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 8,
  },
  calCellSelected: { backgroundColor: colors.primary[600] },
  calCellToday: { backgroundColor: colors.primary[50] },
  calDayText: {
    fontSize: 13, fontWeight: '500', color: colors.gray[800],
  },
  calDayDisabled: { color: colors.gray[300] },
  calDaySelected: { color: colors.white, fontWeight: '700' },
  calDayToday: { color: colors.primary[600], fontWeight: '700' },

  // Slots
  slotHint: {
    fontSize: 12, color: colors.gray[500], marginBottom: 10,
  },
  slotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  slotPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 50,
    borderWidth: 1.5, borderColor: colors.primary[300],
    backgroundColor: colors.white,
  },
  slotPillSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  slotPillDisabled: {
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  slotText: {
    fontSize: 14, fontWeight: '600', color: colors.primary[600],
  },
  slotTextSelected: { color: colors.white },
  slotTextDisabled: { color: colors.gray[400] },
  slotFullBadge: {
    fontSize: 9, fontWeight: '700', color: colors.error[500],
    textTransform: 'uppercase',
  },
  slotSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, marginTop: 12,
    borderWidth: 1, borderColor: colors.primary[100],
  },
  slotSummaryText: {
    fontSize: 13, fontWeight: '600', color: colors.primary[700],
  },

  // Map location fields
  locFieldWrapper: { marginBottom: 4 },
  locLabel: {
    fontSize: 10, fontWeight: '700',
    color: colors.gray[500], letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 6, marginLeft: 2,
  },
  mapThumb: {
    height: 140, borderRadius: 16,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.gray[200],
  },
  mapEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  mapEmptyText: {
    fontSize: 13, color: colors.primary[400], fontWeight: '500',
  },
  mapAddrPill: {
    position: 'absolute', bottom: 38, left: 10, right: 50,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  mapAddrText: {
    fontSize: 11, color: colors.gray[800], fontWeight: '600', flex: 1,
  },
  mapChangeBtn: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  mapChangeBtnText: {
    fontSize: 10, fontWeight: '700', color: colors.white,
  },

  // Swap
  swapRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginVertical: 10,
  },
  swapLine: { flex: 1, height: 1, backgroundColor: colors.gray[200] },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary[600],
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  // Route card
  routeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  routeCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  routeCardTitle: {
    fontSize: 13, fontWeight: '700', color: '#15803D',
  },
  routeLoading: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  routeLoadingText: {
    fontSize: 13, color: colors.gray[500],
  },
  routeStats: {
    flexDirection: 'row', alignItems: 'center',
  },
  routeStat: {
    flex: 1, alignItems: 'center',
  },
  routeStatValue: {
    fontSize: 20, fontWeight: '800', color: '#15803D',
  },
  routeStatLabel: {
    fontSize: 11, color: '#166534', fontWeight: '500', marginTop: 2,
  },
  routeStatDivider: {
    width: 1, height: 36, backgroundColor: '#86EFAC',
  },
  routeUnavailable: {
    fontSize: 12, color: colors.gray[500],
  },

  // Info box
  infoBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: colors.primary[50],
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.primary[100],
    marginTop: 12,
  },
  infoText: {
    flex: 1, fontSize: 12,
    color: colors.gray[700], lineHeight: 18,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16, borderWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, padding: 14,
  },
  summaryIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  summaryTextCol: { flex: 1 },
  summaryDivider: { height: 1, backgroundColor: colors.gray[50], marginHorizontal: 14 },
  summaryLbl: { fontSize: 11, color: colors.gray[400], fontWeight: '600', marginBottom: 2 },
  summaryVal: { fontSize: 13, color: colors.gray[900], fontWeight: '600', lineHeight: 18 },

  // Notes
  notesLabel: {
    fontSize: 13, fontWeight: '600',
    color: colors.gray[700], marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1.5, borderColor: colors.gray[200],
    borderRadius: 14, padding: 14,
    fontSize: 14, color: colors.gray[900],
    minHeight: 90,
  },
  purposeInput: {
    borderWidth: 1.5, borderColor: colors.gray[200],
    borderRadius: 14, padding: 14,
    fontSize: 14, color: colors.gray[900],
    minHeight: 52,
    marginBottom: 12,
  },

  // Error
  fieldError: {
    fontSize: 12, color: colors.error[500],
    marginTop: 5, marginLeft: 2,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.error[50],
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.error[200],
    marginTop: 14,
  },
  errorBoxText: {
    flex: 1, fontSize: 13, color: colors.error[700],
    lineHeight: 18, fontWeight: '500',
  },

  // Footer
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1, borderTopColor: colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, borderRadius: 14,
    backgroundColor: colors.primary[600],
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  footerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  footerSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
  },
  footerBtnText: {
    fontSize: 15, fontWeight: '700', color: colors.white, letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 10, color: colors.gray[400],
    textAlign: 'center', marginTop: 8, fontWeight: '500',
  },
});
