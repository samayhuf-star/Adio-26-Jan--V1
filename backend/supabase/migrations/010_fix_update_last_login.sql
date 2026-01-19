-- ============================================
-- FIX UPDATE_LAST_LOGIN FUNCTION
-- ============================================
-- This fixes the "Database error granting user" issue
-- The function now uses INSERT ... ON CONFLICT DO UPDATE instead of just UPDATE
-- This ensures the user record exists even if sync_user_on_signup didn't run

-- Drop and recreate the function to handle missing users
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT DO UPDATE to ensure user exists
  -- This handles cases where sync_user_on_signup didn't run or failed
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'free'),
    'active',
    COALESCE((SELECT created_at FROM public.users WHERE id = NEW.id), NOW()),
    NOW(),
    NEW.last_sign_in_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    last_login_at = EXCLUDED.last_login_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_last_login() IS 'Updates or creates user record with last_login_at when user signs in (handles missing users)';

