import axios from 'axios';
import Constants from 'expo-constants';

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
    // Get token from storage (will be implemented with expo-secure-store)
    // const token = await SecureStore.getItemAsync('access_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
      
      // Implement token refresh logic here
      // const refreshToken = await SecureStore.getItemAsync('refresh_token');
      // if (refreshToken) {
      //   try {
      //     const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
      //     const { access_token, refresh_token } = response.data;
      //     await SecureStore.setItemAsync('access_token', access_token);
      //     await SecureStore.setItemAsync('refresh_token', refresh_token);
      //     originalRequest.headers.Authorization = `Bearer ${access_token}`;
      //     return api(originalRequest);
      //   } catch (refreshError) {
      //     // Refresh failed, logout user
      //     await SecureStore.deleteItemAsync('access_token');
      //     await SecureStore.deleteItemAsync('refresh_token');
      //   }
      // }
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
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  
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

export default api;
