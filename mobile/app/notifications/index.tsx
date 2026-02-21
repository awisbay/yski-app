import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Check, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainThemeLayout } from '@/components/ui';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks';
import { useNotificationStore } from '@/stores/notificationStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const ICONS: Record<string, any> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

type FilterType = 'all' | 'unread';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');
  const { data, isLoading, refetch, isRefetching } = useNotifications({ limit: 100, includeRead: true });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  useEffect(() => {
    if (typeof unreadCount === 'number') {
      setUnreadCount(unreadCount);
    }
  }, [setUnreadCount, unreadCount]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((item: any) => !item.is_read);
    }
    return notifications;
  }, [filter, notifications]);

  const formatTime = (date?: string) => {
    if (!date) return '-';
    const now = new Date();
    const parsed = new Date(date);
    const diff = now.getTime() - parsed.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    return parsed.toLocaleDateString('id-ID');
  };

  const renderNotification = ({ item }: { item: any }) => {
    const Icon = ICONS[item.type] || Info;
    const iconColor = item.type === 'success'
      ? colors.success[600]
      : item.type === 'warning'
      ? colors.warning[600]
      : colors.primary[600];
    const isRead = !!item.is_read;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isRead) {
            markAsRead.mutate(item.id, { onSuccess: () => refetch() });
          }
        }}
        activeOpacity={0.8}
      >
        <Card style={[styles.notificationCard, !isRead && styles.notificationCardUnread]}>
          <View style={styles.notificationRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
              <Icon size={18} color={iconColor} />
            </View>
            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>{item.title}</Text>
                {!isRead ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>Baru</Text></View> : null}
              </View>
              <Text style={styles.message} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout
      title="Notifikasi"
      subtitle="Sinkron dengan ikon lonceng beranda"
      showBackButton
      rightElement={
        unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllAsRead.mutate(undefined, { onSuccess: () => refetch() })}
            style={styles.headerButton}
            activeOpacity={0.85}
          >
            <Check size={18} color={colors.white} />
          </TouchableOpacity>
        ) : null
      }
      statsStrip={
        <View style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Belum Dibaca</Text>
          </View>
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Belum Dibaca</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
          </View>
        ) : filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 130 }]}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary[600]}
                colors={[colors.primary[600]]}
              />
            }
          />
        ) : (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
            description="Update akan tampil di halaman ini"
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
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statsStrip: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h5,
    color: colors.white,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.caption,
    color: colors.primary[100],
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterText: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  notificationCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  notificationCardUnread: {
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    ...typography.body2,
    color: colors.gray[700],
    fontWeight: '600',
    flex: 1,
  },
  titleUnread: {
    color: colors.gray[900],
    fontWeight: '700',
  },
  unreadBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  message: {
    ...typography.caption,
    color: colors.gray[600],
    marginBottom: 4,
    lineHeight: 18,
  },
  time: {
    ...typography.caption,
    color: colors.gray[400],
  },
});
