import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  FlatList,
  Keyboard,
  Alert,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, MapPin, Check, Navigation2, Search, LocateFixed } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GOOGLE_PLACES_API_KEY } from '@/constants/config';

const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
}

interface SearchResult {
  id: string;
  display_name: string;
  lat?: string;
  lon?: string;
  google_place_id?: string;
}

interface MapPickerProps {
  visible: boolean;
  title?: string;
  initialCoords?: { latitude: number; longitude: number };
  onClose: () => void;
  onConfirm: (location: LocationPoint) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`,
      { headers: { 'User-Agent': 'YSKIApp/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road,
      a.neighbourhood || a.suburb || a.village,
      a.city_district || a.town || a.city || a.county,
      a.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query.trim());

  if (GOOGLE_PLACES_API_KEY) {
    try {
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&components=country:id&language=id&key=${GOOGLE_PLACES_API_KEY}`
      );
      const googleData = await googleRes.json();

      if (googleData?.status === 'OK' && Array.isArray(googleData.predictions)) {
        return googleData.predictions.slice(0, 8).map((p: any) => ({
          id: `g-${p.place_id}`,
          display_name: p.description,
          google_place_id: p.place_id,
        }));
      }
    } catch {
      // fallback to OSM
    }
  }

  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=8&countrycodes=id&accept-language=id`,
      { headers: { 'User-Agent': 'YSKIApp/1.0' } }
    );
    const osmData = await osmRes.json();
    if (!Array.isArray(osmData)) return [];

    return osmData.map((item: any) => ({
      id: `o-${item.place_id}`,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch {
    return [];
  }
}

async function getGooglePlaceCoordinates(placeId: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  try {
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry/location,formatted_address&language=id&key=${GOOGLE_PLACES_API_KEY}`
    );
    const detailsData = await detailsRes.json();

    if (detailsData?.status !== 'OK' || !detailsData.result?.geometry?.location) {
      return null;
    }

    return {
      lat: detailsData.result.geometry.location.lat,
      lng: detailsData.result.geometry.location.lng,
      address: detailsData.result.formatted_address || '',
    };
  } catch {
    return null;
  }
}

export function MapPicker({
  visible,
  title = 'Pilih Lokasi',
  initialCoords,
  onClose,
  onConfirm,
}: MapPickerProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = initialCoords
    ? { ...initialCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  const [currentRegion, setCurrentRegion] = useState<Region>(initialRegion);
  const [address, setAddress] = useState('Geser peta untuk memilih lokasi…');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleRegionChangeComplete = useCallback(async (region: Region) => {
    setCurrentRegion(region);
    setIsGeocoding(true);
    const addr = await reverseGeocode(region.latitude, region.longitude);
    setAddress(addr);
    setIsGeocoding(false);
  }, []);

  const handleConfirm = () => {
    onConfirm({ latitude: currentRegion.latitude, longitude: currentRegion.longitude, address });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlaces(text);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectResult = async (result: SearchResult) => {
    let lat: number | null = null;
    let lng: number | null = null;
    let resultAddress = result.display_name;

    if (result.google_place_id) {
      const placeDetails = await getGooglePlaceCoordinates(result.google_place_id);
      if (placeDetails) {
        lat = placeDetails.lat;
        lng = placeDetails.lng;
        resultAddress = placeDetails.address || result.display_name;
      }
    }

    if (lat === null || lng === null) {
      if (!result.lat || !result.lon) return;
      lat = parseFloat(result.lat);
      lng = parseFloat(result.lon);
    }

    const region: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setCurrentRegion(region);
    mapRef.current?.animateToRegion(region, 650);
    setAddress(resultAddress);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const handleCloseSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin lokasi dibutuhkan', 'Aktifkan izin lokasi agar aplikasi bisa menemukan posisi Anda saat ini.');
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };

      setCurrentRegion(region);
      mapRef.current?.animateToRegion(region, 650);

      setIsGeocoding(true);
      const addr = await reverseGeocode(region.latitude, region.longitude);
      setAddress(addr);
      setIsGeocoding(false);
    } catch {
      Alert.alert('Lokasi tidak tersedia', 'Tidak bisa mengambil lokasi saat ini. Pastikan GPS aktif lalu coba lagi.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}> 
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <X size={20} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari jalan, area, atau tempat…"
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color={colors.primary[500]} />}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={handleCloseSearch}>
                <X size={16} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>

          {showResults && (
            <View style={styles.resultsDropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.resultIcon}>
                      <MapPin size={14} color={colors.primary[600]} />
                    </View>
                    <Text style={styles.resultText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.resultDivider} />}
              />
            </View>
          )}
        </View>

        {!showResults && (
          <View style={styles.instruction}>
            <Navigation2 size={13} color={colors.primary[600]} />
            <Text style={styles.instructionText}>Geser peta untuk memilih titik lokasi</Text>
          </View>
        )}

        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
          />

          <View style={styles.pinWrapper} pointerEvents="none">
            <View style={styles.pinHead} />
            <View style={styles.pinStem} />
            <View style={styles.pinShadow} />
          </View>

          <TouchableOpacity
            style={[styles.locateBtn, isLocating && styles.locateBtnDisabled]}
            onPress={handleLocateMe}
            disabled={isLocating}
            activeOpacity={0.85}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary[700]} />
            ) : (
              <LocateFixed size={18} color={colors.primary[700]} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}> 
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <MapPin size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.addressContent}>
              {isGeocoding ? (
                <View style={styles.geocodingRow}>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text style={styles.geocodingText}>Mencari alamat…</Text>
                </View>
              ) : (
                <Text style={styles.addressText} numberOfLines={3}>{address}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, isGeocoding && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={isGeocoding}
            activeOpacity={0.85}
          >
            <Check size={18} color={colors.white} />
            <Text style={styles.confirmBtnText}>Gunakan Lokasi Ini</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[900],
    padding: 0,
  },
  resultsDropdown: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    maxHeight: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[800],
    lineHeight: 18,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  instructionText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '500',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  pinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    marginLeft: -12,
    marginTop: -36,
  },
  pinHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinStem: {
    width: 2,
    height: 10,
    backgroundColor: colors.primary[600],
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  locateBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  locateBtnDisabled: {
    opacity: 0.8,
  },
  bottomCard: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  geocodingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  geocodingText: {
    fontSize: 13,
    color: colors.gray[400],
  },
  addressText: {
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '500',
    lineHeight: 20,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    height: 54,
    borderRadius: 14,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
});
