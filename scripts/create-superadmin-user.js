/**
 * Script to create a superadmin user in Supabase
 * 
 * This script creates a user in Supabase Auth and sets their role to 'superadmin'
 * 
 * Usage:
 *   node scripts/create-superadmin-user.js <email> <password> [full_name]
 * 
 * Example:
 *   node scripts/create-superadmin-user.js admin@adiology.com SecurePassword123 "Super Admin"
 * 
 * Required Environment Variables:
 *   SUPABASE_SERVICE_ROLE_KEY - Get from Supabase Dashboard → Settings → API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kkdnnrwhzofttzajnwlj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\n💡 To get your service role key:');
  console.log('   1. Go to https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/api');
  console.log('   2. Copy the "service_role" key (NOT the anon key)');
  console.log('   3. Add it to your .env file: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('\n   Or pass it directly:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-superadmin-user.js email password');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin(email, password, fullName = 'Super Admin') {
  try {
    console.log('\n🔐 Creating superadmin user...\n');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${fullName}`);
    console.log(`   Supabase URL: ${SUPABASE_URL}\n`);

    // Step 1: Test connection with a simple admin API call first
    console.log('📝 Step 0: Testing Supabase Admin API connection...');
    try {
      const { data: testData, error: testError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (testError) {
        console.error('   ❌ Connection test failed:', testError.message);
        if (testError.message.includes('Project not specified') || testError.message.includes('Invalid API key')) {
          throw new Error(
            'Invalid Supabase service role key.\n\n' +
            'Please verify:\n' +
            '  1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/api\n' +
            '  2. Copy the "service_role" key (NOT the anon key)\n' +
            '  3. Make sure it\'s for project: kkdnnrwhzofttzajnwlj\n' +
            '  4. Update your .env file: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n\n' +
            'Alternatively, create the user manually via Supabase Dashboard:\n' +
            '  https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users\n' +
            'Then run the SQL script: scripts/create-superadmin-sql.sql'
          );
        }
        throw testError;
      }
      console.log('   ✅ Connection successful! Found', testData?.users?.length || 0, 'users\n');
    } catch (testErr) {
      if (testErr.message.includes('Invalid Supabase')) {
        throw testErr;
      }
      throw new Error('Failed to connect to Supabase: ' + testErr.message);
    }

    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'superadmin',
      },
    });

    if (authError) {
      // Better error handling
      if (authError.message && authError.message.includes('Project not specified')) {
        throw new Error('Invalid Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
      }
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        console.log('⚠️  User already exists in Auth. Updating role...');
        
        // Get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }
        
        const existingUser = existingUsers?.users?.find(u => u.email === email);
        
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }

        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...existingUser.user_metadata,
              full_name: fullName,
              role: 'superadmin',
            },
          }
        );

        if (updateError) {
          throw updateError;
        }

        // Update users table
        const { error: userTableError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            email,
            full_name: fullName,
            role: 'superadmin',
            subscription_plan: 'free',
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (userTableError) {
          throw userTableError;
        }

        console.log('✅ User role updated to superadmin');
        console.log(`\n📧 Login credentials:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`\n🔗 Login URL: https://www.adiology.online/superadmin`);
        return;
      }
      throw authError;
    }

    if (!authData?.user) {
      throw new Error('Failed to create user');
    }

    console.log('✅ User created in Supabase Auth');

    // Step 2: Create/Update user record in users table
    console.log('📝 Step 2: Creating user profile in database...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'superadmin',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (userError) {
      console.error('⚠️  Error creating user profile:', userError.message);
      console.log('   User was created in Auth but profile creation failed.');
      console.log('   You may need to manually update the users table.');
    } else {
      console.log('✅ User profile created in database');
    }

    console.log('\n✅ Superadmin user created successfully!');
    console.log(`\n📧 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🔗 Login URL: https://www.adiology.online/superadmin`);
    console.log('\n⚠️  Keep these credentials secure!');

  } catch (error) {
    console.error('\n❌ Error creating superadmin:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    if (error.stack) {
      console.error('\n   Full error:', error.stack);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check that SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('   2. Verify SUPABASE_URL is correct (should be: https://kkdnnrwhzofttzajnwlj.supabase.co)');
    console.error('   3. Verify the users table exists in your database');
    console.error('   4. Ensure migrations have been run');
    console.error('   5. Check Supabase dashboard for error details');
    console.error('\n   Get your keys from: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/api');
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/create-superadmin-user.js <email> <password> [full_name]');
  console.log('\nExample:');
  console.log('  node scripts/create-superadmin-user.js admin@adiology.com SecurePassword123 "Super Admin"');
  console.log('\nOr with environment variable:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-superadmin-user.js admin@adiology.com password');
  process.exit(1);
}

const [email, password, fullName] = args;

if (!email || !password) {
  console.error('❌ Email and password are required');
  process.exit(1);
}

// Run the function
createSuperAdmin(email, password, fullName || 'Super Admin')
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
