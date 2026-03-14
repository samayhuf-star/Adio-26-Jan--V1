/**
 * Stripe API routes under /api/stripe
 * Frontend uses these paths: config, products, checkout, portal, subscription
 */

import { Hono } from 'hono';
import crypto from 'crypto';
import { getStripePublishableKey, getUncachableStripeClient } from '../stripeClient';
import { stripeService } from '../stripeService';
import { getDatabaseUrl } from '../dbConfig';
import { EmailService } from '../emailService';
import pg from 'pg';
import { logUserEvent } from '../services/userEventLogger';

const { Pool: StripePool } = pg;
const stripePool = new StripePool({ connectionString: getDatabaseUrl() });

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

const ALLOWED_ORIGINS = [
  'adiology.io',
  'adiology.online',
  'www.adiology.io',
  'www.adiology.online',
  'replit.dev',
  'replit.app',
];

function isAllowedOrigin(hostname: string): boolean {
  return ALLOWED_ORIGINS.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed));
}

function getOrigin(c: { req: { url: string; header: (n: string) => string | undefined } }): string {
  const origin = c.req.header('Origin') || c.req.header('Referer');
  if (origin) {
    try {
      const u = new URL(origin);
      if (isAllowedOrigin(u.hostname)) {
        return u.origin;
      }
    } catch {}
  }
  try {
    const u = new URL(c.req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return process.env.DOMAIN || 'https://www.adiology.online';
  }
}

function sanitizeRedirectUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    if (isAllowedOrigin(u.hostname)) {
      return url;
    }
  } catch {}
  return fallback;
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

/** POST /api/stripe/create-promo-code – admin-only: creates a 100% off promo code */
stripe.post('/create-promo-code', async (c) => {
  try {
    const adminKey = c.req.header('x-admin-key');
    const expectedKey = process.env.ADMIN_API_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const code = (body.code as string)?.trim().toUpperCase() || 'ADIOLOGY100';
    const maxRedemptions = body.maxRedemptions ? Number(body.maxRedemptions) : 5;

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Payment system is not configured.' }, 503);
    }

    const coupon = await stripeClient.coupons.create({
      percent_off: 100,
      duration: 'forever',
      name: `100% Off - ${code}`,
      metadata: { created_by: 'admin', purpose: 'testing' },
    });

    const promoParams: any = {
      coupon: coupon.id,
      code,
    };
    if (maxRedemptions) {
      promoParams.max_redemptions = maxRedemptions;
    }

    const promoCode = await stripeClient.promotionCodes.create(promoParams);

    return c.json({
      success: true,
      couponId: coupon.id,
      promoCodeId: promoCode.id,
      code: promoCode.code,
      percentOff: 100,
      duration: 'forever',
      maxRedemptions: maxRedemptions || 'unlimited',
    });
  } catch (error: any) {
    console.error('[Stripe] Create promo code error:', error);
    return c.json({ error: error?.message || 'Failed to create promo code' }, 500);
  }
});

/** POST /api/stripe/lifetime-deal – { email } → { url } — creates a $99 one-time checkout */
stripe.post('/lifetime-deal', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = (body.email as string)?.trim();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    try {
      const existingUser = await stripePool.query(
        `SELECT id, subscription_plan, subscription_status, password_hash IS NOT NULL as has_password 
         FROM users WHERE LOWER(email) = LOWER($1)`,
        [email]
      );
      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        if (user.subscription_plan === 'Lifetime' && user.subscription_status === 'active') {
          return c.json({ error: 'This email already has a Lifetime plan. Please log in instead.' }, 409);
        }
      }
    } catch (checkErr: any) {
      console.error('[Stripe] Duplicate email check error (non-fatal):', checkErr?.message);
    }

    const resolved = await resolveCustomerId(email);
    if (!resolved) {
      return c.json({ error: 'Could not resolve or create Stripe customer' }, 500);
    }

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Payment system is not configured. Please try again later.' }, 503);
    }
    const base = getOrigin(c);

    const promoCode = (body.promoCode as string)?.trim();
    let discounts: any[] | undefined;
    let allowPromoCodes = true;

    if (promoCode) {
      try {
        const promos = await stripeClient.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
        if (promos.data.length > 0) {
          discounts = [{ promotion_code: promos.data[0].id }];
          allowPromoCodes = false;
        }
      } catch (promoErr: any) {
        console.error('[Stripe] Promo code lookup failed (non-fatal):', promoErr?.message);
      }
    }

    const sessionParams: any = {
      customer: resolved.customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 9900,
            product_data: {
              name: 'Adiology Lifetime Deal',
              description: 'Lifetime access to all Adiology features. Pay once, use forever.',
            },
          },
          quantity: 1,
        },
      ],
      success_url: sanitizeRedirectUrl(body.successUrl as string, `${base}/lifetime-deal?success=true`),
      cancel_url: sanitizeRedirectUrl(body.cancelUrl as string, `${base}/lifetime-deal`),
      metadata: {
        plan: 'lifetime',
        deal: 'lifetime-99',
      },
    };

    if (discounts) {
      sessionParams.discounts = discounts;
    } else {
      sessionParams.allow_promotion_codes = allowPromoCodes;
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    return c.json({ url: session.url ?? null });
  } catch (error: any) {
    console.error('[Stripe] Lifetime deal checkout error:', error);
    return c.json({ error: error?.message || 'Failed to create checkout session' }, 500);
  }
});

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
    const successUrl = sanitizeRedirectUrl(body.successUrl as string, `${base}/billing`);
    const cancelUrl = sanitizeRedirectUrl(body.cancelUrl as string, `${base}/billing`);
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
    const returnUrl = sanitizeRedirectUrl(body.returnUrl as string, `${base}/billing`);

    const session = await stripeService.createCustomerPortalSession(resolved.customerId, returnUrl);
    return c.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe] Portal error:', error);
    return c.json({ error: error?.message || 'Failed to create portal session' }, 500);
  }
});

