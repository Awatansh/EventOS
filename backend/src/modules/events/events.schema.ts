import { z } from 'zod';

/** Valid event categories. */
export const EVENT_CATEGORIES = ['conference', 'workshop', 'hackathon', 'meetup', 'webinar'] as const;

/**
 * Query params for listing events.
 */
export const listEventsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['published', 'cancelled', 'draft', 'completed']).default('published'),
  category: z.enum(EVENT_CATEGORIES).optional(),
  sort: z.enum(['date_asc', 'date_desc', 'price_asc', 'price_desc', 'availability']).optional(),
});

/**
 * Create event request body (admin only).
 */
export const createEventSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  description: z.string().optional(),
  venue: z.string().min(1, 'Venue is required').max(255),
  startsAt: z.string().datetime('Invalid date format'),
  endsAt: z.string().datetime('Invalid date format').optional(),
  totalSeats: z.number().int().min(1).max(10000),
  priceCents: z.number().int().min(0).max(10000000).default(0),
  currency: z.string().length(3).default('INR'),
  category: z.enum(EVENT_CATEGORIES).default('conference'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isSeated: z.boolean().default(true),
  seatLayout: z.any().optional(),
});

/**
 * Update event request body (admin only).
 */
export const updateEventSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  venue: z.string().min(1).max(255).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  totalSeats: z.number().int().min(1).max(10000).optional(),
  priceCents: z.number().int().min(0).max(10000000).optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  seatLayout: z.any().optional(),
});

/**
 * UUID path param validation.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

export type ListEventsInput = z.infer<typeof listEventsSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
