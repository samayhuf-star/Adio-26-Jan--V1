-- ============================================
-- Admin Panel Required Tables Migration
-- ============================================
-- This migration creates the missing tables needed for the admin panel
-- to display real data instead of zeros

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'basic', 'pro', 'lifetime')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_name);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled', 'requires_action')),
  payment_method_type TEXT, -- 'card', 'bank_transfer', etc.
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- ============================================
-- EMAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  sender_email TEXT DEFAULT 'noreply@adiology.com',
  subject TEXT NOT NULL,
  template_name TEXT,
  template_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'complained')) DEFAULT 'queued',
  provider TEXT DEFAULT 'aws_ses',
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for emails
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_template ON emails(template_name);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')) DEFAULT 'info',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- SECURITY_RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS security_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ip_block', 'rate_limit', 'access_rule', 'firewall_rule')),
  value TEXT NOT NULL,
  reason TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- Lower numbers = higher priority
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security_rules
CREATE INDEX IF NOT EXISTS idx_security_rules_type ON security_rules(type);
CREATE INDEX IF NOT EXISTS idx_security_rules_active ON security_rules(active);
CREATE INDEX IF NOT EXISTS idx_security_rules_priority ON security_rules(priority);
CREATE INDEX IF NOT EXISTS idx_security_rules_expires_at ON security_rules(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_rules_created_by ON security_rules(created_by);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_rules ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Super admins can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Super admins can manage all payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Emails policies
CREATE POLICY "Users can view emails sent to them"
  ON emails FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.email() = recipient_email
  );

CREATE POLICY "Super admins can view all emails"
  ON emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Super admins can manage all emails"
  ON emails FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Audit logs policies (admin only)
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Super admins can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Security rules policies (admin only)
CREATE POLICY "Super admins can view all security rules"
  ON security_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Super admins can manage all security rules"
  ON security_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

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

-- Triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_rules_updated_at 
  BEFORE UPDATE ON security_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $
BEGIN
  -- Only log if the action is performed by a super admin
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  ) THEN
    INSERT INTO audit_logs (
      admin_user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      level
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
      'info'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Add audit triggers to important tables
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_subscriptions_changes
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_security_rules_changes
  AFTER INSERT OR UPDATE OR DELETE ON security_rules
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE subscriptions IS 'User subscription plans and billing status';
COMMENT ON TABLE payments IS 'Payment records from Stripe and other providers';
COMMENT ON TABLE emails IS 'Email delivery tracking and templates';
COMMENT ON TABLE audit_logs IS 'Admin action logs for compliance and debugging';
COMMENT ON TABLE security_rules IS 'Security and firewall rules for access control';

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert some sample data for testing (only if tables are empty)
DO $
BEGIN
  -- Sample subscription data
  IF NOT EXISTS (SELECT 1 FROM subscriptions LIMIT 1) THEN
    INSERT INTO subscriptions (user_id, plan_name, status, created_at) VALUES
    (gen_random_uuid(), 'basic', 'active', NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), 'pro', 'active', NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), 'lifetime', 'active', NOW() - INTERVAL '60 days');
  END IF;

  -- Sample payment data
  IF NOT EXISTS (SELECT 1 FROM payments LIMIT 1) THEN
    INSERT INTO payments (user_id, amount_cents, currency, status, description, created_at, paid_at) VALUES
    (gen_random_uuid(), 6999, 'usd', 'succeeded', 'Basic Monthly Plan', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), 12999, 'usd', 'succeeded', 'Pro Monthly Plan', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), 9999, 'usd', 'succeeded', 'Lifetime Plan', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');
  END IF;

  -- Sample email data
  IF NOT EXISTS (SELECT 1 FROM emails LIMIT 1) THEN
    INSERT INTO emails (recipient_email, subject, status, template_name, sent_at, delivered_at, created_at) VALUES
    ('user1@example.com', 'Welcome to Adiology!', 'delivered', 'welcome', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('user2@example.com', 'Your subscription is active', 'delivered', 'subscription_active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('user3@example.com', 'Payment received', 'sent', 'payment_confirmation', NOW() - INTERVAL '3 hours', NULL, NOW() - INTERVAL '3 hours');
  END IF;

  -- Sample audit log data
  IF NOT EXISTS (SELECT 1 FROM audit_logs LIMIT 1) THEN
    INSERT INTO audit_logs (action, resource_type, level, details, created_at) VALUES
    ('user_login', 'authentication', 'info', '{"ip": "192.168.1.1", "success": true}', NOW() - INTERVAL '1 hour'),
    ('subscription_created', 'subscription', 'info', '{"plan": "basic", "amount": 6999}', NOW() - INTERVAL '2 hours'),
    ('payment_failed', 'payment', 'error', '{"error": "insufficient_funds", "amount": 12999}', NOW() - INTERVAL '6 hours');
  END IF;

END $;