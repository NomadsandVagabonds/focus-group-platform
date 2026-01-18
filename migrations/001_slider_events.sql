-- Slider Events Table for Persistent Timestamp Storage
-- Run this in your Supabase SQL Editor

-- 1. Create slider_events table
CREATE TABLE IF NOT EXISTS slider_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id TEXT NOT NULL,
    value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
    timestamp BIGINT NOT NULL,           -- Absolute timestamp (Date.now())
    session_ms BIGINT NOT NULL,          -- Milliseconds since session start
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_slider_events_session ON slider_events(session_id);
CREATE INDEX IF NOT EXISTS idx_slider_events_timestamp ON slider_events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_slider_events_participant ON slider_events(session_id, participant_id);

-- 3. Add recording timestamps to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS recording_start_time BIGINT,
ADD COLUMN IF NOT EXISTS recording_end_time BIGINT;

-- 4. Enable RLS (Row Level Security)
ALTER TABLE slider_events ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for insert (anyone can insert during active session)
CREATE POLICY "Allow insert slider events" ON slider_events
    FOR INSERT WITH CHECK (true);

-- 6. Create policy for select (anyone can read)
CREATE POLICY "Allow read slider events" ON slider_events
    FOR SELECT USING (true);

-- Verification query (run after migration):
-- SELECT count(*) FROM slider_events;
