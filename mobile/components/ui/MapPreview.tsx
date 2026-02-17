import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface MapPreviewProps {
  address: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
}

export function MapPreview({ address, latitude, longitude, compact = false }: MapPreviewProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={32} color={colors.primary[500]} />
        <Text style={styles.placeholderText}>Peta lokasi</Text>
      </View>
      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <MapPin size={16} color={colors.primary[600]} />
          <Text style={styles.address} numberOfLines={2}>{address}</Text>
        </View>
        {latitude && longitude && (
          <View style={styles.coordinates}>
            <Navigation size={14} color={colors.gray[400]} />
            <Text style={styles.coordinatesText}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  compact: {
    marginVertical: 8,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.gray[500],
  },
  addressContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[800],
    lineHeight: 20,
  },
  coordinates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginLeft: 24,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});
