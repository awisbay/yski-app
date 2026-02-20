import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Bell, Check, Trash2, ChevronRight, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { MainThemeLayout } from '@/components/ui';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useNotificationStore } from '@/stores/notificationStore';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const ICONS: Record<string, any> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

export default function NotificationsScreen() {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    return new Date(date).toLocaleDateString('id-ID');
  };

  const renderNotification = ({ item }: { item: any }) => {
    const Icon = ICONS[item.type] || Info;
    const iconColors: Record<string, string> = {
      info: colors.primary[500],
      success: colors.success[500],
      warning: colors.warning[500],
    };

    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <Card style={[styles.notificationCard, !item.read ? styles.unreadCard : undefined]}>
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColors[item.type]}15` }]}>
              <Icon size={20} color={iconColors[item.type]} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, !item.read && styles.unreadText]}>
                {item.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <MainThemeLayout
      title="Notifikasi"
      subtitle="Update terbaru untuk Anda"
      showBackButton
      rightElement={
        notifications.length > 0 ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
              <Check size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearNotifications} style={[styles.headerButton, styles.clearButton]}>
              <Trash2 size={18} color={colors.error[100]} />
            </TouchableOpacity>
          </View>
        ) : null
      }
    >
      <View style={styles.content}>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
  clearButton: {
    backgroundColor: 'rgba(220,38,38,0.22)',
    borderColor: 'rgba(220,38,38,0.25)',
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
