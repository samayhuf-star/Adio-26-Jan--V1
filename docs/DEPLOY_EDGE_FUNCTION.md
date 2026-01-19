# Deploy Edge Function - Quick Guide

## Current Status
✅ Routes have been fixed in the code  
⚠️  Edge function needs to be deployed with the updated routes

## Option 1: Deploy via Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Deploy the function
supabase functions deploy make-server-6757d0ca --no-verify-jwt
```

## Option 2: Deploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Navigate to: **Edge Functions** → **make-server-6757d0ca**
3. Upload the files from: `supabase/functions/make-server-6757d0ca/`
   - `index.tsx`
   - `kv_store.tsx`
4. Click **Deploy**

## Option 3: Use the deployment script

Check if you have a deployment script in the project:
```bash
cat scripts/deploy-edge-function.sh
```

## After Deployment

Test the health endpoint:
```bash
curl -X GET \
  "https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected response:
```json
{ "status": "ok" }
```

## Verify Deployment

Run the health test again:
```bash
node test-database-health.js
```

All tests should pass after deployment! ✅
