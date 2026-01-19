# Quick Superadmin Setup - Step by Step

## Step 1: Create User in Supabase Auth (REQUIRED FIRST)

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users

2. **Click "Add User"** button (top right)

3. **Select "Create new user"**

4. **Fill in the form:**
   - **Email**: `sam@sam.com`
   - **Password**: `YourPassword` (or your preferred password)
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (important!)
   - **Send magic link**: ❌ Leave unchecked

5. **Click "Create User"**

6. **Verify the user was created:**
   - You should see `sam@sam.com` in the users list
   - Note the User ID (UUID) - you'll see it in the list

## Step 2: Set Superadmin Role via SQL

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new

2. **Copy and paste this SQL:**

```sql
-- Set superadmin role for sam@sam.com
DO $$
DECLARE
  user_id UUID;
  user_email TEXT := 'sam@sam.com';
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist. Please create the user first via Dashboard → Auth → Users → Add User', user_email;
  END IF;

  -- Update or insert into users table
  INSERT INTO public.users (
    id, email, full_name, role, subscription_plan, subscription_status, created_at, updated_at
  )
  VALUES (
    user_id, user_email, 'sam@sam.com', 'superadmin', 'free', 'active', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    full_name = 'sam@sam.com',
    updated_at = NOW();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('full_name', 'sam@sam.com', 'role', 'superadmin')
  WHERE id = user_id;

  RAISE NOTICE '✅ Superadmin user created successfully!';
  RAISE NOTICE '   User ID: %', user_id;
  RAISE NOTICE '   Email: %', user_email;
END $$;

-- Verify the user was created correctly
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

3. **Click "Run"** button (or press Cmd/Ctrl + Enter)

4. **Check the results:**
   - You should see a success message
   - The verification query should show `role = 'superadmin'` and `auth_role = 'superadmin'`

## Step 3: Test Login

1. **Go to Super Admin Login:**
   - https://www.adiology.online/superadmin

2. **Login with:**
   - **Email**: `sam@sam.com`
   - **Password**: `YourPassword` (or whatever you set in Step 1)

3. **You should see the Super Admin Panel!**

## Troubleshooting

### "User does not exist" error
- **Solution**: Make sure you completed Step 1 (create user in Dashboard) before running the SQL
- Verify the user exists: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users

### "Access denied" after login
- **Solution**: Verify the SQL ran successfully and both `role` and `auth_role` are `'superadmin'`
- Run the verification query from Step 2 again

### Can't find "Add User" button
- Make sure you're logged into the correct Supabase project
- Check the URL contains: `kkdnnrwhzofttzajnwlj`

## Quick Links

- **Create User**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users
- **SQL Editor**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
- **Super Admin Login**: https://www.adiology.online/superadmin

