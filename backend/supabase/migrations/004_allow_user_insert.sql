-- ============================================
-- Allow users to insert their own profile
-- ============================================
-- This policy allows authenticated users to create their own profile
-- when they first sign up

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

