-- Migration: Add API token column to agents table
-- This allows each agent to have a unique API token for programmatic access

-- Add api_token column to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS api_token VARCHAR(200) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_api_token ON public.agents(api_token);

-- Add comment
COMMENT ON COLUMN public.agents.api_token IS 'Unique API token for agent authentication and programmatic access';
