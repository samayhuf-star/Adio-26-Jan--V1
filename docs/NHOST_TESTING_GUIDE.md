# Nhost.io Authentication & Database Testing Guide

## Prerequisites

Before testing, ensure you have:
1. **Nhost Project ID/Subdomain** - Found in your Nhost dashboard
2. **Nhost Admin Secret** - `T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx`
3. **Nhost Region** - Usually `us-east-1` or your project's region

## Quick Test

Run the test script with your Nhost credentials:

```bash
export NHOST_SUBDOMAIN=your-project-id
export NHOST_REGION=us-east-1
export NHOST_ADMIN_SECRET=T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx
node scripts/test-nhost.js
```

## What the Test Script Checks

### 1. Health Check ✅
- Verifies Nhost service is accessible
- Tests basic connectivity

### 2. User Sign Up ✅
- Creates a test user account
- Verifies email/password registration works

### 3. User Sign In ✅
- Tests authentication flow
- Retrieves access token

### 4. Database Query ✅
- Tests GraphQL API connectivity
- Queries user data from database
- Verifies JWT token authentication

### 5. Admin Secret Authentication ✅
- Tests admin secret authentication
- Verifies server-to-server auth works

## Manual Testing Steps

### Step 1: Get Your Nhost Project Details

1. Log in to https://app.nhost.io
2. Select your project
3. Go to **Settings** → **API**
4. Note your:
   - **Project ID** (subdomain)
   - **Region**
   - **Admin Secret** (if you have admin access)

### Step 2: Test Authentication Endpoint

```bash
# Replace YOUR_PROJECT_ID with your actual project ID
curl -X POST https://YOUR_PROJECT_ID.us-east-1.nhost.run/v1/auth/signup/email-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Step 3: Test Sign In

```bash
curl -X POST https://YOUR_PROJECT_ID.us-east-1.nhost.run/v1/auth/signin/email-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Step 4: Test GraphQL Database Query

```bash
# Use the access token from sign-in response
curl -X POST https://YOUR_PROJECT_ID.us-east-1.nhost.run/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "query { users { id email displayName } }"
  }'
```

### Step 5: Test Admin Secret

```bash
curl -X GET https://YOUR_PROJECT_ID.us-east-1.nhost.run/v1/auth/user \
  -H "x-hasura-admin-secret: T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx"
```

## Integration with Current Codebase

### Current Status
- ✅ Codebase uses **PocketBase** for authentication
- ⚠️ **Nhost integration** needs to be added if switching

### To Integrate Nhost:

1. **Install Nhost SDK**:
```bash
npm install @nhost/nhost-js
```

2. **Create Nhost Client** (`src/utils/nhost/client.ts`):
```typescript
import { NhostClient } from '@nhost/nhost-js';

const nhost = new NhostClient({
  subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN,
  region: import.meta.env.VITE_NHOST_REGION || 'us-east-1',
});

export default nhost;
```

3. **Update Auth Utilities** to use Nhost instead of PocketBase

4. **Update Environment Variables**:
```bash
VITE_NHOST_SUBDOMAIN=your-project-id
VITE_NHOST_REGION=us-east-1
NHOST_ADMIN_SECRET=T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx
```

## Troubleshooting

### Error: "NHOST_SUBDOMAIN not set"
- Set the environment variable: `export NHOST_SUBDOMAIN=your-project-id`

### Error: "Connection refused" or "DNS error"
- Verify your project ID is correct
- Check if your project is active in Nhost dashboard
- Verify the region matches your project's region

### Error: "Invalid admin secret"
- Verify the admin secret in Nhost dashboard
- Ensure you're using the correct secret (not the JWT secret)

### Error: "GraphQL query failed"
- Check if your database tables exist
- Verify RLS (Row Level Security) policies allow access
- Check if the user has proper permissions

## Next Steps

1. ✅ Run the test script with your credentials
2. ⏳ Review test results
3. ⏳ Integrate Nhost into codebase (if switching from PocketBase)
4. ⏳ Update environment variables in Vercel
5. ⏳ Test end-to-end authentication flow
