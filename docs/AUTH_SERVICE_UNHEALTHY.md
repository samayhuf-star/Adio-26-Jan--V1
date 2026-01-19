# Auth Service Unhealthy - Troubleshooting Guide

## Problem Identified

Your Supabase project shows:
- ❌ **Auth: Unhealthy**
- ❌ **PostgREST: Unhealthy**
- ✅ Database: Healthy
- ✅ Other services: Healthy

This explains why user creation is failing with "Project not specified" error.

## Why This Happens

1. **Recently Restored Project**: Projects can take 5+ minutes to fully recover
2. **Service Restart**: Services may be restarting after maintenance
3. **Configuration Issue**: Auth service may have a configuration problem
4. **Resource Limits**: Project may have hit resource limits

## Solutions (In Order)

### Solution 1: Wait and Retry (Easiest)

If the project was recently restored or restarted:

1. **Wait 5-10 minutes**
2. **Refresh the status page**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
3. **Check if Auth becomes healthy**
4. **Try creating user again**

### Solution 2: Restart Project

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/infrastructure
2. Look for **"Pause Project"** or **"Restart"** options
3. If available, pause and resume the project
4. Wait for services to restart (5-10 minutes)
5. Check status again

### Solution 3: Check Logs

1. **PostgREST Logs**: Click "View logs >" next to PostgREST in status
2. **Auth Logs**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/logs/edge-logs
3. **Database Logs**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/logs/postgres-logs
4. Look for error messages or connection issues

### Solution 4: Contact Supabase Support

If services don't recover after waiting:

1. Go to: https://supabase.com/support
2. Report:
   - Project ref: `kkdnnrwhzofttzajnwlj`
   - Issue: Auth and PostgREST services are unhealthy
   - Error: "Project not specified" when creating users
   - Status: Database and other services are healthy

## Workaround: Create User via SQL

While waiting for Auth to recover, you can create the user directly in the database:

### Step 1: Generate Password Hash

1. Go to SQL Editor: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new
2. Run:
   ```sql
   SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;
   ```
3. Copy the hash (starts with `$2a$` or `$2b$`)

### Step 2: Create User

1. Open: `scripts/create-user-simple.sql`
2. Replace `YOUR_HASH_HERE` with the hash from Step 1
3. Run the SQL in the editor

This creates the user directly in the database, bypassing the Auth API.

### Step 3: Verify

```sql
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.raw_user_meta_data->>'role' as auth_role,
  u.role as user_role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'sam@sam.com';
```

## Monitoring Status

Check project status:
- **Status Page**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
- **Infrastructure**: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/infrastructure

## Expected Recovery Time

- **Recently restored**: 5-10 minutes
- **Service restart**: 2-5 minutes
- **Configuration fix**: May require support intervention

## Prevention

Once services are healthy:
1. Monitor the status page regularly
2. Set up alerts if available
3. Keep backups of important data
4. Use SQL workarounds for critical operations during outages

## Next Steps

1. ✅ **Immediate**: Use SQL workaround to create user
2. ⏳ **Short-term**: Wait for Auth to recover
3. 🔧 **If persists**: Contact Supabase support
4. ✅ **Once healthy**: Verify user creation works via Dashboard

