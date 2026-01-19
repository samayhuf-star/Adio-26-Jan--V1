# Super Admin Backend Implementation

This document describes the backend and database implementation for the Super Admin panel.

## Database Schema

### Core Tables

1. **users** - User accounts and profiles
   - Links to Supabase Auth users
   - Tracks subscription plan, status, and role
   - Stores last login and metadata

2. **subscriptions** - Subscription and billing information
   - Links to Stripe subscriptions
   - Tracks plan, status, and billing periods

3. **invoices** - Invoice records from payment provider
   - Links to Stripe invoices
   - Tracks payment status and amounts

4. **audit_logs** - Admin action logs for compliance
   - Tracks all admin actions
   - Includes user, action type, resource, IP address, and metadata

5. **feature_flags** - Feature flags for gradual rollouts
   - Enables/disables features
   - Supports user and plan targeting

6. **system_health** - System health monitoring data
   - Tracks service status, uptime, response times
   - Monitors error rates

7. **usage_metrics** - User usage metrics and quotas
   - Tracks API calls, storage, bandwidth, campaigns
   - Supports time-based queries

8. **email_templates** - Email templates for system notifications
   - Supports HTML and text versions
   - Includes variable substitution

9. **announcements** - System announcements and notifications
   - Supports targeting by plan
   - Includes priority and scheduling

10. **support_tickets** - User support tickets
    - Tracks status, priority, assignment
    - Links to users and admins

11. **pricing_plans** - Subscription pricing plans configuration
    - Defines plan features and limits
    - Links to Stripe price IDs

12. **config_settings** - System configuration settings
    - Key-value configuration
    - Supports public/private settings

## Database Functions

### User Management Functions

1. **sync_user_on_signup()** - Automatically syncs auth.users with public.users table
2. **update_last_login()** - Updates last_login_at when user signs in
3. **create_subscription_on_user_creation()** - Creates subscription when user is assigned a paid plan
4. **get_user_statistics()** - Returns user statistics for admin dashboard
5. **get_subscription_statistics()** - Returns subscription statistics including MRR
6. **search_users(search_term)** - Searches users by email, name, or ID

### Triggers

- **on_auth_user_created** - Syncs user on auth.users insert/update
- **on_auth_user_signin** - Updates last_login_at on sign in
- **on_user_subscription_plan_set** - Creates subscription when plan is set

## API Endpoints

All endpoints are prefixed with `/make-server-6757d0ca/admin` and require superadmin authentication.

### User Management

- `GET /admin/users` - Get all users (with pagination and search)
- `GET /admin/users/:id` - Get user by ID
- `POST /admin/users` - Create new user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `POST /admin/users/:id/reset-password` - Generate password reset link

### Overview & Statistics

- `GET /admin/overview` - Get system overview statistics
- `GET /admin/billing/stats` - Get billing and subscription statistics
- `GET /admin/usage` - Get usage metrics
- `GET /admin/health` - Get system health status

### Audit & Logging

- `GET /admin/audit-logs` - Get audit logs (with filtering)

### Feature Flags

- `GET /admin/feature-flags` - Get all feature flags
- `POST /admin/feature-flags` - Create feature flag
- `PUT /admin/feature-flags/:id` - Update feature flag

### Support Tickets

- `GET /admin/support/tickets` - Get support tickets (with filtering)
- `PUT /admin/support/tickets/:id` - Update support ticket

### Announcements

- `GET /admin/announcements` - Get all announcements
- `POST /admin/announcements` - Create announcement
- `PUT /admin/announcements/:id` - Update announcement
- `DELETE /admin/announcements/:id` - Delete announcement

### Email Templates

- `GET /admin/email-templates` - Get all email templates
- `POST /admin/email-templates` - Create email template
- `PUT /admin/email-templates/:id` - Update email template

### Configuration

- `GET /admin/config` - Get configuration settings (optionally filtered by category)
- `PUT /admin/config/:key` - Update configuration setting

### Pricing Plans

- `GET /admin/pricing-plans` - Get all pricing plans
- `PUT /admin/pricing-plans/:id` - Update pricing plan

## Authentication

All admin endpoints require:
1. Valid JWT token in `Authorization: Bearer <token>` header
2. User must have `role = 'superadmin'` in the users table

The `verifySuperAdmin()` function:
- Validates the JWT token with Supabase Auth
- Checks user role in the database
- Returns `{ valid: boolean, userId?: string }`

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can read/update their own data
- Superadmins can read/write all data
- Public read access for feature flags, announcements (active only), and pricing plans (active only)
- Admin-only access for audit logs, system health, and configuration

## Environment Variables

Required environment variables for the Supabase Edge Function:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `GEMINI_API_KEY` - For AI features (already configured)

## Migration Files

1. **001_initial_schema.sql** - Core tables and RLS policies
2. **002_super_admin_tables.sql** - Additional tables for super admin features
3. **003_user_management_functions.sql** - Database functions and triggers

## Usage Example

```typescript
import { adminApi } from '../utils/api/admin';

// Get all users
const result = await adminApi.getUsers({ 
  search: 'john@example.com', 
  page: 1, 
  limit: 50 
});

// Create a new user
const newUser = await adminApi.createUser({
  email: 'newuser@example.com',
  password: 'securepassword123',
  full_name: 'John Doe',
  subscription_plan: 'professional'
});

// Get system overview
const overview = await adminApi.getOverview();
console.log(`Total users: ${overview.totalUsers}`);
console.log(`Active subscriptions: ${overview.activeSubscriptions}`);

// Create an announcement
const announcement = await adminApi.createAnnouncement({
  title: 'New Feature Available',
  content: 'We\'ve added a new feature!',
  type: 'info',
  priority: 'normal',
  target_plans: ['professional', 'enterprise'],
  is_active: true
});
```

## Next Steps

1. Deploy migrations to your Supabase project
2. Set up environment variables in Supabase Edge Functions
3. Deploy the Edge Function
4. Create a superadmin user (manually or via migration)
5. Test the endpoints using the admin panel UI

## Security Considerations

- All endpoints verify superadmin role
- Audit logs track all admin actions
- RLS policies prevent unauthorized access
- Password reset links are generated securely
- User deletion cascades properly through related tables

