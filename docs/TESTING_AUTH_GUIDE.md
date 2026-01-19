# User Signup and Login Testing Guide

## Overview
This guide helps you test the user signup and login flows in the Adiology Campaign Dashboard.

## Signup Flow

### Steps:
1. **Navigate to Signup**
   - Go to the home page
   - Click "Sign Up" or "Create Account"
   - You should see the signup form

2. **Fill Signup Form**
   - **Full Name**: Required (e.g., "John Doe")
   - **Email**: Required, must be valid format (e.g., "test@example.com")
   - **Password**: Minimum 6 characters (e.g., "password123")
   - **Confirm Password**: Must match password

3. **Validation Checks**:
   - ✅ Blank name shows error: "Please enter your name"
   - ✅ Invalid email format shows error: "Please enter a valid email address"
   - ✅ Password < 6 characters shows error: "Password must be at least 6 characters"
   - ✅ Passwords don't match shows error: "Passwords do not match"

4. **Submit Signup**
   - Click "Create Account" button
   - Should show loading state ("Creating account...")
   - Success notification appears: "Account created successfully!"
   - Redirects to `/verify-email?email=...` after ~1 second

5. **Email Verification**:
   - Check email inbox for verification email from Supabase
   - Click verification link in email
   - Should redirect back to app and mark email as verified

### Expected Behavior:
- ✅ Form clears after successful signup
- ✅ Success notification appears
- ✅ Redirects to verification page
- ✅ User profile created in Supabase `users` table
- ✅ No stuck loading states

## Login Flow

### Steps:
1. **Navigate to Login**
   - Go to home page or auth page
   - Click "Sign In" or if already on auth page, ensure login form is visible

2. **Fill Login Form**
   - **Email**: Your registered email (e.g., "test@example.com")
   - **Password**: Your password

3. **Submit Login**
   - Click "Sign In" button
   - Should show loading state ("Signing in...")
   - Success notification: "Welcome back!"
   - Redirects to dashboard (user view)

### Expected Behavior:
- ✅ Success notification appears
- ✅ Redirects to dashboard within 1-2 seconds
- ✅ User profile loads from database
- ✅ No stuck loading states
- ✅ Session persists on page refresh

### Error Cases to Test:
1. **Invalid Credentials**
   - Wrong email or password
   - Shows error: "Invalid email or password. Please try again."

2. **Unverified Email**
   - Try logging in before email verification
   - Shows error: "Please verify your email before signing in..."

3. **Empty Fields**
   - Blank email or password
   - HTML5 validation should prevent submission

## Password Reset Flow

### Steps:
1. **Click "Forgot password?" link** on login form
2. **Enter email address**
3. **Click "Send Reset Link"**
4. **Check email** for password reset link
5. **Click link** in email
6. **Enter new password** on reset page
7. **Confirm new password**
8. **Submit** - password updated successfully

## Testing Checklist

### Signup Tests:
- [ ] Can create new account with valid details
- [ ] Validation errors show for invalid inputs
- [ ] Success notification appears
- [ ] Redirects to verification page
- [ ] Email verification email is received
- [ ] Can verify email via link
- [ ] Error shows if email already exists
- [ ] User profile created in database

### Login Tests:
- [ ] Can login with verified account
- [ ] Success notification appears
- [ ] Redirects to dashboard
- [ ] User profile loads correctly
- [ ] Session persists after refresh
- [ ] Error shows for invalid credentials
- [ ] Error shows for unverified email
- [ ] Loading state doesn't get stuck

### Password Reset Tests:
- [ ] Can request password reset
- [ ] Reset email is received
- [ ] Can reset password via link
- [ ] Can login with new password

## Test Accounts

### Create Test Account:
```
Email: test-user-{timestamp}@example.com
Password: TestPassword123!
Full Name: Test User
```

### Example Test Email:
```
Email: test-1701234567@example.com
Password: TestPassword123!
```

## Debugging Tips

### If Signup/Login Gets Stuck:
1. **Check Browser Console** for errors
2. **Check Network Tab** for failed API calls
3. **Verify Supabase Connection**:
   - Check `src/utils/supabase/info.tsx` for project ID and key
   - Verify Supabase project is active
4. **Check User Profile Creation**:
   - Verify `users` table exists in Supabase
   - Check RLS (Row Level Security) policies allow inserts

### Common Issues:
- **404 Error**: User profile doesn't exist - auto-creation should handle this
- **Stuck Loading**: Check if navigation callback is completing
- **No Email**: Check Supabase email settings and spam folder

## Supabase Dashboard Checks

1. **Auth → Users**: Check if user was created
2. **Table Editor → users**: Check if profile exists
3. **Auth → Email Templates**: Verify email templates are configured
4. **Database → users table**: Verify RLS policies allow user access

## Quick Test Commands

### Test Signup (Manual):
1. Open app in browser
2. Click "Sign Up"
3. Fill form and submit
4. Check email for verification

### Test Login (Manual):
1. Open app in browser
2. Click "Sign In"
3. Enter credentials
4. Should redirect to dashboard

## Automated Testing

Use Playwright test file: `tests/paid-signup.spec.ts`
Run with: `npm run test:lambdatest`

## Notes

- Email verification is required before login (if enabled in Supabase)
- User profile is auto-created on signup
- If profile creation fails, fallback user object is returned
- All errors are logged to console for debugging

