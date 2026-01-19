/**
 * Script to check Supabase connection and backend status
 * Run with: deno run --allow-net --allow-env scripts/check-supabase-connection.ts
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const PROJECT_ID = 'kkdnnrwhzofttzajnwlj';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

console.log('🔍 Checking Supabase Connection...\n');
console.log('Project ID:', PROJECT_ID);
console.log('Supabase URL:', SUPABASE_URL);
console.log('');

// 1. Check if campaign_history table exists
console.log('1. Checking campaign_history table...');
try {
  const { data, error } = await supabase
    .from('campaign_history')
    .select('count')
    .limit(1);

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('   ❌ Table does NOT exist');
      console.log('   📝 Action: Run the migration SQL in Supabase SQL Editor');
      console.log('   📄 File: supabase/migrations/20250103000000_create_campaign_history.sql');
    } else {
      console.log('   ⚠️  Error checking table:', error.message);
    }
  } else {
    console.log('   ✅ Table EXISTS');
  }
} catch (err) {
  console.log('   ❌ Error:', err);
}
console.log('');

// 2. Check edge function deployment
console.log('2. Checking edge function deployment...');
try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/make-server-6757d0ca/health`, {
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('   ✅ Edge function is DEPLOYED');
    console.log('   Response:', data);
  } else {
    console.log('   ❌ Edge function is NOT deployed (Status:', response.status, ')');
    console.log('   📝 Action: Deploy the edge function');
    console.log('   Command: supabase functions deploy make-server-6757d0ca');
  }
} catch (err) {
  console.log('   ❌ Error checking edge function:', err);
}
console.log('');

// 3. Check database connection
console.log('3. Checking database connection...');
try {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (error) {
    console.log('   ⚠️  Database connection issue:', error.message);
  } else {
    console.log('   ✅ Database connection OK');
  }
} catch (err) {
  console.log('   ❌ Database connection failed:', err);
}
console.log('');

// 4. Summary
console.log('==========================================');
console.log('Summary & Next Steps:');
console.log('==========================================');
console.log('');
console.log('To complete setup:');
console.log('1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/');
console.log('2. Navigate to: SQL Editor');
console.log('3. Run the migration: supabase/migrations/20250103000000_create_campaign_history.sql');
console.log('4. (Optional) Deploy edge function: Functions → make-server-6757d0ca → Deploy');
console.log('');

