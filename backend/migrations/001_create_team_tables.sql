-- Migration: Create team management tables
-- Description: Tables for team members, invitations, and organizations
-- Created: 2025-01-08

-- Organizations table (if not exists)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, email, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_id ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Add RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their organization"
    ON organizations FOR UPDATE
    USING (auth.uid() = owner_id);

-- Policies for team_members
CREATE POLICY "Team members can view members in their organization"
    ON team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = team_members.organization_id
            AND o.owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Owners and admins can manage team members"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = team_members.organization_id
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.organization_id = team_members.organization_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'admin'
        )
    );

-- Policies for team_invitations
CREATE POLICY "Team members can view invitations in their organization"
    ON team_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = team_invitations.organization_id
            AND o.owner_id = auth.uid()
        )
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Owners and admins can create invitations"
    ON team_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = organization_id
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.organization_id = team_invitations.organization_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE organizations IS 'Organizations for team collaboration';
COMMENT ON TABLE team_members IS 'Team members within organizations';
COMMENT ON TABLE team_invitations IS 'Pending team invitations';
