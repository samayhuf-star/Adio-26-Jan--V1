# Super Admin Quick Start

## 🚀 5-Minute Setup

### Step 1: Database Setup (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy & paste `backend/supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### Step 2: Environment Variables (1 minute)

In Supabase Dashboard → Edge Functions → Settings, add:

```
SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get from Settings → API>
GEMINI_API_KEY=<your key>
```

### Step 3: Deploy Backend (1 minute)

**Option A - Dashboard:**
1. Edge Functions → Create Function
2. Name: `make-server-6757d0ca`
3. Copy code from `backend/supabase-functions/server/index.tsx`
4. Deploy

**Option B - CLI:**
```bash
supabase functions deploy make-server-6757d0ca
```

### Step 4: Create Super Admin (1 minute)

1. Create user in Supabase Auth (Authentication → Users)
2. Run in SQL Editor:
```sql
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'your-admin-email@example.com';
```

### Step 5: Test (30 seconds)

1. Login with super admin credentials
2. Navigate to Super Admin panel
3. Check if data loads

## ✅ Done!

Your Super Admin backend is now live and ready to use.

## 📚 Full Documentation

See `docs/SUPER_ADMIN_SETUP.md` for detailed setup instructions.

