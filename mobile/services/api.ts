import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { 
            refresh_token: refreshToken 
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          await SecureStore.setItemAsync('access_token', access_token);
          await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          
          // Update store
          useAuthStore.setState({ 
            token: access_token, 
            refreshToken: newRefreshToken 
          });
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 403:
          console.error('Forbidden:', error.response.data);
          break;
        case 500:
          console.error('Server Error:', error.response.data);
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { full_name: string; email: string; phone?: string; password: string }) =>
    api.post('/auth/register', data),
  
  refresh: (refreshToken: string) =>
    axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken }),
  
  me: () =>
    api.get('/auth/me'),
};

// Bookings API
export const bookingsApi = {
  getSlots: (date: string) =>
    api.get('/bookings/slots', { params: { date } }),
  
  create: (data: any) =>
    api.post('/bookings', data),
  
  getMyBookings: () =>
    api.get('/bookings/my'),
  
  getBooking: (id: string) =>
    api.get(`/bookings/${id}`),
  
  cancel: (id: string) =>
    api.patch(`/bookings/${id}/cancel`),
};

// Equipment API
export const equipmentApi = {
  getList: () =>
    api.get('/equipment'),
  
  getDetail: (id: string) =>
    api.get(`/equipment/${id}`),
  
  requestLoan: (equipmentId: string, data: any) =>
    api.post(`/equipment/${equipmentId}/borrow`, data),
  
  getMyLoans: () =>
    api.get('/equipment/loans/my'),
};

// Donations API
export const donationsApi = {
  create: (data: any) =>
    api.post('/donations', data),
  
  getMyDonations: () =>
    api.get('/donations/my'),
  
  getDetail: (id: string) =>
    api.get(`/donations/${id}`),
  
  uploadProof: (id: string, formData: FormData) =>
    api.post(`/donations/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Pickups API
export const pickupsApi = {
  create: (data: any) =>
    api.post('/pickups', data),
  
  getMyPickups: () =>
    api.get('/pickups/my'),
  
  getDetail: (id: string) =>
    api.get(`/pickups/${id}`),
};

// Programs API
export const programsApi = {
  getList: (params?: { limit?: number; sort?: string }) =>
    api.get('/programs', { params }),
  
  getDetail: (id: string) =>
    api.get(`/programs/${id}`),
};

// News API
export const newsApi = {
  getList: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/news', { params }),
  
  getDetail: (id: string) =>
    api.get(`/news/${id}`),
};

export default api;
