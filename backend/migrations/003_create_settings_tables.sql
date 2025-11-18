-- Migration: Create settings and configuration tables
-- Description: Tables for user settings, API keys, webhooks, and notifications
-- Created: 2025-01-08

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    channels JSONB DEFAULT '["email"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_event ON notification_settings(event);

-- Voice settings table
CREATE TABLE IF NOT EXISTS voice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    voice_id VARCHAR(255),
    voice_stability DECIMAL(3,2) DEFAULT 0.5,
    voice_similarity_boost DECIMAL(3,2) DEFAULT 0.75,
    voice_style DECIMAL(3,2) DEFAULT 0.0,
    use_speaker_boost BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_voice_settings_user_id ON voice_settings(user_id);

-- AI model settings table
CREATE TABLE IF NOT EXISTS ai_model_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    model_provider VARCHAR(100) DEFAULT 'elevenlabs',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER,
    system_prompt TEXT,
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_model_settings_user_id ON ai_model_settings(user_id);

-- Integration settings table
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_integration_name ON integration_settings(integration_name);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Webhook endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL DEFAULT '[]',
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_id ON webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_is_active ON webhook_endpoints(is_active);

-- Webhook delivery log table
CREATE TABLE IF NOT EXISTS webhook_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_webhook_id ON webhook_delivery_log(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_event_type ON webhook_delivery_log(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_delivered_at ON webhook_delivery_log(delivered_at);

-- Data exports table
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    config JSONB NOT NULL,
    download_url VARCHAR(500),
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);

-- Call feedback table
CREATE TABLE IF NOT EXISTS call_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    issues JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(call_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_feedback_call_id ON call_feedback(call_id);
CREATE INDEX IF NOT EXISTS idx_call_feedback_user_id ON call_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_call_feedback_rating ON call_feedback(rating);

-- Add RLS policies
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for all settings tables (users can only access their own data)
CREATE POLICY "Users can manage their own notification settings"
    ON notification_settings FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own voice settings"
    ON voice_settings FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI model settings"
    ON ai_model_settings FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integration settings"
    ON integration_settings FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys"
    ON api_keys FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own webhooks"
    ON webhook_endpoints FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own webhook delivery logs"
    ON webhook_delivery_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM webhook_endpoints
            WHERE id = webhook_delivery_log.webhook_endpoint_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own data exports"
    ON data_exports FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own call feedback"
    ON call_feedback FOR ALL
    USING (auth.uid() = user_id);

-- Function to clean up old webhook delivery logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM webhook_delivery_log
    WHERE delivered_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
    DELETE FROM data_exports
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE notification_settings IS 'User notification preferences';
COMMENT ON TABLE voice_settings IS 'Voice AI configuration';
COMMENT ON TABLE ai_model_settings IS 'AI model parameters and prompts';
COMMENT ON TABLE integration_settings IS 'Third-party integration settings';
COMMENT ON TABLE api_keys IS 'User-generated API keys for programmatic access';
COMMENT ON TABLE webhook_endpoints IS 'Webhook endpoints for event notifications';
COMMENT ON TABLE webhook_delivery_log IS 'Log of webhook delivery attempts';
COMMENT ON TABLE data_exports IS 'User data export requests';
COMMENT ON TABLE call_feedback IS 'User feedback on calls';
