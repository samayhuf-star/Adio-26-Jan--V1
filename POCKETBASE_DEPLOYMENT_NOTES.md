# PocketBase Admin Panel - Deployment Notes

## ✅ Changes Committed and Pushed

The following changes have been committed and pushed to the repository:

- ✅ PocketBase admin panel proxy route (`/admin/*`)
- ✅ PocketBaseAdmin React component
- ✅ Installation and startup scripts
- ✅ Updated routing in App.tsx
- ✅ Comprehensive documentation
- ✅ Updated .gitignore to exclude PocketBase binaries

## 🚀 Deployment Status

### Vercel Auto-Deployment

If your Vercel project is connected to this GitHub repository, it will automatically deploy when changes are pushed to `main`. The deployment should be triggered automatically.

### Manual Deployment (if needed)

```bash
# If you have Vercel CLI installed
vercel --prod
```

## ⚠️ Important: PocketBase Setup Required

**The admin panel requires PocketBase to be running separately.** PocketBase is NOT deployed with your Vercel app. You need to:

### Option 1: Self-Host PocketBase (Recommended for Production)

1. **Set up PocketBase on a separate server** (VPS, EC2, etc.)
   - Download PocketBase: https://github.com/pocketbase/pocketbase/releases
   - Run: `./pocketbase serve --http=0.0.0.0:8090`

2. **Set environment variables in Vercel**:
   ```
   POCKETBASE_URL=https://your-pocketbase-server.com
   POCKETBASE_ADMIN_EMAIL=admin@adiology.online
   POCKETBASE_ADMIN_PASSWORD=Admin@123!ChangeMe
   VITE_POCKETBASE_URL=https://your-pocketbase-server.com
   ```

### Option 2: Use PocketBase Cloud

1. Sign up at https://pocketbase.io/cloud
2. Create a new instance
3. Get your instance URL
4. Set environment variables in Vercel with your PocketBase Cloud URL

### Option 3: Docker Deployment

Deploy PocketBase using Docker:

```bash
docker run -d \
  --name pocketbase \
  -p 8090:8090 \
  -v ./pb_data:/pb_data \
  ghcr.io/muchobien/pocketbase:latest \
  --http=0.0.0.0:8090
```

## 📋 Environment Variables Checklist

Add these to **Vercel Dashboard → Settings → Environment Variables**:

### Required for Admin Panel:
```bash
POCKETBASE_URL=https://your-pocketbase-instance.com
POCKETBASE_ADMIN_EMAIL=admin@adiology.online
POCKETBASE_ADMIN_PASSWORD=Admin@123!ChangeMe
VITE_POCKETBASE_URL=https://your-pocketbase-instance.com
```

### Production Security:
- ✅ Change default admin password immediately
- ✅ Use HTTPS for PocketBase URL
- ✅ Enable CORS properly in PocketBase settings
- ✅ Use strong, unique passwords

## 🔍 Verify Deployment

1. **Check Vercel deployment status**: https://vercel.com/dashboard
2. **Test admin panel**: Visit `https://adiology.online/admin`
3. **Check PocketBase connection**: Verify `POCKETBASE_URL` is accessible
4. **Test login**: Use admin credentials to access PocketBase admin UI

## 🐛 Troubleshooting

### Admin Panel Not Loading

1. **Check PocketBase is running**:
   ```bash
   curl https://your-pocketbase-instance.com/api/health
   ```

2. **Verify environment variables** are set in Vercel

3. **Check browser console** for CORS or connection errors

4. **Verify proxy route** is working:
   ```bash
   curl https://adiology.online/admin/_/
   ```

### CORS Issues

If you see CORS errors, configure PocketBase settings:
- Go to PocketBase Admin UI → Settings → API
- Add your domain to allowed origins: `https://adiology.online`

## 📝 Next Steps

1. ✅ Code is deployed to GitHub
2. ⏳ Vercel will auto-deploy (or deploy manually)
3. ⏳ Set up PocketBase instance (separate server/cloud)
4. ⏳ Configure environment variables in Vercel
5. ⏳ Test admin panel at `/admin`
6. ⏳ Change default admin password

## 🔐 Security Reminders

- **Never commit** `.env` files or PocketBase data
- **Change default passwords** immediately
- **Use HTTPS** for all PocketBase connections
- **Restrict PocketBase access** to trusted IPs if possible
- **Regular backups** of PocketBase data (`pb_data/` directory)
