import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.read ? 0 : 1),
  })),
  
  markAsRead: (id) => set((state) => {
    const notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  deleteNotification: (id) => set((state) => {
    const notifications = state.notifications.filter((n) => n.id !== id);
    return {
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    };
  }),
  
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
