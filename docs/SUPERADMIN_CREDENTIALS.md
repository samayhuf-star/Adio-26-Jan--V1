# Superadmin Default Credentials

## Default Superadmin User

**Email:** `sam@sam.com`  
**Password:** `YourPassword`  
**Role:** `superadmin`

## Login URL

https://www.adiology.online/superadmin

## User ID

The user ID (UUID) will be generated automatically when you create the user via SQL. You can find it by running:

```sql
SELECT id, email, role 
FROM public.users 
WHERE email = 'sam@sam.com';
```

## Creating the User

Since the Auth service is currently unhealthy, create the user via SQL:

### Step 1: Generate Password Hash

Run in SQL Editor: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj/sql/new

```sql
SELECT crypt('YourPassword', gen_salt('bf')) as password_hash;
```

### Step 2: Create User

Use the script: `scripts/create-user-simple.sql`

Replace `YOUR_HASH_HERE` with the hash from Step 1, then run the SQL.

### Step 3: Verify

```sql
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.raw_user_meta_data->>'role' as auth_role,
  u.role as user_role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'sam@sam.com';
```

## Security Note

⚠️ **Important:** Change the password from `YourPassword` to a strong password after first login!

## Alternative Credentials

If you want to use different credentials, modify the SQL script:

- Change `user_email` variable to your desired email
- Change the password in the `crypt()` function
- Update `user_full_name` if needed

Example:
```sql
user_email TEXT := 'admin@yourdomain.com';
SELECT crypt('YourSecurePassword123!', gen_salt('bf')) as password_hash;
```

