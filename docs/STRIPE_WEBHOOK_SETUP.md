# Stripe Webhook Setup Guide

## Overview
This guide explains how to set up Stripe webhooks to handle payment events and update user data in your backend.

## Webhook Events to Handle

### 1. `payment_intent.succeeded`
**When:** Payment is successfully completed
**Action:** Update user plan in database

```javascript
// Example webhook handler
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  const customerEmail = paymentIntent.metadata.user_email;
  const planName = paymentIntent.metadata.plan_name;
  
  // Update user in database
  await updateUserPlan(customerEmail, {
    plan: planName,
    stripe_customer_id: paymentIntent.customer,
    subscription_status: 'active',
    subscribed_at: new Date(),
  });
}
```

### 2. `customer.subscription.created`
**When:** Subscription is created (monthly plans)
**Action:** Link subscription to user

```javascript
if (event.type === 'customer.subscription.created') {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = customer.email;
  
  // Update user subscription
  await updateUserSubscription(customerEmail, {
    stripe_subscription_id: subscription.id,
    subscription_status: 'active',
    next_billing_date: new Date(subscription.current_period_end * 1000),
  });
}
```

### 3. `customer.subscription.updated`
**When:** Subscription is modified (plan change, pause, etc.)
**Action:** Update subscription status

```javascript
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  const customer = await stripe.customers.retrieve(customerId);
  
  await updateUserSubscription(customer.email, {
    subscription_status: subscription.status,
    next_billing_date: new Date(subscription.current_period_end * 1000),
  });
}
```

### 4. `customer.subscription.deleted`
**When:** Subscription is cancelled
**Action:** Update user plan to Free

```javascript
if (event.type === 'customer.subscription.deleted') {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  const customer = await stripe.customers.retrieve(customerId);
  
  await updateUserPlan(customer.email, {
    plan: 'Free',
    subscription_status: 'cancelled',
    cancelled_at: new Date(),
  });
}
```

### 5. `invoice.paid`
**When:** Invoice is successfully paid
**Action:** Record invoice payment

```javascript
if (event.type === 'invoice.paid') {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  
  const customer = await stripe.customers.retrieve(customerId);
  
  // Record invoice in database
  await recordInvoice(customer.email, {
    invoice_id: invoice.id,
    amount: invoice.amount_paid / 100, // Convert from cents
    currency: invoice.currency,
    paid_at: new Date(invoice.status_transitions.paid_at * 1000),
  });
}
```

### 6. `invoice.payment_failed`
**When:** Invoice payment fails
**Action:** Notify user and update status

```javascript
if (event.type === 'invoice.payment_failed') {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  
  const customer = await stripe.customers.retrieve(customerId);
  
  // Update subscription status
  await updateUserSubscription(customer.email, {
    subscription_status: 'past_due',
  });
  
  // Send notification email
  await sendPaymentFailedEmail(customer.email);
}
```

## Webhook Endpoint Setup

### 1. Create Webhook Endpoint in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy webhook signing secret

### 2. Implement Webhook Handler

```javascript
// Example Express.js webhook handler
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({error: 'Webhook handler failed'});
  }
});

module.exports = router;
```

## Environment Variables Required

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (for updating user records)
DATABASE_URL=...
```

## Testing Webhooks Locally

### Using Stripe CLI
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Trigger test events: `stripe trigger payment_intent.succeeded`

### Using ngrok (for production-like testing)
1. Install ngrok: https://ngrok.com/
2. Start local server: `npm start`
3. Expose with ngrok: `ngrok http 3000`
4. Use ngrok URL in Stripe webhook endpoint: `https://xxxx.ngrok.io/api/webhooks/stripe`

## Verification Checklist

After setting up webhooks, verify:
- [ ] Webhook endpoint is accessible
- [ ] Webhook signature verification works
- [ ] Events are being received
- [ ] User plan is updated in database
- [ ] Subscription status is updated correctly
- [ ] Invoices are recorded
- [ ] Failed payments are handled
- [ ] Error logging is working

## Security Best Practices

1. **Always verify webhook signatures** - Prevents unauthorized requests
2. **Use HTTPS** - Webhook endpoints must be HTTPS in production
3. **Idempotency** - Handle duplicate events gracefully
4. **Error handling** - Log errors and retry failed operations
5. **Rate limiting** - Protect webhook endpoint from abuse

## Monitoring

Monitor webhook events in:
- Stripe Dashboard → Events: https://dashboard.stripe.com/test/events
- Your application logs
- Error tracking service (Sentry, etc.)

## Troubleshooting

### Webhook Not Receiving Events
- Check endpoint URL is correct
- Verify endpoint is accessible (HTTPS required)
- Check webhook signing secret matches
- Review Stripe Dashboard → Events for delivery status

### Signature Verification Fails
- Ensure raw body is used (not parsed JSON)
- Verify webhook secret is correct
- Check timestamp is within 5 minutes

### Events Not Processing
- Check application logs for errors
- Verify database connection
- Ensure event handlers are implemented
- Test with Stripe CLI locally

