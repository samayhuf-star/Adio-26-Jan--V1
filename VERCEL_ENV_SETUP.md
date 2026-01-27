# 🚀 Vercel Environment Variables Setup

## ⚠️ Critical: You Need BOTH Versions

The app requires **TWO versions** of each variable:
- `NHOST_SUBDOMAIN` - for server-side code
- `VITE_NHOST_SUBDOMAIN` - for client-side/browser code (this is what's missing!)

## Required Environment Variables

Add these to Vercel Dashboard → Settings → Environment Variables:

### Client-Side Variables (VITE_ prefix - Required for Home Page)
```
VITE_NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
VITE_NHOST_REGION=eu-central-1
```

### Server-Side Variables
```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET=your-actual-admin-secret
ADMIN_SECRET_KEY=your-actual-admin-secret
```

### Other Required
```
NODE_ENV=production
```

## Quick Setup Steps

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: **adiology-27-dec-kiro**

2. **Add Variables:**
   - Settings → Environment Variables → Add New
   - Add each variable below

3. **Important Settings:**
   - ✅ Check **Production**
   - ✅ Check **Preview**  
   - ✅ Check **Development**
   - Click **Save**

4. **Redeploy:**
   - Deployments → Latest → ⋯ → Redeploy

## Complete Variable List

Copy and add these one by one:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_NHOST_SUBDOMAIN` | `vumnjkoyxkistmlzotuk` | All |
| `VITE_NHOST_REGION` | `eu-central-1` | All |
| `NHOST_SUBDOMAIN` | `vumnjkoyxkistmlzotuk` | All |
| `NHOST_REGION` | `eu-central-1` | All |
| `NHOST_ADMIN_SECRET` | (your secret) | All |
| `ADMIN_SECRET_KEY` | (same as above) | All |
| `NODE_ENV` | `production` | Production only |

## Why VITE_ Prefix?

- Variables with `VITE_` prefix are **bundled into the client-side code** during build
- Without `VITE_NHOST_SUBDOMAIN`, the browser can't connect to Nhost
- This is why you're seeing the console error!

## After Adding Variables

1. **Redeploy** (required for changes to take effect)
2. **Clear browser cache** or do hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. **Check console** - errors should be gone
4. **Home page should load** properly
