# Quick Deploy Checklist for Email Testing

## ✅ Files Ready
- ✅ `supabase/functions/make-server-6757d0ca/index.tsx` - Main function code
- ✅ `supabase/functions/make-server-6757d0ca/kv_store.tsx` - Required dependency

## 📋 Deployment Steps

### Step 1: Go to Supabase Dashboard
👉 https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj

### Step 2: Navigate to Edge Functions
- Click **Edge Functions** in the left sidebar
- Look for function: `make-server-6757d0ca`

### Step 3: Create/Update Function
**If function doesn't exist:**
- Click **Create Function**
- Name: `make-server-6757d0ca`
- Copy entire contents of: `supabase/functions/make-server-6757d0ca/index.tsx`

**If function exists:**
- Click on `make-server-6757d0ca`
- Click **Edit**
- Replace code with contents of: `supabase/functions/make-server-6757d0ca/index.tsx`

### Step 4: Set Secrets (CRITICAL!)
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add these 3 secrets:

```
SENDUNE_API_KEY = bc9029fb-e5a1-45b9-a94e-11ee31e23a68
SENDUNE_FROM_EMAIL = noreply@adiology.io
FRONTEND_URL = https://adiology.io
```

**Important:** Replace `noreply@adiology.io` with your verified Sendune sender email!

### Step 5: Deploy
- Click **Deploy** button
- Wait for deployment to complete (usually 30-60 seconds)

### Step 6: Verify Deployment
Run this command:
```bash
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM"
```

Expected response: `{"status":"ok"}`

### Step 7: Test Email
Once deployed, run:
```bash
node scripts/test-sendune-setup.js your-email@example.com
```

## 🔍 Troubleshooting

**"Project not specified" error:**
- Function is not deployed → Complete Steps 1-5 above

**"Email service not configured" error:**
- Secrets not set → Complete Step 4 above
- Redeploy function after setting secrets

**Email not received:**
- Check spam folder
- Verify sender email in Sendune dashboard
- Check Sendune Activity → Messages for delivery status

