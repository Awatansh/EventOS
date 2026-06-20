-- Up Migration: Create bookings table
CREATE TABLE IF NOT EXISTS event_os_bookings (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES event_os_users(id) ON DELETE CASCADE,
  event_id      UUID          NOT NULL REFERENCES event_os_events(id) ON DELETE RESTRICT,
  seat_count    INTEGER       NOT NULL CHECK (seat_count > 0 AND seat_count <= 10),
  status        VARCHAR(20)   NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','cancelled')),
  total_cents   INTEGER       NOT NULL CHECK (total_cents >= 0),
  booked_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  cancelled_at  TIMESTAMPTZ,
  cancel_reason VARCHAR(500),

  CONSTRAINT cancel_ts_requires_status
    CHECK (cancelled_at IS NULL OR status = 'cancelled')
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id  ON event_os_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON event_os_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON event_os_bookings(status);
