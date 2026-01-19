# Deploy Payment Endpoints - Quick Guide

## Current Status
✅ Payment endpoint code is ready  
✅ Environment variables can be added  
❌ Edge Function needs to be deployed

## Quick Deploy (Choose One Method)

### Method 1: Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# 4. Copy the updated function files
mkdir -p supabase/functions/make-server-6757d0ca
cp backend/supabase-functions/server/index.tsx supabase/functions/make-server-6757d0ca/index.tsx
cp backend/supabase-functions/server/kv_store.tsx supabase/functions/make-server-6757d0ca/kv_store.tsx

# 5. Deploy the function
supabase functions deploy make-server-6757d0ca --no-verify-jwt
```

### Method 2: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/functions
2. Click on **make-server-6757d0ca** (or create it if it doesn't exist)
3. Copy the contents of `backend/supabase-functions/server/index.tsx` into the editor
4. Click **Deploy**

### Method 3: Use Deployment Script

```bash
chmod +x scripts/deploy-edge-function.sh
./scripts/deploy-edge-function.sh
```

## Set Environment Variables

After deployment, add these secrets in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/functions/make-server-6757d0ca/settings
2. Add these secrets:

```
STRIPE_SECRET_KEY=sk_test_xxx (or sk_live_xxx for production)
STRIPE_WEBHOOK_SECRET=whsec_xxx (optional but recommended)
FRONTEND_URL=https://adiology.online
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key (if using AI features)
SENDUNE_API_KEY=your_sendune_key (if using email)
SENDUNE_FROM_EMAIL=noreply@adiology.online
```

## Verify Deployment

After deploying, run:

```bash
node test-deployment-status.js
```

You should see:
- ✅ Edge Function is DEPLOYED and WORKING!
- ✅ Payment endpoints are accessible

## Test Payment Endpoints

Once deployed, test with:

```bash
# Test health endpoint
curl -X GET \
  "https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected: {"status":"ok"}
```

## Troubleshooting

### "Project not specified" Error
- The function is not deployed
- Deploy using one of the methods above

### "Stripe not configured" Error
- Add `STRIPE_SECRET_KEY` to Edge Function secrets
- Make sure it's the correct key (test vs live)

### "Webhook signature verification failed"
- Add `STRIPE_WEBHOOK_SECRET` to Edge Function secrets
- Get it from Stripe Dashboard → Webhooks → Your webhook → Signing secret

### Function not found (404)
- Check function name: `make-server-6757d0ca`
- Verify it's deployed in the correct project
- Check Supabase Dashboard → Edge Functions

## Next Steps After Deployment

1. ✅ Deploy Edge Function
2. ✅ Add environment variables
3. ✅ Test health endpoint
4. ✅ Test payment endpoints
5. ✅ Configure Stripe webhook
6. ✅ Test full payment flow

## Stripe Webhook Configuration

After deployment, configure Stripe webhook:

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add it to Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

