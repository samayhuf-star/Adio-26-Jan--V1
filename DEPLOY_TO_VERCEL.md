# 🚀 Quick Deployment Guide to Vercel

## ✅ Configuration Verified

Your project is already configured for Vercel deployment:
- ✅ `vercel.json` is properly configured
- ✅ Build output directory: `build` (matches Vite config)
- ✅ Framework: Vite
- ✅ API routes configured at `/api/[...path].ts`
- ✅ Project linked to Vercel: `adiology-dashboard`

## 📋 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   npx vercel login
   ```
   This will open a browser window for authentication.

2. **Deploy to Production:**
   ```bash
   npx vercel --prod
   ```

3. **Your app will be live at:** `https://adiology-dashboard.vercel.app` (or your custom domain)

### Option 2: Deploy via Git Push (Automatic)

If your Vercel project is connected to GitHub:

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. Vercel will automatically detect the push and deploy your app.

## 🔐 Required Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

### Required:
```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET=your-actual-admin-secret
ADMIN_SECRET_KEY=your-actual-admin-secret
NODE_ENV=production
```

### Optional (but recommended):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
VITE_GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=your-postgresql-connection-string
```

**How to set:**
1. Go to https://vercel.com/dashboard
2. Select your project: `adiology-dashboard`
3. Go to **Settings** → **Environment Variables**
4. Add each variable
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

## 🏗️ Build Configuration

- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`
- **Node Version:** >=18.0.0

## ✅ Post-Deployment Checklist

After deployment, verify:
- [ ] App loads at the deployment URL
- [ ] Authentication works (Nhost)
- [ ] API routes respond correctly
- [ ] Environment variables are loaded
- [ ] No console errors in browser

## 🐛 Troubleshooting

### Build Fails
- Check deployment logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is >=18.0.0

### Environment Variables Not Working
- Verify variables are set for **Production** environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### API Routes Not Working
- Verify `api/[...path].ts` is in the root directory
- Check serverless function logs in Vercel dashboard
- Ensure Hono server is properly configured

## 📞 Need Help?

- Check deployment logs: Vercel Dashboard → Deployments → [Your Deployment] → Build Logs
- Vercel Docs: https://vercel.com/docs
- Project Docs: See `docs/` directory for detailed guides
