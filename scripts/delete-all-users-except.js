/**
 * Script to delete all users except a specific email
 * 
 * Usage:
 *   node scripts/delete-all-users-except.js <keep_email>
 * 
 * Example:
 *   node scripts/delete-all-users-except.js d@d.com
 * 
 * WARNING: This will permanently delete all users except the specified email!
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

async function deleteAllUsersExcept(keepEmail) {
  try {
    console.log(`\n🗑️  Deleting all users except: ${keepEmail}\n`);
    console.log('⚠️  WARNING: This will permanently delete all other users!\n');

    // Get all users from Auth
    console.log('📋 Fetching all users from Supabase Auth...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    if (!authUsers?.users || authUsers.users.length === 0) {
      console.log('✅ No users found');
      return;
    }

    console.log(`✅ Found ${authUsers.users.length} user(s)\n`);

    // Find the user to keep
    const keepUser = authUsers.users.find(u => u.email?.toLowerCase() === keepEmail.toLowerCase());
    
    if (!keepUser) {
      console.error(`❌ User with email ${keepEmail} not found!`);
      console.log('   Available users:');
      authUsers.users.forEach(u => console.log(`     - ${u.email}`));
      process.exit(1);
    }

    console.log(`✅ Keeping user: ${keepUser.email} (ID: ${keepUser.id})\n`);

    // Filter users to delete
    const usersToDelete = authUsers.users.filter(u => u.id !== keepUser.id);

    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete (only the specified user exists)');
      return;
    }

    console.log(`🗑️  Users to delete (${usersToDelete.length}):`);
    usersToDelete.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u.id})`);
    });
    console.log('');

    // Delete users from Auth
    let deletedCount = 0;
    let errorCount = 0;

    for (const user of usersToDelete) {
      try {
        console.log(`   Deleting ${user.email}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting ${user.email}: ${deleteError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Deleted ${user.email}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error deleting ${user.email}: ${err.message}`);
        errorCount++;
      }
    }

    // Also clean up users table (cascade should handle this, but let's be explicit)
    console.log('\n📋 Cleaning up users table...');
    const userIdsToDelete = usersToDelete.map(u => u.id);
    
    if (userIdsToDelete.length > 0) {
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .in('id', userIdsToDelete);

      if (dbError) {
        console.warn(`   ⚠️  Error cleaning up users table: ${dbError.message}`);
        console.warn('   (This is usually fine - cascade deletes may have already handled it)');
      } else {
        console.log(`   ✅ Cleaned up ${userIdsToDelete.length} user(s) from users table`);
      }
    }

    console.log('\n✅ Deletion complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Deleted: ${deletedCount} user(s)`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} user(s)`);
    }
    console.log(`   Kept: ${keepUser.email}`);
    console.log(`\n🔐 Remaining user credentials:`);
    console.log(`   Email: ${keepUser.email}`);
    console.log(`   ID: ${keepUser.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\n   Full error:', error.stack);
    }
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node scripts/delete-all-users-except.js <keep_email>');
  console.log('\nExample:');
  console.log('  node scripts/delete-all-users-except.js d@d.com');
  console.log('\n⚠️  WARNING: This will permanently delete all other users!');
  process.exit(1);
}

const keepEmail = args[0];

if (!keepEmail) {
  console.error('❌ Email to keep is required');
  process.exit(1);
}

// Run the function
deleteAllUsersExcept(keepEmail)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
