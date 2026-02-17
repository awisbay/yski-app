import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useSegments } from 'expo-router';

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, user, token, refreshToken, login, register, logout, refreshAccessToken } = useAuthStore();

  // Handle auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token || !refreshToken) return;

    // Parse JWT to get expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

      if (refreshTime > 0) {
        const timer = setTimeout(() => {
          refreshAccessToken();
        }, refreshTime);

        return () => clearTimeout(timer);
      } else if (timeUntilExpiry <= 0) {
        // Token already expired, try to refresh immediately
        refreshAccessToken();
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, [token, refreshToken]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
  };
}
