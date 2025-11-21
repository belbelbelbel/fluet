import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof neon> | null = null;

function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Check if DATABASE_URL is a placeholder or invalid
  const isPlaceholder = !databaseUrl || 
    databaseUrl.includes("user:password@host:port") || 
    databaseUrl.includes("postgresql://user:password") ||
    databaseUrl === "postgresql://user:password@host:port/database?sslmode=require";
  
  if (isPlaceholder) {
    // During build time, skip actual connection
    // This will be caught at runtime when database is actually used
    if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-development-build") {
      // Return a mock that will fail gracefully when used
      throw new Error(
        "DATABASE_URL is not configured. Please set a valid DATABASE_URL in your .env.local file. " +
        "Build is continuing but database operations will fail at runtime."
      );
    }
    
    // At runtime, throw a helpful error
    throw new Error(
      "DATABASE_URL is not configured. Please set a valid DATABASE_URL in your .env.local file."
    );
  }

  if (!_sql) {
    _sql = neon(databaseUrl);
  }
  
  if (!_db) {
    _db = drizzle(_sql, { schema });
  }
  
  return _db;
}

// Use a getter function instead of Proxy for better TypeScript support
export function getDb() {
  return getDatabase();
}

// Export db as a lazy proxy
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const dbInstance = getDatabase();
    const value = dbInstance[prop as keyof ReturnType<typeof drizzle>];
    if (typeof value === "function") {
      return value.bind(dbInstance);
    }
    return value;
  },
});