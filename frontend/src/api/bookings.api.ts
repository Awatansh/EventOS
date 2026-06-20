import api from './axios';
import type { ApiResponse, Booking, PaginationMeta } from '../types';

export const bookingsApi = {
  createBooking: (data: { eventId: string; seats: string[] }) =>
    api.post<ApiResponse<Booking>>('/bookings', data).then((r) => r.data.data),

  getMyBookings: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<Booking[]> & { meta: PaginationMeta }>('/bookings', { params }).then((r) => ({
      bookings: r.data.data,
      meta: r.data.meta!,
    })),

  getBookingById: (id: string) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`).then((r) => r.data.data),

  cancelBooking: (id: string, reason?: string) =>
    api.delete(`/bookings/${id}`, { data: reason ? { reason } : {} }).then((r) => r.data.data),
};
