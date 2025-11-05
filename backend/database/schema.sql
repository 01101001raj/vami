-- Vami Platform Database Schema
-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'starter_trial',

    -- Stripe
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'incomplete',
    current_period_end TIMESTAMP WITH TIME ZONE,

    -- Feature flags (JSONB for flexibility)
    features JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE public.agents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    elevenlabs_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
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

-- Messages table (conversation transcripts)
CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(100) NOT NULL REFERENCES conversations(conversation_id),
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage records table
CREATE TABLE public.usage_records (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    conversation_id VARCHAR(100) REFERENCES conversations(conversation_id),

    minutes_used DECIMAL(10, 2) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar connections table
CREATE TABLE public.calendar_connections (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),

    provider VARCHAR(50) DEFAULT 'google',
    calendar_id VARCHAR(255),

    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE public.team_members (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    member_user_id UUID NOT NULL REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    status VARCHAR(50) DEFAULT 'invited',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view own agents" ON agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON agents FOR UPDATE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT
    USING (agent_id IN (SELECT agent_id FROM agents WHERE user_id = auth.uid()));

-- Usage records policies
CREATE POLICY "Users can view own usage" ON usage_records FOR SELECT USING (auth.uid() = user_id);

-- Calendar connections policies
CREATE POLICY "Users can manage own calendar" ON calendar_connections FOR ALL USING (auth.uid() = user_id);
