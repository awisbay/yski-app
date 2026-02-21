import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Newspaper, Calendar } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useNews } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function NewsScreen() {
  const { data: news, isLoading } = useNews({ limit: 50, is_published: true });

  const renderNewsItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/news/${item.id}`)}
      activeOpacity={0.85}
    >
      <Card style={styles.newsCard}>
        <View style={styles.newsImageWrap}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.newsImage} />
          ) : (
            <View style={styles.newsImageFallback}>
              <Newspaper size={28} color={colors.primary[500]} />
            </View>
          )}
        </View>
        <View style={styles.newsContent}>
          <View style={styles.metaRow}>
            <Badge label={(item.category || 'general').replace('_', '-')} variant="secondary" size="sm" />
            <View style={styles.dateRow}>
              <Calendar size={12} color={colors.gray[500]} />
              <Text style={styles.dateText}>
                {new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.newsExcerpt} numberOfLines={3}>
            {item.excerpt || item.content || '-'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Berita & Informasi"
      subtitle="Info terbaru yayasan"
      showBackButton
    >
      <View style={styles.content}>
        {isLoading ? (
          <>
            <Skeleton height={210} borderRadius={14} />
            <Skeleton height={210} borderRadius={14} />
            <Skeleton height={210} borderRadius={14} />
          </>
        ) : news?.length ? (
          <FlatList
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="Belum ada berita"
            description="Berita dan informasi akan segera tersedia"
          />
        )}
      </View>
    </MainThemeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  newsCard: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 16,
  },
  newsImageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  newsImage: {
    width: '100%',
    height: 155,
  },
  newsImageFallback: {
    width: '100%',
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  newsContent: {
    paddingTop: 10,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    ...typography.caption,
    color: colors.gray[500],
    fontWeight: '600',
  },
  newsTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  newsExcerpt: {
    ...typography.body2,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
