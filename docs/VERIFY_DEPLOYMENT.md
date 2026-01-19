# Verify Edge Function Deployment

## Current Issue
Still getting "Project not specified" error after deployment attempt.

## Verification Checklist

Please verify these in Supabase Dashboard:

### 1. Function Exists
- Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
- Navigate to: **Edge Functions**
- **Question**: Do you see `make-server-6757d0ca` in the list?
  - ✅ Yes → Continue to step 2
  - ❌ No → Function needs to be created

### 2. Function Status
- Click on `make-server-6757d0ca`
- **Question**: What is the deployment status?
  - ✅ Active/Deployed → Continue to step 3
  - ⚠️ Inactive/Error → Check logs and redeploy

### 3. Function Code
- Click **Edit** on the function
- **Question**: Does the code match `supabase/functions/make-server-6757d0ca/index.tsx`?
  - ✅ Yes → Continue to step 4
  - ❌ No → Copy the code again

### 4. Secrets Configuration
- Go to: **Project Settings** → **Edge Functions** → **Secrets**
- **Question**: Are these secrets set?
  ```
  SENDUNE_API_KEY
  SENDUNE_FROM_EMAIL
  FRONTEND_URL
  ```
  - ✅ Yes → Continue to step 5
  - ❌ No → Set them now

### 5. Function Logs
- Go to: **Edge Functions** → `make-server-6757d0ca` → **Logs**
- **Question**: Are there any errors?
  - ✅ No errors → Function should work
  - ⚠️ Errors → Fix errors and redeploy

## Common Issues

### Issue: Function name mismatch
- **Solution**: Function name must be exactly `make-server-6757d0ca` (case-sensitive)

### Issue: Function not deployed
- **Solution**: Click **Deploy** button after pasting code

### Issue: Secrets not set
- **Solution**: Set secrets in Project Settings → Edge Functions → Secrets

### Issue: Code not saved
- **Solution**: Make sure to click **Save** before **Deploy**

## Test After Fixes

Once verified, test with:
```bash
# Health check
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Email test
node scripts/test-sendune-setup.js samayhuf@gmail.com
```

## Expected Results

✅ **Health check should return**: `{"status":"ok"}`
✅ **Email test should return**: Success message with messageId

