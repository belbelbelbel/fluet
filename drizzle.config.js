// Load environment variables from .env.local
import { readFileSync } from 'fs';
import { resolve } from 'path';

let databaseUrl = "postgresql://fluet_owner:O0mzILeGUb3x@ep-bold-sun-a52lj3ws.us-east-2.aws.neon.tech/fluet?sslmode=require";

try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  const match = envFile.match(/DATABASE_URL=(.+)/);
  if (match && match[1]) {
    databaseUrl = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }
} catch (error) {
  console.warn('Could not read .env.local, using default DATABASE_URL');
}

export default {
    dialect: "postgresql",
    schema: "./utils/db/schema.ts",
    out: './drizzle',

    dbCredentials: {
        url: databaseUrl,
    }
}