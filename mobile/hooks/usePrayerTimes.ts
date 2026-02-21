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
    .replace(/daerah khusus ibukota jakarta/gi, 'dki jakarta')
    .replace(/daerah istimewa yogyakarta/gi, 'di yogyakarta')
    .replace(/d\.?k\.?i\.?/gi, 'dki')
    .replace(/adm\.?/gi, 'administrasi')
    .replace(/^provinsi\s+/i, '')
    .replace(/^kota\s+/i, '')
    .replace(/^kota administrasi\s+/i, '')
    .replace(/^kabupaten administrasi\s+/i, '')
    .replace(/^kab\.\s+/i, '')
    .replace(/^kabupaten\s+/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pushUnique(target: string[], value?: string | null) {
  const cleaned = (value || '').trim();
  if (!cleaned) return;
  if (!target.some((item) => normalizeText(item) === normalizeText(cleaned))) {
    target.push(cleaned);
  }
}

function scorePair(candidate: string, target: string) {
  const c = normalizeText(candidate);
  const t = normalizeText(target);
  if (!c || !t) return 0;
  if (c === t) return 100;
  if (c.includes(t) || t.includes(c)) return 88;

  const cTokens = new Set(c.split(' ').filter(Boolean));
  const tTokens = new Set(t.split(' ').filter(Boolean));
  const intersectionSize = [...cTokens].filter((x) => tTokens.has(x)).length;
  if (!intersectionSize) return 0;

  const unionSize = new Set([...cTokens, ...tTokens]).size;
  const jaccard = intersectionSize / Math.max(unionSize, 1);
  return Math.round(jaccard * 80);
}

function findBestFromTargets(candidates: string[], targets: string[]) {
  if (!candidates.length || !targets.length) return null;

  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    let score = 0;
    for (const target of targets) {
      score = Math.max(score, scorePair(candidate, target));
    }
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  if (bestScore < 45) return null;
  return bestCandidate;
}

async function getTaggedLocationCandidates(latitude: number, longitude: number) {
  const provinceCandidates: string[] = [];
  const cityCandidates: string[] = [];
  let locationLabel = '';

  const geocodes = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });
  const geocode = geocodes?.[0];
  if (geocode) {
    pushUnique(provinceCandidates, geocode.region);
    pushUnique(provinceCandidates, geocode.subregion);
    pushUnique(cityCandidates, geocode.city);
    pushUnique(cityCandidates, geocode.district);
    pushUnique(cityCandidates, geocode.subregion);

    const cityDisplay = geocode.city || geocode.subregion || geocode.district || '';
    const provinceDisplay = geocode.region || '';
    locationLabel = [cityDisplay, provinceDisplay].filter(Boolean).join(', ');
  }

  // Ambil detail wilayah dari geocoding map (OSM reverse) sebagai sumber tagging tambahan.
  try {
    const nominatimUrl =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const reverseRes = await fetch(nominatimUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'yski-mobile-app',
      },
    });
    const reverseJson = await reverseRes.json();
    const address = reverseJson?.address || {};

    pushUnique(provinceCandidates, address.state);
    pushUnique(provinceCandidates, address.province);
    pushUnique(provinceCandidates, address.region);

    pushUnique(cityCandidates, address.city);
    pushUnique(cityCandidates, address.county);
    pushUnique(cityCandidates, address.town);
    pushUnique(cityCandidates, address.municipality);
    pushUnique(cityCandidates, address.city_district);
    pushUnique(cityCandidates, address.state_district);

    if (!locationLabel && reverseJson?.display_name) {
      locationLabel = String(reverseJson.display_name)
        .split(',')
        .slice(0, 2)
        .join(',')
        .trim();
    }
  } catch {
    // non-blocking fallback to expo reverse geocode
  }

  return {
    provinceCandidates,
    cityCandidates,
    locationLabel,
  };
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

      const tagged = await getTaggedLocationCandidates(
        position.coords.latitude,
        position.coords.longitude
      );

      const provinceRes = await fetch(`${EQURAN_BASE}/shalat/provinsi`);
      const provinceJson = await provinceRes.json();
      const provinces: string[] = provinceJson?.data || [];
      const matchedProvince = findBestFromTargets(provinces, tagged.provinceCandidates);
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
      const matchedCity =
        findBestFromTargets(cities, tagged.cityCandidates) ||
        findBestFromTargets(cities, [tagged.locationLabel]) ||
        cities[0];
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
