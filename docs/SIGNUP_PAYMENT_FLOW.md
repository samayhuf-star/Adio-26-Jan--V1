# Current Signup & Payment Flow

## 📋 Complete Flow Overview

### **Current Flow Structure:**

```
Homepage → Signup → Email Verification → Pricing Selection → Payment → Success → Dashboard
```

---

## 🔄 Detailed Flow Steps

### **1. Homepage (Initial Entry Point)**
- **File:** `src/components/HomePage.tsx`
- **Features:**
  - Hero section with "Start Building Campaigns Free" button
  - Pricing section with 4 plans:
    - **Lifetime Limited**: $99.99 (one-time)
    - **Lifetime Unlimited**: $199 (one-time)
    - **Monthly Limited**: $49.99/month
    - **Monthly Unlimited**: $99.99/month
  - User can click "Get Started" or select a plan directly

### **2. Authentication (Signup/Login)**
- **File:** `src/components/Auth.tsx`
- **Route:** `/auth` or triggered from homepage
- **Flow:**
  - **Signup Enabled:** `SIGNUP_DISABLED = false` (currently enabled)
  - User fills form:
    - Name (signup only)
    - Email
    - Password (min 6 characters)
    - Confirm Password (signup only)
  - **Signup Process:**
    1. Validates form (name, password length, password match)
    2. Checks if user already exists (localStorage)
    3. Creates new user in `adiology_users` localStorage array
    4. Generates verification token
    5. Stores pending verification in localStorage
    6. Redirects to email verification page
  - **Login Process:**
    1. Validates credentials against localStorage
    2. Sets `auth_user` in localStorage
    3. Redirects to dashboard

### **3. Email Verification**
- **File:** `src/components/EmailVerification.tsx`
- **Route:** `/verify-email?token=xxx&email=xxx`
- **Process:**
  - Validates verification token
  - Marks user as verified in localStorage
  - Sets user as logged in automatically
  - Shows success message
  - **Redirects to:** Homepage (scrolled to pricing section)

### **4. Pricing Selection**
- **Location:** Homepage pricing section (`#pricing`)
- **Plans Available:**
  1. **Lifetime Limited** - $99.99 (one-time)
     - 15 campaigns/month
  2. **Lifetime Unlimited** - $199 (one-time)
     - Unlimited campaigns
  3. **Monthly Limited** - $49.99/month
     - 25 campaigns/month
  4. **Monthly Unlimited** - $99.99/month
     - Unlimited campaigns
- **User Action:**
  - Clicks "Get Started" or plan button
  - If not logged in → redirects to signup
  - If logged in → proceeds to payment page

### **5. Payment Page**
- **File:** `src/components/PaymentPage.tsx`
- **Route:** `/payment?plan=xxx&priceId=xxx&amount=xxx&subscription=true/false`
- **Features:**
  - Stripe Elements integration
  - Card input form
  - Plan summary display
  - Test card info shown
- **Payment Methods:**
  1. **Stripe Payment Intent** (preferred - supports 3D Secure)
     - Tries to create payment intent via API
     - If successful, uses Stripe's card element
     - Handles 3D Secure authentication
  2. **Stripe Checkout** (fallback)
     - Redirects to Stripe Checkout page
- **On Success:**
  - Updates user subscription in localStorage
  - Sets plan, subscription status, billing date
  - Shows success notification
  - Redirects to payment success page

### **6. Payment Success**
- **File:** `src/components/PaymentSuccess.tsx`
- **Route:** `/payment-success?plan=xxx&amount=xxx&subscription=true/false`
- **Features:**
  - Success confirmation
  - Plan details display
  - "Go to Dashboard" button
- **Action:**
  - Updates localStorage with subscription info
  - Redirects to dashboard

### **7. Dashboard Access**
- User can now access all features based on their plan
- Plan restrictions enforced via `isPaidUser()` utility

---

## 🔐 Authentication & Data Storage

### **Storage Methods:**
1. **localStorage Keys:**
   - `auth_user` - Current logged-in user info
   - `adiology_users` - All registered users array
   - `pending_verification` - Email verification tokens
   - `pending_payment` - Payment attempt tracking

