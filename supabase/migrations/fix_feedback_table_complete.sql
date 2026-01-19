-- Complete fix for feedback table
-- This migration handles both cases:
-- 1. Table doesn't exist - creates it with correct schema
-- 2. Table exists with wrong constraint - fixes the constraint

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  type TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop old constraint if it exists (with wrong values)
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;

-- Add correct constraint
ALTER TABLE feedback 
  ADD CONSTRAINT feedback_type_check 
  CHECK (type IN ('feedback', 'feature_request'));

-- Update any existing records with old value
UPDATE feedback 
SET type = 'feature_request' 
WHERE type = 'feature';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (to ensure they're correct)
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Super admins can view all feedback" ON feedback;
CREATE POLICY "Super admins can view all feedback"
  ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update feedback" ON feedback;
CREATE POLICY "Super admins can update feedback"
  ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

