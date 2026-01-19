#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Please check your .env file.');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251227000000_add_workspace_isolation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚡ Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');

    console.log('📊 Running data migration function...');
    await client.query('SELECT migrate_user_data_to_workspaces();');
    console.log('✅ Data migration completed');

    console.log('🎉 Workspace isolation is now fully implemented!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    
    // Check if it's a non-critical error
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('column "workspace_id" of relation')) {
      console.log('⚠️  This appears to be a non-critical error (likely already applied)');
      console.log('🎯 Attempting to run data migration only...');
      
      try {
        await client.query('SELECT migrate_user_data_to_workspaces();');
        console.log('✅ Data migration completed successfully');
        console.log('🏁 Workspace isolation setup complete!');
      } catch (dataMigrationError) {
        console.error('❌ Data migration also failed:', dataMigrationError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();