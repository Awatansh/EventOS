-- Up Migration: Add category and image_url to events table
ALTER TABLE event_os_events
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'conference'
    CHECK (category IN ('conference', 'workshop', 'hackathon', 'meetup', 'webinar')),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_events_category ON event_os_events(category);
