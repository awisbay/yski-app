import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setUser: (user: User) => void;
  clearError: () => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

// Mock API calls - replace with actual API integration
const mockLogin = async (email: string, password: string): Promise<{ user: User; token: string; refreshToken: string } | null> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email && password) {
    return {
      user: {
        id: '1',
        full_name: 'Test User',
        email: email,
        phone: '081234567890',
        role: 'sahabat',
      },
      token: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    };
  }
  return null;
};

const mockRegister = async (data: RegisterData): Promise<{ user: User; token: string; refreshToken: string } | null> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (data.email && data.password) {
    return {
      user: {
        id: '1',
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'sahabat',
      },
      token: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    };
  }
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await mockLogin(email, password);
          
          if (result) {
            set({
              user: result.user,
              token: result.token,
              refreshToken: result.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({ error: 'Invalid credentials', isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: 'Login failed', isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await mockRegister(data);
          
          if (result) {
            set({
              user: result.user,
              token: result.token,
              refreshToken: result.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({ error: 'Registration failed', isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: 'Registration failed', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
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
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
