# Super Admin Backend Deployment Guide

> **For complete production deployment, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)**

## Quick Deployment Steps

### Automated Deployment (Recommended)

```bash
# Complete deployment in one command
./scripts/deploy-all.sh
```

This will guide you through:
1. Database migrations
2. Edge function deployment
3. Super admin user creation

### Manual Deployment

#### 1. Database Migration

```bash
# Option 1: Using script
./scripts/deploy-migrations.sh

# Option 2: Via Supabase Dashboard (Recommended)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of backend/supabase/migrations/001_initial_schema.sql
# 3. Paste and Run
# 4. Repeat for 002_super_admin_tables.sql and 003_user_management_functions.sql

# Option 3: Via Supabase CLI
supabase db push
```

#### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

```
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
GEMINI_API_KEY=<your_gemini_key>
```

#### 3. Deploy Edge Function

```bash
# Option 1: Using script
./scripts/deploy-edge-function.sh

# Option 2: Using Supabase CLI
supabase functions deploy make-server-6757d0ca --no-verify-jwt

# Option 3: Via Dashboard:
# 1. Go to Edge Functions
# 2. Create/Update function: make-server-6757d0ca
# 3. Copy code from backend/supabase-functions/server/index.tsx
# 4. Deploy
```

#### 4. Create Super Admin User

```bash
# Option 1: Using script
./scripts/create-superadmin.sh

# Option 2: Manual
# 1. Create user in Supabase Auth Dashboard
# 2. Run SQL:
UPDATE users 
SET role = 'superadmin',
    subscription_plan = 'enterprise',
    subscription_status = 'active'
WHERE email = 'your-admin-email@example.com';
```

#### 5. Test Deployment

```bash
# Test health endpoint
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health

# Should return: {"status":"ok"}
```

## Production Checklist

- [ ] Database migrations applied (all 3 files)
- [ ] Environment variables set
- [ ] Edge function deployed
- [ ] Super admin user created
- [ ] RLS policies verified
- [ ] API endpoints tested
- [ ] Frontend connected to backend
- [ ] Error logging configured
- [ ] Monitoring set up

## API Endpoints

All endpoints require Bearer token authentication and superadmin role:

### User Management
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user by ID
- `POST /admin/users` - Create user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/:id/reset-password` - Reset password

### Overview & Statistics
- `GET /admin/overview` - System overview stats
- `GET /admin/billing/stats` - Billing statistics
- `GET /admin/usage` - Usage metrics
- `GET /admin/health` - System health

### Audit & Logging
- `GET /admin/audit-logs` - Get audit logs

### Feature Flags
- `GET /admin/feature-flags` - List feature flags
- `POST /admin/feature-flags` - Create feature flag
- `PUT /admin/feature-flags/:id` - Update feature flag

### Support Tickets
- `GET /admin/support/tickets` - Get support tickets
- `PUT /admin/support/tickets/:id` - Update ticket

### Announcements
- `GET /admin/announcements` - Get announcements
- `POST /admin/announcements` - Create announcement
- `PUT /admin/announcements/:id` - Update announcement
- `DELETE /admin/announcements/:id` - Delete announcement

### Email Templates
- `GET /admin/email-templates` - Get templates
- `POST /admin/email-templates` - Create template
- `PUT /admin/email-templates/:id` - Update template

### Configuration
- `GET /admin/config` - Get config settings
- `PUT /admin/config/:key` - Update config

### Pricing Plans
- `GET /admin/pricing-plans` - Get pricing plans
- `PUT /admin/pricing-plans/:id` - Update plan

See [BACKEND_SUPERADMIN.md](./BACKEND_SUPERADMIN.md) for complete API documentation.

