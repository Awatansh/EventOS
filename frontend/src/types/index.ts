/** Shared TypeScript interfaces for the EventOS application. */

export type EventCategory = 'conference' | 'workshop' | 'hackathon' | 'meetup' | 'webinar';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  venue: string;
  startsAt: string;
  endsAt?: string;
  totalSeats: number;
  availableSeats: number;
  priceCents: number;
  currency: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  category: EventCategory;
  imageUrl?: string;
  isSeated: boolean;
  bookedSeats: string[];
  seatLayout?: { rows: number; cols: number; };
  createdBy?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  userId?: string;
  eventId?: string;
  seats: string[];
  totalCents: number;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  event: {
    id: string;
    name: string;
    startsAt: string;
    venue: string;
    status?: string;
    category?: EventCategory;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface AdminStats {
  users: { total: number };
  events: { total: number; published: number; cancelled: number; draft: number };
  bookings: { total: number; confirmed: number; cancelled: number };
  revenue: { totalCents: number };
  recentBookings: Array<{
    id: string;
    seats: string[];
    totalCents: number;
    status: string;
    bookedAt: string;
    userName: string;
    userEmail: string;
    eventName: string;
  }>;
}

/** Category display metadata */
export const CATEGORY_META: Record<EventCategory, { label: string; emoji: string; gradient: string }> = {
  conference: { label: 'Conference', emoji: '🎤', gradient: 'var(--gradient-conference)' },
  workshop:   { label: 'Workshop',   emoji: '🛠️', gradient: 'var(--gradient-workshop)' },
  hackathon:  { label: 'Hackathon',  emoji: '⚡', gradient: 'var(--gradient-hackathon)' },
  meetup:     { label: 'Meetup',     emoji: '🤝', gradient: 'var(--gradient-meetup)' },
  webinar:    { label: 'Webinar',    emoji: '🌐', gradient: 'var(--gradient-webinar)' },
};
