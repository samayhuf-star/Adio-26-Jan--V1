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

async function checkTables() {
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

    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if workspace-related tables exist
    const workspaceTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%workspace%'
      ORDER BY table_name;
    `);
    
    console.log('\n🏢 Workspace-related tables:');
    workspaceTablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check workspace table structure if it exists
    if (workspaceTablesResult.rows.some(row => row.table_name === 'workspaces')) {
      const workspaceStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'workspaces' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n🏗️  Workspaces table structure:');
      workspaceStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

checkTables();