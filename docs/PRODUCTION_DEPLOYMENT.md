# Super Admin Production Deployment Guide

Complete guide to deploy the Super Admin backend to production.

## Quick Start

Run the complete deployment script:

```bash
./scripts/deploy-all.sh
```

This will guide you through all deployment steps.

## Manual Deployment Steps

### Step 1: Deploy Database Migrations

#### Option A: Using Script (Recommended)
```bash
./scripts/deploy-migrations.sh
```

#### Option B: Via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Run each migration file in order:
   - `backend/supabase/migrations/001_initial_schema.sql`
   - `backend/supabase/migrations/002_super_admin_tables.sql`
   - `backend/supabase/migrations/003_user_management_functions.sql`

#### Option C: Using Supabase CLI
```bash
supabase db push
```

**Verify migrations:**
- Check Supabase Dashboard → Database → Tables
- Verify these tables exist: `users`, `subscriptions`, `audit_logs`, `feature_flags`, `system_health`, `usage_metrics`, `email_templates`, `announcements`, `support_tickets`, `pricing_plans`, `config_settings`

### Step 2: Set Environment Variables

1. Go to Supabase Dashboard → Edge Functions → Settings
2. Add these environment variables:

```
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
GEMINI_API_KEY=<your_gemini_api_key>
```

**Where to find:**
- `SUPABASE_URL`: Dashboard → Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Dashboard → Project Settings → API → Service Role Key (keep secret!)
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 3: Deploy Edge Function

#### Option A: Using Script (Recommended)
```bash
./scripts/deploy-edge-function.sh
```

#### Option B: Via Supabase CLI
```bash
# Link to project first
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Deploy function
supabase functions deploy make-server-6757d0ca --no-verify-jwt
```

#### Option C: Via Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function" or edit existing
3. Name: `make-server-6757d0ca`
4. Copy code from `backend/supabase-functions/server/index.tsx`
5. Set environment variables (Step 2)
6. Click "Deploy"

**Verify deployment:**
```bash
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health
```

Should return: `{"status":"ok"}`

### Step 4: Create Super Admin User

#### Option A: Using Script (Recommended)
```bash
./scripts/create-superadmin.sh
```

#### Option B: Manual Steps

1. **Create user in Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Set "Auto Confirm User" to Yes
   - Click "Create user"

2. **Set superadmin role:**
   - Go to Supabase Dashboard → SQL Editor
   - Run this SQL:

```sql
UPDATE users 
SET role = 'superadmin',
    subscription_plan = 'enterprise',
    subscription_status = 'active'
WHERE email = 'your-admin-email@example.com';

-- Verify
SELECT id, email, role, subscription_plan, subscription_status 
FROM users 
WHERE email = 'your-admin-email@example.com';
```

### Step 5: Verify Deployment

1. **Test Health Endpoint:**
```bash
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health
```

2. **Test Authentication:**
```bash
# Get auth token (login via your app first)
TOKEN="your-auth-token"

# Test admin endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/admin/overview
```

3. **Test in UI:**
   - Login to your app with superadmin credentials
   - Navigate to `/superadmin`
   - Verify you can see the admin panel
   - Test user management, overview, etc.

## Production Checklist

- [ ] Database migrations applied (all 3 migration files)
- [ ] All tables created and visible in Dashboard
- [ ] RLS policies enabled on all tables
- [ ] Environment variables set in Edge Functions
- [ ] Edge function deployed successfully
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Super admin user created in Auth
- [ ] Super admin role set in users table
- [ ] Can login with superadmin credentials
- [ ] Admin panel accessible at `/superadmin`
- [ ] API endpoints respond correctly
- [ ] Audit logs are being created

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- Tables already exist, skip that migration
- Or drop tables and re-run migrations (⚠️ data loss)

**Error: "permission denied"**
- Ensure you're using Service Role key for admin operations
- Check RLS policies are correct

### Edge Function Errors

**Error: "Function not found"**
- Verify function name: `make-server-6757d0ca`
- Check function is deployed in Dashboard

**Error: "Unauthorized"**
- Verify environment variables are set
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Ensure token is being sent in Authorization header

**Error: "Internal Server Error"**
- Check Edge Function logs in Dashboard
- Verify database connection
- Check environment variables

### Authentication Errors

**Error: "User is not superadmin"**
- Verify user role in users table: `SELECT role FROM users WHERE email = 'your-email'`
- Update role: `UPDATE users SET role = 'superadmin' WHERE email = 'your-email'`

**Error: "Invalid token"**
- Token may be expired, login again
- Verify token format: `Bearer <token>`

## Security Best Practices

1. **Never commit secrets:**
   - Service Role Key should never be in code
   - Use environment variables only

2. **RLS Policies:**
   - All tables have RLS enabled
   - Only superadmins can access admin endpoints
   - Users can only access their own data

3. **Audit Logging:**
   - All admin actions are logged
   - Check audit_logs table regularly

4. **Environment Variables:**
   - Rotate Service Role Key periodically
   - Use different keys for dev/staging/prod

5. **Rate Limiting:**
   - Consider adding rate limiting to admin endpoints
   - Monitor for suspicious activity

## Monitoring

### Key Metrics to Monitor

1. **API Response Times:**
   - Monitor Edge Function execution time
   - Alert if > 5 seconds

2. **Error Rates:**
   - Check Edge Function logs for errors
   - Monitor 5xx responses

3. **Database Performance:**
   - Monitor query performance
   - Check for slow queries

4. **User Activity:**
   - Monitor admin actions in audit_logs
   - Track user signups and activity

### Logs Location

- **Edge Function Logs:** Supabase Dashboard → Edge Functions → Function → Logs
- **Database Logs:** Supabase Dashboard → Database → Logs
- **Auth Logs:** Supabase Dashboard → Authentication → Logs

## Rollback Plan

If something goes wrong:

1. **Rollback Migrations:**
   - Drop problematic tables/functions
   - Re-run migrations from backup

2. **Rollback Edge Function:**
   - Revert to previous version in Dashboard
   - Or redeploy previous code

3. **Disable Admin Access:**
   - Update superadmin role: `UPDATE users SET role = 'user' WHERE role = 'superadmin'`
   - Or disable Edge Function temporarily

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review `docs/BACKEND_SUPERADMIN.md` for API documentation
- Check `docs/DEPLOYMENT_SUPER_ADMIN.md` for additional details

## Next Steps After Deployment

1. ✅ Test all admin features
2. ✅ Set up monitoring and alerts
3. ✅ Configure backup strategy
4. ✅ Document any custom configurations
5. ✅ Train team on admin panel usage
6. ✅ Set up regular security audits

