-- Create templates table (canonical templates)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  html_template TEXT NOT NULL,
  assets JSONB DEFAULT '[]'::jsonb,
  placeholders JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Create saved_sites table (user's saved/customized sites)
CREATE TABLE IF NOT EXISTS saved_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  assets JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb, -- {theme, accent, etc}
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  vercel JSONB DEFAULT '{}'::jsonb, -- {projectId, deploymentId, url}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Create indexes for saved_sites
CREATE INDEX IF NOT EXISTS idx_saved_sites_user_id ON saved_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_sites_status ON saved_sites(status);
CREATE INDEX IF NOT EXISTS idx_saved_sites_template_id ON saved_sites(template_id);
CREATE INDEX IF NOT EXISTS idx_saved_sites_created_at ON saved_sites(created_at DESC);

-- Create activity_log table (track user actions)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_site_id UUID REFERENCES saved_sites(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('edit', 'download', 'publish', 'duplicate', 'delete', 'domain_connect')),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional action-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_saved_site_id ON activity_log(saved_site_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Templates: Public read access (templates are shared)
CREATE POLICY "Templates are publicly readable"
  ON templates
  FOR SELECT
  USING (true);

-- Saved Sites: Users can only see their own sites
CREATE POLICY "Users can view their own saved sites"
  ON saved_sites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved sites"
  ON saved_sites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved sites"
  ON saved_sites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved sites"
  ON saved_sites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Activity Log: Users can only see their own activity
CREATE POLICY "Users can view their own activity"
  ON activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_saved_sites_updated_at
  BEFORE UPDATE ON saved_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_sites_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Insert default template (canonical template)
INSERT INTO templates (slug, title, html_template, placeholders, category, thumbnail)
VALUES (
  'canonical',
  'Canonical Template',
  '<!DOCTYPE html>...', -- Will be populated from template.html
  '["title", "hero", "services", "pricing", "contact", "images", "seo", "colors", "policy_links"]'::jsonb,
  'General',
  '🏢'
) ON CONFLICT (slug) DO NOTHING;

