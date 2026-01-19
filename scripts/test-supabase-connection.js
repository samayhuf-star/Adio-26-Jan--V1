/**
 * Script to check Supabase connection and backend status
 * Run with: node scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

const PROJECT_ID = 'kkdnnrwhzofttzajnwlj';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testConnection() {
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
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('permission denied')) {
        console.log('   ❌ Table does NOT exist or no access');
        console.log('   📝 Action: Run the migration SQL in Supabase SQL Editor');
        console.log('   📄 File: supabase/migrations/20250103000000_create_campaign_history.sql');
        console.log('   Error details:', error.message);
      } else {
        console.log('   ⚠️  Error checking table:', error.message);
        console.log('   Error code:', error.code);
      }
    } else {
      console.log('   ✅ Table EXISTS and is accessible');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
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
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('   ❌ Edge function is NOT deployed (Status:', response.status, ')');
      console.log('   📝 Action: Deploy the edge function (optional)');
      console.log('   Command: supabase functions deploy make-server-6757d0ca');
      console.log('   Note: Direct database save will work even without edge function');
    }
  } catch (err) {
    console.log('   ❌ Error checking edge function:', err.message);
  }
  console.log('');

  // 3. Check database connection (test with a simple query)
  console.log('3. Checking database connection...');
  try {
    // Try to query a system table that should always exist
    const { data, error } = await supabase
      .rpc('version')
      .limit(1);

    if (error) {
      // If RPC doesn't work, try a simple select
      const { data: testData, error: testError } = await supabase
        .from('campaign_history')
        .select('id')
        .limit(0);

      if (testError && testError.code !== '42P01') {
        console.log('   ⚠️  Database connection issue:', testError.message);
      } else {
        console.log('   ✅ Database connection OK');
      }
    } else {
      console.log('   ✅ Database connection OK');
    }
  } catch (err) {
    console.log('   ⚠️  Could not verify database connection:', err.message);
  }
  console.log('');

  // 4. Test write permission (if table exists)
  console.log('4. Testing write permission...');
  try {
    const testCampaign = {
      type: 'test',
      name: 'Connection Test Campaign',
      data: { test: true, timestamp: new Date().toISOString() },
      status: 'draft'
    };

    const { data, error } = await supabase
      .from('campaign_history')
      .insert(testCampaign)
      .select('id')
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.log('   ⚠️  Cannot test write - table does not exist');
      } else {
        console.log('   ⚠️  Write test failed:', error.message);
        console.log('   Error code:', error.code);
      }
    } else {
      console.log('   ✅ Write permission OK');
      console.log('   Test campaign ID:', data.id);
      
      // Clean up test campaign
      await supabase
        .from('campaign_history')
        .delete()
        .eq('id', data.id);
      console.log('   🧹 Test campaign cleaned up');
    }
  } catch (err) {
    console.log('   ⚠️  Write test error:', err.message);
  }
  console.log('');

  // 5. Summary
  console.log('==========================================');
  console.log('Summary & Next Steps:');
  console.log('==========================================');
  console.log('');
  console.log('Dashboard URL:');
  console.log('https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/');
  console.log('');
  console.log('To complete setup:');
  console.log('1. Go to: SQL Editor in Supabase Dashboard');
  console.log('2. Run the migration: supabase/migrations/20250103000000_create_campaign_history.sql');
  console.log('3. (Optional) Deploy edge function: Functions → make-server-6757d0ca → Deploy');
  console.log('');
  console.log('Current Status:');
  console.log('- Code is ready: ✅ Direct database save implemented');
  console.log('- Fallback chain: Edge Function → Database → localStorage');
  console.log('');
}

testConnection().catch(console.error);

