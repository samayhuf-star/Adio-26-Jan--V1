# Nhost Database Setup - Complete Connection String

## Your Nhost Database Connection Details

**Full Connection String:**
```
postgres://postgres:JMFSvSBe4Nv51bCb@vumnjkoyxkistmlzotuk.db.eu-central-1.nhost.run:5432/vumnjkoyxkistmlzotuk
```

## Environment Variables to Set in Vercel

### Option 1: Single DATABASE_URL (Recommended)
```
DATABASE_URL=postgres://postgres:JMFSvSBe4Nv51bCb@vumnjkoyxkistmlzotuk.db.eu-central-1.nhost.run:5432/vumnjkoyxkistmlzotuk
```

### Option 2: Component Variables
```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_DB_PASSWORD=JMFSvSBe4Nv51bCb
```

## Steps to Configure in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** → **Environment Variables**

2. **Add DATABASE_URL**
   - Click **Add New**
   - Name: `DATABASE_URL`
   - Value: `postgres://postgres:JMFSvSBe4Nv51bCb@vumnjkoyxkistmlzotuk.db.eu-central-1.nhost.run:5432/vumnjkoyxkistmlzotuk`
   - Select all environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

3. **Verify Other Nhost Variables Are Set**
   Make sure these are also configured:
   ```
   NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
   NHOST_REGION=eu-central-1
   NHOST_ADMIN_SECRET=your-admin-secret
   ADMIN_SECRET_KEY=your-admin-secret
   ```

4. **Redeploy**
   - After saving environment variables, go to **Deployments**
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger automatic deployment

## Security Notes

⚠️ **Important:**
- This file contains your database password - **DO NOT commit it to git**
- Keep your database password secure
- Consider rotating the password periodically
- Never share this password publicly

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
