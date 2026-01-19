-- Create published_websites table
CREATE TABLE IF NOT EXISTS published_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_data JSONB NOT NULL,
  vercel_deployment_id TEXT NOT NULL,
  vercel_url TEXT NOT NULL,
  vercel_project_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('deploying', 'ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_published_websites_user_id ON published_websites(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_published_websites_created_at ON published_websites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE published_websites ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own websites
CREATE POLICY "Users can view their own websites"
  ON published_websites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own websites
CREATE POLICY "Users can insert their own websites"
  ON published_websites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own websites
CREATE POLICY "Users can update their own websites"
  ON published_websites
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own websites
CREATE POLICY "Users can delete their own websites"
  ON published_websites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_published_websites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_published_websites_updated_at
  BEFORE UPDATE ON published_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_published_websites_updated_at();

