-- Migration 009: Resume Tokens for Save & Resume Functionality
-- Part of Agent 7: Survey Settings

-- Resume Tokens Table
CREATE TABLE IF NOT EXISTS resume_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_tokens_survey ON resume_tokens(survey_id);
CREATE INDEX IF NOT EXISTS idx_resume_tokens_response ON resume_tokens(response_id);
CREATE INDEX IF NOT EXISTS idx_resume_tokens_token ON resume_tokens(token);
CREATE INDEX IF NOT EXISTS idx_resume_tokens_expires ON resume_tokens(expires_at);

-- Add unique constraint for response_id (one token per response)
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_tokens_response_unique ON resume_tokens(response_id);

-- Add composite index for response_data upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_response_data_composite
ON response_data(response_id, question_id, COALESCE(subquestion_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add updated_at column to response_data if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'response_data' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE response_data ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add metadata columns to survey_responses if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'survey_responses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Function to clean up expired resume tokens
CREATE OR REPLACE FUNCTION cleanup_expired_resume_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM resume_tokens
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use resume token
CREATE OR REPLACE FUNCTION validate_resume_token(token_code VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    token_id UUID,
    response_id UUID,
    survey_id UUID,
    error_message VARCHAR
) AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Look up the token
    SELECT rt.*, sr.status as response_status
    INTO token_record
    FROM resume_tokens rt
    JOIN survey_responses sr ON rt.response_id = sr.id
    WHERE rt.token = token_code;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::UUID, 'Token not found'::VARCHAR;
        RETURN;
    END IF;

    -- Check if expired
    IF token_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, token_record.id, token_record.response_id, token_record.survey_id, 'Token has expired'::VARCHAR;
        RETURN;
    END IF;

    -- Check if response is already complete
    IF token_record.response_status = 'complete' THEN
        RETURN QUERY SELECT false, token_record.id, token_record.response_id, token_record.survey_id, 'Survey already completed'::VARCHAR;
        RETURN;
    END IF;

    -- Update last accessed
    UPDATE resume_tokens
    SET last_accessed_at = NOW()
    WHERE id = token_record.id;

    -- Token is valid
    RETURN QUERY SELECT true, token_record.id, token_record.response_id, token_record.survey_id, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on resume_tokens
CREATE OR REPLACE FUNCTION update_resume_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resume_token_timestamp_trigger ON resume_tokens;
CREATE TRIGGER resume_token_timestamp_trigger
    BEFORE UPDATE ON resume_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_resume_token_timestamp();
