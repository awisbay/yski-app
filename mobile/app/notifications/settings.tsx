import { RoutePlaceholderScreen } from '@/components/ui';

export default function NotificationSettingsScreen() {
  return (
    <RoutePlaceholderScreen
      title="Pengaturan Notifikasi"
      subtitle="Kelola preferensi notifikasi"
      actionLabel="Kembali ke Notifikasi"
      actionRoute="/notifications"
    />
  );
}
