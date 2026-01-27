# Vercel Environment Variables Configuration

## Required Environment Variables for Nhost Integration

Set these in your Vercel project dashboard: **Settings** → **Environment Variables**

### Nhost Configuration

```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET=your-actual-admin-secret-from-nhost-dashboard
ADMIN_SECRET_KEY=your-actual-admin-secret-from-nhost-dashboard
```

**Important:** 
- Get `NHOST_ADMIN_SECRET` from your Nhost dashboard → Settings → API
- Use the same value for both `NHOST_ADMIN_SECRET` and `ADMIN_SECRET_KEY`
- Never commit these secrets to git

### Database Configuration

**Option 1: Full Connection String (Recommended)**
```
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@vumnjkoyxkistmlzotuk.db.eu-central-1.nhost.run:5432/vumnjkoyxkistmlzotuk
```

**Option 2: Using Components**
```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_DB_PASSWORD=your-database-password
```

**Important:**
- Get your database password from Nhost Dashboard → Settings → Database → Public Access
- Generate a new password if you haven't set one yet
- Replace `[YOUR-PASSWORD]` with your actual password
- The database name matches your subdomain: `vumnjkoyxkistmlzotuk`

### Stripe Configuration (if using Stripe)

```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Other Required Variables

```
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name and value
5. Select environments: **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your application for changes to take effect

## Verification

After setting environment variables, verify they're working:

1. Check deployment logs for any configuration warnings
2. Test the Super Admin panel at `/admin`
3. Check that Nhost GraphQL queries work

## Current Deployment Status

- **Latest Commit**: `80ed073` - Update Nhost configuration
- **Status**: Building/Deployed
- **Environment**: Production
