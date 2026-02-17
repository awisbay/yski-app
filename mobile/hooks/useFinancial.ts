import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financialApi } from '@/services/api';

// Query keys
export const financialKeys = {
  all: ['financial'] as const,
  dashboard: () => [...financialKeys.all, 'dashboard'] as const,
  reports: () => [...financialKeys.all, 'reports'] as const,
  report: (id: string) => [...financialKeys.all, 'report', id] as const,
};

// Hook to get financial dashboard
export function useFinancialDashboard() {
  return useQuery({
    queryKey: financialKeys.dashboard(),
    queryFn: () => financialApi.getDashboard(),
  });
}

// Hook to get financial reports
export function useFinancialReports(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: financialKeys.reports(),
    queryFn: () => financialApi.getReports(params),
  });
}

// Hook to get single report
export function useFinancialReport(id: string) {
  return useQuery({
    queryKey: financialKeys.report(id),
    queryFn: () => financialApi.getReport(id),
    enabled: !!id,
  });
}