/** POST /api/stripe/upgrade-subscription – { email, newPriceId, newPlanName } → { success, subscription } */
stripe.post('/upgrade-subscription', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, newPriceId, newPlanName } = body as { email?: string; newPriceId?: string; newPlanName?: string };

    if (!email || !newPriceId) {
      return c.json({ error: 'Missing required fields: email, newPriceId' }, 400);
    }

    const resolved = await resolveCustomerId(email);
    if (!resolved) {
      return c.json({ error: 'Could not resolve Stripe customer' }, 500);
    }

    try {
      const updatedSubscription = await stripeService.upgradeSubscription(resolved.customerId, newPriceId);

      if (resolved.userId && newPlanName) {
        await stripeService.updateUserStripeInfo(resolved.userId, {
          subscriptionPlan: newPlanName.toLowerCase(),
          stripeSubscriptionId: updatedSubscription.id,
        });
      }

      return c.json({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          currentPeriodEnd: updatedSubscription.current_period_end,
        },
      });
    } catch (upgradeError: any) {
      if (upgradeError.message === 'NO_ACTIVE_SUBSCRIPTION') {
        return c.json({ error: 'NO_ACTIVE_SUBSCRIPTION' }, 404);
      }
      throw upgradeError;
    }
  } catch (error: any) {
    console.error('[Stripe] Upgrade subscription error:', error);
    return c.json({ error: error?.message || 'Failed to upgrade subscription' }, 500);
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

function getAuthEmail(c: any): string | null {
  const auth = c.req.header('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return (payload?.email as string) || null;
}

/** GET /api/stripe/payment-methods/:email – list saved payment methods */
stripe.get('/payment-methods/:email', async (c) => {
  try {
    const email = decodeURIComponent(c.req.param('email') || '');
    if (!email) return c.json({ error: 'Email required' }, 400);

    const authEmail = getAuthEmail(c);
    if (!authEmail || authEmail.toLowerCase() !== email.toLowerCase()) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await stripeService.getUserByEmail(email);
    if (!user?.stripe_customer_id) return c.json({ paymentMethods: [] });

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) return c.json({ paymentMethods: [] });

    const methods = await stripeClient.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card',
    });

    const customer = await stripeClient.customers.retrieve(user.stripe_customer_id);
    const defaultPmId = (customer as any).invoice_settings?.default_payment_method;

    const paymentMethods = methods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month?.toString().padStart(2, '0') || '',
      expYear: pm.card?.exp_year?.toString().slice(-2) || '',
      isDefault: pm.id === defaultPmId,
    }));

    return c.json({ paymentMethods });
  } catch (error) {
    console.error('[Stripe] Payment methods error:', error);
    return c.json({ paymentMethods: [] });
  }
});

/** POST /api/stripe/setup-intent – create a SetupIntent for securely collecting card details */
stripe.post('/setup-intent', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = (body.email as string)?.trim();
    if (!email) return c.json({ error: 'Missing required field: email' }, 400);

    const authEmail = getAuthEmail(c);
    if (!authEmail || authEmail.toLowerCase() !== email.toLowerCase()) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const resolved = await resolveCustomerId(email);
    if (!resolved) return c.json({ error: 'Could not resolve Stripe customer' }, 500);

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) return c.json({ error: 'Stripe not configured' }, 500);

    const setupIntent = await stripeClient.setupIntents.create({
      customer: resolved.customerId,
      payment_method_types: ['card'],
    });

    return c.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error('[Stripe] SetupIntent error:', error);
    return c.json({ error: error?.message || 'Failed to create setup intent' }, 500);
  }
});

/** DELETE /api/stripe/payment-methods/:paymentMethodId – detach a payment method */
stripe.delete('/payment-methods/:paymentMethodId', async (c) => {
  try {
    const paymentMethodId = c.req.param('paymentMethodId') || '';
    if (!paymentMethodId) return c.json({ error: 'Payment method ID required' }, 400);

    const authEmail = getAuthEmail(c);
    if (!authEmail) return c.json({ error: 'Unauthorized' }, 401);

    const user = await stripeService.getUserByEmail(authEmail);
    if (!user?.stripe_customer_id) return c.json({ error: 'No Stripe customer found' }, 404);

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) return c.json({ error: 'Stripe not configured' }, 500);

    const pm = await stripeClient.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== user.stripe_customer_id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await stripeClient.paymentMethods.detach(paymentMethodId);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Stripe] Detach payment method error:', error);
    return c.json({ error: error?.message || 'Failed to remove payment method' }, 500);
  }
});

