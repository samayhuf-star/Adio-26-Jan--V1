# Deploy Edge Function Now

## Quick Deployment Steps

### 1. Go to Supabase Dashboard
👉 https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj

### 2. Navigate to Edge Functions
- Click **Edge Functions** in the left sidebar

### 3. Create/Update Function
- **If function doesn't exist**: Click **Create Function**
- **If function exists**: Click on `make-server-6757d0ca` → Click **Edit**
- **Function name**: `make-server-6757d0ca` (exact match)

### 4. Copy Code
Open this file: `supabase/functions/make-server-6757d0ca/index.tsx`
Copy **ALL** the code (all 1979 lines)
Paste into the function editor in Supabase Dashboard

### 5. Set Secrets (CRITICAL!)
Go to: **Project Settings** → **Edge Functions** → **Secrets**

Add these 3 secrets:
```
SENDUNE_API_KEY = bc9029fb-e5a1-45b9-a94e-11ee31e23a68
SENDUNE_FROM_EMAIL = noreply@adiology.online
FRONTEND_URL = https://adiology.online
```

**Important**: Replace `noreply@adiology.online` with your verified Sendune sender email!

### 6. Deploy
- Click **Deploy** button
- Wait for deployment (30-60 seconds)
- Check for any errors in the logs

### 7. Test
After deployment, run:
```bash
node scripts/test-sendune-setup.js samayhuf@gmail.com
```

Expected: Email sent successfully! ✅

## Alternative: Deploy Frontend (Vercel)

If you also need to deploy the frontend:

```bash
# If using Vercel CLI
vercel --prod

# Or push to git and Vercel will auto-deploy
git push origin main
```

