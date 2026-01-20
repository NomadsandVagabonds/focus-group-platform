-- Migration 010: Users and Permissions System
-- Part of Agent 6: User Management

-- Users Table (extends Supabase auth.users if using Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_role CHECK (role IN ('admin', 'editor', 'viewer'))
);

-- User Permissions Table (survey-level permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'view',
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_permission_level CHECK (permission_level IN ('view', 'edit', 'admin')),
    CONSTRAINT unique_user_survey UNIQUE (user_id, survey_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_survey ON user_permissions(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_level ON user_permissions(permission_level);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON activity_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_survey_id UUID,
    p_required_level VARCHAR DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    permission_level VARCHAR;
    level_rank INTEGER;
    required_rank INTEGER;
BEGIN
    -- Get user's global role
    SELECT role INTO user_role FROM users WHERE id = p_user_id AND is_active = true;

    -- Admin users have all permissions
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;

    -- Get survey-specific permission
    SELECT up.permission_level INTO permission_level
    FROM user_permissions up
    WHERE up.user_id = p_user_id AND up.survey_id = p_survey_id;

    IF permission_level IS NULL THEN
        RETURN false;
    END IF;

    -- Check permission level hierarchy
    level_rank := CASE permission_level
        WHEN 'view' THEN 1
        WHEN 'edit' THEN 2
        WHEN 'admin' THEN 3
        ELSE 0
    END;

    required_rank := CASE p_required_level
        WHEN 'view' THEN 1
        WHEN 'edit' THEN 2
        WHEN 'admin' THEN 3
        ELSE 0
    END;

    RETURN level_rank >= required_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get accessible surveys for a user
CREATE OR REPLACE FUNCTION get_user_surveys(p_user_id UUID)
RETURNS TABLE (
    survey_id UUID,
    survey_title VARCHAR,
    permission_level VARCHAR
) AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    -- Get user's global role
    SELECT role INTO user_role FROM users WHERE id = p_user_id AND is_active = true;

    -- Admin users can access all surveys
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT s.id, s.title::VARCHAR, 'admin'::VARCHAR
        FROM surveys s
        ORDER BY s.created_at DESC;
    ELSE
        -- Return surveys user has explicit permission for
        RETURN QUERY
        SELECT s.id, s.title::VARCHAR, up.permission_level::VARCHAR
        FROM surveys s
        JOIN user_permissions up ON s.id = up.survey_id
        WHERE up.user_id = p_user_id
        ORDER BY s.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent)
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on users
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_timestamp_trigger ON users;
CREATE TRIGGER user_timestamp_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- Trigger to update updated_at on user_permissions
DROP TRIGGER IF EXISTS permission_timestamp_trigger ON user_permissions;
CREATE TRIGGER permission_timestamp_trigger
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- Insert default admin user (optional, for initial setup)
INSERT INTO users (email, full_name, role)
VALUES ('admin@example.com', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
