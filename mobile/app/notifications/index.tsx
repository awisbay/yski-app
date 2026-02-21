import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Check, ChevronRight, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';
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

export default function NotificationsScreen() {
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
    const iconColors: Record<string, string> = {
      info: colors.primary[500],
      success: colors.success[500],
      warning: colors.warning[500],
    };
    const isRead = !!item.is_read;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isRead) {
            markAsRead.mutate(item.id, {
              onSuccess: () => refetch(),
            });
          }
        }}
        activeOpacity={0.7}
      >
        <Card style={[styles.notificationCard, !isRead ? styles.unreadCard : undefined]}>
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColors[item.type] || colors.primary[500]}15` }]}>
              <Icon size={20} color={iconColors[item.type] || colors.primary[500]} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, !isRead && styles.unreadText]}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
          {!isRead && <View style={styles.unreadDot} />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout
      title="Notifikasi"
      subtitle="Sama dengan lonceng di beranda"
      showBackButton
      rightElement={
        notifications.length > 0 ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => markAllAsRead.mutate(undefined, { onSuccess: () => refetch() })}
              style={styles.headerButton}
            >
              <Check size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : null
      }
    >
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrap}><ActivityIndicator size="small" color={colors.primary[600]} /></View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
            title="Tidak ada notifikasi"
            description="Anda akan menerima notifikasi di sini"
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  listContent: {
    paddingBottom: 100,
  },
  notificationCard: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: colors.primary[50],
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
    color: colors.gray[900],
  },
  message: {
    ...typography.caption,
    color: colors.gray[500],
    marginBottom: 4,
  },
  time: {
    ...typography.caption,
    color: colors.gray[400],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: 8,
  },
});
