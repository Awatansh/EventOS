-- Up Migration: Create events table
CREATE TABLE IF NOT EXISTS event_os_events (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255)  NOT NULL,
  description     TEXT,
  venue           VARCHAR(255)  NOT NULL,
  starts_at       TIMESTAMPTZ   NOT NULL,
  ends_at         TIMESTAMPTZ,
  total_seats     INTEGER       NOT NULL CHECK (total_seats > 0),
  available_seats INTEGER       NOT NULL CHECK (available_seats >= 0),
  price_cents     INTEGER       NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency        CHAR(3)       NOT NULL DEFAULT 'INR',
  status          VARCHAR(20)   NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft','published','cancelled','completed')),
  created_by      UUID          REFERENCES event_os_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT available_lte_total CHECK (available_seats <= total_seats),
  CONSTRAINT ends_after_starts CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON event_os_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_status    ON event_os_events(status);
