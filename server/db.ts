import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { getDatabaseUrl } from "./dbConfig";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
  if (!pool || !db) {
    try {
      const databaseUrl = getDatabaseUrl();
      pool = new Pool({ connectionString: databaseUrl });
      db = drizzle(pool, { schema });
    } catch (error) {
      console.error('[DB] Failed to initialize database connection:', error);
      // Don't throw - allow function to start even if DB is not configured
      // Routes that need DB will handle the error
    }
  }
  return { pool, db };
}

// Lazy initialization - only connect when needed
export function getDb() {
  const { db: dbInstance } = initializeDb();
  if (!dbInstance) {
    throw new Error('Database not configured. Please set SUPABASE_DB_PASSWORD or DATABASE_URL');
  }
  return dbInstance;
}

export function getPool() {
  const { pool: poolInstance } = initializeDb();
  if (!poolInstance) {
    throw new Error('Database not configured. Please set SUPABASE_DB_PASSWORD or DATABASE_URL');
  }
  return poolInstance;
}

// Export db for backward compatibility - lazy getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
