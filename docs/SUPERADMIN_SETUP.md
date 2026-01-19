# Super Admin Setup Guide

## Current Status

✅ Backend endpoints are implemented  
✅ Database tables and functions are ready  
✅ Frontend components are built  
⚠️  Edge Function needs to be deployed  
⚠️  Superadmin user needs to be created  

## Issues Fixed

1. ✅ **SuperAdminLogin** - Now uses Supabase Auth instead of localStorage
2. ✅ **Admin API** - Improved error handling and authentication
3. ✅ **Backend Endpoints** - All admin endpoints are implemented

## Setup Steps

### Step 1: Deploy Edge Function

The Edge Function contains all the admin endpoints but needs to be deployed:

```bash
cd "/Users/samay/Downloads/New Adiology Campaign Dashboard (1)"
supabase link --project-ref kkdnnrwhzofttzajnwlj
supabase functions deploy make-server-6757d0ca --no-verify-jwt
```

Or deploy via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/functions
2. Update/create `make-server-6757d0ca` function
3. Copy code from `backend/supabase-functions/server/index.tsx`
4. Deploy

### Step 2: Create Superadmin User

You have two options:

#### Option A: Using the Script (Recommended)

1. Create a `.env` file in the project root:
```bash
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Get your service role key from:
   https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/settings/api

3. Run the script:
```bash
node scripts/create-superadmin-user.js admin@adiology.com YourSecurePassword "Super Admin"
```

#### Option B: Manual Setup via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/auth/users
2. Click "Add User" → "Create new user"
3. Enter email and password
4. Set email as confirmed
5. Add user metadata:
   ```json
   {
     "full_name": "Super Admin",
     "role": "superadmin"
   }
   ```
6. Go to SQL Editor and run:
   ```sql
   INSERT INTO users (id, email, full_name, role, subscription_plan, subscription_status)
   VALUES (
     'USER_ID_FROM_AUTH',
     'admin@adiology.com',
     'Super Admin',
     'superadmin',
     'free',
     'active'
   )
   ON CONFLICT (id) DO UPDATE SET
     role = 'superadmin',
     updated_at = NOW();
   ```

### Step 3: Verify Setup

1. Go to: https://www.adiology.online/superadmin
2. Login with your superadmin credentials
3. You should see the admin panel

## Backend Endpoints Available

All these endpoints are implemented in the Edge Function:

### User Management
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user by ID
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/:id/reset-password` - Reset password

### System Overview
- `GET /admin/overview` - System statistics
- `GET /admin/health` - System health
- `GET /admin/usage` - Usage metrics
- `GET /admin/billing/stats` - Billing statistics

### Content Management
- `GET /admin/feature-flags` - List feature flags
- `POST /admin/feature-flags` - Create feature flag
- `PUT /admin/feature-flags/:id` - Update feature flag
- `GET /admin/announcements` - List announcements
- `POST /admin/announcements` - Create announcement
- `GET /admin/email-templates` - List email templates
- `POST /admin/email-templates` - Create email template

### Support & Logs
- `GET /admin/support/tickets` - List support tickets
- `PUT /admin/support/tickets/:id` - Update ticket
- `GET /admin/audit-logs` - List audit logs

### Configuration
- `GET /admin/config` - Get configuration
- `PUT /admin/config/:key` - Update configuration
- `GET /admin/pricing-plans` - List pricing plans
- `PUT /admin/pricing-plans/:id` - Update pricing plan

## Authentication Flow

1. User logs in via SuperAdminLogin
2. Supabase Auth authenticates the user
3. System checks if user has `superadmin` role in `users` table
4. If authorized, user gets access token
5. Admin API uses token to call backend endpoints
6. Backend verifies token and checks role
7. Backend returns data from Supabase database

## Troubleshooting

### "Admin functions require backend implementation"
- **Cause**: Edge Function is not deployed or not accessible
- **Fix**: Deploy the Edge Function (Step 1)

### "Unauthorized" or "Access denied"
- **Cause**: User doesn't have superadmin role
- **Fix**: Create superadmin user (Step 2) and verify role in database

### "Not authenticated"
- **Cause**: No valid Supabase Auth session
- **Fix**: Login again via SuperAdminLogin page

### "Endpoint not found"
- **Cause**: Edge Function not deployed or wrong function name
- **Fix**: Verify function is deployed and URL is correct

### "Project not specified"
- **Cause**: Edge Function not deployed
- **Fix**: Deploy the Edge Function

## Testing

After setup, test the admin panel:

1. Login at `/superadmin`
2. Check Overview module - should show stats
3. Check Users module - should list users
4. Try creating a user - should work
5. Check other modules - should load data

## Database Tables Required

All these tables should exist (from migrations):
- ✅ `users` - User accounts
- ✅ `subscriptions` - Subscription data
- ✅ `invoices` - Payment history
- ✅ `audit_logs` - Admin action logs
- ✅ `feature_flags` - Feature flags
- ✅ `system_health` - Health monitoring
- ✅ `usage_metrics` - Usage tracking
- ✅ `support_tickets` - Support tickets
- ✅ `announcements` - System announcements
- ✅ `email_templates` - Email templates
- ✅ `pricing_plans` - Pricing configuration
- ✅ `config_settings` - System configuration

## Next Steps

1. ✅ Deploy Edge Function
2. ✅ Create superadmin user
3. ✅ Test login
4. ✅ Test admin functions
5. ✅ Verify all modules work

