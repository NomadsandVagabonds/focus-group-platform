-- Migration: Participant Tags for Segmentation
-- Run this in Supabase SQL Editor

-- Tags table (persisted, reusable across sessions)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',  -- gray-500 default
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: participant <-> tag (many-to-many)
CREATE TABLE IF NOT EXISTS participant_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participant_tags_participant ON participant_tags(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_tags_tag ON participant_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_tags ENABLE ROW LEVEL SECURITY;

-- Public read for tags (moderators need to see available tags)
CREATE POLICY "Allow public read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tags" ON tags FOR DELETE USING (true);

-- Public access for participant_tags (moderators manage)
CREATE POLICY "Allow public read participant_tags" ON participant_tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert participant_tags" ON participant_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete participant_tags" ON participant_tags FOR DELETE USING (true);