### **User Object Structure:**
```typescript
{
  email: string;
  password: string; // Stored in plain text (localStorage only)
  name: string;
  verified: boolean;
  verifiedAt?: string;
  plan?: string; // After payment
  subscriptionStatus?: 'active' | 'inactive';
  subscribedAt?: string;
  nextBillingDate?: string; // For subscriptions
  createdAt: string;
}
```

---

## 💳 Payment Integration

### **Stripe Integration:**
- **Publishable Key:** From `VITE_STRIPE_PUBLISHABLE_KEY` env var
- **Current Status:** Uses placeholder key (`pk_test_placeholder`)
- **Price IDs:**
  - `price_lifetime_limited`
  - `price_lifetime_unlimited`
  - `price_monthly_25`
  - `price_monthly_unlimited`

### **Payment Flow:**
1. User selects plan → Payment page
2. Payment page tries to create Payment Intent
3. If API unavailable, falls back to Stripe Checkout redirect
4. Card payment processed
5. Success → Updates localStorage → Shows success page

---

## ⚠️ Current Limitations & Notes

### **1. Authentication:**
- ✅ Signup is **ENABLED** (not disabled)
- ⚠️ Passwords stored in plain text (localStorage only - not production-ready)
- ⚠️ No password reset functionality (coming soon)
- ⚠️ Super admin route: `/superadmin` (separate login)

### **2. Email Verification:**
- ✅ Verification token system in place
- ⚠️ Email sending relies on API (`/email/send-verification`)
- ⚠️ If API unavailable, shows verification URL in console for testing
- ✅ Auto-verifies when token present in URL

### **3. Payment:**
- ✅ Stripe integration ready
- ⚠️ Uses placeholder Stripe key (needs actual key)
- ⚠️ Payment updates localStorage only (no backend sync)
- ⚠️ No webhook handling for subscription events
- ⚠️ No invoice generation
- ⚠️ No payment history tracking

### **4. Data Persistence:**
- ⚠️ All data stored in localStorage (not persistent across devices)
- ⚠️ No database integration for user accounts
- ⚠️ No Supabase Auth integration (using custom auth)

---

## 🎯 Flow Summary

### **Happy Path (New User):**
1. User visits homepage
2. Clicks "Get Started" → Goes to Auth page
3. Signs up with name, email, password
4. Redirected to email verification page
5. Verifies email (via link or manual verification)
6. Auto-logged in and redirected to homepage
7. Scrolls to pricing section
8. Selects a plan
9. Redirected to payment page
10. Enters card details
11. Payment processed
12. Redirected to success page
13. Goes to dashboard

### **Returning User:**
1. User visits homepage
2. Clicks "Sign In"
3. Enters email and password
4. Logged in → Goes to dashboard
5. Can access billing panel to manage subscription

### **Direct Plan Selection (Logged In):**
1. User on homepage
2. Clicks plan button in pricing section
3. Redirected directly to payment page
4. Completes payment
5. Success → Dashboard

---

## 🔧 Areas for Improvement

### **Recommended Enhancements:**
1. **Supabase Auth Integration:**
   - Replace localStorage auth with Supabase Auth
   - Proper password hashing
   - Password reset functionality
   - Email verification via Supabase

2. **Database Integration:**
   - Store users in Supabase database
   - Sync subscription status
   - Payment history tracking

3. **Stripe Webhooks:**
   - Handle subscription events
   - Update user status automatically
   - Invoice management

4. **Payment Backend:**
   - Create actual payment intent endpoint
   - Handle webhook events
   - Sync with database

---

## 📝 Quick Reference

**Key Files:**
- `src/components/Auth.tsx` - Signup/Login
- `src/components/EmailVerification.tsx` - Email verification
- `src/components/PaymentPage.tsx` - Payment processing
- `src/components/PaymentSuccess.tsx` - Success page
- `src/components/HomePage.tsx` - Pricing selection
- `src/App.tsx` - Flow routing
- `src/utils/stripe.ts` - Stripe utilities

**Routes:**
- `/` - Homepage
- `/auth` - Signup/Login
- `/verify-email?token=xxx&email=xxx` - Email verification
- `/payment?plan=xxx&priceId=xxx&amount=xxx` - Payment
- `/payment-success` - Success page

