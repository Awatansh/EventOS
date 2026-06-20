-- Up Migration: Multiplex Seat Selection Features

-- Add booked_seats, locked_seats, and seat_layout to events
ALTER TABLE event_os_events
  ADD COLUMN IF NOT EXISTS booked_seats VARCHAR(10)[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS locked_seats JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seat_layout JSONB;

-- Modify bookings table to use specific seats array instead of count
ALTER TABLE event_os_bookings DROP CONSTRAINT IF EXISTS bookings_seat_count_check;
ALTER TABLE event_os_bookings DROP COLUMN IF EXISTS seat_count;
ALTER TABLE event_os_bookings ADD COLUMN IF NOT EXISTS seats VARCHAR(10)[] NOT NULL DEFAULT '{}';

-- Check constraint to ensure at least one seat is booked and no more than 10
ALTER TABLE event_os_bookings ADD CONSTRAINT bookings_seats_length_check CHECK (array_length(seats, 1) > 0 AND array_length(seats, 1) <= 10);
