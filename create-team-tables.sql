-- Create team_invitations table
-- This table stores team invitation records
CREATE TABLE IF NOT EXISTS team_invitations (
  id SERIAL PRIMARY KEY,
  invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE, -- Unique token for invitation link
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired
  expires_at TIMESTAMP, -- Invitation expiration (e.g., 7 days)
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON team_invitations(invited_by);

-- Create agency_team_members table
-- This table stores team member relationships between agencies and users
CREATE TABLE IF NOT EXISTS agency_team_members (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL, -- designer, copywriter, manager, admin
  permissions JSONB, -- Permission matrix
  invited_by INTEGER REFERENCES users(id),
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, user_id) -- Prevent duplicate memberships
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_agency_team_members_agency_id ON agency_team_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_team_members_user_id ON agency_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_team_members_status ON agency_team_members(status);
