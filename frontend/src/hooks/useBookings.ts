import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings.api';

/**
 * React Query hook for fetching user's bookings.
 */
export function useBookings(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingsApi.getMyBookings(params),
    staleTime: 15000,
  });
}

/**
 * Mutation hook for creating a booking.
 * Invalidates both bookings and event queries on success.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { eventId: string; seats: string[] }) =>
      bookingsApi.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

/**
 * Mutation hook for cancelling a booking.
 * Invalidates both bookings and event queries on success.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsApi.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}
