-- Migration 006: Templates, Label Sets, and Global Settings
-- Part of Agent 10: Admin UI & Templates

-- Survey Templates Table
CREATE TABLE IF NOT EXISTS survey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    question_count INTEGER DEFAULT 0,
    survey_structure JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Label Sets Table
CREATE TABLE IF NOT EXISTS label_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    labels JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Settings Table
CREATE TABLE IF NOT EXISTS global_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default label sets
INSERT INTO label_sets (name, language, labels) VALUES
    ('5-Point Likert', 'en', '[
        {"code": "A1", "label": "Strongly Disagree"},
        {"code": "A2", "label": "Disagree"},
        {"code": "A3", "label": "Neutral"},
        {"code": "A4", "label": "Agree"},
        {"code": "A5", "label": "Strongly Agree"}
    ]'::jsonb),
    ('7-Point Likert', 'en', '[
        {"code": "A1", "label": "Strongly Disagree"},
        {"code": "A2", "label": "Disagree"},
        {"code": "A3", "label": "Somewhat Disagree"},
        {"code": "A4", "label": "Neutral"},
        {"code": "A5", "label": "Somewhat Agree"},
        {"code": "A6", "label": "Agree"},
        {"code": "A7", "label": "Strongly Agree"}
    ]'::jsonb),
    ('Frequency', 'en', '[
        {"code": "A1", "label": "Never"},
        {"code": "A2", "label": "Rarely"},
        {"code": "A3", "label": "Sometimes"},
        {"code": "A4", "label": "Often"},
        {"code": "A5", "label": "Always"}
    ]'::jsonb),
    ('Importance', 'en', '[
        {"code": "A1", "label": "Not Important"},
        {"code": "A2", "label": "Slightly Important"},
        {"code": "A3", "label": "Moderately Important"},
        {"code": "A4", "label": "Important"},
        {"code": "A5", "label": "Very Important"}
    ]'::jsonb),
    ('Satisfaction', 'en', '[
        {"code": "A1", "label": "Very Dissatisfied"},
        {"code": "A2", "label": "Dissatisfied"},
        {"code": "A3", "label": "Neutral"},
        {"code": "A4", "label": "Satisfied"},
        {"code": "A5", "label": "Very Satisfied"}
    ]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default global settings
INSERT INTO global_settings (key, value) VALUES
    ('survey_settings', '{
        "defaultTheme": "editorial_academic",
        "defaultFormat": "group_by_group",
        "defaultLanguage": "en",
        "allowAnonymous": true,
        "requireConsent": true,
        "dataRetentionDays": 365,
        "exportFormat": "csv",
        "emailNotifications": true,
        "adminEmail": ""
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_templates_category ON survey_templates(category);
CREATE INDEX IF NOT EXISTS idx_survey_templates_created ON survey_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_label_sets_language ON label_sets(language);
