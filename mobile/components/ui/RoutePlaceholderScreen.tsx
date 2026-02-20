import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MainThemeLayout } from './MainThemeLayout';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface RoutePlaceholderScreenProps {
  title: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  actionRoute?: string;
}

export function RoutePlaceholderScreen({
  title,
  subtitle = 'Halaman sudah terdaftar di routing',
  description = 'Konten detail untuk halaman ini bisa dilanjutkan di phase berikutnya.',
  actionLabel = 'Kembali ke Beranda',
  actionRoute = '/(tabs)',
}: RoutePlaceholderScreenProps) {
  return (
    <MainThemeLayout title={title} subtitle={subtitle} showBackButton>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <Button title={actionLabel} onPress={() => router.replace(actionRoute)} />
        </View>
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    marginTop: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: {
    ...typography.h5,
    color: colors.gray[900],
    marginBottom: 8,
  },
  cardDescription: {
    ...typography.body2,
    color: colors.gray[600],
    marginBottom: 16,
    lineHeight: 21,
  },
});
