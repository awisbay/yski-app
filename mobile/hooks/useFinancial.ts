import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financialApi } from '@/services/api';

export const financialKeys = {
  all: ['financial'] as const,
  categories: () => [...financialKeys.all, 'categories'] as const,
  transactions: (params?: Record<string, any>) => [...financialKeys.all, 'transactions', params || {}] as const,
  balances: () => [...financialKeys.all, 'balances'] as const,
};

export function useFinancialCategories() {
  return useQuery({
    queryKey: financialKeys.categories(),
    queryFn: () => financialApi.getCategories().then((res) => res.data),
  });
}

export function useFinancialTransactions(params?: {
  skip?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  transaction_type?: 'request_fund' | 'income_report';
  category_id?: string;
}) {
  return useQuery({
    queryKey: financialKeys.transactions(params),
    queryFn: () => financialApi.getTransactions(params).then((res) => res.data),
  });
}

export function useFinancialBalances() {
  return useQuery({
    queryKey: financialKeys.balances(),
    queryFn: () => financialApi.getBalances().then((res) => res.data),
  });
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      category_id: string;
      transaction_type: 'request_fund' | 'income_report';
      amount: number;
      description?: string;
    }) => financialApi.createTransaction(payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.balances() });
    },
  });
}

export function useReviewFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      id: string;
      status: 'approved' | 'rejected';
      reviewed_note?: string;
    }) => financialApi.reviewTransaction(payload.id, {
      status: payload.status,
      reviewed_note: payload.reviewed_note,
    }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.balances() });
    },
  });
}
