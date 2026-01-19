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

    // Step 1: Add workspace_id columns
    console.log('📝 Adding workspace_id columns...');
    const addColumnsSQL = fs.readFileSync(path.join(__dirname, 'workspace-migration-simple.sql'), 'utf8');
    await client.query(addColumnsSQL);
    console.log('✅ Workspace columns added');

    // Step 2: Update existing data to use admin workspaces
    console.log('📊 Migrating existing data to admin workspaces...');
    
    // Get all users with admin workspaces
    const usersResult = await client.query(`
      SELECT DISTINCT u.id as user_id, w.id as admin_workspace_id
      FROM users u
      JOIN workspaces w ON w.owner_id = u.id AND w.is_admin_workspace = true
    `);
    
    console.log(`Found ${usersResult.rows.length} users with admin workspaces`);
    
    // Update each user's data
    for (const user of usersResult.rows) {
      console.log(`Updating data for user ${user.user_id}...`);
      
      // Update saved_sites
      await client.query(`
        UPDATE saved_sites 
        SET workspace_id = $1 
        WHERE user_id = $2 AND workspace_id IS NULL
      `, [user.admin_workspace_id, user.user_id]);
      
      // Update activity_log
      await client.query(`
        UPDATE activity_log 
        SET workspace_id = $1 
        WHERE user_id = $2 AND workspace_id IS NULL
      `, [user.admin_workspace_id, user.user_id]);
      
      // Update campaign_history
      await client.query(`
        UPDATE campaign_history 
        SET workspace_id = $1 
        WHERE user_id = $2 AND workspace_id IS NULL
      `, [user.admin_workspace_id, user.user_id]);
    }
    
    console.log('✅ Data migration completed');

    // Step 3: Update RLS policies for saved_sites
    console.log('🔒 Updating RLS policies...');
    
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own saved sites" ON saved_sites;
      DROP POLICY IF EXISTS "Users can insert their own saved sites" ON saved_sites;
      DROP POLICY IF EXISTS "Users can update their own saved sites" ON saved_sites;
      DROP POLICY IF EXISTS "Users can delete their own saved sites" ON saved_sites;
    `);
    
    await client.query(`
      CREATE POLICY "Users can view saved sites in their workspaces"
        ON saved_sites FOR SELECT
        USING (
          user_id::text = auth.uid()::text AND
          (workspace_id IS NULL OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = saved_sites.workspace_id
            AND wm.user_id::text = auth.uid()::text
            AND wm.status = 'active'
          ))
        );
    `);
    
    await client.query(`
      CREATE POLICY "Users can insert saved sites in their workspaces"
        ON saved_sites FOR INSERT
        WITH CHECK (
          user_id::text = auth.uid()::text AND
          (workspace_id IS NULL OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = saved_sites.workspace_id
            AND wm.user_id::text = auth.uid()::text
            AND wm.status = 'active'
          ))
        );
    `);
    
    console.log('✅ RLS policies updated');
    console.log('🎉 Workspace isolation migration completed successfully!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    
    // Check if it's a non-critical error
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('column "workspace_id" of relation')) {
      console.log('⚠️  This appears to be a non-critical error (likely already applied)');
      console.log('🏁 Migration may have been partially or fully completed already');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();