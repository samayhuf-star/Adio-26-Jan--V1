# PocketBase Admin Panel - Login Credentials

## Access URL
**Production**: https://adiology.online/admin

## Default Admin Credentials

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

### Login Information
- **Email**: `admin@adiology.online`
- **Password**: `Admin@123!ChangeMe`

## First-Time Setup

If this is your first time accessing PocketBase:

1. **Access PocketBase directly** (bypassing the proxy) to create the first admin account:
   - Local: `http://127.0.0.1:8090/_/`
   - Production: `https://your-pocketbase-instance.com/_/`

2. **Create the admin account** using the credentials above

3. **Update environment variables** in your `.env` file:
   ```bash
   POCKETBASE_URL=http://127.0.0.1:8090  # or your production URL
   POCKETBASE_ADMIN_EMAIL=admin@adiology.online
   POCKETBASE_ADMIN_PASSWORD=Admin@123!ChangeMe
   ```

4. **Restart your server** to load the new environment variables

5. **Access the admin panel** at `/admin` and change the password immediately!

## Changing the Password

1. Log in to the admin panel at `/admin`
2. Navigate to **Settings** → **Admins**
3. Click on your admin account
4. Update the password
5. Update `POCKETBASE_ADMIN_PASSWORD` in your `.env` file
6. Restart your server

## Security Notes

- These are default credentials - **MUST be changed in production**
- Use a strong, unique password
- Enable 2FA if available
- Keep credentials secure and never commit them to version control
- Regularly rotate passwords

## Troubleshooting

If you cannot log in:
1. Verify PocketBase is running
2. Check that `POCKETBASE_URL` is correct
3. Try accessing PocketBase directly (bypassing proxy)
4. Check server logs for errors
