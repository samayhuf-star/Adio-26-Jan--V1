# Stripe Payment System Setup Guide

This guide explains how to set up the live payment system for Adiology Campaign Dashboard.

## Prerequisites

1. Stripe Account (https://stripe.com)
2. Supabase Project with Edge Functions enabled
3. Environment variables configured

## Step 1: Create Stripe Products and Prices

1. Log in to your Stripe Dashboard
2. Go to Products → Add Product
3. Create the following products with prices:

### Lifetime Limited - $99.99 (One-time payment)
- Product Name: "Lifetime Limited"
- Price: $99.99
- Billing: One time
- Copy the Price ID (starts with `price_`)

### Lifetime Unlimited - $199 (One-time payment)
- Product Name: "Lifetime Unlimited"
- Price: $199
- Billing: One time
- Copy the Price ID

### Monthly Limited - $49.99/month (Recurring)
- Product Name: "Monthly Limited"
- Price: $49.99
- Billing: Recurring (monthly)
- Copy the Price ID

### Monthly Unlimited - $99.99/month (Recurring)
- Product Name: "Monthly Unlimited"
- Price: $99.99
- Billing: Recurring (monthly)
- Copy the Price ID

## Step 2: Update Price IDs

Update `src/utils/stripe.ts` with your actual Stripe Price IDs:

```typescript
export const PLAN_PRICE_IDS = {
  lifetime_limited: 'price_YOUR_PRICE_ID_HERE', // $99.99 one-time
  lifetime_unlimited: 'price_YOUR_PRICE_ID_HERE', // $199 one-time
  monthly_25: 'price_YOUR_PRICE_ID_HERE', // $49.99/month
  monthly_unlimited: 'price_YOUR_PRICE_ID_HERE', // $99.99/month
};
```

## Step 3: Configure Environment Variables

### Frontend (.env or Vercel)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-anon-key
SITE_URL=https://your-domain.com (for production)
```

### Supabase Edge Functions (Supabase Dashboard → Settings → Edge Functions → Secrets)
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook settings)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SITE_URL=https://your-domain.com
```

## Step 4: Deploy Supabase Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the functions:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## Step 5: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

## Step 6: Run Database Migration

Run the migration to add Stripe support:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Run the contents of: supabase/migrations/add_stripe_support.sql
```

## Step 7: Test the Payment Flow

1. **Test Mode**: Use Stripe test cards
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

2. **Test Flow**:
   - Sign up for a new account
   - Go to Billing page
   - Select a plan
   - Complete checkout with test card
   - Verify subscription appears in BillingPanel
   - Check Stripe Dashboard for payment

## Step 8: Go Live

1. Switch to Stripe Live mode
2. Update environment variables with live keys
3. Redeploy edge functions
4. Update webhook endpoint to use live mode
5. Test with a real card (small amount)

## User Flow

1. **Signup**: User creates account
2. **Email Verification**: User verifies email (optional for payment)
3. **Plan Selection**: User goes to Billing page
4. **Checkout**: User selects plan and is redirected to Stripe Checkout
5. **Payment**: User enters card details and completes payment
6. **Webhook**: Stripe sends webhook, subscription is created in database
7. **Access**: User gains access to paid features

## Troubleshooting

### Checkout not working
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Verify edge function is deployed and accessible

### Webhook not receiving events
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Stripe webhook logs for delivery status

### Subscription not appearing
- Check webhook is receiving events
- Verify database migration ran successfully
- Check Supabase Edge Function logs

## Support

For issues, check:
- Stripe Dashboard → Logs
- Supabase Dashboard → Edge Functions → Logs
- Browser Console
- Network tab for API calls

