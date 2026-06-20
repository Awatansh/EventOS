import api from './axios';
import type { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data.data),

  getGoogleAuthUrl: () =>
    api.get<ApiResponse<{ url: string }>>('/auth/google').then((r) => r.data.data.url),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string; user: AuthResponse['user'] }>>('/auth/refresh').then((r) => r.data.data),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<AuthResponse['user']>>('/auth/me').then((r) => r.data.data),

  updateProfile: (data: { name?: string; password?: string }) =>
    api.put<ApiResponse<AuthResponse['user']>>('/auth/me', data).then((r) => r.data.data),
};
