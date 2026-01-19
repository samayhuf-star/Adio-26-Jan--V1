# Supabase Database Schema Documentation

## Overview
This document describes the database schema and configuration for the Adiology Campaign Dashboard.

## Project Information
- **Project ID:** `kkdnnrwhzofttzajnwlj`
- **Project URL:** `https://kkdnnrwhzofttzajnwlj.supabase.co`

---

## Current Tables

### 1. `kv_store_6757d0ca`
**Purpose:** Key-value store for history, tickets, and other temporary data.

**Schema:**
```sql
CREATE TABLE kv_store_6757d0ca (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for prefix searches
CREATE INDEX idx_kv_store_prefix ON kv_store_6757d0ca USING gin (key gin_trgm_ops);
```

**Usage:**
- History entries: `history:userId:id`
- Support tickets: `ticket:userId:id`
- Other key-value data

**Row Level Security (RLS):**
⚠️ **Status:** Not configured - needs RLS policies

**Recommended RLS Policy:**
```sql
-- Enable RLS
ALTER TABLE kv_store_6757d0ca ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users can access own kv data"
  ON kv_store_6757d0ca
  FOR ALL
  USING (auth.uid()::text = (value->>'userId'));
```

---

## Required Tables (Not Yet Created)

### 2. `users`
**Purpose:** User accounts and profiles.

**Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
```

**RLS Policy:**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

---

### 3. `subscriptions`
**Purpose:** Subscription and billing information.

**Schema:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

**RLS Policy:**
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 4. `invoices`
**Purpose:** Invoice records.

**Schema:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
```

**RLS Policy:**
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can read their own invoices
CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 5. `billing_events`
**Purpose:** Webhook events from payment provider (Stripe).

**Schema:**
```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_processed ON billing_events(processed);
CREATE INDEX idx_billing_events_stripe_id ON billing_events(stripe_event_id);
```

**RLS Policy:**
```sql
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access billing events
CREATE POLICY "Service role only"
  ON billing_events
  FOR ALL
  USING (false); -- No public access, only service role
```

---

### 6. `audit_logs`
**Purpose:** Admin action logs for compliance and debugging.

**Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**RLS Policy:**
```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

## Edge Functions

### Function: `make-server-6757d0ca`
**Location:** `backend/supabase-functions/server/index.tsx`

**Endpoints:**
- `GET /health` - Health check
- `POST /generate-keywords` - Generate keywords using Gemini AI
- `POST /ai/generate-negative-keywords` - Generate negative keywords
- `POST /generate-ads` - Generate ad copy
- `POST /history/save` - Save history entry
- `GET /history/list` - List history entries
- `POST /history/delete` - Delete history entry
- `POST /tickets/create` - Create support ticket
- `GET /tickets/list` - List support tickets
- `GET /billing/info` - Get billing info (mock)
- `POST /billing/subscribe` - Subscribe to plan (mock)

**Required Environment Variables:**
- `GEMINI_API_KEY` - Google Gemini API key

---

## Migration Checklist

### Phase 1: Core Tables
- [ ] Create `users` table
- [ ] Create `subscriptions` table
- [ ] Create `invoices` table
- [ ] Set up RLS policies for all tables

### Phase 2: Billing Integration
- [ ] Create `billing_events` table
- [ ] Set up Stripe webhook handler
- [ ] Migrate mock billing endpoints to real implementation

### Phase 3: Audit & Monitoring
- [ ] Create `audit_logs` table
- [ ] Implement audit logging in admin actions
- [ ] Set up monitoring queries

### Phase 4: Security Hardening
- [ ] Review and update all RLS policies
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Set up rate limiting

---

## Security Best Practices

1. **Always enable RLS** on all tables
2. **Use service role key** only in edge functions (never expose to client)
3. **Validate all inputs** in edge functions
4. **Use parameterized queries** to prevent SQL injection
5. **Limit API access** with rate limiting
6. **Monitor access logs** regularly
7. **Rotate API keys** periodically
8. **Use HTTPS** for all connections

---

## Backup & Recovery

### Automated Backups
- Supabase provides daily backups automatically
- Point-in-time recovery available for Pro plans

### Manual Backup
```sql
-- Export specific table
pg_dump -h db.kkdnnrwhzofttzajnwlj.supabase.co \
  -U postgres \
  -d postgres \
  -t kv_store_6757d0ca \
  > backup.sql
```

---

## Performance Optimization

### Indexes
- All foreign keys should have indexes
- Frequently queried columns should have indexes
- Use composite indexes for multi-column queries

### Connection Pooling
- Use Supabase connection pooler: `pooler.supabase.com`
- Configure max connections based on usage

### Query Optimization
- Use `EXPLAIN ANALYZE` to identify slow queries
- Avoid N+1 queries
- Use pagination for large result sets

---

**Last Updated:** 2025-01-27

