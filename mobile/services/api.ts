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
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, new_password: newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
};

// Bookings API
export const bookingsApi = {
  getList: () => api.get('/bookings'),
  getMyBookings: () => api.get('/bookings/my'),
  getBooking: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  approve: (id: string) => api.patch(`/bookings/${id}/approve`),
  reject: (id: string, rejectionReason: string) =>
    api.patch(`/bookings/${id}/reject`, { rejection_reason: rejectionReason }),
  updateStatus: (id: string, status: 'in_progress' | 'completed') =>
    api.patch(`/bookings/${id}/status?status=${status}`),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
  getSlots: (date: string) => api.get(`/bookings/slots?date=${date}`),
};

// Donations API
export const donationsApi = {
  getList: () => api.get('/donations'),
  getMyDonations: () => api.get('/donations/my'),
  getDetail: (id: string) => api.get(`/donations/${id}`),
  create: (data: any) => api.post('/donations', data),
  verify: (id: string, status: 'paid' | 'cancelled') =>
    api.patch(`/donations/${id}/verify`, { status }),
  uploadProof: (id: string, formData: FormData) =>
    api.post(`/donations/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSummary: () => api.get('/donations/summary'),
};

// Equipment API
export const equipmentApi = {
  getList: () => api.get('/equipment'),
  getDetail: (id: string) => api.get(`/equipment/${id}`),
  getStats: () => api.get('/equipment/stats'),
  createEquipment: (data: any) => api.post('/equipment', data),
  uploadPhoto: (formData: FormData) =>
    api.post('/equipment/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyLoans: () => api.get('/equipment/my-loans'),
  getAllLoans: (params?: { status?: string }) => api.get('/equipment/loans/all', { params }),
  requestLoan: (equipmentId: string, data: any) =>
    api.post(`/equipment/${equipmentId}/loans`, data),
  approveLoan: (loanId: string) => api.patch(`/equipment/loans/${loanId}/approve`),
  rejectLoan: (loanId: string) => api.patch(`/equipment/loans/${loanId}/reject`),
  markLoanBorrowed: (loanId: string) => api.patch(`/equipment/loans/${loanId}/borrowed`),
  markLoanReturned: (loanId: string) => api.patch(`/equipment/loans/${loanId}/returned`),
  updateEquipment: (id: string, data: any) => api.put(`/equipment/${id}`, data),
};

// Pickups API
export const pickupsApi = {
  getList: () => api.get('/pickups'),
  getMyPickups: () => api.get('/pickups/my'),
  getAssigned: () => api.get('/pickups/assigned'),
  getDetail: (id: string) => api.get(`/pickups/${id}`),
  create: (data: any) => api.post('/pickups', data),
  uploadPhoto: (formData: FormData) =>
    api.post('/pickups/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  review: (id: string, data: any) => api.patch(`/pickups/${id}/review`, data),
  start: (id: string) => api.patch(`/pickups/${id}/start`),
  complete: (id: string, data?: { collected_amount?: number | null; notes?: string | null }) =>
    api.patch(`/pickups/${id}/complete`, data || {}),
  cancel: (id: string, reason?: string) =>
    api.patch(`/pickups/${id}/cancel`, { cancellation_reason: reason }),
};

// Content API
export const programsApi = {
  getList: (params?: { limit?: number; sort?: string; status?: string; skip?: number; is_featured?: boolean }) =>
    api.get('/content/programs', { params }),
  getDetail: (id: string) => api.get(`/content/programs/${id}`),
  create: (data: any) => api.post('/content/programs', data),
  update: (id: string, data: any) => api.put(`/content/programs/${id}`, data),
  uploadBanner: (formData: FormData) =>
    api.post('/content/programs/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const newsApi = {
  getList: (params?: { category?: string; page?: number; limit?: number; is_published?: boolean; news_status?: string; skip?: number }) =>
    api.get('/content/news', { params }),
  getDetail: (id: string) => api.get(`/content/news/${id}`),
  create: (data: any) => api.post('/content/news', data),
  update: (id: string, data: any) => api.put(`/content/news/${id}`, data),
  uploadBanner: (formData: FormData) =>
    api.post('/content/news/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  generateContent: (data: { title: string; brief: string }) =>
    api.post('/content/news/generate-content', data),
};

// Phase 5: Auction API
export const auctionsApi = {
  getList: (params?: { search?: string; status?: 'ready' | 'bidding' | 'sold'; skip?: number; limit?: number }) =>
    api.get('/auctions', { params }),
  getMyBids: () => api.get('/auctions/my-bids'),
  getDetail: (id: string) => api.get(`/auctions/${id}`),
  uploadPhoto: (formData: FormData) =>
    api.post('/auctions/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  create: (data: any) => api.post('/auctions', data),
  placeBid: (id: string, data: { amount: number }) =>
    api.post(`/auctions/${id}/bid`, data),
  approveBid: (id: string, bid_id: string) =>
    api.patch(`/auctions/${id}/approve-bid`, { bid_id }),
  uploadPaymentProof: (id: string, formData: FormData) =>
    api.post(`/auctions/${id}/upload-payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verifyPayment: (id: string, status: 'paid' | 'rejected') =>
    api.patch(`/auctions/${id}/verify-payment`, { status }),
};

// Phase 5: Financial API
export const financialApi = {
  getCategories: () => api.get('/financial/categories'),
  createCategory: (data: { name: string }) => api.post('/financial/categories', data),
  getTransactions: (params?: {
    skip?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected';
    transaction_type?: 'request_fund' | 'income_report';
    category_id?: string;
  }) => api.get('/financial/transactions', { params }),
  createTransaction: (data: {
    category_id: string;
    transaction_type: 'request_fund' | 'income_report';
    amount: number;
    description?: string;
  }) => api.post('/financial/transactions', data),
  reviewTransaction: (
    id: string,
    data: { status: 'approved' | 'rejected'; reviewed_note?: string }
  ) => api.patch(`/financial/transactions/${id}/review`, data),
  getBalances: () => api.get('/financial/balances'),
};

// Phase 5: Notifications API
export const notificationsApi = {
  getList: (params?: { limit?: number; offset?: number; includeRead?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  registerPushToken: (data: { token: string; deviceType: string }) =>
    api.post('/notifications/push-token', data),
  removePushToken: (token: string) =>
    api.delete('/notifications/push-token', { params: { token } }),
};

export default api;
