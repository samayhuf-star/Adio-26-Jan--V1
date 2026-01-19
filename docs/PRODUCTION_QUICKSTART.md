# 🚀 Super Admin Production Quick Start

Deploy the Super Admin backend to production in 5 minutes!

## One-Command Deployment

```bash
./scripts/deploy-all.sh
```

This script will guide you through:
1. ✅ Database migrations
2. ✅ Edge function deployment  
3. ✅ Super admin user creation

## What You Need

1. **Supabase Account** - Already have one ✓
2. **Supabase CLI** - Install if needed:
   ```bash
   npm install -g supabase
   supabase login
   ```
3. **Environment Variables** - Get from Supabase Dashboard:
   - Service Role Key (Dashboard → Settings → API)
   - Gemini API Key (if using AI features)

## Step-by-Step (If Not Using Script)

### 1. Deploy Migrations
```bash
./scripts/deploy-migrations.sh
```

### 2. Deploy Edge Function
```bash
./scripts/deploy-edge-function.sh
```

### 3. Create Super Admin
```bash
./scripts/create-superadmin.sh
```

## Verify Deployment

```bash
# Test health endpoint
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health
```

Should return: `{"status":"ok"}`

## Access Admin Panel

1. Login to your app with superadmin credentials
2. Navigate to `/superadmin`
3. Start managing users, subscriptions, and more!

## Need Help?

- 📚 Full docs: `docs/PRODUCTION_DEPLOYMENT.md`
- 🔧 API docs: `docs/BACKEND_SUPERADMIN.md`
- 🐛 Issues? Check Supabase Dashboard → Edge Functions → Logs

## What's Deployed?

✅ Complete database schema (12 tables)
✅ User management functions & triggers
✅ Admin API endpoints (30+ endpoints)
✅ Authentication & authorization
✅ Audit logging
✅ RLS security policies

---

**Ready? Run:** `./scripts/deploy-all.sh`

