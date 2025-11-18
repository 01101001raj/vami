-- ============================================================
-- VAMI PLATFORM - COMPLETE DATABASE SETUP
-- ============================================================
-- Run this on your Supabase SQL Editor to set up the entire database
-- Execute in order - each section depends on the previous ones
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'starter_trial',

    -- Stripe integration
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'incomplete',
    current_period_end TIMESTAMP WITH TIME ZONE,

    -- Feature flags (JSONB for flexibility)
    features JSONB DEFAULT '{
        "minutes_limit": 240,
        "concurrent_calls": 1,
        "business_numbers": 1,
        "team_members": 1,
        "inbound_calls": true,
        "outbound_calls": false,
        "call_recordings": false,
        "call_transcripts": false,
        "email_confirmations": false,
        "sms_confirmations": false,
        "basic_analytics": true,
        "advanced_analytics": false,
        "sentiment_analysis": false,
        "voice_cloning": false,
        "call_routing": false,
        "multi_location": false,
        "white_labeling": false,
        "priority_support": false,
        "custom_integrations": false
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    api_token VARCHAR(255),  -- NEW: For agent actions API authentication
    elevenlabs_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    agent_id VARCHAR(100) NOT NULL REFERENCES agents(agent_id),
    end_user_id VARCHAR(100),

    duration_secs INTEGER,
    total_cost INTEGER,
    call_successful VARCHAR(50),
    summary TEXT,
    title VARCHAR(500),

    sentiment VARCHAR(50),
    intent VARCHAR(100),

    webhook_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage records table
CREATE TABLE IF NOT EXISTS public.usage_records (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id VARCHAR(100) REFERENCES conversations(conversation_id),

    minutes_used DECIMAL(10, 2) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. KNOWLEDGE BASE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.knowledge_base_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,

    filename VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    storage_url TEXT NOT NULL,

    processed BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. CALENDAR INTEGRATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    provider VARCHAR(50) DEFAULT 'google',
    calendar_id VARCHAR(255),
    calendar_name VARCHAR(255),

    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calendar_integration_id UUID REFERENCES calendar_integrations(id),

    title VARCHAR(500) NOT NULL,
    description TEXT,

    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,

    status VARCHAR(50) DEFAULT 'scheduled',

    attendee_email VARCHAR(255),
    attendee_name VARCHAR(255),
    attendee_phone VARCHAR(50),

    external_event_id VARCHAR(255),

    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (end_time > start_time)
);

-- ============================================================
-- 4. TEAM MANAGEMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    settings JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    status VARCHAR(50) DEFAULT 'pending',

    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',

    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),

    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. CALLS MANAGEMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,

    phone_number VARCHAR(50) NOT NULL,
    direction VARCHAR(20) DEFAULT 'outbound',

    status VARCHAR(50) DEFAULT 'pending',

    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,

    external_call_id VARCHAR(255),
    conversation_id VARCHAR(100) REFERENCES conversations(conversation_id),

    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. SETTINGS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_preview VARCHAR(50) NOT NULL,

    permissions JSONB DEFAULT '["read"]'::jsonb,

    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,

    events TEXT[] DEFAULT ARRAY['call.completed'],
    secret VARCHAR(255),

    status VARCHAR(50) DEFAULT 'active',

    last_triggered_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    email_notifications JSONB DEFAULT '{
        "new_conversation": true,
        "appointment_booked": true,
        "usage_limit_warning": true,
        "payment_failed": true,
        "weekly_summary": true
    }'::jsonb,

    sms_notifications JSONB DEFAULT '{
        "critical_alerts": true
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment);

-- Usage records indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base_files(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent_id ON knowledge_base_files(agent_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_organization_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view own agents" ON agents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own agents" ON agents
    FOR UPDATE USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        agent_id IN (
            SELECT agent_id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Usage records policies
CREATE POLICY "Users can view own usage" ON usage_records
    FOR SELECT USING (user_id = auth.uid());

-- Knowledge base policies
CREATE POLICY "Users can manage own knowledge base" ON knowledge_base_files
    FOR ALL USING (user_id = auth.uid());

-- Appointments policies
CREATE POLICY "Users can manage own appointments" ON appointments
    FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. STORAGE BUCKETS
-- ============================================================

-- Note: Run these in the Supabase Storage section, not SQL editor

-- Create knowledge-base bucket for file uploads
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('knowledge-base', 'knowledge-base', false);

-- Storage policies for knowledge-base bucket
-- CREATE POLICY "Users can upload to own folder" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'knowledge-base' AND
--         (storage.foldername(name))[1] = auth.uid()::text
--     );

-- CREATE POLICY "Users can view own files" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'knowledge-base' AND
--         (storage.foldername(name))[1] = auth.uid()::text
--     );

-- CREATE POLICY "Users can delete own files" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'knowledge-base' AND
--         (storage.foldername(name))[1] = auth.uid()::text
--     );

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify tables were created
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify indexes were created
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

COMMENT ON TABLE users IS 'Vami platform users (extends Supabase auth)';
COMMENT ON TABLE agents IS 'ElevenLabs AI agents owned by users';
COMMENT ON TABLE conversations IS 'Call records from ElevenLabs';
COMMENT ON TABLE usage_records IS 'Usage tracking for billing';
COMMENT ON TABLE knowledge_base_files IS 'Uploaded documents for agent knowledge';
COMMENT ON TABLE appointments IS 'Booked appointments from calls';
COMMENT ON TABLE team_members IS 'Team collaboration (Professional+ plans)';
COMMENT ON TABLE calls IS 'Outbound call management';

-- ============================================================
-- SUCCESS!
-- Database setup complete. Next steps:
-- 1. Create storage bucket "knowledge-base" in Supabase dashboard
-- 2. Configure environment variables in backend
-- 3. Test database connectivity
-- ============================================================
