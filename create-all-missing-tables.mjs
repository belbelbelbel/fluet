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

async function createAllTables() {
  try {
    console.log('Creating all missing tables...\n');

    // 1. Create clients table
    console.log('1. Creating clients table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        status VARCHAR(50) DEFAULT 'active',
        payment_status VARCHAR(50) DEFAULT 'paid',
        payment_due_date DATE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('   ✅ clients table created');

    // Create indexes for clients
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON clients(payment_status);`;
    console.log('   ✅ clients indexes created\n');

    // 2. Create team_invitations table
    console.log('2. Creating team_invitations table...');
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
    console.log('   ✅ team_invitations table created');

    // Create indexes for team_invitations
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON team_invitations(invited_by);`;
    console.log('   ✅ team_invitations indexes created\n');

    // 3. Create agency_team_members table
    console.log('3. Creating agency_team_members table...');
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
    console.log('   ✅ agency_team_members table created');

    // Create indexes for agency_team_members
    await sql`CREATE INDEX IF NOT EXISTS idx_agency_team_members_agency_id ON agency_team_members(agency_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agency_team_members_user_id ON agency_team_members(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agency_team_members_status ON agency_team_members(status);`;
    console.log('   ✅ agency_team_members indexes created\n');

    // 4. Create client_credits table
    console.log('4. Creating client_credits table...');
    await sql`
      CREATE TABLE IF NOT EXISTS client_credits (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        posts_per_month INTEGER DEFAULT 12,
        posts_used INTEGER DEFAULT 0,
        revisions_per_post INTEGER DEFAULT 3,
        rush_requests INTEGER DEFAULT 2,
        rush_used INTEGER DEFAULT 0,
        reset_date DATE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('   ✅ client_credits table created');

    // Create indexes for client_credits
    await sql`CREATE INDEX IF NOT EXISTS idx_client_credits_client_id ON client_credits(client_id);`;
    console.log('   ✅ client_credits indexes created\n');

    console.log('✅ All tables setup complete!');
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Table already exists, skipping...');
    } else {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }
}

createAllTables()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
