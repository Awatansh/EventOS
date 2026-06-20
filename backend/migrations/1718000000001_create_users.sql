-- Up Migration: Create users table
CREATE TABLE IF NOT EXISTS event_os_users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','admin')),
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON event_os_users(email);
