# Stripe Backend Verification Guide

## Overview
This document outlines how to verify that Stripe backend integration is working correctly after a payment is processed.

## Prerequisites
- Access to Stripe Dashboard (https://dashboard.stripe.com)
- Test mode enabled for testing, Live mode for production
- Stripe API keys configured

## Verification Checklist

### 1. Customer Created ✅
**Location:** Stripe Dashboard → Customers

**What to Check:**
- Customer exists with correct email address
- Customer ID is generated (e.g., `cus_xxxxx`)
- Customer created timestamp matches payment time
- Customer metadata contains:
  - `user_id` or `user_email`
  - `plan_name`
  - `app_source: adiology`

**Expected Result:**
```
Customer: john.doe@example.com
Customer ID: cus_ABC123XYZ
Created: [Payment timestamp]
Metadata:
  - user_email: john.doe@example.com
  - plan_name: Lifetime Unlimited
  - app_source: adiology
```

### 2. Subscription Started ✅
**Location:** Stripe Dashboard → Subscriptions (for monthly plans)

**What to Check:**
- Subscription exists for monthly plans only
- Subscription status = "active"
- Subscription start date matches payment time
- Subscription linked to correct customer
- Subscription linked to correct price/product

**Expected Result:**
```
Subscription ID: sub_ABC123XYZ
Status: active
Customer: cus_ABC123XYZ
Price: price_monthly_unlimited ($99.99/month)
Start Date: [Payment timestamp]
Current Period End: [Next billing date]
```

**Note:** Lifetime plans do NOT create subscriptions (one-time payment)

### 3. Payment Intent / Charge Created ✅
**Location:** Stripe Dashboard → Payments

**What to Check:**
- Payment exists with correct amount
- Payment status = "succeeded"
- Payment method (card) is saved
- Payment linked to correct customer
- Payment metadata contains:
  - `plan_name`
  - `user_email`
  - `is_subscription: true/false`

**Expected Result:**
```
Payment ID: pi_ABC123XYZ
Amount: $199.00 (or plan amount)
Status: succeeded
Customer: cus_ABC123XYZ
Payment Method: card_xxxxx
Metadata:
  - plan_name: Lifetime Unlimited
  - user_email: john.doe@example.com
  - is_subscription: false
```

### 4. Invoice Generated ✅
**Location:** Stripe Dashboard → Invoices

**What to Check:**
- Invoice exists for the payment
- Invoice status = "paid"
- Invoice amount matches plan price
- Invoice linked to correct customer
- Invoice contains line items:
  - Plan name
  - Amount
  - Tax (if applicable)

**Expected Result:**
```
Invoice ID: in_ABC123XYZ
Status: paid
Amount: $199.00
Customer: cus_ABC123XYZ
Line Items:
  - Lifetime Unlimited Plan: $199.00
Paid: [Payment timestamp]
```

### 5. Metadata Verification ✅
**Location:** Customer, Subscription, Payment, Invoice → Metadata section

**What to Check:**
- `user_email`: Matches user's email from signup
- `plan_name`: Matches selected plan (e.g., "Lifetime Unlimited")
- `user_id`: Optional - internal user ID if available
- `app_source`: "adiology" (for tracking)

**Expected Metadata:**
```json
{
  "user_email": "john.doe@example.com",
  "plan_name": "Lifetime Unlimited",
  "user_id": "user_12345",
  "app_source": "adiology"
}
```

### 6. Plan/SKU Verification ✅
**Location:** Stripe Dashboard → Products → [Plan Name]

**What to Check:**
- Product exists with correct name
- Price ID matches `PLAN_PRICE_IDS` in code:
  - `price_lifetime_limited` → $99.99
  - `price_lifetime_unlimited` → $199.00
  - `price_monthly_25` → $49.99/month
  - `price_monthly_unlimited` → $99.99/month
- Price amount matches plan pricing
- Price type: "one_time" for lifetime, "recurring" for monthly

**Expected Products:**
```
Product: Lifetime Limited Plan
Price ID: price_lifetime_limited
Amount: $99.99
Type: one_time

Product: Lifetime Unlimited Plan
Price ID: price_lifetime_unlimited
Amount: $199.00
Type: one_time

Product: Monthly Limited Plan
Price ID: price_monthly_25
Amount: $49.99
Type: recurring (monthly)

Product: Monthly Unlimited Plan
Price ID: price_monthly_unlimited
Amount: $99.99
Type: recurring (monthly)
```

## Backend Implementation Requirements

### Current Status
The frontend currently uses client-side Stripe integration. For production, you need:

### 1. Backend API Endpoints Required

#### Create Payment Intent
```
POST /api/create-payment-intent
Body: {
  priceId: string,
  planName: string,
  amount: number,
  isSubscription: boolean,
  customerEmail: string
}
Response: {
  clientSecret: string,
  customerId: string
}
```

#### Create Checkout Session
```
POST /api/create-checkout-session
Body: {
  priceId: string,
  planName: string,
  customerEmail: string
}
Response: {
  sessionId: string,
  url: string
}
```

#### Create Customer Portal Session
```
POST /api/create-portal-session
Body: {
  customerEmail: string,
  returnUrl: string
}
Response: {
  url: string
}
```

### 2. Stripe Webhook Handler Required

```
POST /api/webhooks/stripe
```

**Events to Handle:**
- `payment_intent.succeeded` - Update user plan in database
- `customer.subscription.created` - Link subscription to user
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.paid` - Record invoice payment
- `invoice.payment_failed` - Handle failed payment

**Webhook Actions:**
1. Verify webhook signature
2. Extract customer email from event
3. Update user plan in database
4. Update subscription status
5. Send confirmation email (optional)

### 3. Database Updates Required

When payment succeeds, backend should:
1. Find user by email
2. Update user record:
   - `plan`: Plan name
   - `stripe_customer_id`: Customer ID
   - `stripe_subscription_id`: Subscription ID (if monthly)
   - `subscription_status`: "active"
   - `subscribed_at`: Timestamp
   - `next_billing_date`: Next billing date (if monthly)

## Testing Steps

### Test Payment Flow
1. User selects a plan on homepage
2. User completes payment with test card: `4242 4242 4242 4242`
3. Payment succeeds
4. Verify in Stripe Dashboard:
   - ✅ Customer created
   - ✅ Payment succeeded
   - ✅ Invoice generated
   - ✅ Metadata correct
   - ✅ Plan/SKU correct

### Test Monthly Subscription
1. User selects monthly plan
2. User completes payment
3. Verify in Stripe Dashboard:
   - ✅ Customer created
   - ✅ Subscription created and active
   - ✅ Payment succeeded
   - ✅ Invoice generated
   - ✅ Next billing date set correctly

### Test Lifetime Plan
1. User selects lifetime plan
2. User completes payment
3. Verify in Stripe Dashboard:
   - ✅ Customer created
   - ✅ Payment succeeded (one-time)
   - ✅ NO subscription created
   - ✅ Invoice generated
   - ✅ Metadata indicates `is_subscription: false`

## Stripe Dashboard Quick Links

- **Customers:** https://dashboard.stripe.com/test/customers
- **Subscriptions:** https://dashboard.stripe.com/test/subscriptions
- **Payments:** https://dashboard.stripe.com/test/payments
- **Invoices:** https://dashboard.stripe.com/test/invoices
- **Products:** https://dashboard.stripe.com/test/products
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Events:** https://dashboard.stripe.com/test/events

## Troubleshooting

### Customer Not Created
- Check if backend API is receiving payment intent request
- Verify Stripe API key is correct
- Check backend logs for errors

### Subscription Not Created (Monthly Plans)
- Verify `isSubscription: true` is passed to backend
- Check if price ID is for recurring product
- Verify webhook is handling `payment_intent.succeeded`

### Metadata Missing
- Ensure backend is adding metadata when creating payment intent
- Check webhook handler is preserving metadata
- Verify metadata is included in customer creation

### Invoice Not Generated
- Invoices are auto-generated for subscriptions
- For one-time payments, verify payment succeeded
- Check invoice settings in Stripe Dashboard

## Production Checklist

Before going live:
- [ ] Switch Stripe API keys to live mode
- [ ] Create products/prices in live mode
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Test webhook signature verification
- [ ] Set up error monitoring for webhook failures
- [ ] Configure email notifications for failed payments
- [ ] Set up subscription renewal reminders
- [ ] Test customer portal access
- [ ] Verify all metadata is being stored correctly

