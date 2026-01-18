-- Session scripts table
-- Stores moderator scripts with sections for each focus group session

CREATE TABLE IF NOT EXISTS session_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,  -- Client-generated ID for ordering
    title TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    content TEXT,
    media_tag TEXT,  -- Reference to media item filename
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_session_scripts_session_id ON session_scripts(session_id);

-- Enable RLS
ALTER TABLE session_scripts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (moderators)
CREATE POLICY session_scripts_all ON session_scripts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_session_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_scripts_updated
    BEFORE UPDATE ON session_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_session_scripts_updated_at();
