-- ============================================
-- ALTERNATIVE: Create User Directly via SQL
-- ============================================
-- Use this ONLY if Dashboard user creation fails
-- This creates the user in auth.users and public.users
-- ============================================

-- IMPORTANT: You need to generate a password hash first!
-- Use this tool: https://bcrypt-generator.com/
-- Or use: SELECT crypt('YourPassword', gen_salt('bf'));
-- Then replace 'YOUR_PASSWORD_HASH_HERE' below

-- Step 1: Generate password hash (run this first to get the hash)
-- Replace 'YourPassword' with your actual password
SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;

-- Step 2: Copy the hash from above, then run this to create the user
-- Replace 'YOUR_PASSWORD_HASH_HERE' with the hash from Step 1

DO $$
DECLARE
  user_id UUID := gen_random_uuid();
  user_email TEXT := 'sam@sam.com';
  user_password_hash TEXT := 'YOUR_PASSWORD_HASH_HERE'; -- Replace with hash from Step 1
  user_full_name TEXT := 'sam@sam.com';
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'User % already exists. Updating role to superadmin...', user_email;
    
    -- Get existing user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
  ELSE
    -- Create user in auth.users
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
      user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      user_password_hash,
      NOW(), -- Auto-confirm email
      jsonb_build_object(
        'full_name', user_full_name,
        'role', 'superadmin'
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE '✅ User created in auth.users';
  END IF;

  -- Create/update in public.users
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
    user_full_name,
    'superadmin',
    'free',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    full_name = user_full_name,
    updated_at = NOW();

  -- Update auth.users metadata
  UPDATE auth.users
  SET 
    raw_user_meta_data = jsonb_build_object(
      'full_name', user_full_name,
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

-- Verify the user
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'role' as auth_role,
  u.role as user_role,
  u.full_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'sam@sam.com';

