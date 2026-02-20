import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/services/api';
import { API_ORIGIN } from '@/constants/config';

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizeEquipment(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    totalStock: raw.totalStock ?? raw.total_stock,
    availableStock: raw.availableStock ?? raw.available_stock,
    photoUrl: resolveMediaUrl(raw.photoUrl ?? raw.photo_url),
    isActive: raw.isActive ?? raw.is_active,
  };
}

function normalizeLoan(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    equipmentId: raw.equipmentId ?? raw.equipment_id,
    borrowerId: raw.borrowerId ?? raw.borrower_id,
    borrowerName: raw.borrowerName ?? raw.borrower_name,
    borrowerPhone: raw.borrowerPhone ?? raw.borrower_phone,
    borrowDate: raw.borrowDate ?? raw.borrow_date,
    returnDate: raw.returnDate ?? raw.return_date,
    borrowLocation: raw.borrowLocation ?? raw.borrow_location,
    borrowLat: raw.borrowLat ?? raw.borrow_lat,
    borrowLng: raw.borrowLng ?? raw.borrow_lng,
    approvedBy: raw.approvedBy ?? raw.approved_by,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    equipment: normalizeEquipment(raw.equipment),
  };
}

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: object) => [...equipmentKeys.lists(), filters] as const,
  detail: (id: string) => [...equipmentKeys.all, 'detail', id] as const,
  stats: () => [...equipmentKeys.all, 'stats'] as const,
  loans: () => [...equipmentKeys.all, 'loans'] as const,
  allLoans: (status?: string) => [...equipmentKeys.all, 'all-loans', status || 'all'] as const,
};

export function useEquipmentList(filters?: { category?: string; available_only?: boolean }) {
  return useQuery({
    queryKey: equipmentKeys.list(filters || {}),
    queryFn: () => equipmentApi.getList().then(res => (res.data || []).map(normalizeEquipment)),
  });
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: equipmentKeys.stats(),
    queryFn: () => equipmentApi.getStats().then(res => res.data),
  });
}

export function useEquipmentDetail(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentApi.getDetail(id).then(res => normalizeEquipment(res.data)),
    enabled: !!id,
  });
}

export function useMyLoans() {
  return useQuery({
    queryKey: equipmentKeys.loans(),
    queryFn: () => equipmentApi.getMyLoans().then(res => (res.data || []).map(normalizeLoan)),
  });
}

export function useAllEquipmentLoans(status?: string) {
  return useQuery({
    queryKey: equipmentKeys.allLoans(status),
    queryFn: () => equipmentApi.getAllLoans({ status }).then(res => (res.data || []).map(normalizeLoan)),
  });
}

export function useRequestLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: string; data: any }) =>
      equipmentApi.requestLoan(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allLoans() });
    },
  });
}

export function useApproveLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => equipmentApi.approveLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
    },
  });
}

export function useRejectLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => equipmentApi.rejectLoan(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
    },
  });
}

export function useMarkLoanBorrowed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => equipmentApi.markLoanBorrowed(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
    },
  });
}

export function useMarkLoanReturned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => equipmentApi.markLoanReturned(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.allLoans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.loans() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => equipmentApi.updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
    },
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => equipmentApi.createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
    },
  });
}

export function useUploadEquipmentPhoto() {
  return useMutation({
    mutationFn: (formData: FormData) => equipmentApi.uploadPhoto(formData),
  });
}
