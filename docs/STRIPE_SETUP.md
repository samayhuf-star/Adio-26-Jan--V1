# Stripe Payment Integration Setup

## Frontend Setup ✅

The frontend is now configured to use Stripe for payments. The following components have been updated:

1. **Signup Enabled**: Users can now create accounts (`src/components/Auth.tsx`)
2. **Stripe Integration**: Stripe Checkout and Customer Portal integrated (`src/components/BillingPanel.tsx`)
3. **Stripe Utilities**: Helper functions for Stripe operations (`src/utils/stripe.ts`)

## Backend Setup Required

To enable full payment functionality, you need to create backend API endpoints:

### 1. Create Checkout Session Endpoint

**Endpoint**: `POST /api/create-checkout-session`

**Request Body**:
```json
{
  "priceId": "price_lifetime_unlimited",
  "planName": "Lifetime Unlimited"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_..."
}
```

**Implementation Example** (Node.js/Express):
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, planName } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: priceId.includes('lifetime') ? 'payment' : 'subscription',
    success_url: `${req.headers.origin}/billing?success=true`,
    cancel_url: `${req.headers.origin}/billing?canceled=true`,
    customer_email: req.user.email, // Get from auth
    metadata: {
      planName,
      userId: req.user.id,
    },
  });
  
  res.json({ sessionId: session.id });
});
```

### 2. Create Customer Portal Session Endpoint

**Endpoint**: `POST /api/create-portal-session`

**Response**:
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Implementation Example**:
```javascript
app.post('/api/create-portal-session', async (req, res) => {
  const customerId = req.user.stripeCustomerId; // Get from database
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${req.headers.origin}/billing`,
  });
  
  res.json({ url: session.url });
});
```

### 3. Stripe Webhook Handler (Optional but Recommended)

**Endpoint**: `POST /api/webhooks/stripe`

Handle Stripe events:
- `checkout.session.completed` - Update user subscription status
- `customer.subscription.updated` - Update subscription details
- `customer.subscription.deleted` - Handle cancellations
- `invoice.payment_succeeded` - Record successful payments
- `invoice.payment_failed` - Handle failed payments

## Environment Variables

Add to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Stripe Price IDs

Update `src/utils/stripe.ts` with your actual Stripe Price IDs:

```typescript
export const PLAN_PRICE_IDS = {
  lifetime_limited: 'price_xxxxx', // Replace with actual Price ID
  lifetime_unlimited: 'price_xxxxx',
  monthly_25: 'price_xxxxx',
  monthly_unlimited: 'price_xxxxx',
};
```

## Testing

1. Use Stripe test mode keys
2. Use test card numbers: `4242 4242 4242 4242`
3. Use any future expiry date and any 3-digit CVC

## Next Steps

1. Create Stripe account and get API keys
2. Create Products and Prices in Stripe Dashboard
3. Update `PLAN_PRICE_IDS` in `src/utils/stripe.ts`
4. Implement backend endpoints
5. Set up webhook endpoint for subscription updates
6. Test the full payment flow

