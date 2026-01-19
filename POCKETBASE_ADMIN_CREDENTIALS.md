# PocketBase Admin Panel - Login Credentials

## Access URL
**Production**: https://adiology.online/admin

## Default Admin Credentials

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

### Login Information
- **Email**: `admin@adiology.online`
- **Password**: `Admin@123!ChangeMe`

## First-Time Setup

### Step 1: Install PocketBase

If PocketBase is not installed, run:

```bash
./scripts/install-pocketbase.sh
```

### Step 2: Start PocketBase Server

Start PocketBase:

```bash
./scripts/start-pocketbase.sh
```

The server will start at `http://127.0.0.1:8090`

### Step 3: Create Admin Account

1. **Open PocketBase Admin UI**:
   - Go to: `http://127.0.0.1:8090/_/`
   - PocketBase will prompt you to create the first admin account

2. **Create the admin account**:
   - Email: `admin@adiology.online`
   - Password: `Admin@123!ChangeMe`
   - Click "Create admin"

3. **Update environment variables** in your `.env` file:
   ```bash
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=admin@adiology.online
   POCKETBASE_ADMIN_PASSWORD=Admin@123!ChangeMe
   VITE_POCKETBASE_URL=http://127.0.0.1:8090
   ```

4. **Restart your application server** to load the new environment variables

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
