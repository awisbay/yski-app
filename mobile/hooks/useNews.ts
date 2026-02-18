import { useQuery } from '@tanstack/react-query';
import { newsApi } from '@/services/api';

// Query keys
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: object) => [...newsKeys.lists(), filters] as const,
  detail: (id: string) => [...newsKeys.all, 'detail', id] as const,
};

// Hook to get news list
export function useNews(filters?: { category?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: newsKeys.list(filters || {}),
    queryFn: () => newsApi.getList(filters).then(res => res.data),
  });
}

// Hook to get news detail
export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsApi.getDetail(id).then(res => res.data),
    enabled: !!id,
  });
}
