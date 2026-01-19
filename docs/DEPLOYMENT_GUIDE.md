# Deployment Guide - Vercel

This guide walks you through deploying the Adiology Campaign Dashboard to Vercel.

---

## Prerequisites

1. **Vercel Account**
   - Sign up at https://vercel.com
   - Connect your GitHub/GitLab/Bitbucket account

2. **Supabase Project**
   - Project ID: `kkdnnrwhzofttzajnwlj`
   - Public Anon Key: (see `.env.example`)

3. **API Keys**
   - Gemini API Key (for AI features)
   - Stripe Keys (optional, for billing)

---

## Step 1: Prepare Repository

### 1.1 Commit All Changes
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Verify Build Works Locally
```bash
npm install
npm run build
```

Verify that the `build` directory is created successfully.

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard

1. **Import Project**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the repository containing this project

2. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (or leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

3. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   VITE_SUPABASE_URL=https://kkdnnrwhzofttzajnwlj.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   GEMINI_API_KEY=<your-gemini-key>
   ```

   **Note:** For production, also add:
   ```
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add GEMINI_API_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Step 3: Configure Supabase Edge Functions

### 3.1 Deploy Edge Function

The edge function is located at `backend/supabase-functions/server/index.tsx`.

**Using Supabase CLI:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Deploy function
supabase functions deploy make-server-6757d0ca
```

**Set Environment Variables:**
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 3.2 Verify Function Deployment

Test the health endpoint:
```bash
curl https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Step 4: Post-Deployment Verification

### 4.1 Smoke Tests

Run these tests on your production URL:

1. **Homepage Loads**
   - ✅ Visit `https://your-project.vercel.app`
   - ✅ Dashboard should load

2. **Navigation Works**
   - ✅ Click through all sidebar menu items
   - ✅ All modules should load

3. **Super Admin Access**
   - ✅ Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
   - ✅ Login with: `admin@adbuilder.com` / `SuperAdmin123!`
   - ✅ Admin panel should load

4. **Campaign Builder**
   - ✅ Create a test campaign
   - ✅ Verify data saves

5. **Keyword Planner**
   - ✅ Generate keywords
   - ✅ Verify AI integration works

6. **History Panel**
   - ✅ Save an item
   - ✅ Verify it appears in history

7. **Support Tickets**
   - ✅ Create a test ticket
   - ✅ Verify it saves

8. **Billing Panel**
   - ✅ Verify billing info displays
   - ✅ (Note: Currently mock data)

### 4.2 Check Browser Console

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify no CORS errors

### 4.3 Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check "Functions" and "Logs" tabs for errors

---

## Step 5: Monitor & Maintain

### 5.1 Set Up Monitoring

1. **Error Tracking**
   - Integrate Sentry (see `src/utils/errorTracking.ts`)
   - Add Sentry DSN to environment variables

2. **Analytics**
   - Add Google Analytics or similar
   - Track user behavior

3. **Uptime Monitoring**
   - Use UptimeRobot or similar
   - Set up alerts for downtime

### 5.2 Regular Maintenance

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Review Logs Weekly**
   - Check Vercel function logs
   - Check Supabase logs
   - Review error tracking dashboard

3. **Backup Database**
   - Supabase provides automatic backups
   - Verify backups are working

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`
- **Solution:** Run `npm install` locally and commit `package-lock.json`

**Error:** `Build output not found`
- **Solution:** Verify `build` directory is created. Check `vite.config.ts` output directory.

### Runtime Errors

**Error:** `Project ID not configured`
- **Solution:** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel environment variables

**Error:** `CORS error`
- **Solution:** Check Supabase CORS settings. Verify edge function CORS middleware is enabled.

**Error:** `API unavailable`
- **Solution:** Verify edge function is deployed. Check Supabase function logs.

### Performance Issues

**Slow Load Times**
- Enable Vercel Edge Caching
- Optimize images
- Use CDN for static assets

**High Function Invocations**
- Implement rate limiting
- Add caching layer
- Optimize API calls

---

## Environment Variables Reference

### Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional (for full functionality)
- `GEMINI_API_KEY` - For AI keyword/ad generation
- `STRIPE_PUBLISHABLE_KEY` - For billing (if integrated)
- `STRIPE_SECRET_KEY` - For billing (if integrated)
- `VITE_SENTRY_DSN` - For error tracking

---

## Rollback Plan

If deployment fails:

1. **Via Vercel Dashboard**
   - Go to "Deployments"
   - Find previous successful deployment
   - Click "..." → "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain (optional)
2. ✅ Configure SSL certificate (automatic with Vercel)
3. ✅ Set up monitoring and alerts
4. ✅ Review audit report (`AUDIT_REPORT.md`)
5. ✅ Implement missing features (billing, auth, etc.)

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Project Issues:** Check `AUDIT_REPORT.md` for known issues

---

**Last Updated:** 2025-01-27

