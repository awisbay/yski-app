import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import { Platform } from 'react-native';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: (params?: { limit?: number; offset?: number; includeRead?: boolean }) =>
    [...notificationKeys.all, 'list', params || {}] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

// Hook to get notifications
export function useNotifications(params?: { limit?: number; offset?: number; includeRead?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.lists(params),
    queryFn: () => notificationsApi.getList(params).then(res => res.data),
  });
}

// Hook to get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationsApi.getUnreadCount().then(res => res.data),
  });
}

// Hook to mark as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}

// Hook to mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}

// Hook to register push token
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (token: string) =>
      notificationsApi.registerPushToken({
        token,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
  });
}
