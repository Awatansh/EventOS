import api from './axios';
import type { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data).then((r) => r.data.data),

  googleLogin: (credential: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/google', { credential }).then((r) => r.data.data),

  googleRegister: (data: { credential: string; password?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/google/register', data).then((r) => r.data.data),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh').then((r) => r.data.data),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<AuthResponse['user']>>('/auth/me').then((r) => r.data.data),
};
