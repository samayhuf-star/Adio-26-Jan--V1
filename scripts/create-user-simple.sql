-- ============================================
-- SIMPLE: Create Superadmin User via SQL
-- ============================================
-- This bypasses the Dashboard UI entirely
-- Run in: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
-- ============================================

-- Step 1: Generate password hash for 'YourPassword'
-- Run this FIRST and copy the hash
SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;

-- Step 2: After you get the hash, run this (replace YOUR_HASH with the hash from Step 1)
-- This creates the user in auth.users
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'sam@sam.com';
  user_password_hash TEXT := 'YOUR_HASH_HERE'; -- ⚠️ REPLACE WITH HASH FROM STEP 1
  user_full_name TEXT := 'sam@sam.com';
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE '⚠️  User % already exists. Updating to superadmin...', user_email;
    
    -- Get existing user ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email LIMIT 1;
    
    -- Update existing user
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_build_object('full_name', user_full_name, 'role', 'superadmin'),
      updated_at = NOW()
    WHERE id = new_user_id;
    
  ELSE
    -- Create new user in auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      user_password_hash,
      NOW(), -- Auto-confirm email
      jsonb_build_object('full_name', user_full_name, 'role', 'superadmin'),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE '✅ User created in auth.users with ID: %', new_user_id;
  END IF;

  -- Create/update in public.users
  INSERT INTO public.users (
    id, email, full_name, role, subscription_plan, subscription_status, created_at, updated_at
  )
  VALUES (
    new_user_id, user_email, user_full_name, 'superadmin', 'free', 'active', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    full_name = user_full_name,
    updated_at = NOW();

  RAISE NOTICE '✅ Superadmin user setup complete!';
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   Password: YourPassword';
  RAISE NOTICE '   Login at: https://www.adiology.online/superadmin';
END $$;

-- Step 3: Verify (run this after Step 2)
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.raw_user_meta_data->>'role' as auth_role,
  u.role as user_role,
  u.full_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'sam@sam.com';

