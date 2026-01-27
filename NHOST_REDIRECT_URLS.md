# 🔗 Nhost Redirect URLs Configuration

## Problem
Email verification links are going to `localhost:3000` instead of the production domain.

## Solution: Whitelist Redirect URLs in Nhost

### Step 1: Go to Nhost Dashboard
1. Visit: https://app.nhost.io
2. Select your project: **vumnjkoyxkistmlzotuk**

### Step 2: Configure Allowed Redirect URLs
1. Go to **Settings** → **Authentication**
2. Scroll down to **Allowed Redirect URLs** section
3. Click **Add URL** or **Edit**

### Step 3: Add These URLs

Add each URL one by one:

```
https://www.adiology.online/verify-email
https://www.adiology.online/reset-password
https://adiology.online/verify-email
https://adiology.online/reset-password
```

**For Preview Deployments (optional but recommended):**
```
https://*.vercel.app/verify-email
https://*.vercel.app/reset-password
```

### Step 4: Save Changes
- Click **Save** after adding all URLs
- Changes take effect immediately

## What This Fixes

✅ Email verification links will now point to `https://www.adiology.online/verify-email`  
✅ Password reset links will point to `https://www.adiology.online/reset-password`  
✅ No more `localhost:3000` errors

## Important Notes

- **Wildcards**: Some Nhost plans support wildcards (`*.vercel.app`) for preview deployments
- **HTTPS Required**: All redirect URLs must use `https://`
- **Exact Match**: URLs must match exactly (including trailing slashes if any)
- **No Query Parameters**: Don't include query parameters in the whitelist URLs

## Verification

After adding the URLs:
1. Try registering a new account
2. Check the verification email
3. The link should point to `https://www.adiology.online/verify-email` (not localhost)