/** POST /api/stripe/create-trial – validate card and create trial subscription */
stripe.post('/create-trial', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, planName, paymentMethodId, couponCode } = body as { email?: string; planName?: string; paymentMethodId?: string; couponCode?: string };

    console.log(`[Stripe] create-trial request: email=${email}, plan=${planName}, pmId=${paymentMethodId?.slice(0, 10)}..., coupon=${couponCode || 'none'}`);

    if (!email || !planName || !paymentMethodId) {
      return c.json({ error: 'Missing required fields: email, planName, paymentMethodId' }, 400);
    }

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      console.error('[Stripe] Stripe client not available');
      return c.json({ error: 'Payment system is temporarily unavailable. Please try again later.' }, 500);
    }

    const resolved = await resolveCustomerId(email);
    if (!resolved) {
      console.error('[Stripe] Could not resolve customer for email:', email);
      return c.json({ error: 'Could not set up your payment profile. Please try again.' }, 500);
    }

    const { customerId, userId } = resolved;
    console.log(`[Stripe] Resolved customer: ${customerId}, userId: ${userId}`);

    try {
      await stripeClient.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (attachErr: any) {
      if (attachErr?.code !== 'resource_already_exists') {
        console.error('[Stripe] Failed to attach payment method:', attachErr);
        return c.json({ error: attachErr?.message || 'Failed to attach your card. Please try again.' }, 400);
      }
    }

    await stripeClient.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    try {
      const authIntent = await stripeClient.paymentIntents.create({
        amount: 100,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: 'manual',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });

      console.log(`[Stripe] Auth intent status: ${authIntent.status}`);

      if (authIntent.status !== 'requires_capture' && authIntent.status !== 'succeeded') {
        return c.json({ error: 'Card validation failed. Please check your card details and try again.' }, 400);
      }

      await stripeClient.paymentIntents.cancel(authIntent.id);
      console.log(`[Stripe] Auth intent cancelled (hold released)`);
    } catch (authError: any) {
      console.error('[Stripe] Card auth failed:', authError?.message);
      return c.json({ error: authError?.message || 'Card validation failed. Please check your card details and try again.' }, 400);
    }

    const products = await stripeClient.products.list({ active: true, limit: 100 });
    let priceId: string | null = null;
    const normalizedPlan = planName.toLowerCase().trim();

    console.log(`[Stripe] Searching for plan "${normalizedPlan}" among ${products.data.length} products`);

    for (const product of products.data) {
      const productNameLower = product.name.toLowerCase();
      const metaPlan = product.metadata?.plan_name?.toLowerCase();
      const nameMatch = productNameLower.includes(normalizedPlan) ||
        normalizedPlan.includes(productNameLower) ||
        metaPlan === normalizedPlan;

      if (nameMatch) {
        console.log(`[Stripe] Matched product: "${product.name}" (${product.id})`);
        const prices = await stripeClient.prices.list({ product: product.id, active: true, limit: 10 });
        if (prices.data.length > 0) {
          const recurringPrice = prices.data.find(p => p.recurring) || prices.data[0];
          priceId = recurringPrice.id;
          break;
        }
      }
    }

    if (!priceId) {
      const allPrices = await stripeClient.prices.list({ active: true, limit: 100 });
      for (const price of allPrices.data) {
        if (price.recurring && price.nickname?.toLowerCase().includes(normalizedPlan)) {
          priceId = price.id;
          console.log(`[Stripe] Found price by nickname: "${price.nickname}" (${price.id})`);
          break;
        }
      }
    }

    if (!priceId) {
      console.error(`[Stripe] No price found for plan "${planName}". Available products: ${products.data.map(p => p.name).join(', ')}`);
      return c.json({ error: `No matching pricing plan found for "${planName}". Please contact support.` }, 400);
    }

    const subscriptionParams: any = {
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 7,
      default_payment_method: paymentMethodId,
    };

    if (couponCode) {
      try {
        const promotionCodes = await stripeClient.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
        if (promotionCodes.data.length > 0) {
          subscriptionParams.promotion_code = promotionCodes.data[0].id;
          console.log(`[Stripe] Applied promotion code: ${couponCode}`);
        } else {
          const coupon = await stripeClient.coupons.retrieve(couponCode).catch(() => null);
          if (coupon && coupon.valid) {
            subscriptionParams.coupon = coupon.id;
            console.log(`[Stripe] Applied coupon: ${couponCode}`);
          } else {
            console.warn(`[Stripe] Coupon/promo code "${couponCode}" not found or invalid, proceeding without discount`);
          }
        }
      } catch (couponErr: any) {
        console.warn(`[Stripe] Error applying coupon "${couponCode}":`, couponErr?.message);
      }
    }

    const subscription = await stripeClient.subscriptions.create(subscriptionParams);

    console.log(`[Stripe] Subscription created: ${subscription.id}, status: ${subscription.status}`);

    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    const updateResult = await stripePool.query(
      `UPDATE users SET 
        card_validated = true,
        selected_plan = $1,
        stripe_customer_id = $2,
        stripe_subscription_id = $3,
        subscription_plan = $1,
        subscription_status = 'trialing',
        updated_at = NOW()
      WHERE id = $4 OR LOWER(email) = LOWER($5)`,
      [planName, customerId, subscription.id, userId, email]
    );

    console.log(`[Stripe] Users table updated: ${updateResult.rowCount} rows for userId=${userId}, email=${email}`);

    if (updateResult.rowCount === 0) {
      console.warn(`[Stripe] WARNING: No user row updated! userId=${userId}, email=${email}. Attempting insert fallback.`);
    }

    try {
      await stripePool.query(
        `INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan_name, status, trial_start, trial_end, current_period_start, current_period_end, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'trialing', NOW(), $6, NOW(), $6, NOW(), NOW())
         ON CONFLICT (stripe_subscription_id) DO UPDATE SET
           status = 'trialing',
           trial_start = NOW(),
           trial_end = $6,
           updated_at = NOW()`,
        [userId, customerId, subscription.id, priceId, planName, trialEnd]
      );
    } catch (subInsertErr: any) {
      console.error('[Stripe] Subscription record insert failed (non-fatal):', subInsertErr?.message);
    }

    await logUserEvent(userId, 'card_validated', 'Card validated', `Credit card validated for trial`, { email, planName });
    await logUserEvent(userId, 'trial_started', 'Trial started', `7-day trial started for ${planName}`, { email, planName, subscriptionId: subscription.id });
    await logUserEvent(userId, 'subscription_created', 'Subscription created', `Trial subscription created for ${planName}`, { email, planName, subscriptionId: subscription.id, status: 'trialing' });

    console.log(`[Stripe] Trial subscription created for ${email}, plan: ${planName}, sub: ${subscription.id}`);

    return c.json({
      success: true,
      subscriptionId: subscription.id,
      trialEnd: trialEnd?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('[Stripe] Create trial error:', error?.message, error?.stack);
    return c.json({ error: error?.message || 'Failed to create trial subscription. Please try again.' }, 500);
  }
});

/** POST /api/stripe/check-trial-status – check trial/subscription status for authenticated user */
stripe.post('/check-trial-status', async (c) => {
  try {
    const email = getAuthEmail(c);
    if (!email) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const result = await stripePool.query(
      'SELECT email_verified, card_validated, subscription_plan, subscription_status, stripe_subscription_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = result.rows[0];
    let trialEnd: string | null = null;

    if (user.stripe_subscription_id) {
      try {
        const stripeClient = await getUncachableStripeClient();
        if (stripeClient) {
          const sub = await stripeClient.subscriptions.retrieve(user.stripe_subscription_id);
          if (sub.trial_end) {
            trialEnd = new Date(sub.trial_end * 1000).toISOString();
          }
        }
      } catch (subError) {
        console.error('[Stripe] Error fetching subscription for trial status:', subError);
      }
    }

    return c.json({
      cardValidated: user.card_validated || false,
      emailVerified: user.email_verified || false,
      subscriptionPlan: user.subscription_plan || 'free',
      subscriptionStatus: user.subscription_status || 'inactive',
      trialEnd,
    });
  } catch (error: any) {
    console.error('[Stripe] Check trial status error:', error);
    return c.json({ error: error?.message || 'Failed to check trial status' }, 500);
  }
});

/** POST /api/stripe/validate-coupon – validate a coupon/promo code */
stripe.post('/validate-coupon', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { code } = body as { code?: string };

    if (!code || !code.trim()) {
      return c.json({ valid: false, error: 'Please enter a coupon code' }, 400);
    }

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ valid: false, error: 'Payment system is temporarily unavailable' }, 500);
    }

    const promotionCodes = await stripeClient.promotionCodes.list({ code: code.trim(), active: true, limit: 1 });
    if (promotionCodes.data.length > 0) {
      const promo = promotionCodes.data[0];
      const couponData = (promo as any).coupon;
      return c.json({
        valid: true,
        discount: couponData.percent_off
          ? { type: 'percent', value: couponData.percent_off }
          : { type: 'amount', value: (couponData.amount_off || 0) / 100, currency: couponData.currency || 'usd' },
        name: couponData.name || code.trim(),
      });
    }

    try {
      const coupon = await stripeClient.coupons.retrieve(code.trim());
      if (coupon && coupon.valid) {
        return c.json({
          valid: true,
          discount: coupon.percent_off
            ? { type: 'percent', value: coupon.percent_off }
            : { type: 'amount', value: (coupon.amount_off || 0) / 100, currency: coupon.currency || 'usd' },
          name: coupon.name || code.trim(),
        });
      }
    } catch {
      // not a coupon ID either
    }

    return c.json({ valid: false, error: 'Invalid or expired coupon code' });
  } catch (error: any) {
    console.error('[Stripe] Validate coupon error:', error?.message);
    return c.json({ valid: false, error: 'Failed to validate coupon' }, 500);
  }
});

