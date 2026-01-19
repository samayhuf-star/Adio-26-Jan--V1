import { defineConfig } from "drizzle-kit";

function getDatabaseUrl(): string {
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
  if (supabaseDbUrl) {
    return supabaseDbUrl;
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  throw new Error("No database connection configured. Please set SUPABASE_DB_PASSWORD or DATABASE_URL");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
