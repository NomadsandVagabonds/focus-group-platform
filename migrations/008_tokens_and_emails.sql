-- Migration 008: Survey Tokens and Email System
-- Part of Agent 8: Token & Email System

-- Survey Tokens Table
CREATE TABLE IF NOT EXISTS survey_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    token VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'unused',
    uses_remaining INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_status CHECK (status IN ('unused', 'used', 'expired')),
    CONSTRAINT non_negative_uses CHECK (uses_remaining >= 0)
);

-- Create indexes for token lookups
CREATE INDEX IF NOT EXISTS idx_survey_tokens_survey ON survey_tokens(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_token ON survey_tokens(token);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_email ON survey_tokens(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_survey_tokens_status ON survey_tokens(status);
CREATE INDEX IF NOT EXISTS idx_survey_tokens_expires ON survey_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_email_type CHECK (type IN ('invitation', 'reminder', 'completion', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_email_logs_survey ON email_logs(survey_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- Function to expire tokens past their expiration date
CREATE OR REPLACE FUNCTION expire_old_tokens()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE survey_tokens
    SET status = 'expired'
    WHERE status = 'unused'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate a token
CREATE OR REPLACE FUNCTION validate_token(token_code VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    token_id UUID,
    survey_id UUID,
    uses_remaining INTEGER,
    error_message VARCHAR
) AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Look up the token
    SELECT * INTO token_record
    FROM survey_tokens
    WHERE token = UPPER(token_code);

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 0, 'Token not found'::VARCHAR;
        RETURN;
    END IF;

    -- Check if expired
    IF token_record.expires_at IS NOT NULL AND token_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, token_record.id, token_record.survey_id, 0, 'Token has expired'::VARCHAR;
        RETURN;
    END IF;

    -- Check remaining uses
    IF token_record.uses_remaining <= 0 THEN
        RETURN QUERY SELECT false, token_record.id, token_record.survey_id, 0, 'Token has no remaining uses'::VARCHAR;
        RETURN;
    END IF;

    -- Token is valid
    RETURN QUERY SELECT true, token_record.id, token_record.survey_id, token_record.uses_remaining, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Function to use a token (atomic decrement)
CREATE OR REPLACE FUNCTION use_token(token_code VARCHAR, response_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    success BOOLEAN,
    remaining_uses INTEGER,
    error_message VARCHAR
) AS $$
DECLARE
    token_record RECORD;
    new_uses INTEGER;
    new_status VARCHAR;
BEGIN
    -- Look up and lock the token
    SELECT * INTO token_record
    FROM survey_tokens
    WHERE token = UPPER(token_code)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 'Token not found'::VARCHAR;
        RETURN;
    END IF;

    -- Check if expired
    IF token_record.expires_at IS NOT NULL AND token_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, 0, 'Token has expired'::VARCHAR;
        RETURN;
    END IF;

    -- Check remaining uses
    IF token_record.uses_remaining <= 0 THEN
        RETURN QUERY SELECT false, 0, 'Token has no remaining uses'::VARCHAR;
        RETURN;
    END IF;

    -- Calculate new values
    new_uses := token_record.uses_remaining - 1;
    new_status := CASE WHEN new_uses <= 0 THEN 'used' ELSE token_record.status END;

    -- Update the token
    UPDATE survey_tokens
    SET uses_remaining = new_uses,
        status = new_status,
        used_at = NOW(),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{last_response_id}',
            COALESCE(to_jsonb(response_uuid::text), 'null'::jsonb)
        )
    WHERE id = token_record.id;

    RETURN QUERY SELECT true, new_uses, NULL::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update token status when expired
CREATE OR REPLACE FUNCTION check_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'unused' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS token_expiry_trigger ON survey_tokens;
CREATE TRIGGER token_expiry_trigger
    BEFORE INSERT OR UPDATE ON survey_tokens
    FOR EACH ROW
    EXECUTE FUNCTION check_token_expiry();