/** POST /api/stripe/send-welcome-email – send welcome email after signup + payment */
stripe.post('/send-welcome-email', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, name, planName } = body as { email?: string; name?: string; planName?: string };

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const userCheck = await stripePool.query(
      `SELECT id, card_validated FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    if (userCheck.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    if (!userCheck.rows[0].card_validated) {
      return c.json({ error: 'Payment not verified' }, 403);
    }

    const { sendEmail } = await import('../resendClient');

    const result = await sendEmail({
      to: email,
      subject: `Welcome to Adiology, ${name || 'there'}! 🚀`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:16px;padding:40px;text-align:center;">
  <div style="width:64px;height:64px;background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:16px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
    <span style="font-size:32px;">🚀</span>
  </div>
  <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;">Welcome to Adiology!</h1>
  <p style="color:#c7d2fe;font-size:16px;margin:0 0 32px;">Your ${planName || 'Pro'} plan is ready. Let's build your first campaign.</p>
  
  <div style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin-bottom:32px;text-align:left;">
    <h3 style="color:#a5b4fc;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Getting Started</h3>
    <div style="color:#e0e7ff;font-size:14px;line-height:2;">
      ✅ Account created<br>
      ✅ Payment method verified<br>
      ✅ 7-day free trial started<br>
      🎯 Next: Create your first campaign
    </div>
  </div>
  
  <a href="https://adiology.io" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:16px;">
    Go to Dashboard
  </a>
  
  <p style="color:#6366f1;font-size:12px;margin-top:32px;">Need help? Reply to this email or visit our help center.</p>
</div>
<p style="color:#4b5563;font-size:11px;text-align:center;margin-top:24px;">&copy; ${new Date().getFullYear()} Adiology. All rights reserved.</p>
</div>
</body>
</html>
      `,
    });

    console.log(`[Stripe] Welcome email sent to ${email}: ${result.success ? 'OK' : result.error || 'simulated'}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Stripe] Send welcome email error:', error?.message);
    return c.json({ success: false, error: 'Failed to send welcome email' }, 500);
  }
});

/** GET /api/stripe/payment-methods/:email – Retrieve saved payment methods for a user */
stripe.get('/payment-methods/:email', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ paymentMethods: [] }, 401);
    }
    const token = authHeader.substring(7);
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.email) {
      return c.json({ paymentMethods: [] }, 401);
    }

    const email = decodeURIComponent(c.req.param('email')).toLowerCase().trim();
    const tokenEmail = (payload.email as string).toLowerCase().trim();
    if (email !== tokenEmail) {
      return c.json({ paymentMethods: [] }, 403);
    }

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ paymentMethods: [] });
    }

    const customers = await stripeClient.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return c.json({ paymentMethods: [] });
    }

    const customer = customers.data[0];
    const methods = await stripeClient.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    const paymentMethods = methods.data.map((pm: any) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: customer.invoice_settings?.default_payment_method === pm.id,
    }));

    return c.json({ paymentMethods });
  } catch (error: any) {
    console.error('[Stripe] Payment methods error:', error?.message);
    return c.json({ paymentMethods: [] });
  }
});

/** GET /api/stripe/session-status – Exchange Stripe session_id for JWT after successful checkout */
stripe.get('/session-status', async (c) => {
  try {
    const sessionId = c.req.query('session_id');
    if (!sessionId) {
      return c.json({ success: false, error: 'session_id is required' }, 400);
    }

    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ success: false, error: 'Payment system not configured' }, 503);
    }

    let session: any;
    try {
      session = await stripeClient.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    } catch (err: any) {
      console.error('[Stripe] session-status retrieve error:', err?.message);
      return c.json({ success: false, error: 'Invalid or expired session' }, 400);
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete' && session.status !== 'completed') {
      return c.json({ success: false, error: 'Payment not completed' }, 402);
    }

    const metadata = session.metadata || {};
    const metadataUserId = metadata.userId;
    const customerEmail = session.customer_details?.email || session.customer_email;

    let userRow: any = null;

    if (metadataUserId) {
      const result = await stripePool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [metadataUserId]);
      if (result.rows.length > 0) userRow = result.rows[0];
    }
    if (!userRow && customerEmail) {
      const result = await stripePool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [customerEmail]);
      if (result.rows.length > 0) userRow = result.rows[0];
    }

    if (!userRow) {
      return c.json({ success: false, error: 'User not found. Please contact support.' }, 404);
    }

    const plan = metadata.plan || 'monthly';
    const isLifetime = plan === 'lifetime' || metadata.deal === 'lifetime-99';
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id || null;

    let stripeSubscriptionId: string | null = null;
    let currentPeriodEnd: Date | null = null;

    let sessionSubStatus = 'active';

    if (!isLifetime && session.subscription) {
      const sub = session.subscription;
      stripeSubscriptionId = typeof sub === 'string' ? sub : (sub as any)?.id || null;
      const periodEnd = typeof sub === 'object' && sub !== null ? (sub as any).current_period_end : null;
      if (periodEnd) currentPeriodEnd = new Date(periodEnd * 1000);

      if (stripeSubscriptionId) {
        try {
          const stripeClient = await getUncachableStripeClient();
          const fullSub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
          sessionSubStatus = (fullSub as any).status === 'trialing' ? 'trialing' : 'active';
          if ((fullSub as any).trial_end && sessionSubStatus === 'trialing') {
            currentPeriodEnd = new Date((fullSub as any).trial_end * 1000);
          } else if ((fullSub as any).current_period_end) {
            currentPeriodEnd = new Date((fullSub as any).current_period_end * 1000);
          }
        } catch (subFetchErr: any) {
          console.error('[Stripe] session-status subscription fetch error (non-fatal):', subFetchErr?.message);
        }
      }
    }

    try {
      await stripePool.query(
        `UPDATE users
         SET subscription_status = $6,
             subscription_plan = COALESCE(NULLIF($1, ''), subscription_plan),
             stripe_customer_id = COALESCE($2, stripe_customer_id),
             stripe_subscription_id = COALESCE($3, stripe_subscription_id),
             current_period_end = COALESCE($4, current_period_end),
             card_validated = true,
             updated_at = NOW()
         WHERE id = $5`,
        [plan, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, userRow.id, sessionSubStatus]
      );
      userRow.subscription_status = sessionSubStatus;
      userRow.subscription_plan = plan || userRow.subscription_plan;
      userRow.card_validated = true;
      userRow.current_period_end = currentPeriodEnd || userRow.current_period_end;
    } catch (updateErr: any) {
      console.error('[Stripe] session-status eager update error (non-fatal):', updateErr?.message);
    }

    const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';
    const jwtToken = (await import('jsonwebtoken')).default.sign(
      { userId: userRow.id, email: userRow.email, role: userRow.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await stripePool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [userRow.id]);

    return c.json({
      success: true,
      token: jwtToken,
      user: {
        id: userRow.id,
        email: userRow.email,
        full_name: userRow.full_name,
        avatar_url: userRow.avatar_url,
        role: userRow.role || 'user',
        subscription_plan: userRow.subscription_plan,
        subscription_status: userRow.subscription_status,
        stripe_customer_id: userRow.stripe_customer_id,
        stripe_subscription_id: userRow.stripe_subscription_id,
        ai_usage: userRow.ai_usage || 0,
        email_verified: userRow.email_verified || false,
        card_validated: userRow.card_validated || false,
        selected_plan: userRow.selected_plan || null,
        current_period_end: userRow.current_period_end || null,
        created_at: userRow.created_at,
      },
    });
  } catch (error: any) {
    console.error('[Stripe] session-status error:', error);
    return c.json({ success: false, error: 'Failed to retrieve session status' }, 500);
  }
});

/** POST /api/stripe/webhook – Stripe webhook handler for checkout events */
stripe.post('/webhook', async (c) => {
  try {
    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const rawBody = await c.req.text();
    const sig = c.req.header('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';

    if (webhookSecret && sig) {
      try {
        event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return c.json({ error: 'Webhook signature verification failed' }, 400);
      }
    } else if (isProduction) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is required in production');
      return c.json({ error: 'Webhook not configured for production' }, 500);
    } else {
      event = JSON.parse(rawBody);
      console.log('[Stripe Webhook] DEV MODE: Processing without signature verification');
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (id: ${event.id})`);

    try {
      const dupeCheck = await stripePool.query(
        `SELECT id FROM audit_logs WHERE details->>'stripe_event_id' = $1 LIMIT 1`,
        [event.id]
      );
      if (dupeCheck.rows.length > 0) {
        console.log(`[Stripe Webhook] Duplicate event ${event.id}, skipping`);
        return c.json({ received: true });
      }
    } catch {}

    try {
      await stripePool.query(
        `INSERT INTO audit_logs (id, action, resource_type, resource_id, details, level, created_at)
         VALUES (gen_random_uuid(), $1, 'stripe_webhook', $2, $3, 'info', NOW())`,
        [event.type, event.id, JSON.stringify({ stripe_event_id: event.id, type: event.type })]
      );
    } catch (logErr: any) {
      console.error('[Stripe Webhook] Audit log error (non-fatal):', logErr?.message);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const metadata = session.metadata || {};
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
      const metadataUserId = metadata.userId || null;

      const isLifetimePlan = metadata.deal === 'lifetime-99' || metadata.plan === 'lifetime';

      let activatedUserId: string | null = null;

      if (isLifetimePlan) {
        console.log(`[Stripe Webhook] Lifetime deal purchase by ${customerEmail} (userId: ${metadataUserId})`);

        try {
          let updateResult: any;
          if (metadataUserId) {
            updateResult = await stripePool.query(
              `UPDATE users 
               SET subscription_plan = 'Lifetime', 
                   subscription_status = 'active',
                   stripe_customer_id = COALESCE(stripe_customer_id, $2),
                   updated_at = NOW()
               WHERE id = $1
               RETURNING id`,
              [metadataUserId, stripeCustomerId]
            );
          }
          if (!updateResult || updateResult.rowCount === 0) {
            updateResult = await stripePool.query(
              `UPDATE users 
               SET subscription_plan = 'Lifetime', 
                   subscription_status = 'active',
                   stripe_customer_id = COALESCE(stripe_customer_id, $2),
                   updated_at = NOW()
               WHERE LOWER(email) = LOWER($1)
               RETURNING id`,
              [customerEmail, stripeCustomerId]
            );
          }

          if (updateResult.rowCount && updateResult.rowCount > 0) {
            activatedUserId = updateResult.rows[0].id;
            await logUserEvent(activatedUserId!, 'checkout_completed', 'Lifetime deal purchased', `Lifetime deal checkout completed`, { email: customerEmail, amount: session.amount_total });
            await logUserEvent(activatedUserId!, 'subscription_created', 'Lifetime subscription activated', `Lifetime plan activated`, { email: customerEmail, plan: 'Lifetime' });
            console.log(`[Stripe Webhook] Activated Lifetime plan for user ${activatedUserId}`);
          } else if (customerEmail) {
            const newUserId = crypto.randomUUID();
            await stripePool.query(
              `INSERT INTO users (id, email, role, subscription_plan, subscription_status, email_verified, stripe_customer_id, created_at, updated_at)
               VALUES ($1, LOWER($2), 'user', 'Lifetime', 'active', false, $3, NOW(), NOW())`,
              [newUserId, customerEmail, stripeCustomerId]
            );
            activatedUserId = newUserId;
            await logUserEvent(newUserId, 'signup', 'Account created via lifetime deal', `Account auto-created from lifetime deal purchase`, { email: customerEmail });
            await logUserEvent(newUserId, 'checkout_completed', 'Lifetime deal purchased', `Lifetime deal checkout completed`, { email: customerEmail, amount: session.amount_total });
            console.log(`[Stripe Webhook] Created new user ${customerEmail} with Lifetime plan`);
          }
        } catch (dbErr) {
          console.error('[Stripe Webhook] Lifetime DB update/create error:', dbErr);
        }

        if (activatedUserId) {
          try {
            await stripePool.query(
              `INSERT INTO subscriptions (id, user_id, stripe_customer_id, plan_name, status, current_period_end, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, 'Lifetime', 'active', '2099-12-31', NOW(), NOW())
               ON CONFLICT DO NOTHING`,
              [activatedUserId, stripeCustomerId]
            );
          } catch (subErr: any) {
            console.error('[Stripe Webhook] Subscription record insert error (non-fatal):', subErr?.message);
          }

          try {
            const paymentIntentId = session.payment_intent;
            if (paymentIntentId) {
              await stripePool.query(
                `INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount_cents, currency, status, description, paid_at, created_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, 'usd', 'succeeded', 'Lifetime Deal', NOW(), NOW())
                 ON CONFLICT (stripe_payment_intent_id) DO NOTHING`,
                [activatedUserId, paymentIntentId, session.amount_total || 9900]
              );
            }
          } catch (payErr: any) {
            console.error('[Stripe Webhook] Payment record insert error (non-fatal):', payErr?.message);
          }

          if (customerEmail) {
            try {
              const { sendEmail: sendResendEmail } = await import('../resendClient');
              await sendResendEmail({
                to: customerEmail,
                subject: 'Your Adiology Lifetime Access is Active!',
                html: buildLifetimeConfirmationEmail(customerEmail, session.amount_total),
              });
              console.log(`[Stripe Webhook] Lifetime confirmation email sent to ${customerEmail}`);
            } catch (emailErr) {
              console.error('[Stripe Webhook] Email send error:', emailErr);
            }
          }
        }
      } else {
        console.log(`[Stripe Webhook] Subscription checkout completed for ${customerEmail} (userId: ${metadataUserId})`);

        let stripeSubscriptionId: string | null = null;
        let currentPeriodEnd: Date | null = null;
        let trialEnd: Date | null = null;
        let subStatus: string = 'active';
        const planName = metadata.plan || metadata.planName || 'monthly';

        try {
          if (session.subscription) {
            const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id;
            if (subId) {
              stripeSubscriptionId = subId;
              try {
                const sub = await stripeClient.subscriptions.retrieve(subId);
                currentPeriodEnd = new Date((sub as any).current_period_end * 1000);
                subStatus = (sub as any).status || 'active';
                if ((sub as any).trial_end) {
                  trialEnd = new Date((sub as any).trial_end * 1000);
                }
              } catch (subFetchErr: any) {
                console.error('[Stripe Webhook] Subscription fetch error (non-fatal):', subFetchErr?.message);
              }
            }
          }
        } catch (subErr: any) {
          console.error('[Stripe Webhook] Subscription ID extraction error (non-fatal):', subErr?.message);
        }

        const resolvedStatus = (subStatus === 'trialing' || trialEnd) ? 'trialing' : 'active';
        const periodEndForDb = resolvedStatus === 'trialing' && trialEnd ? trialEnd : currentPeriodEnd;

        try {
          let updateResult: any;
          if (metadataUserId) {
            updateResult = await stripePool.query(
              `UPDATE users 
               SET subscription_plan = $1, 
                   subscription_status = $6,
                   stripe_customer_id = COALESCE(stripe_customer_id, $3),
                   stripe_subscription_id = COALESCE($4, stripe_subscription_id),
                   current_period_end = COALESCE($5, current_period_end),
                   card_validated = true,
                   updated_at = NOW()
               WHERE id = $2
               RETURNING id, email`,
              [planName, metadataUserId, stripeCustomerId, stripeSubscriptionId, periodEndForDb, resolvedStatus]
            );
          }
          if (!updateResult || updateResult.rowCount === 0) {
            updateResult = await stripePool.query(
              `UPDATE users 
               SET subscription_plan = $1, 
                   subscription_status = $6,
                   stripe_customer_id = COALESCE(stripe_customer_id, $3),
                   stripe_subscription_id = COALESCE($4, stripe_subscription_id),
                   current_period_end = COALESCE($5, current_period_end),
                   card_validated = true,
                   updated_at = NOW()
               WHERE LOWER(email) = LOWER($2)
               RETURNING id, email`,
              [planName, customerEmail, stripeCustomerId, stripeSubscriptionId, periodEndForDb, resolvedStatus]
            );
          }

          if (updateResult && updateResult.rows.length > 0) {
            activatedUserId = updateResult.rows[0].id;
            const activatedEmail = updateResult.rows[0].email || customerEmail;
            await logUserEvent(activatedUserId!, 'checkout_completed', 'Checkout completed', `${planName} plan checkout completed`, { email: activatedEmail, planName, amount: session.amount_total });
            if (resolvedStatus === 'trialing') {
              await logUserEvent(activatedUserId!, 'trial_started', 'Trial started', `7-day trial started for ${planName}`, { email: activatedEmail, planName, trialEnd: trialEnd?.toISOString() });
            } else {
              await logUserEvent(activatedUserId!, 'subscription_created', 'Subscription created', `${planName} plan activated`, { email: activatedEmail, planName });
            }
            console.log(`[Stripe Webhook] ${resolvedStatus === 'trialing' ? 'Trial started' : 'Activated'} ${planName} plan for user ${activatedUserId}`);

            try {
              if (stripeSubscriptionId) {
                const safeDate = (d: Date | null | undefined): Date | null => {
                  if (!d) return null;
                  const t = d.getTime();
                  if (isNaN(t) || t <= 0) return null;
                  return d;
                };
                await stripePool.query(
                  `INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan_name, status, trial_end, current_period_end, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1, $2, $3, $4, $7, $5, $6, NOW(), NOW())
                   ON CONFLICT DO NOTHING`,
                  [activatedUserId, stripeCustomerId, stripeSubscriptionId, planName, safeDate(trialEnd), safeDate(currentPeriodEnd), resolvedStatus]
                );
              }
            } catch (subErr: any) {
              console.error('[Stripe Webhook] Subscription record insert error (non-fatal):', subErr?.message);
            }
          }
        } catch (dbErr) {
          console.error('[Stripe Webhook] DB update error:', dbErr);
        }
      }

      if (activatedUserId && customerEmail) {
        try {
          const verifyCheck = await stripePool.query(
            `SELECT id, email FROM users WHERE id = $1 AND (email_verified IS NULL OR email_verified = false) LIMIT 1`,
            [activatedUserId]
          );
          if (verifyCheck.rows.length > 0) {
            const verifyToken = crypto.randomUUID();
            const verifyExpires = new Date();
            verifyExpires.setHours(verifyExpires.getHours() + 48);
            await stripePool.query(
              `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
               VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
              [activatedUserId, verifyToken, verifyExpires]
            );
            const PROD_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';
            const verificationUrl = `${PROD_URL}/verify-email?token=${verifyToken}&email=${encodeURIComponent(customerEmail.toLowerCase())}`;

            const { sendEmail: sendVerifyEmail } = await import('../resendClient');
            const { emailTemplates } = await import('../email-templates');
            const template = emailTemplates.emailVerification;
            const verifyHtml = template.html
              .replace(/\{\{verification_url\}\}/g, verificationUrl)
              .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());

            await sendVerifyEmail({
              to: customerEmail.toLowerCase(),
              subject: template.subject,
              html: verifyHtml,
            });
            console.log(`[Stripe Webhook] Verification email sent to ${customerEmail}`);
          }
        } catch (verifyErr: any) {
          console.error('[Stripe Webhook] Verification email error (non-fatal):', verifyErr?.message);
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const amountPaid = (invoice as any).amount_paid || 0;
      const invoiceId = invoice.id;
      const currency = (invoice as any).currency || 'usd';
      const paymentIntentId = typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id || null;
      const receiptUrl = (invoice as any).hosted_invoice_url || null;
      const subscriptionId = typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id || null;

      if (customerId) {
        try {
          // Update period end on users and subscriptions tables
          if (periodEnd) {
            const periodEndDate = new Date(periodEnd * 1000);
            await stripePool.query(
              `UPDATE users SET current_period_end = $1, updated_at = NOW() WHERE stripe_customer_id = $2`,
              [periodEndDate, customerId]
            );
            await stripePool.query(
              `UPDATE subscriptions SET current_period_end = $1, status = 'active', updated_at = NOW() WHERE stripe_customer_id = $2`,
              [periodEndDate, customerId]
            );
          }

          // Record the payment (skip $0 trial invoices)
          if (amountPaid > 0 && invoiceId) {
            const userResult = await stripePool.query(
              `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
              [customerId]
            );
            const userId = userResult.rows[0]?.id || null;

            // Find subscription record id for linking
            let subRecordId: string | null = null;
            if (subscriptionId) {
              const subResult = await stripePool.query(
                `SELECT id FROM subscriptions WHERE stripe_subscription_id = $1 OR stripe_customer_id = $2 LIMIT 1`,
                [subscriptionId, customerId]
              );
              subRecordId = subResult.rows[0]?.id || null;
            }

            // Determine plan description from subscription
            let description = 'Subscription payment';
            if (userId) {
              const planResult = await stripePool.query(
                `SELECT subscription_plan FROM users WHERE id = $1 LIMIT 1`,
                [userId]
              );
              const plan = planResult.rows[0]?.subscription_plan;
              if (plan) description = `${plan} plan – recurring payment`;
            }

            await stripePool.query(
              `INSERT INTO payments (
                id, user_id, subscription_id, stripe_payment_intent_id, stripe_invoice_id,
                amount_cents, currency, status, description, receipt_url, paid_at, created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'succeeded', $7, $8, NOW(), NOW()
              )
              ON CONFLICT (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL DO NOTHING`,
              [userId, subRecordId, paymentIntentId, invoiceId, amountPaid, currency, description, receiptUrl]
            );

            if (userId) {
              await logUserEvent(userId, 'payment_received', 'Payment received', description, {
                amountCents: amountPaid,
                currency,
                invoiceId,
                stripeCustomerId: customerId,
              });
            }

            console.log(`[Stripe Webhook] Recorded payment of ${amountPaid} ${currency} for customer ${customerId} (invoice: ${invoiceId})`);
          } else {
            console.log(`[Stripe Webhook] Skipping $0 invoice ${invoiceId} for customer ${customerId}`);
          }

          console.log(`[Stripe Webhook] Updated current_period_end for customer ${customerId}`);
        } catch (dbErr: any) {
          console.error('[Stripe Webhook] invoice.payment_succeeded DB update error (non-fatal):', dbErr?.message);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      try {
        const userResult = await stripePool.query(
          `UPDATE users 
           SET subscription_status = 'cancelled',
               updated_at = NOW()
           WHERE stripe_customer_id = $1
           RETURNING id, email`,
          [customerId]
        );
        await stripePool.query(
          `UPDATE subscriptions SET status = 'cancelled', canceled_at = NOW(), updated_at = NOW() WHERE stripe_customer_id = $1 AND status != 'cancelled'`,
          [customerId]
        );
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          await logUserEvent(user.id, 'subscription_canceled', 'Subscription cancelled', `Subscription cancelled via Stripe`, { email: user.email, stripeCustomerId: customerId });
        }
        console.log(`[Stripe Webhook] Subscription cancelled for customer ${customerId}`);
      } catch (dbErr) {
        console.error('[Stripe Webhook] DB update error:', dbErr);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      const customerId = invoice.customer;
      const attemptCount = invoice.attempt_count || 1;

      console.log(`[Stripe Webhook] Payment failed for ${customerEmail} (attempt ${attemptCount})`);

      if (attemptCount >= 3 && customerId) {
        try {
          await stripePool.query(
            `UPDATE users SET subscription_status = 'past_due', updated_at = NOW() WHERE stripe_customer_id = $1`,
            [customerId]
          );
          console.log(`[Stripe Webhook] Marked user as past_due after ${attemptCount} failed attempts`);
        } catch (pdErr: any) {
          console.error('[Stripe Webhook] past_due update error (non-fatal):', pdErr?.message);
        }
      }

      if (customerEmail) {
        try {
          const userResult = await stripePool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [customerEmail]);
          if (userResult.rows.length > 0) {
            await logUserEvent(userResult.rows[0].id, 'payment_failed', 'Payment failed', `Invoice payment failed (attempt ${attemptCount})`, { email: customerEmail, invoiceId: invoice.id, amount: invoice.amount_due, attemptCount });
          }
        } catch (logErr: any) {
          console.error('[Stripe Webhook] Payment failed event log error (non-fatal):', logErr?.message);
        }
        try {
          const PROD_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';
          const { sendEmail: sendFailEmail } = await import('../resendClient');
          await sendFailEmail({
            to: customerEmail,
            subject: `Payment Failed - Action Required${attemptCount >= 3 ? ' (Final Notice)' : ''}`,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:16px;padding:40px;text-align:center;"><h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Payment Failed${attemptCount >= 3 ? ' — Final Notice' : ''}</h1><p style="color:#fca5a5;font-size:16px;margin:0 0 24px;">We were unable to process your payment (attempt ${attemptCount} of 3). Please update your payment method to continue using Adiology.${attemptCount >= 3 ? ' Your account has been restricted.' : ''}</p><a href="${PROD_URL}/billing" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;">Update Payment Method</a></div></div></body></html>`,
          });
        } catch (emailErr: any) {
          console.error('[Stripe Webhook] Failed to send payment failure email:', emailErr?.message);
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const prevAttributes = (event.data as any).previous_attributes || {};
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any)?.id;
      const newStatus = (subscription as any).status;
      const prevStatus = prevAttributes.status;

      if (prevStatus === 'trialing' && newStatus === 'active') {
        const periodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null;
        try {
          const userResult = await stripePool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 current_period_end = COALESCE($2, current_period_end),
                 updated_at = NOW()
             WHERE stripe_customer_id = $1
             RETURNING id, email, subscription_plan`,
            [customerId, periodEnd]
          );
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            await stripePool.query(
              `UPDATE subscriptions SET status = 'active', trial_end = NULL, current_period_end = COALESCE($2, current_period_end), updated_at = NOW() WHERE stripe_customer_id = $1`,
              [customerId, periodEnd]
            );
            await logUserEvent(user.id, 'trial_converted', 'Trial converted to paid', `7-day trial ended, subscription is now active for ${user.subscription_plan}`, { email: user.email, plan: user.subscription_plan });
            console.log(`[Stripe Webhook] Trial converted to active for user ${user.id} (${user.email})`);
            try {
              const { sendEmail: sendTrialEmail } = await import('../resendClient');
              const PROD_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';
              await sendTrialEmail({
                to: user.email,
                subject: 'Your Adiology Trial Has Ended — Welcome to the Full Plan!',
                html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="background:linear-gradient(135deg,#4c1d95,#312e81);border-radius:16px;padding:40px;text-align:center;"><h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Your Trial Has Ended</h1><p style="color:#c4b5fd;font-size:16px;margin:0 0 8px;">Your 7-day free trial of the <strong style="color:#fff;">${user.subscription_plan}</strong> plan has ended and your subscription is now active.</p><p style="color:#c4b5fd;font-size:14px;margin:0 0 24px;">Your card on file has been charged for the first billing cycle. You can manage your subscription anytime from your billing settings.</p><a href="${PROD_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;">Go to Dashboard</a></div></div></body></html>`,
              });
            } catch (emailErr: any) {
              console.error('[Stripe Webhook] Trial converted email error (non-fatal):', emailErr?.message);
            }
          }
        } catch (dbErr: any) {
          console.error('[Stripe Webhook] customer.subscription.updated DB error:', dbErr?.message);
        }
      }
    }

    if (event.type === 'customer.subscription.trial_will_end') {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any)?.id;
      const trialEnd = (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null;
      try {
        const userResult = await stripePool.query(
          `SELECT id, email, subscription_plan FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
          [customerId]
        );
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const trialEndStr = trialEnd ? trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'soon';
          await logUserEvent(user.id, 'trial_ending_soon', 'Trial ending soon', `Trial ends on ${trialEndStr}`, { email: user.email, trialEnd: trialEnd?.toISOString() });
          try {
            const { sendEmail: sendReminderEmail } = await import('../resendClient');
            const PROD_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';
            await sendReminderEmail({
              to: user.email,
              subject: 'Your Adiology Trial Ends in 3 Days',
              html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',system-ui,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="background:linear-gradient(135deg,#4c1d95,#312e81);border-radius:16px;padding:40px;text-align:center;"><h1 style="color:#ffffff;font-size:24px;margin:0 0 16px;">Your Trial Ends in 3 Days</h1><p style="color:#c4b5fd;font-size:16px;margin:0 0 8px;">Your free trial of the <strong style="color:#fff;">${user.subscription_plan}</strong> plan ends on <strong style="color:#fff;">${trialEndStr}</strong>.</p><p style="color:#c4b5fd;font-size:14px;margin:0 0 24px;">After that, your card on file will be charged automatically. If you'd like to cancel before being charged, you can do so from your billing settings.</p><a href="${PROD_URL}/billing" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;">Manage Subscription</a></div></div></body></html>`,
            });
            console.log(`[Stripe Webhook] Trial ending reminder sent to ${user.email}`);
          } catch (emailErr: any) {
            console.error('[Stripe Webhook] Trial ending reminder email error (non-fatal):', emailErr?.message);
          }
        }
      } catch (dbErr: any) {
        console.error('[Stripe Webhook] customer.subscription.trial_will_end DB error:', dbErr?.message);
      }
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

