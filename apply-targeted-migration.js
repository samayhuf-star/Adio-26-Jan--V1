#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Please check your .env file.');
  process.exit(1);
}

// Tables that need workspace isolation
const TABLES_TO_MIGRATE = [
  'campaign_history',
  'forms',
  'form_submissions',
  'vms',
  'vm_billing_records',
  'vm_usage_tracking',
  'billing_accounts',
  'user_template_preferences'
];

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

    // Step 1: Add workspace_id columns to existing tables
    console.log('📝 Adding workspace_id columns to tables...');
    
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        console.log(`  Adding workspace_id to ${tableName}...`);
        await client.query(`
          ALTER TABLE ${tableName} 
          ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
        `);
        
        // Create index for performance
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${tableName}_workspace_id ON ${tableName}(workspace_id);
        `);
        
        console.log(`  ✅ ${tableName} updated`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ⚠️  Table ${tableName} does not exist, skipping...`);
        } else {
          console.error(`  ❌ Error updating ${tableName}:`, error.message);
        }
      }
    }

    // Step 2: Migrate existing data to admin workspaces
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
      console.log(`  Updating data for user ${user.user_id}...`);
      
      for (const tableName of TABLES_TO_MIGRATE) {
        try {
          // Check if table exists and has user_id column
          const tableCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'user_id'
          `, [tableName]);
          
          if (tableCheck.rows.length > 0) {
            const result = await client.query(`
              UPDATE ${tableName} 
              SET workspace_id = $1 
              WHERE user_id = $2 AND workspace_id IS NULL
            `, [user.admin_workspace_id, user.user_id]);
            
            if (result.rowCount > 0) {
              console.log(`    Updated ${result.rowCount} rows in ${tableName}`);
            }
          }
        } catch (error) {
          console.log(`    ⚠️  Could not update ${tableName}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Data migration completed');

    // Step 3: Update RLS policies for key tables
    console.log('🔒 Updating RLS policies...');
    
    const tablesToUpdatePolicies = ['campaign_history', 'forms', 'form_submissions'];
    
    for (const tableName of tablesToUpdatePolicies) {
      try {
        console.log(`  Updating RLS policies for ${tableName}...`);
        
        // Drop existing policies
        await client.query(`
          DROP POLICY IF EXISTS "Users can view their own ${tableName.replace('_', ' ')}" ON ${tableName};
          DROP POLICY IF EXISTS "Users can insert their own ${tableName.replace('_', ' ')}" ON ${tableName};
          DROP POLICY IF EXISTS "Users can update their own ${tableName.replace('_', ' ')}" ON ${tableName};
          DROP POLICY IF EXISTS "Users can delete their own ${tableName.replace('_', ' ')}" ON ${tableName};
        `);
        
        // Create new workspace-aware policies
        await client.query(`
          CREATE POLICY "Users can view ${tableName.replace('_', ' ')} in their workspaces"
            ON ${tableName} FOR SELECT
            USING (
              user_id::text = auth.uid()::text AND
              (workspace_id IS NULL OR EXISTS (
                SELECT 1 FROM workspace_members wm
                WHERE wm.workspace_id = ${tableName}.workspace_id
                AND wm.user_id::text = auth.uid()::text
                AND wm.status = 'active'
              ))
            );
        `);
        
        await client.query(`
          CREATE POLICY "Users can insert ${tableName.replace('_', ' ')} in their workspaces"
            ON ${tableName} FOR INSERT
            WITH CHECK (
              user_id::text = auth.uid()::text AND
              (workspace_id IS NULL OR EXISTS (
                SELECT 1 FROM workspace_members wm
                WHERE wm.workspace_id = ${tableName}.workspace_id
                AND wm.user_id::text = auth.uid()::text
                AND wm.status = 'active'
              ))
            );
        `);
        
        console.log(`  ✅ RLS policies updated for ${tableName}`);
      } catch (error) {
        console.log(`  ⚠️  Could not update RLS policies for ${tableName}: ${error.message}`);
      }
    }
    
    console.log('✅ RLS policies updated');
    console.log('🎉 Workspace isolation migration completed successfully!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration();