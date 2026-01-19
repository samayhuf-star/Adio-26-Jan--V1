-- ============================================
-- SQL Script to Create Superadmin User
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
--
-- This creates a superadmin user that can login via the SuperAdminLogin page
-- ============================================

-- Step 1: Create user in auth.users (if not exists)
-- Note: You'll need to create the user via Supabase Dashboard first:
-- https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users
-- Then run this SQL to set the role

-- Replace 'USER_EMAIL_HERE' with the actual email of the user you created
-- Replace 'USER_ID_HERE' with the UUID from auth.users table

-- First, let's check if user exists and get their ID
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
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please create the user first via Supabase Dashboard → Auth → Users → Add User', user_email;
  END IF;

  -- Update or insert into users table
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
  VALUES (
    user_id,
    user_email,
    'sam@sam.com',
    'superadmin',
    'free',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    full_name = 'sam@sam.com',
    updated_at = NOW();

  -- Update user metadata in auth.users
  UPDATE auth.users
  SET 
    raw_user_meta_data = jsonb_build_object(
      'full_name', 'sam@sam.com',
      'role', 'superadmin'
    ),
    updated_at = NOW()
  WHERE id = user_id;

  RAISE NOTICE '✅ Superadmin user created/updated successfully!';
  RAISE NOTICE '   User ID: %', user_id;
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   Role: superadmin';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login at: https://www.adiology.online/superadmin';
END $$;

-- Verify the user was created
SELECT 
  id,
  email,
  full_name,
  role,
  subscription_plan,
  subscription_status,
  created_at
FROM public.users
WHERE email = 'sam@sam.com';

