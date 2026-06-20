import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Axios instance with interceptors for auth token management.
 * - Request interceptor: attaches Bearer token from store
 * - Response interceptor: handles 401 → refresh → retry
 */
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send cookies for refresh token
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 → refresh → retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/register') || original.url?.includes('/auth/refresh');
    
    if (!isAuthEndpoint && error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // Retry original request
      } catch {
        // Refresh failed → logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
