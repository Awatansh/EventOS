import api from './axios';
import type { ApiResponse, Event, PaginationMeta } from '../types';

export const eventsApi = {
  getEvents: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<Event[]> & { meta: PaginationMeta }>('/events', { params }).then((r) => ({
      events: r.data.data,
      meta: r.data.meta!,
    })),

  getCategories: () =>
    api.get<ApiResponse<string[]>>('/events/categories').then((r) => r.data.data),

  getEventById: (id: string) =>
    api.get<ApiResponse<Event>>(`/events/${id}`).then((r) => r.data.data),

  createEvent: (data: Partial<Event>) =>
    api.post<ApiResponse<Event>>('/events', data).then((r) => r.data.data),

  updateEvent: (id: string, data: Partial<Event>) =>
    api.patch<ApiResponse<Event>>(`/events/${id}`, data).then((r) => r.data.data),

  cancelEvent: (id: string) =>
    api.delete(`/events/${id}`).then((r) => r.data),
};