function buildLifetimeConfirmationEmail(email: string, amountTotal?: number): string {
  const amount = amountTotal ? `$${(amountTotal / 100).toFixed(2)}` : '$99.00';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const PROD_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';
  const setupUrl = `${PROD_URL}/lifetime-deal?success=true`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:16px;padding:40px;text-align:center;">
  <div style="width:64px;height:64px;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
    <span style="font-size:32px;">&#127881;</span>
  </div>
  <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;">You're In For Life!</h1>
  <p style="color:#a7f3d0;font-size:16px;margin:0 0 32px;">Your Adiology Lifetime Access is now active. No subscriptions, no renewals — ever.</p>
  
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;margin-bottom:24px;text-align:left;">
    <h3 style="color:#6ee7b7;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Purchase Summary</h3>
    <div style="color:#d1fae5;font-size:14px;line-height:2;">
      <strong>Plan:</strong> Lifetime Access<br>
      <strong>Amount Paid:</strong> ${amount}<br>
      <strong>Date:</strong> ${date}<br>
      <strong>Account:</strong> ${email}
    </div>
  </div>

  <div style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:20px;margin-bottom:24px;text-align:left;">
    <h3 style="color:#93c5fd;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Next Steps — Set Up Your Account</h3>
    <div style="color:#dbeafe;font-size:14px;line-height:2;">
      <strong>1.</strong> Click the button below to set your password<br>
      <strong>2.</strong> Choose a secure password for your account<br>
      <strong>3.</strong> Start building campaigns immediately
    </div>
  </div>

  <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:18px;margin-bottom:16px;">
    Set Up Your Account
  </a>
  
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;margin-top:24px;margin-bottom:32px;text-align:left;">
    <h3 style="color:#6ee7b7;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">What You Get</h3>
    <div style="color:#d1fae5;font-size:14px;line-height:2;">
      &#9989; 13 Campaign Structures (SKAG, STAG, Alpha-Beta & more)<br>
      &#9989; AI Keyword Generation & Ad Creation<br>
      &#9989; RSA, DKI & Call-Only Ad Builder<br>
      &#9989; Campaign Assets (Sitelinks, Callouts, Snippets)<br>
      &#9989; Google Ads Editor CSV Export<br>
      &#9989; Click Guard Fraud Protection<br>
      &#9989; Domain Monitoring & Proxy Mail<br>
      &#9989; All Future Updates Included
    </div>
  </div>
  
  <p style="color:#6ee7b7;font-size:12px;margin-top:32px;">Questions? Just reply to this email — we're here to help.</p>
</div>
<div style="text-align:center;margin-top:24px;">
  <p style="color:#4b5563;font-size:11px;">This is a one-time payment confirmation. You will not be charged again.</p>
  <p style="color:#4b5563;font-size:11px;">&copy; ${new Date().getFullYear()} Adiology. All rights reserved.</p>
</div>
</div>
</body>
</html>`;
}

export { stripe as stripeRoutes };
