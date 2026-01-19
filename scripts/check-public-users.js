// Script to check public.users table structure specifically
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkPublicUsersTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check public.users table structure specifically
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Public.users table structure:');
    console.table(result.rows);

    // Also check what tables exist in public schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\nAll tables in public schema:');
    console.table(tablesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPublicUsersTable().catch(console.error);