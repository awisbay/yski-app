import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      setUser(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; fullName: string; phone?: string }) =>
      authApi.register(data).then((res) => res.data),
    onSuccess: async (data) => {
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
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

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.me().then((res) => res.data),
    enabled: false, // Only fetch when needed
  });

  return {
    user: userQuery.data,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error?.message || registerMutation.error?.message,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}
