# Quick Nhost Test Instructions

## To Test Nhost Authentication & Database

### Step 1: Get Your Nhost Project ID

1. Go to https://app.nhost.io
2. Log in and select your project
3. Go to **Settings** → **API**
4. Copy your **Project ID** (this is your subdomain)

### Step 2: Run the Test

**Option A: Simple Test (Recommended)**
```bash
node scripts/test-nhost-simple.js YOUR_PROJECT_ID us-east-1
```

**Option B: With Environment Variables**
```bash
export NHOST_SUBDOMAIN=your-project-id
export NHOST_REGION=us-east-1
export NHOST_ADMIN_SECRET="T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx"
node scripts/test-nhost-simple.js
```

**Option C: Full Test Suite**
```bash
export NHOST_SUBDOMAIN=your-project-id
export NHOST_REGION=us-east-1
export NHOST_ADMIN_SECRET="T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx"
node scripts/test-nhost.js
```

### What Gets Tested

✅ **Health Check** - Verifies Nhost service is running  
✅ **Admin Authentication** - Tests admin secret authentication  
✅ **Auth Endpoint** - Checks authentication API availability  
✅ **Database Query** - Tests GraphQL database connectivity  
✅ **User Sign Up** - Tests user registration flow  

### Expected Output

If everything works, you should see:
```
✅ Health check passed
✅ Admin authentication successful
✅ Auth endpoint accessible
✅ Database/GraphQL accessible
✅ User sign up successful
```

### Troubleshooting

**Error: "NHOST_SUBDOMAIN not set"**
- Provide your project ID as the first argument or set the environment variable

**Error: "Connection refused"**
- Verify your project ID is correct
- Check if your project is active in Nhost dashboard
- Try a different region if `us-east-1` doesn't work

**Error: "Invalid admin secret"**
- Verify the admin secret in Nhost dashboard → Settings → API
- Make sure you're using the admin secret, not the JWT secret

### Next Steps After Testing

1. If tests pass → Integrate Nhost SDK into your app
2. Update authentication code to use Nhost
3. Test end-to-end user authentication flow
4. Deploy and test in production
