-- ============================================
-- Additional Tables for Super Admin Panel
-- ============================================

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'support', 'marketing', 'system')),
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names like ['user_name', 'plan_name']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_plans JSONB DEFAULT '[]'::jsonb, -- Array of plan names, empty = all users
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'feature_request', 'bug')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================
-- PRICING PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in cents
  price_yearly INTEGER, -- Price in cents (null if not available)
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  limits JSONB DEFAULT '{}'::jsonb, -- Object with limit keys like {"campaigns": 10, "api_calls": 1000}
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pricing_plans
CREATE INDEX IF NOT EXISTS idx_pricing_plans_name ON pricing_plans(name);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_sort_order ON pricing_plans(sort_order);

-- ============================================
-- CONFIG SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS config_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'features', 'limits', 'integrations', 'email')),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- If true, can be read by non-admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for config_settings
CREATE INDEX IF NOT EXISTS idx_config_settings_key ON config_settings(key);
CREATE INDEX IF NOT EXISTS idx_config_settings_category ON config_settings(category);
CREATE INDEX IF NOT EXISTS idx_config_settings_public ON config_settings(is_public);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_settings ENABLE ROW LEVEL SECURITY;

-- Email templates - admins only
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

-- Announcements - public read active, admin write
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT
  USING (is_active = TRUE AND (ends_at IS NULL OR ends_at > NOW()));

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

-- Support tickets - users can read/create own, admins can read all
CREATE POLICY "Users can read own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

-- Pricing plans - public read active, admin write
CREATE POLICY "Anyone can read active pricing plans"
  ON pricing_plans FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage pricing plans"
  ON pricing_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

-- Config settings - public read if is_public, admin write
CREATE POLICY "Public can read public config settings"
  ON config_settings FOR SELECT
  USING (is_public = TRUE OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

CREATE POLICY "Admins can manage config settings"
  ON config_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin')
  ));

-- ============================================
-- TRIGGERS
-- ============================================

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_settings_updated_at BEFORE UPDATE ON config_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE email_templates IS 'Email templates for system notifications';
COMMENT ON TABLE announcements IS 'System announcements and notifications';
COMMENT ON TABLE support_tickets IS 'User support tickets';
COMMENT ON TABLE pricing_plans IS 'Subscription pricing plans configuration';
COMMENT ON TABLE config_settings IS 'System configuration settings';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default pricing plans
INSERT INTO pricing_plans (name, display_name, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
  ('free', 'Free', 'Perfect for getting started', 0, 0, 
   '["Basic campaign builder", "CSV validator", "Keyword planner"]'::jsonb,
   '{"campaigns": 1, "api_calls": 100, "keywords_per_campaign": 50}'::jsonb,
   1),
  ('starter', 'Starter', 'For small businesses', 2900, 29000,
   '["Everything in Free", "Advanced keyword tools", "Ad builder", "Email support"]'::jsonb,
   '{"campaigns": 5, "api_calls": 1000, "keywords_per_campaign": 200}'::jsonb,
   2),
  ('professional', 'Professional', 'For growing businesses', 9900, 99000,
   '["Everything in Starter", "AI keyword generation", "Negative keywords builder", "Priority support"]'::jsonb,
   '{"campaigns": 20, "api_calls": 10000, "keywords_per_campaign": 500}'::jsonb,
   3),
  ('enterprise', 'Enterprise', 'For large organizations', 29900, 299000,
   '["Everything in Professional", "Custom integrations", "Dedicated support", "Custom limits"]'::jsonb,
   '{"campaigns": -1, "api_calls": -1, "keywords_per_campaign": -1}'::jsonb,
   4)
ON CONFLICT (name) DO NOTHING;

-- Insert default config settings
INSERT INTO config_settings (key, value, category, description, is_public)
VALUES 
  ('max_file_size_mb', '10'::jsonb, 'general', 'Maximum file upload size in MB', true),
  ('maintenance_mode', 'false'::jsonb, 'general', 'Enable maintenance mode', false),
  ('signup_enabled', 'true'::jsonb, 'general', 'Allow new user signups', true),
  ('api_rate_limit', '100'::jsonb, 'limits', 'API calls per minute per user', false),
  ('free_plan_campaign_limit', '1'::jsonb, 'limits', 'Maximum campaigns for free plan', true),
  ('stripe_enabled', 'false'::jsonb, 'billing', 'Enable Stripe payments', false),
  ('email_from_address', '"noreply@adiology.com"'::jsonb, 'email', 'Default email sender address', false)
ON CONFLICT (key) DO NOTHING;

