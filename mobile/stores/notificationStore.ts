import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning';
  referenceType?: string;
  referenceId?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  pushToken: string | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
  setPushToken: (token: string | null) => void;
  initialize: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      pushToken: null,

      setNotifications: (notifications) => set({ notifications }),
      
      addNotification: (notification) => {
        const { notifications, unreadCount } = get();
        set({
          notifications: [notification, ...notifications],
          unreadCount: unreadCount + 1,
        });
      },
      
      markAsRead: (id) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const newUnreadCount = updatedNotifications.filter((n) => !n.read).length;
        set({
          notifications: updatedNotifications,
          unreadCount: newUnreadCount,
        });
      },
      
      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
        set({
          notifications: updatedNotifications,
          unreadCount: 0,
        });
      },
      
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
      
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      setPushToken: (token) => set({ pushToken: token }),
      
      initialize: async () => {
        // Initialize push notifications
        try {
          const { registerForPushNotificationsAsync } = await import('@/services/notifications');
          const token = await registerForPushNotificationsAsync();
          if (token) {
            set({ pushToken: token });
          }
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
