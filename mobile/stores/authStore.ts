import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/services/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

// Secure storage for tokens
const secureStorage = {
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(email, password);
          const { user, access_token, refresh_token } = response.data;
          
          // Store tokens securely
          await secureStorage.setItem('access_token', access_token);
          await secureStorage.setItem('refresh_token', refresh_token);
          
          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.detail || 'Login failed', 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            password: data.password,
          });
          
          const { user, access_token, refresh_token } = response.data;
          
          await secureStorage.setItem('access_token', access_token);
          await secureStorage.setItem('refresh_token', refresh_token);
          
          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          set({ 
            error: error.response?.data?.detail || 'Registration failed', 
            isLoading: false 
          });
          return false;
        }
      },

      logout: async () => {
        await secureStorage.removeItem('access_token');
        await secureStorage.removeItem('refresh_token');
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) return false;

        try {
          const response = await authApi.refresh(currentRefreshToken);
          const { access_token, refresh_token } = response.data;
          
          await secureStorage.setItem('access_token', access_token);
          await secureStorage.setItem('refresh_token', refresh_token);
          
          set({
            token: access_token,
            refreshToken: refresh_token,
          });
          return true;
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          return false;
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: async (accessToken: string, refreshToken: string) => {
        await secureStorage.setItem('access_token', accessToken);
        await secureStorage.setItem('refresh_token', refreshToken);
        set({ token: accessToken, refreshToken });
      },

      clearTokens: async () => {
        await secureStorage.removeItem('access_token');
        await secureStorage.removeItem('refresh_token');
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
      },

      hydrate: async () => {
        const token = await secureStorage.getItem('access_token');
        const refreshToken = await secureStorage.getItem('refresh_token');
        if (token) {
          set({ token, refreshToken, isAuthenticated: true });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
