import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Newspaper, Calendar, ChevronRight, Search } from 'lucide-react-native';
import { MainThemeLayout, Skeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useNews } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const CATEGORIES = ['all', 'umum', 'kegiatan', 'pengumuman', 'artikel'];

export default function NewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: news, isLoading } = useNews({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const renderNewsItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/news/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.newsCard}>
        <View style={styles.newsImage}>
          <Newspaper size={32} color={colors.primary[300]} />
        </View>
        <View style={styles.newsContent}>
          <View style={styles.newsHeader}>
            <Badge label={item.category} variant="secondary" size="sm" />
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.gray[400]} />
              <Text style={styles.dateText}>
                {new Date(item.publishedAt).toLocaleDateString('id-ID')}
              </Text>
            </View>
          </View>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.newsExcerpt} numberOfLines={2}>
            {item.excerpt || item.content?.substring(0, 100)}...
          </Text>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Baca selengkapnya</Text>
            <ChevronRight size={16} color={colors.primary[600]} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Berita & Informasi"
      subtitle="Info terbaru yayasan"
      showBackButton
      rightElement={
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color={colors.white} />
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === 'all' ? 'Semua' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <>
            <Skeleton height={200} borderRadius={12} />
            <Skeleton height={200} borderRadius={12} />
            <Skeleton height={200} borderRadius={12} />
          </>
        ) : news?.length > 0 ? (
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
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[500],
  },
  categoryText: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  newsCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  newsImage: {
    height: 160,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    margin: -16,
    marginBottom: 16,
  },
  newsContent: {
    paddingTop: 8,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...typography.caption,
    color: colors.gray[400],
  },
  newsTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: 8,
  },
  newsExcerpt: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 12,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    ...typography.body2,
    color: colors.primary[600],
    fontWeight: '500',
    marginRight: 4,
  },
});
