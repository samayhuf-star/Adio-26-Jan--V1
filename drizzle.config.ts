import { defineConfig } from "drizzle-kit";

function getDatabaseUrl(): string {
  // Primary: Use Replit DATABASE_URL (automatically provisioned)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  // Fallback: Supabase (legacy support)
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  throw new Error("No database connection configured. Please set DATABASE_URL");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
