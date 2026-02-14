import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load DATABASE_URL from .env.local
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match && match[1]) {
      databaseUrl = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    }
  } catch (error) {
    console.error('Could not read .env.local:', error.message);
    console.error('Please make sure DATABASE_URL is set in your .env.local file');
    process.exit(1);
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found. Please set it in your .env.local file');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createTeamTables() {
  try {
    console.log('Creating team_invitations table...');

    // Create team_invitations table
    await sql`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id SERIAL PRIMARY KEY,
        invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ team_invitations table created');

    // Create indexes for team_invitations
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON team_invitations(invited_by);
    `;

    console.log('✅ team_invitations indexes created');

    console.log('Creating agency_team_members table...');

    // Create agency_team_members table
    await sql`
      CREATE TABLE IF NOT EXISTS agency_team_members (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL,
        permissions JSONB,
        invited_by INTEGER REFERENCES users(id),
        invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
        joined_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agency_id, user_id)
      );
    `;

    console.log('✅ agency_team_members table created');

    // Create indexes for agency_team_members
    await sql`
      CREATE INDEX IF NOT EXISTS idx_agency_team_members_agency_id ON agency_team_members(agency_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_agency_team_members_user_id ON agency_team_members(user_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_agency_team_members_status ON agency_team_members(status);
    `;

    console.log('✅ agency_team_members indexes created');
    console.log('✅ All team tables setup complete!');
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Tables already exist, skipping...');
    } else {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }
}

createTeamTables()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
