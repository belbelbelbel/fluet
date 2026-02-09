import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load DATABASE_URL from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let databaseUrl = null;
try {
  const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf8');
  const match = envFile.match(/DATABASE_URL=(.+)/);
  if (match && match[1]) {
    databaseUrl = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }
} catch (error) {
  console.error('Could not read .env.local:', error.message);
  process.exit(1);
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createLinkedAccountsTable() {
  try {
    console.log('Creating linked_accounts table...');

    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS "linked_accounts" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "platform" varchar(50) NOT NULL,
        "account_id" text NOT NULL,
        "account_username" text,
        "access_token" text,
        "refresh_token" text,
        "token_expires_at" timestamp,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log('✅ Table created successfully');

    // Add foreign key constraint
    console.log('Adding foreign key constraint...');
    await sql`
      ALTER TABLE "linked_accounts" 
      ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") 
      REFERENCES "public"."users"("id") 
      ON DELETE no action 
      ON UPDATE no action;
    `;

    console.log('✅ Foreign key constraint added successfully');
    console.log('✅ linked_accounts table setup complete!');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Table already exists, skipping...');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

createLinkedAccountsTable()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
