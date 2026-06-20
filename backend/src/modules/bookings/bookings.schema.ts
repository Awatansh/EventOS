import { z } from 'zod';

/**
 * Create booking request body.
 */
export const createBookingSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
  seats: z.array(z.string()).min(1, 'Must book at least 1 seat').max(10, 'Maximum 10 seats per booking'),
});

/**
 * List bookings query params.
 */
export const listBookingsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['confirmed', 'cancelled']).optional(),
});

/**
 * Cancel booking with optional reason.
 */
export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * UUID path param validation.
 */
export const bookingIdSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;
