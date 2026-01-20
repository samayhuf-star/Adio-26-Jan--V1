// Database configuration - PostgreSQL connection
// Note: Database may be hosted on Supabase infrastructure, but Supabase client/auth is removed
export function getDatabaseUrl(): string {
  // Primary: Use PostgreSQL connection string
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  // Check DATABASE_URL if explicitly set
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  throw new Error('No database connection configured. Please set SUPABASE_DB_PASSWORD or DATABASE_URL');
}
