# Nhost Database Setup - Template

## Your Nhost Database Connection Details

**Full Connection String:**
```
postgres://postgres:YOUR_PASSWORD@YOUR_SUBDOMAIN.db.YOUR_REGION.nhost.run:5432/YOUR_SUBDOMAIN
```

## Environment Variables to Set in Vercel

### Option 1: Single DATABASE_URL (Recommended)
```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@YOUR_SUBDOMAIN.db.YOUR_REGION.nhost.run:5432/YOUR_SUBDOMAIN
```

### Option 2: Component Variables
```
NHOST_SUBDOMAIN=YOUR_SUBDOMAIN
NHOST_REGION=YOUR_REGION
NHOST_DB_PASSWORD=YOUR_PASSWORD
```

## Steps to Configure in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** → **Environment Variables**

2. **Add DATABASE_URL**
   - Click **Add New**
   - Name: `DATABASE_URL`
   - Value: `postgres://postgres:YOUR_PASSWORD@YOUR_SUBDOMAIN.db.YOUR_REGION.nhost.run:5432/YOUR_SUBDOMAIN`
   - Select all environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

3. **Verify Other Nhost Variables Are Set**
   Make sure these are also configured:
   ```
   NHOST_SUBDOMAIN=YOUR_SUBDOMAIN
   NHOST_REGION=YOUR_REGION
   NHOST_ADMIN_SECRET=your-admin-secret
   ADMIN_SECRET_KEY=your-admin-secret
   ```

4. **Redeploy**
   - After saving environment variables, go to **Deployments**
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger automatic deployment

## Security Notes

⚠️ **Important:**
- Never commit files containing actual passwords to git
- Keep your database password secure
- Consider rotating the password periodically
- Never share this password publicly
- Use environment variables for all sensitive data

## Verification

After deployment, test these endpoints:
- `https://www.adiology.online/api/health` - Should return `{ status: 'ok' }`
- `https://www.adiology.online/api/workspace-projects` - Should connect to database (requires auth token)

## Troubleshooting

If you see database connection errors:
1. Verify `DATABASE_URL` is set correctly in Vercel
2. Check that public database access is enabled in Nhost dashboard
3. Verify the password is correct (no extra spaces or characters)
4. Check Vercel deployment logs for connection errors
