import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { MainThemeLayout, ProgramCardSkeleton } from '@/components/ui';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { usePrograms } from '@/hooks';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function ProgramsScreen() {
  const { data: programs, isLoading } = usePrograms({ status: 'active', limit: 50 });

  const renderProgramItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/programs/${item.id}`)}
      activeOpacity={0.85}
    >
      <Card style={styles.programCard}>
        <View style={styles.programImageWrap}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.programImage} />
          ) : (
            <View style={styles.programImageFallback}>
              <Heart size={28} color={colors.primary[500]} />
            </View>
          )}
        </View>
        <View style={styles.programContent}>
          <Text style={styles.programTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.programDescription} numberOfLines={3}>
            {item.description || '-'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <MainThemeLayout
      title="Program"
      subtitle="Program aktif YSKI"
      showBackButton
    >
      <View style={styles.content}>
        {isLoading ? (
          <>
            <ProgramCardSkeleton />
            <ProgramCardSkeleton />
            <ProgramCardSkeleton />
          </>
        ) : programs?.length ? (
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
  programCard: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 16,
  },
  programImageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  programImage: {
    width: '100%',
    height: 150,
  },
  programImageFallback: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  programContent: {
    paddingTop: 10,
    gap: 6,
  },
  programTitle: {
    ...typography.h4,
    color: colors.gray[900],
  },
  programDescription: {
    ...typography.body2,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
