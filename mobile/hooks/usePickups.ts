import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickupsApi } from '@/services/api';
import { API_ORIGIN } from '@/constants/config';

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizePickup(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    requestCode: raw.requestCode ?? raw.request_code,
    pickupType: raw.pickupType ?? raw.pickup_type,
    pickupAddress: raw.pickupAddress ?? raw.pickup_address,
    pickupLat: raw.pickupLat ?? raw.pickup_lat,
    pickupLng: raw.pickupLng ?? raw.pickup_lng,
    requesterName: raw.requesterName ?? raw.requester_name,
    requesterPhone: raw.requesterPhone ?? raw.requester_phone,
    preferredDate: raw.preferredDate ?? raw.preferred_date,
    preferredTimeSlot: raw.preferredTimeSlot ?? raw.preferred_time_slot,
    itemDescription: raw.itemDescription ?? raw.item_description,
    itemPhotoUrl: resolveMediaUrl(raw.itemPhotoUrl ?? raw.item_photo_url),
    acceptedAt: raw.acceptedAt ?? raw.accepted_at,
    etaMinutes: raw.etaMinutes ?? raw.eta_minutes,
    etaDistanceKm: raw.etaDistanceKm ?? raw.eta_distance_km,
    responderLat: raw.responderLat ?? raw.responder_lat,
    responderLng: raw.responderLng ?? raw.responder_lng,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    scheduledAt: raw.scheduledAt ?? raw.scheduled_at,
    completedAt: raw.completedAt ?? raw.completed_at,
  };
}

export const pickupKeys = {
  all: ['pickups'] as const,
  list: (scope: 'all' | 'my' | 'assigned') => [...pickupKeys.all, scope] as const,
  detail: (id: string) => [...pickupKeys.all, 'detail', id] as const,
};

export function useMyPickups() {
  return useQuery({
    queryKey: pickupKeys.list('my'),
    queryFn: () => pickupsApi.getMyPickups().then((res) => (res.data || []).map(normalizePickup)),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useAllPickups() {
  return useQuery({
    queryKey: pickupKeys.list('all'),
    queryFn: () => pickupsApi.getList().then((res) => (res.data || []).map(normalizePickup)),
  });
}

export function useAssignedPickups() {
  return useQuery({
    queryKey: pickupKeys.list('assigned'),
    queryFn: () => pickupsApi.getAssigned().then((res) => (res.data || []).map(normalizePickup)),
  });
}

export function usePickupDetail(id: string) {
  return useQuery({
    queryKey: pickupKeys.detail(id),
    queryFn: () => pickupsApi.getDetail(id).then((res) => normalizePickup(res.data)),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreatePickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => pickupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('my') });
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('all') });
    },
  });
}

export function useUploadPickupPhoto() {
  return useMutation({
    mutationFn: (formData: FormData) => pickupsApi.uploadPhoto(formData),
  });
}

export function useReviewPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pickupsApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('all') });
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('my') });
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('assigned') });
    },
  });
}

export function useCancelPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      pickupsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('my') });
      queryClient.invalidateQueries({ queryKey: pickupKeys.list('all') });
    },
  });
}
