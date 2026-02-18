import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationsApi } from '@/services/api';
import { useDonationStore } from '@/stores/donationStore';

// Query keys
export const donationKeys = {
  all: ['donations'] as const,
  lists: () => [...donationKeys.all, 'list'] as const,
  detail: (id: string) => [...donationKeys.all, 'detail', id] as const,
  summary: () => [...donationKeys.all, 'summary'] as const,
};

// Hook to get user's donations
export function useMyDonations() {
  return useQuery({
    queryKey: donationKeys.lists(),
    queryFn: () => donationsApi.getMyDonations().then(res => res.data),
  });
}

// Hook to get donation detail
export function useDonationDetail(id: string) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: () => donationsApi.getDetail(id).then(res => res.data),
    enabled: !!id,
  });
}

// Hook to get donation summary
export function useDonationSummary() {
  return useQuery({
    queryKey: donationKeys.summary(),
    queryFn: () => donationsApi.getSummary().then(res => res.data),
  });
}

// Hook to create donation
export function useCreateDonation() {
  const queryClient = useQueryClient();
  const { clearDonationForm } = useDonationStore();

  return useMutation({
    mutationFn: (data: any) => donationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: donationKeys.lists() });
      clearDonationForm();
    },
  });
}
