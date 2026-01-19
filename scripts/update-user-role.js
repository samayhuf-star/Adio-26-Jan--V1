/**
 * Script to update user role in Supabase
 * 
 * Usage:
 *   node scripts/update-user-role.js <email> <role>
 * 
 * Example:
 *   node scripts/update-user-role.js d@d.com admin
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kkdnnrwhzofttzajnwlj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateUserRole(email, role) {
  try {
    console.log(`\n🔄 Updating user role...\n`);
    console.log(`   Email: ${email}`);
    console.log(`   New Role: ${role}\n`);

    // First, get the user ID from auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`✅ Found user: ${user.id}`);

    // Update the users table
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ User role updated successfully!`);
    console.log(`\n📋 Updated user:`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   ID: ${user.id}`);

  } catch (error) {
    console.error('\n❌ Error updating user role:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/update-user-role.js <email> <role>');
  console.log('\nExample:');
  console.log('  node scripts/update-user-role.js d@d.com admin');
  process.exit(1);
}

const [email, role] = args;

if (!email || !role) {
  console.error('❌ Email and role are required');
  process.exit(1);
}

if (!['user', 'admin', 'superadmin'].includes(role)) {
  console.error('❌ Role must be one of: user, admin, superadmin');
  process.exit(1);
}

// Run the function
updateUserRole(email, role)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
