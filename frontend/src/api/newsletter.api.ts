import api from './axios';
import { ApiResponse } from '../types';

export const newsletterApi = {
  subscribe: (email: string) =>
    api.post<ApiResponse<void>>('/newsletter/subscribe', { email }).then((res) => res.data),
  
  getStatus: () =>
    api.get<ApiResponse<{ isSubscribed: boolean }>>('/newsletter/status').then((res) => res.data),
};
