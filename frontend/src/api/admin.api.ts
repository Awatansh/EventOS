import api from './axios';
import type { ApiResponse, AdminStats } from '../types';

export const adminApi = {
  getStats: () =>
    api.get<ApiResponse<AdminStats>>('/admin/stats').then((r) => r.data.data),
};
