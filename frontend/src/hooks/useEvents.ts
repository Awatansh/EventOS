import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

/**
 * React Query hook for fetching paginated events list.
 */
export function useEvents(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.getEvents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * React Query hook for fetching a single event by ID.
 */
export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEventById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
