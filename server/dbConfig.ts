export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }

  throw new Error('No database connection configured. Please set DATABASE_URL');
}
