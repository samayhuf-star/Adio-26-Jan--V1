// Database configuration - PostgreSQL connection
// Using Nhost PostgreSQL database
export function getDatabaseUrl(): string {
  // Primary: Use Nhost database connection string
  // Nhost provides DATABASE_URL in format: postgresql://postgres:[password]@[host]:[port]/postgres
  const databaseUrl = process.env.DATABASE_URL || process.env.NHOST_DATABASE_URL;
  
  if (databaseUrl) {
    return databaseUrl;
  }
  
  // Fallback: Try to construct Nhost database URL from components
  const nhostSubdomain = process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID;
  const nhostRegion = process.env.NHOST_REGION || 'eu-central-1';
  const nhostDbPassword = process.env.NHOST_DB_PASSWORD;
  
  if (nhostSubdomain && nhostDbPassword) {
    // Nhost database connection format: postgres://postgres:[password]@[subdomain].db.[region].nhost.run:5432/[subdomain]
    // Example: postgres://postgres:password@vumnjkoyxkistmlzotuk.db.eu-central-1.nhost.run:5432/vumnjkoyxkistmlzotuk
    return `postgres://postgres:${nhostDbPassword}@${nhostSubdomain}.db.${nhostRegion}.nhost.run:5432/${nhostSubdomain}`;
  }
  
  // Legacy Supabase support (for migration period)
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    console.warn('[DB Config] Using legacy Supabase connection. Consider migrating to Nhost.');
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  throw new Error('No database connection configured. Please set DATABASE_URL, NHOST_DATABASE_URL, or NHOST_DB_PASSWORD with NHOST_SUBDOMAIN');
}
