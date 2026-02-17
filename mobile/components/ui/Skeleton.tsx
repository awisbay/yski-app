import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 4 }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
      ]}
    />
  );
}

export function BookingCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={120} height={20} borderRadius={4} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <View style={styles.divider} />
      <Skeleton width="100%" height={16} />
      <View style={styles.row}>
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  );
}

export function ProgramCardSkeleton() {
  return (
    <View style={[styles.card, styles.horizontalCard]}>
      <Skeleton width={120} height={120} borderRadius={12} />
      <View style={styles.content}>
        <Skeleton width={80} height={16} borderRadius={4} />
        <Skeleton width="100%" height={20} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray[200],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  horizontalCard: {
    flexDirection: 'row',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 12,
  },
  row: {
    marginTop: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
