import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/services/api';

// Query keys
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: object) => [...equipmentKeys.lists(), filters] as const,
  detail: (id: string) => [...equipmentKeys.all, 'detail', id] as const,
  stats: () => [...equipmentKeys.all, 'stats'] as const,
  loans: () => [...equipmentKeys.all, 'loans'] as const,
};

// Hook to get equipment list
export function useEquipmentList(filters?: { category?: string; available_only?: boolean }) {
  return useQuery({
    queryKey: equipmentKeys.list(filters || {}),
    queryFn: () => equipmentApi.getList().then(res => res.data),
  });
}

// Hook to get equipment stats
export function useEquipmentStats() {
  return useQuery({
    queryKey: equipmentKeys.stats(),
    queryFn: () => equipmentApi.getStats().then(res => res.data),
  });
}

// Hook to get equipment detail
export function useEquipmentDetail(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentApi.getDetail(id).then(res => res.data),
    enabled: !!id,
  });
}

// Hook to get my loans
export function useMyLoans() {
  return useQuery({
    queryKey: equipmentKeys.loans(),
    queryFn: () => equipmentApi.getMyLoans().then(res => res.data),
  });
}

// Hook to request loan
export function useRequestLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: string; data: any }) =>
      equipmentApi.requestLoan(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}
