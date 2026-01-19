# Troubleshooting Edge Function Deployment

## Current Issue
Getting "Project not specified" error when calling the Edge Function.

## Possible Causes

### 1. Function Not Deployed
- The function might not be deployed to Supabase
- Check Supabase Dashboard → Edge Functions → make-server-6757d0ca

### 2. Function Name Mismatch
- Verify the function name is exactly: `make-server-6757d0ca`
- Case-sensitive and must match exactly

### 3. Deployment Status
- Check if function shows as "Active" in Supabase Dashboard
- Look for any deployment errors in the logs

### 4. Verify Deployment Steps

**In Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Click: **Edge Functions**
3. Check if `make-server-6757d0ca` appears in the list
4. Click on it to see details
5. Check deployment status and logs

**If function doesn't exist:**
1. Click **Create Function**
2. Name: `make-server-6757d0ca` (exact match)
3. Copy code from: `supabase/functions/make-server-6757d0ca/index.tsx`
4. Set secrets (see below)
5. Click **Deploy**

**If function exists but not working:**
1. Click on the function
2. Check **Logs** tab for errors
3. Verify **Secrets** are set correctly
4. Try **Redeploy**

### 5. Required Secrets
Make sure these are set in **Project Settings → Edge Functions → Secrets**:
```
SENDUNE_API_KEY=bc9029fb-e5a1-45b9-a94e-11ee31e23a68
SENDUNE_FROM_EMAIL=noreply@adiology.online
FRONTEND_URL=https://adiology.online
```

### 6. Test After Deployment
Once deployed, test with:
```bash
# Health check
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Email test
node scripts/test-sendune-setup.js samayhuf@gmail.com
```

## Alternative: Check Function List
In Supabase Dashboard → Edge Functions, you should see a list of all deployed functions. If `make-server-6757d0ca` is not in the list, it needs to be created and deployed.

