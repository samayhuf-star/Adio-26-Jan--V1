// Script to check users table structure
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkUsersTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check users table structure
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table structure:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable().catch(console.error);