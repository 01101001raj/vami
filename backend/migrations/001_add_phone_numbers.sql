-- ============================================================
-- ADD PHONE NUMBERS FOR MULTI-TENANT SUPPORT
-- ============================================================
-- Each user/agent gets their own dedicated phone number
-- ============================================================

-- Add phone number fields to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS phone_number_sid VARCHAR(100),  -- Twilio phone number SID
ADD COLUMN IF NOT EXISTS phone_number_provider VARCHAR(50) DEFAULT 'twilio',  -- 'twilio' or 'elevenlabs'
ADD COLUMN IF NOT EXISTS phone_number_status VARCHAR(50) DEFAULT 'inactive';  -- 'active', 'inactive', 'pending'

-- Create index for fast lookup by phone number (for incoming calls)
CREATE INDEX IF NOT EXISTS idx_agents_phone_number ON public.agents(phone_number);
CREATE INDEX IF NOT EXISTS idx_agents_phone_sid ON public.agents(phone_number_sid);

-- Add comment explaining usage
COMMENT ON COLUMN public.agents.phone_number IS 'Dedicated phone number for this agent (e.g., +12125551234)';
COMMENT ON COLUMN public.agents.phone_number_sid IS 'Twilio Phone Number SID (e.g., PNxxxx) for management';
COMMENT ON COLUMN public.agents.phone_number_provider IS 'Phone service provider: twilio or elevenlabs';
COMMENT ON COLUMN public.agents.phone_number_status IS 'Phone number status: active, inactive, or pending provisioning';

-- ============================================================
-- OPTIONAL: Create separate phone_numbers table for better management
-- ============================================================
-- This allows multiple numbers per agent in the future

CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES agents(agent_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Phone number details
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    phone_number_sid VARCHAR(100) UNIQUE,  -- Twilio SID
    provider VARCHAR(50) DEFAULT 'twilio',  -- 'twilio' or 'elevenlabs'

    -- Status and capabilities
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'inactive', 'released'
    capabilities JSONB DEFAULT '{"voice": true, "sms": false, "mms": false}'::jsonb,

    -- Metadata
    country_code VARCHAR(5),
    friendly_name VARCHAR(255),
    monthly_cost DECIMAL(10, 2),

    -- Provisioning details
    provisioned_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for phone_numbers table
CREATE INDEX IF NOT EXISTS idx_phone_numbers_agent ON public.phone_numbers(agent_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON public.phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON public.phone_numbers(status);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================

-- Enable RLS on phone_numbers table
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Users can see only their own phone numbers
CREATE POLICY "Users can view own phone numbers"
    ON public.phone_numbers FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own phone numbers
CREATE POLICY "Users can insert own phone numbers"
    ON public.phone_numbers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own phone numbers
CREATE POLICY "Users can update own phone numbers"
    ON public.phone_numbers FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own phone numbers
CREATE POLICY "Users can delete own phone numbers"
    ON public.phone_numbers FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- Function to update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phone_numbers_timestamp
    BEFORE UPDATE ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_phone_numbers_updated_at();
