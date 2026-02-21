import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/services/api';
import { API_ORIGIN } from '@/constants/config';

// Query keys
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: object) => [...newsKeys.lists(), filters] as const,
  detail: (id: string) => [...newsKeys.all, 'detail', id] as const,
};

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizeNews(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    publishedAt: raw.publishedAt ?? raw.published_at,
    isPublished: raw.isPublished ?? raw.is_published,
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl ?? raw.thumbnail_url),
  };
}

// Hook to get news list
export function useNews(filters?: {
  category?: string;
  page?: number;
  limit?: number;
  is_published?: boolean;
  news_status?: string;
  skip?: number;
}) {
  return useQuery({
    queryKey: newsKeys.list(filters || {}),
    queryFn: () => newsApi.getList(filters).then(res => (res.data || []).map(normalizeNews)),
  });
}

// Hook to get news detail
export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsApi.getDetail(id).then(res => normalizeNews(res.data)),
    enabled: !!id,
  });
}

export function useUploadNewsBanner() {
  return useMutation({
    mutationFn: (formData: FormData) => newsApi.uploadBanner(formData).then((res) => res.data),
  });
}

export function useGenerateNewsContent() {
  return useMutation({
    mutationFn: (payload: { title: string; brief: string }) =>
      newsApi.generateContent(payload).then((res) => res.data),
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => newsApi.create(payload).then((res) => normalizeNews(res.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      newsApi.update(id, payload).then((res) => normalizeNews(res.data)),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.detail(vars.id) });
    },
  });
}
