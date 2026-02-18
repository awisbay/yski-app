import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        
        await SecureStore.setItemAsync('access_token', access_token);
        await SecureStore.setItemAsync('refresh_token', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post('/api/v1/auth/register', data),
  
  refresh: (refreshToken: string) =>
    api.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
  
  logout: () => api.post('/api/v1/auth/logout'),
  
  me: () => api.get('/api/v1/auth/me'),
};

// Bookings API
export const bookingsApi = {
  getList: () => api.get('/api/v1/bookings'),
  getMyBookings: () => api.get('/api/v1/bookings/my'),
  getBooking: (id: string) => api.get(`/api/v1/bookings/${id}`),
  create: (data: any) => api.post('/api/v1/bookings', data),
  cancel: (id: string) => api.patch(`/api/v1/bookings/${id}/cancel`),
  getSlots: (date: string) => api.get(`/api/v1/bookings/slots?date=${date}`),
};

// Donations API
export const donationsApi = {
  getList: () => api.get('/api/v1/donations'),
  getMyDonations: () => api.get('/api/v1/donations/my'),
  getDetail: (id: string) => api.get(`/api/v1/donations/${id}`),
  create: (data: any) => api.post('/api/v1/donations', data),
  uploadProof: (id: string, formData: FormData) =>
    api.post(`/api/v1/donations/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSummary: () => api.get('/api/v1/donations/summary'),
};

// Equipment API
export const equipmentApi = {
  getList: () => api.get('/api/v1/equipment'),
  getDetail: (id: string) => api.get(`/api/v1/equipment/${id}`),
  getStats: () => api.get('/api/v1/equipment/stats'),
  getMyLoans: () => api.get('/api/v1/equipment/loans/my'),
  requestLoan: (equipmentId: string, data: any) =>
    api.post(`/api/v1/equipment/${equipmentId}/loans`, data),
};

// Pickups API
export const pickupsApi = {
  getList: () => api.get('/api/v1/pickups'),
  getMyPickups: () => api.get('/api/v1/pickups/my'),
  getDetail: (id: string) => api.get(`/api/v1/pickups/${id}`),
  create: (data: any) => api.post('/api/v1/pickups', data),
  cancel: (id: string, reason?: string) =>
    api.patch(`/api/v1/pickups/${id}/cancel`, { cancellation_reason: reason }),
};

// Content API
export const programsApi = {
  getList: (params?: { limit?: number; sort?: string }) =>
    api.get('/api/v1/content/programs', { params }),
  getDetail: (id: string) => api.get(`/api/v1/content/programs/${id}`),
};

export const newsApi = {
  getList: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/api/v1/content/news', { params }),
  getDetail: (id: string) => api.get(`/api/v1/content/news/${id}`),
};

// Phase 5: Auction API
export const auctionsApi = {
  getList: (params?: { search?: string; skip?: number; limit?: number }) =>
    api.get('/api/v1/auctions', { params }),
  getMyBids: () => api.get('/api/v1/auctions/my-bids'),
  getDetail: (id: string) => api.get(`/api/v1/auctions/${id}`),
  placeBid: (id: string, data: { amount: number }) =>
    api.post(`/api/v1/auctions/${id}/bid`, data),
};

// Phase 5: Financial Reports API
export const financialApi = {
  getDashboard: () => api.get('/api/v1/financial/dashboard'),
  getReports: (params?: { skip?: number; limit?: number }) =>
    api.get('/api/v1/financial/reports', { params }),
  getReport: (id: string) => api.get(`/api/v1/financial/reports/${id}`),
  downloadPdf: (id: string) => api.get(`/api/v1/financial/reports/${id}/pdf`, { responseType: 'blob' }),
};

// Phase 5: Notifications API
export const notificationsApi = {
  getList: (params?: { limit?: number; offset?: number; includeRead?: boolean }) =>
    api.get('/api/v1/notifications', { params }),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/api/v1/notifications/read-all'),
  registerPushToken: (data: { token: string; deviceType: string }) =>
    api.post('/api/v1/notifications/push-token', data),
  removePushToken: (token: string) =>
    api.delete('/api/v1/notifications/push-token', { params: { token } }),
};

export default api;
