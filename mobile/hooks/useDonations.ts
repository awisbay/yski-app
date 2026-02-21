import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationsApi } from '@/services/api';
import { useDonationStore } from '@/stores/donationStore';

function normalizeDonation(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    donationCode: raw.donationCode ?? raw.donation_code,
    donationType: raw.donationType ?? raw.donation_type,
    paymentStatus: raw.paymentStatus ?? raw.payment_status,
    donorName: raw.donorName ?? raw.donor_name,
    donorEmail: raw.donorEmail ?? raw.donor_email,
    donorPhone: raw.donorPhone ?? raw.donor_phone,
    proofUrl: raw.proofUrl ?? raw.proof_url,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

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
    queryFn: () => donationsApi.getMyDonations().then(res => (res.data || []).map(normalizeDonation)),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useAllDonations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...donationKeys.lists(), 'all'],
    queryFn: () => donationsApi.getList().then((res) => (res.data || []).map(normalizeDonation)),
    enabled: options?.enabled ?? true,
  });
}

// Hook to get donation detail
export function useDonationDetail(id: string) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: () => donationsApi.getDetail(id).then(res => normalizeDonation(res.data)),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
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

export function useUploadDonationProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      donationsApi.uploadProof(id, formData),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: donationKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: donationKeys.lists() });
    },
  });
}

export function useVerifyDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'paid' | 'cancelled' }) =>
      donationsApi.verify(id, status),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: donationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...donationKeys.lists(), 'all'] });
      queryClient.invalidateQueries({ queryKey: donationKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: donationKeys.summary() });
    },
  });
}
