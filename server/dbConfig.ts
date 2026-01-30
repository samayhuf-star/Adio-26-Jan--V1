// Database configuration - PostgreSQL connection
// Primary: Nhost PostgreSQL
export function getDatabaseUrl(): string {
  // Primary: Use Nhost database connection
  const nhostDatabaseUrl = process.env.NHOST_DATABASE_URL;
  if (nhostDatabaseUrl) {
    return nhostDatabaseUrl;
  }
  
  // Fallback: Replit DATABASE_URL (automatically provisioned)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  // Fallback: Try to construct Nhost database URL from components
  const nhostSubdomain = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID;
  const nhostRegion = process.env.NHOST_REGION || 'eu-central-1';
  const nhostDbPassword = process.env.NHOST_DB_PASSWORD;
  
  if (nhostSubdomain && nhostDbPassword) {
    return `postgres://postgres:${nhostDbPassword}@${nhostSubdomain}.db.${nhostRegion}.nhost.run:5432/${nhostSubdomain}`;
  }
  
  // Legacy Supabase support (for migration period)
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    console.warn('[DB Config] Using legacy Supabase connection.');
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  throw new Error('No database connection configured. Please set DATABASE_URL');
}
