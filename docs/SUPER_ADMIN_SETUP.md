# Super Admin Backend Setup Guide

This guide will help you set up the complete backend infrastructure for the Super Admin panel.

## Prerequisites

1. Supabase account and project
2. Supabase CLI installed (`npm install -g supabase`)
3. Access to Supabase dashboard

## Step 1: Database Setup

### 1.1 Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `backend/supabase/migrations/001_initial_schema.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This will create all necessary tables:
- `users` - User accounts and profiles
- `subscriptions` - Subscription and billing information
- `invoices` - Invoice records
- `audit_logs` - Admin action logs
- `feature_flags` - Feature flags for gradual rollouts
- `system_health` - System health monitoring
- `usage_metrics` - User usage metrics

### 1.2 Create Super Admin User

After running the migration, create your first super admin user:

```sql
-- First, create the user in Supabase Auth (via dashboard or API)
-- Then link it to the users table:

INSERT INTO users (id, email, full_name, role)
VALUES (
  'YOUR_AUTH_USER_ID',  -- Get this from Supabase Auth
  'admin@example.com',
  'Super Admin',
  'superadmin'
);
```

**Alternative: Via Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Create a new user with email/password
3. Copy the user ID
4. Run the SQL above with that user ID

## Step 2: Environment Variables

### 2.1 Supabase Edge Function Environment Variables

In your Supabase project dashboard:
1. Go to **Edge Functions** → **Settings**
2. Add the following environment variables:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**To get your Service Role Key:**
1. Go to **Settings** → **API**
2. Copy the `service_role` key (keep this secret!)

### 2.2 Frontend Environment Variables

The frontend already has Supabase configuration in `src/utils/supabase/info.tsx`. Ensure it's correct.

## Step 3: Deploy Backend (Supabase Edge Functions)

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the edge function
supabase functions deploy make-server-6757d0ca \
  --project-ref YOUR_PROJECT_ID
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in Supabase dashboard
2. Click **Create Function**
3. Name: `make-server-6757d0ca`
4. Copy the contents of `backend/supabase-functions/server/index.tsx`
5. Paste into the function editor
6. Set environment variables (from Step 2.1)
7. Click **Deploy**

## Step 4: Verify Setup

### 4.1 Test Database Connection

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'subscriptions', 'audit_logs', 'feature_flags');

-- Should return 4 rows
```

### 4.2 Test API Endpoints

Test the health endpoint:

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-6757d0ca/health
```

Should return: `{"status":"ok"}`

### 4.3 Test Super Admin Authentication

1. Login to your app with the super admin credentials
2. Navigate to Super Admin panel
3. Check if data loads (users, overview, etc.)

## Step 5: Initial Data Setup

### 5.1 Create Sample Users (Optional)

```sql
-- Insert sample users for testing
INSERT INTO users (email, full_name, role, subscription_plan, subscription_status)
VALUES 
  ('user1@example.com', 'Test User 1', 'user', 'free', 'active'),
  ('user2@example.com', 'Test User 2', 'user', 'starter', 'active'),
  ('admin@example.com', 'Admin User', 'admin', 'professional', 'active');
```

### 5.2 Create Sample Feature Flags

```sql
INSERT INTO feature_flags (name, description, enabled, target_plans)
VALUES 
  ('new_dashboard', 'New dashboard UI', true, '["professional", "enterprise"]'),
  ('ai_keywords', 'AI keyword generation', true, '[]'),
  ('advanced_analytics', 'Advanced analytics features', false, '["enterprise"]');
```

### 5.3 Create System Health Records

```sql
INSERT INTO system_health (service_name, status, uptime_percentage, response_time_ms)
VALUES 
  ('API Server', 'operational', 99.9, 120),
  ('Database', 'operational', 99.99, 15),
  ('Job Queue', 'operational', 99.5, 200);
```

## Step 6: Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Service role key is stored securely (never in client code)
- [ ] Super admin endpoints require authentication
- [ ] Audit logging is working
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (if available)

## Step 7: Monitoring

### 7.1 Set Up Alerts

In Supabase dashboard:
1. Go to **Database** → **Logs**
2. Monitor for errors
3. Set up alerts for critical issues

### 7.2 Monitor API Usage

1. Go to **Edge Functions** → **Logs**
2. Monitor function invocations
3. Check for errors or slow responses

## Troubleshooting

### Issue: "Unauthorized" errors

**Solution:**
- Verify the user has `role = 'superadmin'` in the users table
- Check that the JWT token is being sent correctly
- Verify the service role key is set correctly

### Issue: Tables not found

**Solution:**
- Ensure migrations ran successfully
- Check table names match exactly (case-sensitive)
- Verify you're connected to the correct database

### Issue: API endpoints not working

**Solution:**
- Check Edge Function is deployed
- Verify environment variables are set
- Check function logs in Supabase dashboard
- Ensure CORS is configured correctly

### Issue: No data showing

**Solution:**
- Verify RLS policies allow super admin access
- Check if data exists in tables
- Verify API responses in browser network tab
- Check browser console for errors

## Next Steps

1. **Set up Stripe integration** for real billing (if needed)
2. **Configure email notifications** for admin actions
3. **Set up automated backups** for database
4. **Implement rate limiting** for API endpoints
5. **Add monitoring and alerting** for production

## Support

For issues or questions:
1. Check Supabase logs
2. Review API response errors
3. Verify database schema matches documentation
4. Check environment variables are set correctly

