-- Create campaign_history table for storing campaigns directly in database
-- This bypasses the edge function KV store and provides persistent storage

CREATE TABLE IF NOT EXISTS campaign_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_history_user_id ON campaign_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_type ON campaign_history(type);
CREATE INDEX IF NOT EXISTS idx_campaign_history_status ON campaign_history(status);
CREATE INDEX IF NOT EXISTS idx_campaign_history_created_at ON campaign_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE campaign_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaign_history;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaign_history;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaign_history;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaign_history;

-- Policy: Users can only see their own campaigns
CREATE POLICY "Users can view their own campaigns"
  ON campaign_history
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert their own campaigns
CREATE POLICY "Users can insert their own campaigns"
  ON campaign_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own campaigns
CREATE POLICY "Users can update their own campaigns"
  ON campaign_history
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can delete their own campaigns
CREATE POLICY "Users can delete their own campaigns"
  ON campaign_history
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_campaign_history_updated_at ON campaign_history;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_campaign_history_updated_at
  BEFORE UPDATE ON campaign_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

