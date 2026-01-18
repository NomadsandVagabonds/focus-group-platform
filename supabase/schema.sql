-- Resonant Database Schema
-- Run this in Supabase SQL Editor (supabase.com → Your Project → SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions (focus groups)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
    moderator_notes TEXT,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    display_name TEXT,
    email TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, code)
);

-- Slider Ratings
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    value INTEGER CHECK (value >= 0 AND value <= 100),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings (S3 links)
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    s3_url TEXT NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_code ON participants(code);
CREATE INDEX idx_ratings_session ON ratings(session_id);
CREATE INDEX idx_ratings_participant ON ratings(participant_id);
CREATE INDEX idx_sessions_code ON sessions(code);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read for session validation (needed for join flow)
CREATE POLICY "Allow public read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read participants" ON participants FOR SELECT USING (true);

-- Allow anonymous insert for ratings (participants submit ratings)
CREATE POLICY "Allow public insert ratings" ON ratings FOR INSERT WITH CHECK (true);

-- Allow public read for recordings (for playback)
CREATE POLICY "Allow public read recordings" ON recordings FOR SELECT USING (true);
