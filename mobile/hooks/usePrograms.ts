import { useQuery } from '@tanstack/react-query';
import { programsApi } from '@/services/api';

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (filters: object) => [...programKeys.lists(), filters] as const,
  featured: () => [...programKeys.all, 'featured'] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
};

// Hook to get programs list
export function usePrograms(filters?: { limit?: number; sort?: string; category?: string }) {
  return useQuery({
    queryKey: programKeys.list(filters || {}),
    queryFn: () => programsApi.getList(filters).then(res => res.data),
  });
}

// Hook to get featured programs
export function useFeaturedPrograms(limit?: number) {
  return useQuery({
    queryKey: programKeys.featured(),
    queryFn: () => programsApi.getList({ limit: limit || 5, sort: 'created_at:desc' }).then(res => res.data),
  });
}

// Hook to get program detail
export function useProgramDetail(id: string) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programsApi.getDetail(id).then(res => res.data),
    enabled: !!id,
  });
}
