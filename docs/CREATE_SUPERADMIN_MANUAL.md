# Manual Superadmin User Creation

Since the automated script requires a valid service role key, here's how to create the superadmin user manually:

## Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Create User in Auth

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - **Email**: `sam@sam.com`
   - **Password**: `YourPassword` (or your preferred password)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create User"**
5. Copy the **User ID** (UUID) - you'll need it for Step 2

### Step 2: Set Superadmin Role via SQL

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
2. Copy and paste the SQL from `scripts/create-superadmin-sql.sql`
3. Click **"Run"**

Or run this SQL directly:

```sql
-- Replace USER_ID with the UUID from Step 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'full_name', 'sam@sam.com',
  'role', 'superadmin'
)
WHERE email = 'sam@sam.com';

-- Update users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  'sam@sam.com',
  'superadmin',
  'free',
  'active',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'sam@sam.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  full_name = 'sam@sam.com',
  updated_at = NOW();
```

## Method 2: Fix Service Role Key and Use Script

### Step 1: Get Correct Service Role Key

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/api
2. Scroll to **"Project API keys"**
3. Find **"service_role"** key (NOT the anon key)
4. Copy the entire key (it's very long, starts with `eyJ...`)

### Step 2: Update .env File

Add or update in your `.env` file:

```bash
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Run Script

```bash
node scripts/create-superadmin-user.js sam@sam.com YourPassword "sam@sam.com"
```

## Verify Superadmin User

After creating the user, verify it works:

1. Go to: https://www.adiology.online/superadmin
2. Login with:
   - Email: `sam@sam.com`
   - Password: `YourPassword` (or whatever you set)
3. You should see the Super Admin Panel

## Troubleshooting

### "Access denied" or "Unauthorized"
- Verify the user has `role = 'superadmin'` in the `users` table
- Check that the user exists in both `auth.users` and `public.users`

### "User not found"
- Make sure the user was created in Supabase Auth first
- Verify the email matches exactly (case-sensitive)

### "Project not specified" error
- The service role key is incorrect or for a different project
- Get the correct key from the Supabase Dashboard

## Quick SQL Check

Run this to verify the superadmin user:

```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.subscription_plan,
  u.subscription_status,
  au.raw_user_meta_data->>'role' as auth_role
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'sam@sam.com';
```

Both `u.role` and `auth_role` should be `'superadmin'`.

