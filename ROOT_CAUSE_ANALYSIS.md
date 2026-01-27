# Root Cause Analysis: Module Loading Failures

## Summary

The application is experiencing multiple module loading failures due to a combination of deployment cache mismatches, authentication token refresh issues, and configuration problems.

## Issues Identified

### 1. **404 Errors for Dynamic Imports** (Primary Issue)
**Error:**
```
GET https://www.adiology.online/assets/KeywordPlanner-DgMtF0a0.js net::ERR_ABORTED 404 (Not Found)
GET https://www.adiology.online/assets/TerminalResultsConsole-0zxjkxeh.js net::ERR_ABORTED 404 (Not Found)
TypeError: Failed to fetch dynamically imported module
```

**Root Cause:**
- The browser has a cached version of `index.html` from a previous deployment
- The cached HTML references JavaScript bundles with old hashes (`DgMtF0a0`, `0zxjkxeh`)
- After a new deployment, Vite generates new hashes for these bundles
- The old bundles no longer exist on the server, causing 404 errors
- This is a classic **deployment cache mismatch** issue

**Why It Happens:**
- Vite uses content-based hashing for cache busting (`[name]-[hash].js`)
- When code changes, new hashes are generated
- Browsers cache `index.html` aggressively
- Old `index.html` tries to load bundles that don't exist anymore

**Solution:**
1. **Immediate Fix:** Users need to hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or clear cache
2. **Code Fix:** The app already has version checking (`src/utils/versionCheck.ts`) but it may need improvements
3. **Deployment Fix:** Ensure proper cache headers for `index.html` (no-cache) vs static assets (long cache)

---

### 2. **401 Unauthorized from Nhost** (Secondary Issue)
**Error:**
```
POST https://vumnjkoyxkistmlzotuk.auth.eu-central-1.nhost.run/v1/token 401 (Unauthorized)
```

**Root Cause:**
- Nhost client is attempting to refresh an expired/invalid refresh token
- The refresh token stored in localStorage is from an old session or has expired
- This is **expected behavior** when tokens expire, but it's causing console noise

**Why It Happens:**
- Nhost client has `autoRefreshToken: true` configured (`src/lib/nhost.ts:18`)
- When the app loads, it tries to refresh tokens automatically
- If the refresh token is invalid/expired, Nhost returns 401
- The app already suppresses these errors in `main.tsx:68-70` but they still appear in console

**Solution:**
1. **Code Fix:** Improve error handling to silently handle expected 401s during token refresh
2. **User Fix:** Clear localStorage and sign in again
3. **Prevention:** Better token expiration handling and automatic sign-out on refresh failure

---

### 3. **500 Internal Server Error from /api/errors** (Tertiary Issue)
**Error:**
```
POST https://www.adiology.online/api/errors 500 (Internal Server Error)
```

**Root Cause:**
- The error reporting endpoint (`server/index.ts:189-200`) is receiving malformed JSON or encountering an unhandled error
- When the frontend tries to report errors (like the 404s above), the backend itself fails

**Why It Happens:**
- The endpoint tries to parse JSON without proper error handling
- If the request body is malformed or missing, `c.req.json()` throws
- The catch block returns 500, but the error might be happening during JSON parsing

**Solution:**
- Add better error handling in `/api/errors` endpoint
- Validate request body before parsing
- Return appropriate error codes (400 for bad requests, 500 for server errors)

---

### 4. **Stripe Secret Key Exposure** (Security Issue)
**Warning:**
```
Production environment warnings: (2) ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY']
```

**Root Cause:**
- The code is checking for `STRIPE_SECRET_KEY` in client-side environment validation (`src/utils/envValidation.ts:20`)
- `STRIPE_SECRET_KEY` should **NEVER** be exposed to the client
- Only `VITE_STRIPE_PUBLISHABLE_KEY` should be available in the browser
- Additionally, `src/utils/expenseTracking.ts:45` tries to use `VITE_STRIPE_SECRET_KEY` which should not exist

**Why It's Dangerous:**
- Secret keys exposed to the client can be extracted by anyone
- This allows unauthorized access to Stripe API
- Could lead to financial fraud or data breaches

**Solution:**
1. **Remove** `STRIPE_SECRET_KEY` from client-side environment validation
2. **Fix** `expenseTracking.ts` to use server-side API instead of direct Stripe calls
3. **Verify** no `VITE_STRIPE_SECRET_KEY` exists in Vercel environment variables
4. **Only** expose `VITE_STRIPE_PUBLISHABLE_KEY` to the client

---

## Recommended Fixes

### Priority 1: Fix Dynamic Import Failures (404s)

**File: `src/utils/versionCheck.ts`**
- Already has version checking logic
- May need to improve cache clearing on version mismatch
- Consider adding automatic page reload when chunk errors occur

**File: `vite.config.ts`**
- Verify cache headers are properly configured
- Ensure `index.html` has `no-cache` headers
- Static assets should have long cache times

**Deployment:**
- Configure Vercel to set proper cache headers
- `index.html`: `Cache-Control: no-cache, no-store, must-revalidate`
- Static assets: `Cache-Control: public, max-age=31536000, immutable`

### Priority 2: Fix Error Endpoint (500)

**File: `server/index.ts`**
```typescript
app.post('/api/errors', async (c) => {
  try {
    let errorData;
    try {
      errorData = await c.req.json();
    } catch (parseError) {
      console.error('[Client Error] Failed to parse error data:', parseError);
      return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }
    
    console.error('[Client Error]', errorData);
    return c.json({ success: true, message: 'Error logged' });
  } catch (error) {
    console.error('Error logging error:', error);
    return c.json({ error: 'Failed to log error' }, 500);
  }
});
```

### Priority 3: Fix Stripe Key Exposure

**File: `src/utils/envValidation.ts`**
- Remove `STRIPE_SECRET_KEY` from optional variables list
- Only check for `VITE_STRIPE_PUBLISHABLE_KEY`

**File: `src/utils/expenseTracking.ts`**
- Remove direct Stripe API calls from client
- Create server-side endpoint for expense tracking
- Use that endpoint instead of direct API calls

**Vercel Environment Variables:**
- Verify `VITE_STRIPE_SECRET_KEY` does NOT exist
- Only `VITE_STRIPE_PUBLISHABLE_KEY` should be exposed
- `STRIPE_SECRET_KEY` should only exist server-side (without VITE_ prefix)

### Priority 4: Improve Nhost Token Refresh Handling

**File: `src/lib/nhost.ts`**
- Add better error handling for token refresh failures
- Consider setting `autoSignIn: false` (already set) and handling failures gracefully

**File: `src/main.tsx`**
- Error suppression is already in place (lines 68-70, 112-113)
- May need to improve to catch errors earlier in the chain

---

## Immediate Actions Required

1. **For Users:** Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
2. **For Developers:** 
   - Fix the `/api/errors` endpoint error handling
   - Remove Stripe secret key from client-side code
   - Verify Vercel cache headers are correct
   - Test version checking works properly

## Testing Checklist

After fixes:
- [ ] Deploy new version
- [ ] Load app in incognito window (no cache)
- [ ] Verify no 404 errors for dynamic imports
- [ ] Verify no 500 errors from `/api/errors`
- [ ] Verify no Stripe secret key warnings
- [ ] Test token refresh with expired token
- [ ] Verify cache headers are correct
