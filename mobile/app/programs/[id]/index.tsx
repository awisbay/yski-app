import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MainThemeLayout } from '@/components/ui';
import { useProgramDetail } from '@/hooks';
import { colors } from '@/constants/colors';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: program, isLoading } = useProgramDetail(String(id || ''));

  if (isLoading) {
    return (
      <MainThemeLayout title="Detail Program" subtitle="Memuat informasi program" showBackButton>
        <View style={styles.centered}><ActivityIndicator size="small" color={colors.primary[600]} /></View>
      </MainThemeLayout>
    );
  }

  if (!program) {
    return (
      <MainThemeLayout title="Detail Program" subtitle="Program tidak ditemukan" showBackButton>
        <View style={styles.centered}><Text style={styles.emptyText}>Program tidak ditemukan.</Text></View>
      </MainThemeLayout>
    );
  }

  return (
    <MainThemeLayout title="Detail Program" subtitle="Informasi lengkap program" showBackButton>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {program.thumbnailUrl ? (
            <Image source={{ uri: program.thumbnailUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>YSKI</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.contentText}>{program.description || '-'}</Text>
      </ScrollView>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.gray[500],
    fontSize: 13,
  },
  heroWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.gray[100],
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: 190,
  },
  heroFallback: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  heroFallbackText: {
    color: colors.primary[700],
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 10,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
});
