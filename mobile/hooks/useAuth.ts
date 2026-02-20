import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();
  const { setUser, setTokens, clearTokens } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password).then((res) => res.data),
    onSuccess: async (data) => {
      await setTokens(data.access_token, data.refresh_token);
      const me = await authApi.me().then((res) => res.data);
      setUser(me);
      queryClient.setQueryData(authKeys.user(), me);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; full_name: string; phone?: string }) =>
      authApi.register(data).then((res) => res.data),
    onSuccess: async (data) => {
      // Register endpoint currently returns user profile only.
      setUser(data);
      queryClient.setQueryData(authKeys.user(), data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await clearTokens();
      setUser(null);
      queryClient.clear();
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email).then((res) => res.data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword).then((res) => res.data),
  });

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.me().then((res) => res.data),
    enabled: false, // Only fetch when needed
  });

  return {
    user: userQuery.data,
    isLoading:
      loginMutation.isPending ||
      registerMutation.isPending ||
      forgotPasswordMutation.isPending ||
      resetPasswordMutation.isPending,
    error:
      getReadableError(loginMutation.error) ||
      getReadableError(registerMutation.error) ||
      getReadableError(forgotPasswordMutation.error) ||
      getReadableError(resetPasswordMutation.error),
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
  };
}
  const getReadableError = (err: unknown): string | undefined => {
    const axiosErr = err as AxiosError<any> | undefined;
    const detail = axiosErr?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d: any) => d?.msg || d?.message || String(d))
        .join(', ');
    }
    return axiosErr?.message;
  };
