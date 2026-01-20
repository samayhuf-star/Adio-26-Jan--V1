# PocketBase Admin Panel Setup Guide

## Overview

The PocketBase admin panel is now accessible at `https://adiology.online/admin`. This provides full access to manage your PocketBase database, collections, users, and settings.

## Access URL

- **Production**: `https://adiology.online/admin`
- **Local Development**: `http://localhost:5000/admin`

## Initial Admin Credentials Setup

### Option 1: First-Time Setup (If PocketBase is Fresh)

If this is the first time setting up PocketBase, you need to create the initial admin account:

1. **Access PocketBase directly** (bypassing the proxy):
   - If running locally: `http://127.0.0.1:8090/_/`
   - If deployed: `https://your-pocketbase-instance.com/_/`

2. **Create the first admin account**:
   - PocketBase will prompt you to create the first admin account
   - Enter your email and password
   - Save these credentials securely

3. **Set environment variables**:
   ```bash
   POCKETBASE_ADMIN_EMAIL=your-admin-email@example.com
   POCKETBASE_ADMIN_PASSWORD=your-secure-password
   ```

### Option 2: Using Existing Admin Account

If you already have a PocketBase admin account:

1. **Set environment variables** in your `.env` file:
   ```bash
   POCKETBASE_URL=http://127.0.0.1:8090  # or your production PocketBase URL
   POCKETBASE_ADMIN_EMAIL=your-admin-email@example.com
   POCKETBASE_ADMIN_PASSWORD=your-secure-password
   ```

2. **Restart your server** to load the new environment variables

## Default Admin Credentials

**IMPORTANT**: Change these default credentials immediately after first setup!

### Default Login (Change These!)
- **Email**: `admin@adiology.online`
- **Password**: `Admin@123!ChangeMe`

### How to Change Admin Password

1. Log in to PocketBase admin panel at `/admin`
2. Navigate to **Settings** → **Admins**
3. Click on your admin account
4. Update the password
5. Update `POCKETBASE_ADMIN_PASSWORD` in your `.env` file

## Environment Variables

Add these to your `.env` file:

```bash
# PocketBase Configuration
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@adiology.online
POCKETBASE_ADMIN_PASSWORD=Admin@123!ChangeMe

# Frontend (for client-side PocketBase connection)
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

For production, update these to your production PocketBase instance URL.

## Features Available in Admin Panel

The PocketBase admin panel provides:

1. **Collections Management**
   - Create, edit, and delete collections
   - Manage collection fields and rules
   - Configure collection settings

2. **User Management**
   - View all users
   - Edit user profiles
   - Manage user roles and permissions
   - Reset passwords

3. **API Logs**
   - View API request logs
   - Monitor API usage
   - Debug API issues

4. **Settings**
   - Configure email settings
   - Manage file storage
   - Set up OAuth providers
   - Configure security settings

5. **Backups**
   - Create database backups
   - Restore from backups
   - Export/import data

## Security Best Practices

1. **Use Strong Passwords**: Admin accounts should have strong, unique passwords
2. **Enable 2FA**: Enable two-factor authentication for admin accounts
3. **Limit Access**: Only grant admin access to trusted personnel
4. **Regular Backups**: Set up automated backups of your PocketBase database
5. **Monitor Logs**: Regularly review admin action logs
6. **Update Regularly**: Keep PocketBase updated to the latest version

## Troubleshooting

### Cannot Access Admin Panel

1. **Check PocketBase URL**: Ensure `POCKETBASE_URL` is correct in your `.env`
2. **Check PocketBase is Running**: Verify PocketBase instance is accessible
3. **Check Credentials**: Verify `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD` are correct
4. **Check Server Logs**: Look for proxy errors in server console

### Proxy Errors

If you see proxy errors:
1. Verify PocketBase is running and accessible
2. Check network connectivity between your server and PocketBase
3. Verify CORS settings in PocketBase (if applicable)

### Authentication Issues

If you can't log in:
1. Try accessing PocketBase directly (bypassing proxy)
2. Reset admin password if needed
3. Check that environment variables are loaded correctly

## Support

For issues or questions:
1. Check PocketBase documentation: https://pocketbase.io/docs/
2. Review server logs for error messages
3. Contact your system administrator
