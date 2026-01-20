-- Migration 007: Survey Quotas
-- Part of Agent 9: Quota Management

-- Survey Quotas Table
CREATE TABLE IF NOT EXISTS survey_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "limit" INTEGER NOT NULL DEFAULT 100,
    current_count INTEGER NOT NULL DEFAULT 0,
    action VARCHAR(50) NOT NULL DEFAULT 'screenout',
    redirect_url TEXT,
    conditions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_action CHECK (action IN ('screenout', 'stop', 'redirect')),
    CONSTRAINT positive_limit CHECK ("limit" > 0),
    CONSTRAINT non_negative_count CHECK (current_count >= 0)
);

-- Function to increment quota count atomically
CREATE OR REPLACE FUNCTION increment_quota_count(quota_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE survey_quotas
    SET current_count = current_count + 1,
        updated_at = NOW()
    WHERE id = quota_id
    RETURNING current_count INTO new_count;

    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if quota is full
CREATE OR REPLACE FUNCTION is_quota_full(quota_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    quota_record RECORD;
BEGIN
    SELECT current_count, "limit"
    INTO quota_record
    FROM survey_quotas
    WHERE id = quota_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    RETURN quota_record.current_count >= quota_record."limit";
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_survey_quotas_survey ON survey_quotas(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_quotas_active ON survey_quotas(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_survey_quotas_count ON survey_quotas(current_count, "limit");

-- Quota history table for tracking changes
CREATE TABLE IF NOT EXISTS quota_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quota_id UUID NOT NULL REFERENCES survey_quotas(id) ON DELETE CASCADE,
    response_id UUID REFERENCES survey_responses(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    count_before INTEGER NOT NULL,
    count_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_history_quota ON quota_history(quota_id);
CREATE INDEX IF NOT EXISTS idx_quota_history_response ON quota_history(response_id);

-- Trigger to log quota changes
CREATE OR REPLACE FUNCTION log_quota_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_count IS DISTINCT FROM NEW.current_count THEN
        INSERT INTO quota_history (quota_id, action, count_before, count_after)
        VALUES (NEW.id, 'count_change', OLD.current_count, NEW.current_count);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quota_change_trigger ON survey_quotas;
CREATE TRIGGER quota_change_trigger
    AFTER UPDATE ON survey_quotas
    FOR EACH ROW
    EXECUTE FUNCTION log_quota_change();
