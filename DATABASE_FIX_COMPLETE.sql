-- ============================================================================
-- DATABASE_FIX_COMPLETE.sql
-- Adiology Database Schema Fix - Safe to run multiple times
-- ============================================================================
-- This script adds all missing columns to your Supabase/PostgreSQL database
-- Run this in your database SQL editor (Supabase SQL Editor, pgAdmin, etc.)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FIX: campaign_history table - Add missing columns
-- ============================================================================

-- Add 'type' column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'type') THEN
        ALTER TABLE campaign_history ADD COLUMN type TEXT DEFAULT 'campaign';
        UPDATE campaign_history SET type = 'campaign' WHERE type IS NULL;
        RAISE NOTICE 'Added column: campaign_history.type';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.type';
    END IF;
END $$;

-- Add 'name' column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'name') THEN
        ALTER TABLE campaign_history ADD COLUMN name TEXT DEFAULT 'Untitled Campaign';
        UPDATE campaign_history SET name = 'Untitled Campaign' WHERE name IS NULL;
        RAISE NOTICE 'Added column: campaign_history.name';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.name';
    END IF;
END $$;

-- Add 'data' column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'data') THEN
        ALTER TABLE campaign_history ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
        UPDATE campaign_history SET data = '{}'::jsonb WHERE data IS NULL;
        RAISE NOTICE 'Added column: campaign_history.data';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.data';
    END IF;
END $$;

-- Add 'status' column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'status') THEN
        ALTER TABLE campaign_history ADD COLUMN status TEXT DEFAULT 'completed';
        UPDATE campaign_history SET status = 'completed' WHERE status IS NULL;
        RAISE NOTICE 'Added column: campaign_history.status';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.status';
    END IF;
END $$;

-- Add 'workspace_id' column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'workspace_id') THEN
        ALTER TABLE campaign_history ADD COLUMN workspace_id UUID;
        RAISE NOTICE 'Added column: campaign_history.workspace_id';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.workspace_id';
    END IF;
END $$;

-- Add 'user_id' column if missing (for older tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'user_id') THEN
        ALTER TABLE campaign_history ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added column: campaign_history.user_id';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.user_id';
    END IF;
END $$;

-- Add timestamps if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'created_at') THEN
        ALTER TABLE campaign_history ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added column: campaign_history.created_at';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.created_at';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaign_history' AND column_name = 'updated_at') THEN
        ALTER TABLE campaign_history ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added column: campaign_history.updated_at';
    ELSE
        RAISE NOTICE 'Column already exists: campaign_history.updated_at';
    END IF;
END $$;

-- ============================================================================
-- FIX: users table - Add missing columns
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
        RAISE NOTICE 'Added column: users.stripe_customer_id';
    ELSE
        RAISE NOTICE 'Column already exists: users.stripe_customer_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
        RAISE NOTICE 'Added column: users.stripe_subscription_id';
    ELSE
        RAISE NOTICE 'Column already exists: users.stripe_subscription_id';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'ai_usage') THEN
        ALTER TABLE users ADD COLUMN ai_usage INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column: users.ai_usage';
    ELSE
        RAISE NOTICE 'Column already exists: users.ai_usage';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_blocked') THEN
        ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added column: users.is_blocked';
    ELSE
        RAISE NOTICE 'Column already exists: users.is_blocked';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
        RAISE NOTICE 'Added column: users.subscription_plan';
    ELSE
        RAISE NOTICE 'Column already exists: users.subscription_plan';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added column: users.subscription_status';
    ELSE
        RAISE NOTICE 'Column already exists: users.subscription_status';
    END IF;
END $$;

-- ============================================================================
-- CREATE: subscriptions table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: payments table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    subscription_id UUID,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL,
    payment_method_type TEXT,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);

-- ============================================================================
-- CREATE: invoices table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    stripe_invoice_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: emails table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    recipient_email TEXT NOT NULL,
    sender_email TEXT DEFAULT 'noreply@adiology.com',
    subject TEXT NOT NULL,
    template_name TEXT,
    template_data JSONB,
    status TEXT NOT NULL DEFAULT 'queued',
    provider TEXT DEFAULT 'aws_ses',
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    complained_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: audit_logs table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    admin_user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    level TEXT NOT NULL DEFAULT 'info',
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: security_rules table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    reason TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: feedback table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    user_email TEXT,
    type TEXT NOT NULL,
    rating INTEGER,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- CREATE: templates table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    html_template TEXT NOT NULL,
    assets JSONB DEFAULT '[]'::jsonb,
    placeholders JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    thumbnail TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: published_websites table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS published_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_data JSONB NOT NULL,
    vercel_deployment_id TEXT NOT NULL,
    vercel_url TEXT NOT NULL,
    vercel_project_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: user_notifications table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    action_type TEXT,
    action_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE: ad_search_requests table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS ad_search_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    search_query TEXT NOT NULL,
    advertiser_domain TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    results JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============================================================================
-- CREATE INDEXES for better performance
-- ============================================================================

-- campaign_history indexes
CREATE INDEX IF NOT EXISTS idx_campaign_history_user_id ON campaign_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_type ON campaign_history(type);
CREATE INDEX IF NOT EXISTS idx_campaign_history_status ON campaign_history(status);
CREATE INDEX IF NOT EXISTS idx_campaign_history_created_at ON campaign_history(created_at);

-- users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- emails indexes
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);

-- feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- user_notifications indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);

-- ad_search_requests indexes
CREATE INDEX IF NOT EXISTS idx_ad_search_requests_user_id ON ad_search_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_search_requests_status ON ad_search_requests(status);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '  DATABASE FIX COMPLETE!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '  All missing columns have been added.';
    RAISE NOTICE '  All missing tables have been created.';
    RAISE NOTICE '  All indexes have been created.';
    RAISE NOTICE '';
    RAISE NOTICE '  Next steps:';
    RAISE NOTICE '  1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)';
    RAISE NOTICE '  2. Go to your dashboard';
    RAISE NOTICE '  3. All errors should be resolved!';
    RAISE NOTICE '============================================================';
END $$;

-- Success confirmation
SELECT 'DATABASE FIX COMPLETE! Refresh your browser to see the changes.' AS result;
