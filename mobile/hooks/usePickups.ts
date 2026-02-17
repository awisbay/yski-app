import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickupsApi } from '@/services/api';

// Query keys
export const pickupKeys = {
  all: ['pickups'] as const,
  lists: () => [...pickupKeys.all, 'list'] as const,
  myPickups: () => [...pickupKeys.all, 'my'] as const,
  detail: (id: string) => [...pickupKeys.all, 'detail', id] as const,
  stats: () => [...pickupKeys.all, 'stats'] as const,
};

// Hook to get my pickups
export function useMyPickups() {
  return useQuery({
    queryKey: pickupKeys.myPickups(),
    queryFn: () => pickupsApi.getMyPickups(),
  });
}

// Hook to get pickup detail
export function usePickupDetail(id: string) {
  return useQuery({
    queryKey: pickupKeys.detail(id),
    queryFn: () => pickupsApi.getDetail(id),
    enabled: !!id,
  });
}

// Hook to create pickup
export function useCreatePickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => pickupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.myPickups() });
    },
  });
}

// Hook to cancel pickup
export function useCancelPickup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      pickupsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupKeys.myPickups() });
    },
  });
}
