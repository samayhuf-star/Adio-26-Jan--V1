# 🔧 Fix: Missing Environment Variables

## Problem
The app is showing errors because `VITE_NHOST_SUBDOMAIN` is not set in Vercel.

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find and click on your project: **adiology-27-dec-kiro** (or **adiology-dashboard**)

### Step 2: Add Environment Variables
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar
3. Click **Add New** button

### Step 3: Add These Required Variables

Add each variable one by one:

#### Variable 1: VITE_NHOST_SUBDOMAIN
- **Key:** `VITE_NHOST_SUBDOMAIN`
- **Value:** `vumnjkoyxkistmlzotuk`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 2: VITE_NHOST_REGION
- **Key:** `VITE_NHOST_REGION`
- **Value:** `eu-central-1`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Step 4: Redeploy
After adding the variables, you need to redeploy:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

**Option B: Via CLI**
```bash
npx vercel --prod
```

## Complete List of Recommended Environment Variables

While you're at it, you may also want to add these:

### Required for Full Functionality:
```
VITE_NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
VITE_NHOST_REGION=eu-central-1
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET=your-actual-admin-secret
ADMIN_SECRET_KEY=your-actual-admin-secret
NODE_ENV=production
```

### Optional (for payments, etc.):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## ⚠️ Important Notes

1. **VITE_ prefix**: Variables starting with `VITE_` are exposed to the browser/client-side code
2. **Redeploy Required**: After adding environment variables, you MUST redeploy for changes to take effect
3. **Environment Selection**: Make sure to select all three environments (Production, Preview, Development) when adding variables

## ✅ Verification

After redeploying, check:
1. Open your app URL
2. Open browser console (F12)
3. The errors should be gone
4. The home page should load properly
