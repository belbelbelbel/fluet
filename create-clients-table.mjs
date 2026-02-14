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

async function createClientsTable() {
  try {
    console.log('Creating clients table...');

    // Create clients table
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

    console.log('✅ clients table created');

    // Create indexes for clients
    await sql`
      CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON clients(payment_status);
    `;

    console.log('✅ clients indexes created');
    console.log('✅ clients table setup complete!');
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Table already exists, skipping...');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

createClientsTable()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
