-- ============================================
-- User Management Functions and Triggers
-- ============================================

-- Function to sync auth.users with users table on signup
CREATE OR REPLACE FUNCTION sync_user_on_signup()
RETURNS TRIGGER AS $$
BEGIN
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
    NOW(),
    NOW(),
    NEW.last_sign_in_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    last_login_at = NEW.last_sign_in_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_on_signup();

-- Function to update last_login_at when user signs in
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NEW.last_sign_in_at,
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login_at on sign in
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();

-- Function to handle user deletion cascade
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related records (cascades should handle most, but we can add custom logic here)
  -- Note: RLS policies and foreign key constraints handle most cascades automatically
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create subscription when user is created with a paid plan
CREATE OR REPLACE FUNCTION create_subscription_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create subscription if plan is not 'free'
  IF NEW.subscription_plan != 'free' THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.subscription_plan,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when user plan is set
DROP TRIGGER IF EXISTS on_user_subscription_plan_set ON public.users;
CREATE TRIGGER on_user_subscription_plan_set
  AFTER INSERT OR UPDATE OF subscription_plan ON public.users
  FOR EACH ROW
  WHEN (NEW.subscription_plan IS DISTINCT FROM COALESCE(OLD.subscription_plan, 'free'))
  EXECUTE FUNCTION create_subscription_on_user_creation();

-- Function to log user actions to audit_logs
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create_user';
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update_user';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete_user';
    old_data := to_jsonb(OLD);
  END IF;

  -- Insert audit log (only for admin/superadmin actions, not system triggers)
  -- This will be called from the API layer with proper user context
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics (for admin dashboard)
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  suspended_users BIGINT,
  users_by_plan JSONB,
  recent_signups_30d BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.users WHERE subscription_status = 'active')::BIGINT as active_users,
    (SELECT COUNT(*) FROM public.users WHERE subscription_status = 'suspended')::BIGINT as suspended_users,
    (
      SELECT jsonb_object_agg(subscription_plan, count)
      FROM (
        SELECT subscription_plan, COUNT(*)::INTEGER as count
        FROM public.users
        GROUP BY subscription_plan
      ) plan_counts
    ) as users_by_plan,
    (
      SELECT COUNT(*)
      FROM public.users
      WHERE created_at >= NOW() - INTERVAL '30 days'
    )::BIGINT as recent_signups_30d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription statistics
CREATE OR REPLACE FUNCTION get_subscription_statistics()
RETURNS TABLE (
  total_subscriptions BIGINT,
  active_subscriptions BIGINT,
  canceled_subscriptions BIGINT,
  subscriptions_by_plan JSONB,
  mrr NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.subscriptions)::BIGINT as total_subscriptions,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active')::BIGINT as active_subscriptions,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'canceled')::BIGINT as canceled_subscriptions,
    (
      SELECT jsonb_object_agg(plan, count)
      FROM (
        SELECT plan, COUNT(*)::INTEGER as count
        FROM public.subscriptions
        WHERE status = 'active'
        GROUP BY plan
      ) plan_counts
    ) as subscriptions_by_plan,
    (
      SELECT COALESCE(SUM(pp.price_monthly), 0)
      FROM public.subscriptions s
      JOIN public.pricing_plans pp ON s.plan = pp.name
      WHERE s.status = 'active'
    )::NUMERIC / 100.0 as mrr; -- Convert cents to dollars
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users (for admin search)
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  subscription_plan TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.subscription_plan,
    u.subscription_status,
    u.created_at,
    u.last_login_at
  FROM public.users u
  WHERE
    u.email ILIKE '%' || search_term || '%'
    OR u.full_name ILIKE '%' || search_term || '%'
    OR u.id::TEXT ILIKE '%' || search_term || '%'
  ORDER BY u.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (for admin functions)
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION sync_user_on_signup() IS 'Syncs auth.users with public.users table on user creation';
COMMENT ON FUNCTION update_last_login() IS 'Updates last_login_at when user signs in';
COMMENT ON FUNCTION create_subscription_on_user_creation() IS 'Creates subscription record when user is assigned a paid plan';
COMMENT ON FUNCTION get_user_statistics() IS 'Returns user statistics for admin dashboard';
COMMENT ON FUNCTION get_subscription_statistics() IS 'Returns subscription statistics for admin dashboard';
COMMENT ON FUNCTION search_users(TEXT) IS 'Searches users by email, name, or ID';

