# Super Admin Features Documentation

## Overview

The Super Admin panel provides comprehensive backend infrastructure and frontend interface for managing the Adiology Campaign Dashboard platform.

## Backend Infrastructure

### Database Schema

**Tables Created:**
- `users` - User accounts with roles (user, admin, superadmin)
- `subscriptions` - Subscription and billing information
- `invoices` - Invoice records from payment provider
- `audit_logs` - Admin action logs for compliance
- `feature_flags` - Feature flags for gradual rollouts
- `system_health` - System health monitoring data
- `usage_metrics` - User usage metrics and quotas

**Security:**
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Audit logging for all admin actions

### API Endpoints

**User Management:**
- `GET /admin/users` - List all users (with pagination & search)
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id` - Update user (role, status, plan, etc.)
- `DELETE /admin/users/:id` - Delete user

**System Overview:**
- `GET /admin/overview` - Get system statistics
  - Total users
  - Active subscriptions
  - Recent signups (30 days)
  - System health status

**Audit & Logging:**
- `GET /admin/audit-logs` - Get audit logs (with filters)
  - Filter by action type
  - Filter by user ID
  - Pagination support

**Billing & Subscriptions:**
- `GET /admin/billing/stats` - Get billing statistics
  - Plan distribution
  - Recent transactions

**Usage Metrics:**
- `GET /admin/usage` - Get usage metrics
  - Filter by metric type
  - Filter by time period (24h, 7d, 30d)

**System Health:**
- `GET /admin/health` - Get system health status
  - Service status
  - Uptime percentages
  - Response times

**Feature Flags:**
- `GET /admin/feature-flags` - List all feature flags
- `POST /admin/feature-flags` - Create new feature flag
- `PUT /admin/feature-flags/:id` - Update feature flag

## Frontend Features

### Modules Implemented

1. **Overview Module**
   - Real-time system statistics
   - Total users count
   - Active subscriptions
   - Recent signups
   - System health indicators

2. **Users & Accounts Module**
   - User listing with pagination
   - Search functionality
   - User management actions:
     - Suspend/Activate accounts
     - Delete users
     - View user details
   - Real-time data from database

3. **Audit Logs Module**
   - Complete audit trail
   - Filter by action type
   - Filter by user
   - Timestamp tracking
   - IP address logging

4. **Other Modules** (Ready for implementation)
   - Billing & Subscriptions
   - Usage & Limits
   - System Health
   - Feature Flags
   - Content Management
   - Analytics & Reports
   - Support Tools
   - Configuration

## Authentication & Authorization

### How It Works

1. **User Authentication:**
   - Users login via Supabase Auth
   - JWT token is stored in session
   - Token is sent with all API requests

2. **Super Admin Verification:**
   - Backend verifies JWT token
   - Checks user role in database
   - Only users with `role = 'superadmin'` can access admin endpoints

3. **Frontend Protection:**
   - `isSuperAdmin()` helper function checks role
   - Super Admin Panel only accessible to super admins
   - Unauthorized users are redirected

## Data Flow

```
Frontend (SuperAdminPanel)
    ↓
API Client (adminApi)
    ↓
Supabase Edge Function (make-server-6757d0ca)
    ↓
Supabase Database (PostgreSQL)
    ↓
Response with Data
    ↓
Frontend Display
```

## Security Features

1. **Row Level Security (RLS):**
   - Users can only access their own data
   - Admins can access all data
   - Policies enforced at database level

2. **API Authentication:**
   - All admin endpoints require valid JWT token
   - Token verified on every request
   - Service role key only used server-side

3. **Audit Logging:**
   - All admin actions are logged
   - Includes user ID, action, resource, IP address
   - Immutable audit trail

4. **Input Validation:**
   - All inputs validated in backend
   - SQL injection prevention
   - XSS protection

## Usage Examples

### Get All Users

```typescript
import { adminApi } from '@/utils/api/admin';

const { users, pagination } = await adminApi.getUsers({
  search: 'john@example.com',
  page: 1,
  limit: 50
});
```

### Update User Status

```typescript
await adminApi.updateUser(userId, {
  subscription_status: 'suspended'
});
```

### Get System Overview

```typescript
const overview = await adminApi.getOverview();
console.log(overview.totalUsers);
console.log(overview.activeSubscriptions);
```

### Get Audit Logs

```typescript
const { logs } = await adminApi.getAuditLogs({
  action: 'update_user',
  page: 1,
  limit: 100
});
```

## Next Steps for Full Implementation

1. **Complete Remaining Modules:**
   - Connect Billing, Usage, Health modules to APIs
   - Implement Feature Flags UI
   - Add Analytics dashboard

2. **Enhanced Features:**
   - User impersonation
   - Bulk user operations
   - Export functionality (CSV, PDF)
   - Real-time notifications

3. **Monitoring:**
   - Set up error tracking
   - Performance monitoring
   - Usage analytics

4. **Integration:**
   - Stripe webhook handlers
   - Email notifications
   - Third-party integrations

## Support

For setup issues, see:
- `docs/SUPER_ADMIN_SETUP.md` - Detailed setup guide
- `docs/QUICK_START_SUPER_ADMIN.md` - Quick start guide
- `docs/DEPLOYMENT_SUPER_ADMIN.md` - Deployment guide

