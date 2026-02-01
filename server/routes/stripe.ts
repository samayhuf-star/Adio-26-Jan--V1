/**
 * Stripe API routes under /api/stripe
 * Frontend uses these paths: config, products, checkout, portal, subscription
 */

import { Hono } from 'hono';
import { getStripePublishableKey } from '../stripeClient';
import { stripeService } from '../stripeService';

const stripe = new Hono();

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getOrigin(c: { req: { url: string; header: (n: string) => string | undefined } }): string {
  const origin = c.req.header('Origin') || c.req.header('Referer');
  if (origin) {
    try {
      const u = new URL(origin);
      return u.origin;
    } catch {}
  }
  try {
    const u = new URL(c.req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'https://www.adiology.online';
  }
}

/** GET /api/stripe/config – { publishableKey } */
stripe.get('/config', async (c) => {
  try {
    const publishableKey = await getStripePublishableKey();
    return c.json({ publishableKey: publishableKey ?? null });
  } catch (error) {
    console.error('[Stripe] Config error:', error);
    return c.json({ publishableKey: null }, 200);
  }
});

/** GET /api/stripe/products – { products } */
stripe.get('/products', async (c) => {
  try {
    const products = await stripeService.listProductsWithPrices(true, 50, 0);
    
    const formattedProducts = products.map((product: any) => ({
      id: product.product_id,
      name: product.product_name,
      description: product.product_description,
      active: product.product_active,
      metadata: product.product_metadata,
      prices: product.prices?.map((price: any) => ({
        id: price.price_id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        active: price.price_active,
        metadata: price.price_metadata
      })) || []
    }));
    
    return c.json({ products: formattedProducts });
  } catch (error) {
    console.error('[Stripe] Products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

/** Resolve Stripe customer ID from email; create customer if needed and persist to users. */
async function resolveCustomerId(email: string, userId?: string): Promise<{ customerId: string; userId: string } | null> {
  const user = await stripeService.getUserByEmail(email);
  const uid = userId || (user?.id as string) || `email-${email}`;

  if (user?.stripe_customer_id) {
    return { customerId: user.stripe_customer_id, userId: user.id };
  }

  try {
    const customer = await stripeService.createCustomer(email, uid);
    if (user) {
      await stripeService.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
    }
    return { customerId: customer.id, userId: user?.id ?? uid };
  } catch (e) {
    console.error('[Stripe] resolveCustomerId:', e);
    return null;
  }
}

/** POST /api/stripe/checkout – { priceId, email, userId?, planName? } → { sessionId, url } */
stripe.post('/checkout', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { priceId, email, userId } = body as { priceId?: string; email?: string; userId?: string; planName?: string };

    if (!priceId || !email) {
      return c.json({ error: 'Missing required fields: priceId, email' }, 400);
    }

    const resolved = await resolveCustomerId(email, userId);
    if (!resolved) {
      return c.json({ error: 'Could not resolve or create Stripe customer' }, 500);
    }

    const base = getOrigin(c);
    const successUrl = (body.successUrl as string) || `${base}/billing`;
    const cancelUrl = (body.cancelUrl as string) || `${base}/billing`;
    const mode = ((body.mode as string) || 'subscription') as 'subscription' | 'payment';

    const session = await stripeService.createCheckoutSession(
      resolved.customerId,
      priceId,
      successUrl,
      cancelUrl,
      mode
    );

    return c.json({ sessionId: session.id, url: session.url ?? null });
  } catch (error: any) {
    console.error('[Stripe] Checkout error:', error);
    return c.json({ error: error?.message || 'Failed to create checkout session' }, 500);
  }
});

/** POST /api/stripe/portal – { email, returnUrl? } → { url } */
stripe.post('/portal', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = (body.email as string)?.trim();
    if (!email) {
      return c.json({ error: 'Missing required field: email' }, 400);
    }

    const resolved = await resolveCustomerId(email);
    if (!resolved) {
      return c.json({ error: 'Could not resolve Stripe customer for this email' }, 500);
    }

    const base = getOrigin(c);
    const returnUrl = (body.returnUrl as string) || `${base}/billing`;

    const session = await stripeService.createCustomerPortalSession(resolved.customerId, returnUrl);
    return c.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe] Portal error:', error);
    return c.json({ error: error?.message || 'Failed to create portal session' }, 500);
  }
});

/** GET /api/stripe/subscription (Bearer) or GET /api/stripe/subscription/:email – { plan } */
stripe.get('/subscription', async (c) => {
  return subscriptionHandler(c, null);
});

stripe.get('/subscription/:email', async (c) => {
  const email = decodeURIComponent(c.req.param('email') || '');
  return subscriptionHandler(c, email);
});

async function subscriptionHandler(c: any, emailFromParam: string | null) {
  try {
    let email = emailFromParam?.trim() || null;

    if (!email) {
      const auth = c.req.header('Authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token) {
        const payload = decodeJwtPayload(token);
        email = (payload?.email as string) || null;
      }
    }

    if (!email) {
      return c.json({ error: 'Missing email (or valid Bearer token with email claim)' }, 401);
    }

    const user = await stripeService.getUserByEmail(email);
    const plan = user?.subscription_plan ?? 'free';
    return c.json({ plan });
  } catch (error) {
    console.error('[Stripe] Subscription error:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
}

export { stripe as stripeRoutes };
