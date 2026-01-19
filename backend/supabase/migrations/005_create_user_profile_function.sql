-- ============================================
-- SECURITY DEFINER Function for User Profile Creation
-- ============================================
-- This function allows users to create/update their own profile
-- It bypasses RLS by running with elevated privileges

-- Drop the function if it exists
DROP FUNCTION IF EXISTS create_or_update_user_profile(UUID, TEXT, TEXT);

-- Create function to create or update user profile
CREATE OR REPLACE FUNCTION create_or_update_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  subscription_plan TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Ensure the user_id matches the authenticated user
  IF p_user_id::text != auth.uid()::text THEN
    RAISE EXCEPTION 'Permission denied: Can only create/update your own profile';
  END IF;

  -- Insert or update the user profile and return the result
  RETURN QUERY
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
    p_user_id,
    p_email,
    p_full_name,
    'user',
    'free',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW()
  RETURNING
    users.id,
    users.email,
    users.full_name,
    users.role,
    users.subscription_plan,
    users.subscription_status,
    users.created_at,
    users.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_or_update_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION create_or_update_user_profile(UUID, TEXT, TEXT) IS 'Allows users to create or update their own profile, bypassing RLS';

