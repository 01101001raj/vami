-- Migration: Create calendar integration tables
-- Description: Tables for calendar integrations and appointments
-- Created: 2025-01-08

-- Calendar integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_email VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255),
    calendar_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, provider_email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_active ON calendar_integrations(is_active);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_integration_id UUID REFERENCES calendar_integrations(id) ON DELETE SET NULL,
    external_event_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(500),
    timezone VARCHAR(100) DEFAULT 'UTC',
    status VARCHAR(50) DEFAULT 'scheduled',
    attendee_email VARCHAR(255),
    attendee_name VARCHAR(255),
    attendee_phone VARCHAR(50),
    send_reminders BOOLEAN DEFAULT TRUE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    meeting_url VARCHAR(500),
    is_synced BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_integration_id ON appointments(calendar_integration_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_attendee_email ON appointments(attendee_email);
CREATE INDEX IF NOT EXISTS idx_appointments_external_event_id ON appointments(external_event_id);

-- Calendar settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    business_hours JSONB DEFAULT '[]',
    slot_duration_minutes INTEGER DEFAULT 30,
    buffer_time_minutes INTEGER DEFAULT 0,
    max_advance_booking_days INTEGER DEFAULT 30,
    min_advance_booking_hours INTEGER DEFAULT 24,
    timezone VARCHAR(100) DEFAULT 'UTC',
    auto_confirm BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);

-- OAuth states table (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);

-- Add RLS policies
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_integrations
CREATE POLICY "Users can view their own calendar integrations"
    ON calendar_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar integrations"
    ON calendar_integrations FOR ALL
    USING (auth.uid() = user_id);

-- Policies for appointments
CREATE POLICY "Users can view their own appointments"
    ON appointments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own appointments"
    ON appointments FOR ALL
    USING (auth.uid() = user_id);

-- Policies for calendar_settings
CREATE POLICY "Users can view their own calendar settings"
    ON calendar_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar settings"
    ON calendar_settings FOR ALL
    USING (auth.uid() = user_id);

-- Policies for oauth_states
CREATE POLICY "Users can view their own OAuth states"
    ON oauth_states FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own OAuth states"
    ON oauth_states FOR ALL
    USING (auth.uid() = user_id);

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE calendar_integrations IS 'External calendar provider integrations';
COMMENT ON TABLE appointments IS 'Scheduled appointments and meetings';
COMMENT ON TABLE calendar_settings IS 'User calendar preferences and availability settings';
COMMENT ON TABLE oauth_states IS 'OAuth state tokens for CSRF protection';
