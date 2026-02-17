import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Heart, TrendingUp, ChevronRight, Search } from 'lucide-react-native';
import { ScreenWrapper, SectionHeader, Skeleton, ProgramCardSkeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { usePrograms } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const CATEGORIES = ['all', 'pendidikan', 'kesehatan', 'sosial', 'dakwah', 'ekonomi'];

export default function ProgramsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: programs, isLoading } = usePrograms({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderProgramItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/programs/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.programCard}>
        <View style={styles.programImage}>
          <Heart size={40} color={colors.primary[300]} />
        </View>
        <View style={styles.programContent}>
          <View style={styles.programHeader}>
            <Badge label={item.category} variant="primary" size="sm" />
            <Text style={styles.programDate}>
              {new Date(item.createdAt).toLocaleDateString('id-ID')}
            </Text>
          </View>
          <Text style={styles.programTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.programDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <ProgressBar 
            progress={item.collectedAmount / item.targetAmount}
            style={styles.programProgress}
          />
          <View style={styles.programStats}>
            <Text style={styles.raisedAmount}>
              {formatCurrency(item.collectedAmount)}
            </Text>
            <Text style={styles.targetAmount}>
              dari {formatCurrency(item.targetAmount)}
            </Text>
          </View>
          <View style={styles.donorCount}>
            <TrendingUp size={14} color={colors.success[500]} />
            <Text style={styles.donorText}>
              {item.donorCount || 0} donatur
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <Header
        title="Program"
        showBackButton
        rightElement={
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        }
      />

      {/* Categories */}
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
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
        </>
      ) : programs?.length > 0 ? (
        <FlatList
          data={programs}
          renderItem={renderProgramItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon={Heart}
          title="Belum ada program"
          description="Program akan segera tersedia"
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
  programCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  programImage: {
    height: 160,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    margin: -16,
    marginBottom: 16,
  },
  programContent: {
    paddingTop: 8,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programDate: {
    ...typography.caption,
    color: colors.gray[400],
  },
  programTitle: {
    ...typography.h4,
    color: colors.gray[900],
    marginBottom: 8,
  },
  programDescription: {
    ...typography.body2,
    color: colors.gray[500],
    marginBottom: 16,
  },
  programProgress: {
    marginBottom: 12,
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  raisedAmount: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.success[600],
  },
  targetAmount: {
    ...typography.caption,
    color: colors.gray[500],
  },
  donorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  donorText: {
    ...typography.caption,
    color: colors.success[600],
  },
});
