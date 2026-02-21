import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programsApi } from '@/services/api';
import { API_ORIGIN } from '@/constants/config';

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (filters: object) => [...programKeys.lists(), filters] as const,
  featured: () => [...programKeys.all, 'featured'] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
};

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizeProgram(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    targetAmount: raw.targetAmount ?? raw.target_amount,
    collectedAmount: raw.collectedAmount ?? raw.collected_amount,
    isFeatured: raw.isFeatured ?? raw.is_featured,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl ?? raw.thumbnail_url),
    displayOrder: raw.displayOrder ?? raw.display_order ?? 0,
  };
}

// Hook to get programs list
export function usePrograms(filters?: {
  limit?: number;
  sort?: string;
  category?: string;
  status?: string;
  skip?: number;
  is_featured?: boolean;
}) {
  return useQuery({
    queryKey: programKeys.list(filters || {}),
    queryFn: () => programsApi.getList(filters).then(res => (res.data || []).map(normalizeProgram)),
  });
}

// Hook to get featured programs
export function useFeaturedPrograms(limit?: number) {
  return useQuery({
    queryKey: programKeys.featured(),
    queryFn: () => programsApi.getList({ limit: limit || 5, status: 'active' }).then(res => (res.data || []).map(normalizeProgram)),
  });
}

// Hook to get program detail
export function useProgramDetail(id: string) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programsApi.getDetail(id).then(res => normalizeProgram(res.data)),
    enabled: !!id,
  });
}

export function useUploadProgramBanner() {
  return useMutation({
    mutationFn: (formData: FormData) => programsApi.uploadBanner(formData).then((res) => res.data),
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => programsApi.create(payload).then((res) => normalizeProgram(res.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      queryClient.invalidateQueries({ queryKey: programKeys.featured() });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      programsApi.update(id, payload).then((res) => normalizeProgram(res.data)),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      queryClient.invalidateQueries({ queryKey: programKeys.featured() });
      queryClient.invalidateQueries({ queryKey: programKeys.detail(vars.id) });
    },
  });
}
