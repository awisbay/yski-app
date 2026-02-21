import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';

type DailySchedule = {
  tanggal: number;
  tanggal_lengkap: string;
  hari: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

type PrayerName = 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';

type NextPrayer = {
  name: PrayerName;
  time: string;
  minutesRemaining: number;
  label: string;
};

type PrayerTimesState = {
  locationLabel: string;
  province: string;
  city: string;
  todaySchedule: DailySchedule | null;
  nextPrayer: NextPrayer | null;
  loading: boolean;
  error: string | null;
};

const EQURAN_BASE = 'https://equran.id/api/v2';

function normalizeText(value: string) {
  return (value || '')
    .toLowerCase()
    .replace(/^provinsi\s+/i, '')
    .replace(/^kota\s+/i, '')
    .replace(/^kab\.\s+/i, '')
    .replace(/^kabupaten\s+/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(target: string, candidates: string[]) {
  const normalizedTarget = normalizeText(target);
  if (!normalizedTarget) return null;

  const exact = candidates.find((candidate) => normalizeText(candidate) === normalizedTarget);
  if (exact) return exact;

  const includes = candidates.find((candidate) => {
    const n = normalizeText(candidate);
    return n.includes(normalizedTarget) || normalizedTarget.includes(n);
  });
  if (includes) return includes;

  return null;
}

function parseTimeToDate(baseDate: Date, hhmm: string) {
  const [hourRaw, minuteRaw] = hhmm.split(':');
  const hour = Number(hourRaw || 0);
  const minute = Number(minuteRaw || 0);
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    0,
    0
  );
}

function computeNextPrayer(today: DailySchedule | null, allSchedules: DailySchedule[] = []): NextPrayer | null {
  if (!today) return null;

  const now = new Date();
  const prayerSlots: Array<{ key: PrayerName; time: string }> = [
    { key: 'Subuh', time: today.subuh },
    { key: 'Dzuhur', time: today.dzuhur },
    { key: 'Ashar', time: today.ashar },
    { key: 'Maghrib', time: today.maghrib },
    { key: 'Isya', time: today.isya },
  ];

  for (const slot of prayerSlots) {
    const targetTime = parseTimeToDate(now, slot.time);
    if (targetTime.getTime() > now.getTime()) {
      const diffMinutes = Math.max(1, Math.ceil((targetTime.getTime() - now.getTime()) / 60000));
      return {
        name: slot.key,
        time: slot.time,
        minutesRemaining: diffMinutes,
        label: `${diffMinutes} menit lagi`,
      };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const tomorrowSchedule = allSchedules.find((item) => item.tanggal_lengkap === tomorrowKey);
  const fallbackTime = tomorrowSchedule?.subuh || today.subuh;
  const tomorrowSubuh = parseTimeToDate(tomorrow, fallbackTime);
  const diffMinutes = Math.max(1, Math.ceil((tomorrowSubuh.getTime() - now.getTime()) / 60000));

  return {
    name: 'Subuh',
    time: fallbackTime,
    minutesRemaining: diffMinutes,
    label: `${diffMinutes} menit lagi`,
  };
}

export function usePrayerTimes() {
  const [state, setState] = useState<PrayerTimesState>({
    locationLabel: 'Memuat lokasi...',
    province: '',
    city: '',
    todaySchedule: null,
    nextPrayer: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Izin lokasi belum diberikan.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocodes = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const geocode = geocodes?.[0];
      const rawProvince = geocode?.region || '';
      const rawCity = geocode?.city || geocode?.subregion || geocode?.district || '';

      const provinceRes = await fetch(`${EQURAN_BASE}/shalat/provinsi`);
      const provinceJson = await provinceRes.json();
      const provinces: string[] = provinceJson?.data || [];
      const matchedProvince = findBestMatch(rawProvince, provinces) || rawProvince;
      if (!matchedProvince) {
        throw new Error('Provinsi tidak ditemukan dari lokasi.');
      }

      const cityRes = await fetch(`${EQURAN_BASE}/shalat/kabkota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinsi: matchedProvince }),
      });
      const cityJson = await cityRes.json();
      const cities: string[] = cityJson?.data || [];
      const matchedCity = findBestMatch(rawCity, cities) || cities[0] || rawCity;
      if (!matchedCity) {
        throw new Error('Kab/Kota tidak ditemukan dari lokasi.');
      }

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const scheduleRes = await fetch(`${EQURAN_BASE}/shalat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provinsi: matchedProvince,
          kabkota: matchedCity,
          bulan: month,
          tahun: year,
        }),
      });
      const scheduleJson = await scheduleRes.json();
      const allSchedules: DailySchedule[] = scheduleJson?.data?.jadwal || [];
      const todayKey = now.toISOString().slice(0, 10);
      const todaySchedule =
        allSchedules.find((item) => item.tanggal_lengkap === todayKey) ||
        allSchedules.find((item) => item.tanggal === now.getDate()) ||
        null;

      const nextPrayer = computeNextPrayer(todaySchedule, allSchedules);
      const locationLabel = `${matchedCity}, ${matchedProvince}`;

      setState({
        locationLabel,
        province: matchedProvince,
        city: matchedCity,
        todaySchedule,
        nextPrayer,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || 'Gagal memuat jadwal sholat.',
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const times = useMemo(() => {
    if (!state.todaySchedule) return null;
    return [
      { label: 'Subuh', value: state.todaySchedule.subuh },
      { label: 'Dzuhur', value: state.todaySchedule.dzuhur },
      { label: 'Ashar', value: state.todaySchedule.ashar },
      { label: 'Maghrib', value: state.todaySchedule.maghrib },
      { label: 'Isya', value: state.todaySchedule.isya },
    ];
  }, [state.todaySchedule]);

  return {
    ...state,
    times,
    refresh,
  };
}
