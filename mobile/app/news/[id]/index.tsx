import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MainThemeLayout } from '@/components/ui';
import { useNewsDetail } from '@/hooks';
import { colors } from '@/constants/colors';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: article, isLoading } = useNewsDetail(String(id || ''));

  if (isLoading) {
    return (
      <MainThemeLayout title="Detail Berita" subtitle="Memuat informasi berita" showBackButton>
        <View style={styles.centered}><ActivityIndicator size="small" color={colors.primary[600]} /></View>
      </MainThemeLayout>
    );
  }

  if (!article) {
    return (
      <MainThemeLayout title="Detail Berita" subtitle="Berita tidak ditemukan" showBackButton>
        <View style={styles.centered}><Text style={styles.emptyText}>Berita tidak ditemukan.</Text></View>
      </MainThemeLayout>
    );
  }

  return (
    <MainThemeLayout title="Detail Berita" subtitle="Informasi lengkap" showBackButton>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {article.thumbnailUrl ? (
            <Image source={{ uri: article.thumbnailUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackText}>BERITA</Text>
            </View>
          )}
        </View>
        <Text style={styles.category}>{(article.category || 'general').replace('_', '-')}</Text>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.date}>
          {new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID')}
        </Text>
        <Text style={styles.body}>{article.content || '-'}</Text>
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
    backgroundColor: colors.secondary[50],
  },
  heroFallbackText: {
    color: colors.secondary[700],
    fontSize: 24,
    fontWeight: '800',
  },
  category: {
    color: colors.secondary[700],
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 6,
    lineHeight: 28,
  },
  date: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
});
