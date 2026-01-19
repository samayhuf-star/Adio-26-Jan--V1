-- ============================================
-- Users Table Migration
-- ============================================
-- This migration creates the users table that extends Supabase auth.users
-- with additional application-specific fields

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'lifetime')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  ai_usage INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  last_sign_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role and admin fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role or admin-only fields
    (OLD.role = NEW.role) AND
    (OLD.subscription_plan = NEW.subscription_plan OR auth.uid() = id) AND
    (OLD.subscription_status = NEW.subscription_status OR auth.uid() = id) AND
    (OLD.is_blocked = NEW.is_blocked OR auth.uid() = id)
  );

-- Super admins can view all users
CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
    )
  );

-- Super admins can manage all users
CREATE POLICY "Super admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'superadmin'
    )
  );

-- Allow user creation (for new signups)
CREATE POLICY "Allow user creation"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync user data from auth.users
CREATE OR REPLACE FUNCTION sync_user_from_auth()
RETURNS TRIGGER AS $
BEGIN
  -- Insert or update user record when auth.users changes
  INSERT INTO users (id, email, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    last_sign_in = CASE 
      WHEN NEW.last_sign_in_at > OLD.last_sign_in_at THEN NEW.last_sign_in_at
      ELSE users.last_sign_in
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to sync from auth.users (if we have access to it)
-- Note: This might not work in all Supabase setups due to RLS on auth.users
-- CREATE TRIGGER sync_user_from_auth_trigger
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION sync_user_from_auth();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample admin user for testing
DO $
BEGIN
  -- Only insert if no users exist
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    -- Insert a test super admin user
    INSERT INTO users (
      id, 
      email, 
      full_name, 
      role, 
      subscription_plan, 
      subscription_status,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'admin@adiology.com',
      'Super Admin',
      'superadmin',
      'lifetime',
      'active',
      NOW()
    );

    -- Insert some sample regular users
    INSERT INTO users (
      id, 
      email, 
      full_name, 
      role, 
      subscription_plan, 
      subscription_status,
      ai_usage,
      created_at
    ) VALUES 
    (gen_random_uuid(), 'user1@example.com', 'John Doe', 'user', 'basic', 'active', 15, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), 'user2@example.com', 'Jane Smith', 'user', 'pro', 'active', 45, NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), 'user3@example.com', 'Bob Johnson', 'user', 'free', 'trialing', 5, NOW() - INTERVAL '7 days'),
    (gen_random_uuid(), 'user4@example.com', 'Alice Brown', 'user', 'lifetime', 'active', 120, NOW() - INTERVAL '60 days');
  END IF;
END $;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Extended user profiles with subscription and admin data';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - must match Supabase auth user';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or superadmin';
COMMENT ON COLUMN users.subscription_plan IS 'Current subscription plan';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN users.ai_usage IS 'Number of AI operations used this month';
COMMENT ON COLUMN users.is_blocked IS 'Whether the user is blocked by admin';