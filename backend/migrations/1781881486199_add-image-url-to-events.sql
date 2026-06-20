-- Up Migration
ALTER TABLE event_os_events ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

-- Down Migration
ALTER TABLE event_os_events DROP COLUMN IF NOT EXISTS image_url;