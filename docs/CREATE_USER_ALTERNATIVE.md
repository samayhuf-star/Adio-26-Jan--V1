# Alternative: Create User When Dashboard Fails

If you're getting "Project not specified" error in the Supabase Dashboard, here are alternative methods:

## Method 1: Try Dashboard Again (Simplest)

1. **Clear browser cache** for supabase.com
2. **Try incognito/private window**
3. **Check project status**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
4. **Wait a few minutes** and try again (might be temporary Supabase issue)

## Method 2: Create User via SQL (If Dashboard Keeps Failing)

### Step 1: Generate Password Hash

1. Go to SQL Editor: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
2. Run this to generate password hash:

```sql
SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;
```

3. **Copy the hash** (it will be a long string starting with `$2a$` or `$2b$`)

### Step 2: Create User with Hash

1. In the same SQL Editor, run the script from `scripts/create-user-via-sql.sql`
2. **Replace `YOUR_PASSWORD_HASH_HERE`** with the hash from Step 1
3. Click "Run"

### Step 3: Verify and Login

1. Verify user exists: Check the verification query results
2. Login at: https://www.adiology.online/superadmin
   - Email: `sam@sam.com`
   - Password: `YourPassword`

## Method 3: Use Supabase CLI (If You Have It)

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Create user (requires service role key)
supabase db execute "
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'sam@sam.com',
    crypt('YourPassword', gen_salt('bf')),
    NOW(),
    '{\"role\": \"superadmin\", \"full_name\": \"sam@sam.com\"}'::jsonb
  );
"
```

## Method 4: Contact Supabase Support

If none of the above work, the project might have an issue:

1. Check project status: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Check for any error messages or warnings
3. Contact Supabase support if project appears paused or has issues

## Quick SQL Script (All-in-One)

If you want to try the SQL method, here's a simplified version:

```sql
-- First, generate password hash
SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;

-- Then use that hash in this (replace YOUR_HASH):
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  'sam@sam.com',
  'YOUR_HASH_HERE',  -- Paste hash from above
  NOW(),
  '{"role": "superadmin", "full_name": "sam@sam.com"}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id;

-- Then set role in public.users (use the ID from above)
INSERT INTO public.users (id, email, full_name, role, subscription_plan, subscription_status)
VALUES (
  'USER_ID_FROM_ABOVE',  -- Use the ID returned above
  'sam@sam.com',
  'sam@sam.com',
  'superadmin',
  'free',
  'active'
);
```

## Recommended Approach

1. **First**: Try Method 1 (refresh/clear cache)
2. **If that fails**: Use Method 2 (SQL with password hash)
3. **Last resort**: Contact Supabase support

