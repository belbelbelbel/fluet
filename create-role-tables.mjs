import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createRoleTables() {
  try {
    console.log("Creating role management tables...\n");

    // 1. Update clients table with new fields
    console.log("1. Updating clients table...");
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
    `;
    
    // Update status default to 'pending' if not already set
    await sql`
      ALTER TABLE clients 
      ALTER COLUMN status SET DEFAULT 'pending';
    `;
    
    console.log("   ✅ clients table updated");

    // 2. Create user_accounts table
    console.log("2. Creating user_accounts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id SERIAL PRIMARY KEY,
        clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        agency_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log("   ✅ user_accounts table created");

    // Create indexes for user_accounts
    await sql`CREATE INDEX IF NOT EXISTS idx_user_accounts_clerk_user_id ON user_accounts(clerk_user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts(role);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_accounts_client_id ON user_accounts(client_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_accounts_agency_id ON user_accounts(agency_id);`;
    console.log("   ✅ user_accounts indexes created\n");

    // 3. Create client_invitations table
    console.log("3. Creating client_invitations table...");
    await sql`
      CREATE TABLE IF NOT EXISTS client_invitations (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        accepted_at TIMESTAMP
      );
    `;
    console.log("   ✅ client_invitations table created");

    // Create indexes for client_invitations
    await sql`CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON client_invitations(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_invitations_client_id ON client_invitations(client_id);`;
    console.log("   ✅ client_invitations indexes created\n");

    console.log("✅ All role management tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createRoleTables();
