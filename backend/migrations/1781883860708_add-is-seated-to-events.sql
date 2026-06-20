-- Up Migration
ALTER TABLE event_os_events ADD COLUMN IF NOT EXISTS is_seated BOOLEAN DEFAULT true;

-- Down Migration
ALTER TABLE event_os_events DROP COLUMN IF NOT EXISTS is_seated;