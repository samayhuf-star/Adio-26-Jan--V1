import { Hono } from 'hono';
import { getDb } from '../db';
import { appsumoLicenses, users, subscriptions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { getUserIdFromToken } from '../utils/auth';

export const appsumoRoutes = new Hono();

const APPSUMO_API_KEY = process.env.APPSUMO_API_KEY || '';
const APPSUMO_CLIENT_ID = process.env.APPSUMO_CLIENT_ID || '';
const APPSUMO_CLIENT_SECRET = process.env.APPSUMO_CLIENT_SECRET || '';

function appendEventLog(existing: Array<{event: string, timestamp: number, tier?: number}> | null, event: string, tier?: number) {
  const log = existing || [];
  log.push({ event, timestamp: Date.now(), tier });
  return log;
}

function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!APPSUMO_API_KEY) {
    console.error('[AppSumo] APPSUMO_API_KEY not configured - rejecting webhook');
    return false;
  }
  if (!signature) return false;
  try {
    const computed = crypto.createHmac('sha256', APPSUMO_API_KEY).update(rawBody).digest('hex');
    if (computed.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=').trim();
  });
  return cookies;
}

appsumoRoutes.post('/webhook', async (c) => {
  try {
    const rawBody = await c.req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    if (body.test) {
      console.log('[AppSumo] Test webhook received');
      return c.json({ success: true, event: 'test' });
    }

    const signature = c.req.header('x-appsumo-signature') || c.req.header('X-AppSumo-Signature');
    if (APPSUMO_API_KEY && !verifyWebhookSignature(rawBody, signature)) {
      console.warn('[AppSumo] Invalid webhook signature - rejected');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const { event, license_key, license_status, tier, product_id, customer_email } = body;

    if (!event || !license_key) {
      return c.json({ error: 'Missing event or license_key' }, 400);
    }

    console.log(`[AppSumo] Webhook: event=${event}, license=${license_key}, tier=${tier}, status=${license_status}`);

    const db = getDb();

    switch (event) {
      case 'purchase': {
        const existing = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, license_key)).limit(1);
        if (existing.length > 0) {
          await db.update(appsumoLicenses).set({
            tier: tier || 1,
            status: 'inactive',
            productId: product_id,
            email: customer_email || existing[0].email,
            eventLog: appendEventLog(existing[0].eventLog, 'purchase', tier),
            updatedAt: new Date(),
          }).where(eq(appsumoLicenses.licenseKey, license_key));
        } else {
          await db.insert(appsumoLicenses).values({
            licenseKey: license_key,
            tier: tier || 1,
            status: 'inactive',
            productId: product_id,
            email: customer_email || null,
            eventLog: [{ event: 'purchase', timestamp: Date.now(), tier: tier || 1 }],
          });
        }
        break;
      }

      case 'activate': {
        const license = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, license_key)).limit(1);
        if (license.length > 0) {
          await db.update(appsumoLicenses).set({
            status: 'active',
            tier: tier || license[0].tier,
            activatedAt: new Date(),
            email: customer_email || license[0].email,
            eventLog: appendEventLog(license[0].eventLog, 'activate', tier),
            updatedAt: new Date(),
          }).where(eq(appsumoLicenses.licenseKey, license_key));

          if (license[0].userId) {
            await activateLifetimePlan(db, license[0].userId);
          }
        }
        break;
      }

      case 'upgrade':
      case 'downgrade': {
        const license = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, license_key)).limit(1);
        if (license.length > 0) {
          await db.update(appsumoLicenses).set({
            tier: tier || license[0].tier,
            status: license_status || license[0].status,
            eventLog: appendEventLog(license[0].eventLog, event, tier),
            updatedAt: new Date(),
          }).where(eq(appsumoLicenses.licenseKey, license_key));
        }
        break;
      }

      case 'deactivate': {
        const license = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, license_key)).limit(1);
        if (license.length > 0) {
          await db.update(appsumoLicenses).set({
            status: 'deactivated',
            deactivatedAt: new Date(),
            eventLog: appendEventLog(license[0].eventLog, 'deactivate', tier),
            updatedAt: new Date(),
          }).where(eq(appsumoLicenses.licenseKey, license_key));

          if (license[0].userId) {
            await deactivateLifetimePlan(db, license[0].userId);
          }
        }
        break;
      }

      default:
        console.log(`[AppSumo] Unknown event: ${event}`);
    }

    return c.json({ success: true, event });
  } catch (error: any) {
    console.error('[AppSumo] Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

appsumoRoutes.get('/auth', async (c) => {
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = getRedirectUri(c);
  const redirectUrl = `https://appsumo.com/openid/authorize/?response_type=code&client_id=${APPSUMO_CLIENT_ID}&scope=openid email profile&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  c.header('Set-Cookie', `appsumo_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return c.redirect(redirectUrl);
});

appsumoRoutes.get('/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const stateParam = c.req.query('state');

    if (!code) {
      return c.redirect('/appsumo/redeem?error=no_code');
    }

    const cookies = parseCookies(c.req.header('Cookie'));
    const savedState = cookies['appsumo_state'];

    if (!stateParam || !savedState || stateParam !== savedState) {
      console.warn('[AppSumo] OAuth state mismatch - possible CSRF');
      return c.redirect('/appsumo/redeem?error=invalid_state');
    }

    c.header('Set-Cookie', 'appsumo_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    const tokenResponse = await fetch('https://appsumo.com/openid/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: APPSUMO_CLIENT_ID,
        client_secret: APPSUMO_CLIENT_SECRET,
        redirect_uri: getRedirectUri(c),
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('[AppSumo] Token exchange failed:', errText);
      return c.redirect('/appsumo/redeem?error=token_failed');
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    const licenseResponse = await fetch('https://appsumo.com/openid/license_key/', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!licenseResponse.ok) {
      console.error('[AppSumo] License fetch failed');
      return c.redirect('/appsumo/redeem?error=license_failed');
    }

    const licenseData = await licenseResponse.json() as any;
    const licenseKeys: string[] = Array.isArray(licenseData) 
      ? licenseData.map((l: any) => l.license_key || l) 
      : licenseData.license_key 
        ? [licenseData.license_key] 
        : [];

    if (licenseKeys.length === 0) {
      return c.redirect('/appsumo/redeem?error=no_license');
    }

    const licenseKey = licenseKeys[0];
    c.header('Set-Cookie', `appsumo_license=${encodeURIComponent(licenseKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`, { append: true });
    return c.redirect('/appsumo/redeem?from_appsumo=1');
  } catch (error: any) {
    console.error('[AppSumo] Callback error:', error);
    return c.redirect('/appsumo/redeem?error=callback_failed');
  }
});

appsumoRoutes.get('/pending-license', async (c) => {
  try {
    const cookies = parseCookies(c.req.header('Cookie'));
    const licenseKey = cookies['appsumo_license'];

    if (!licenseKey) {
      return c.json({ licenseKey: null });
    }

    c.header('Set-Cookie', 'appsumo_license=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return c.json({ licenseKey: decodeURIComponent(licenseKey) });
  } catch {
    return c.json({ licenseKey: null });
  }
});

appsumoRoutes.post('/activate', async (c) => {
  try {
    const authenticatedUserId = await getUserIdFromToken(c);
    const { licenseKey, email } = await c.req.json();

    if (!licenseKey) {
      return c.json({ error: 'License key is required' }, 400);
    }

    if (!authenticatedUserId) {
      return c.json({ error: 'You must be signed in to activate a license.' }, 401);
    }

    const db = getDb();

    const license = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, licenseKey)).limit(1);

    if (license.length === 0) {
      await db.insert(appsumoLicenses).values({
        licenseKey,
        userId: authenticatedUserId,
        email: email || null,
        tier: 1,
        status: 'active',
        activatedAt: new Date(),
        eventLog: [{ event: 'manual_activate', timestamp: Date.now(), tier: 1 }],
      });
    } else {
      const existing = license[0];

      if (existing.status === 'deactivated') {
        return c.json({ error: 'This license has been deactivated (refunded). Please contact AppSumo support.' }, 400);
      }

      if (existing.userId && existing.userId !== authenticatedUserId) {
        return c.json({ error: 'This license is already linked to another account.' }, 400);
      }

      await db.update(appsumoLicenses).set({
        userId: authenticatedUserId,
        email: email || existing.email,
        status: 'active',
        activatedAt: existing.activatedAt || new Date(),
        eventLog: appendEventLog(existing.eventLog, 'activate', existing.tier || 1),
        updatedAt: new Date(),
      }).where(eq(appsumoLicenses.licenseKey, licenseKey));
    }

    await activateLifetimePlan(db, authenticatedUserId);

    return c.json({ success: true, message: 'License activated! You now have lifetime access.' });
  } catch (error: any) {
    console.error('[AppSumo] Activate error:', error);
    return c.json({ error: 'Failed to activate license' }, 500);
  }
});

appsumoRoutes.get('/license/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const db = getDb();
    const license = await db.select().from(appsumoLicenses).where(eq(appsumoLicenses.licenseKey, key)).limit(1);

    if (license.length === 0) {
      return c.json({ error: 'License not found' }, 404);
    }

    return c.json({
      success: true,
      license: {
        licenseKey: license[0].licenseKey,
        status: license[0].status,
        tier: license[0].tier,
        activatedAt: license[0].activatedAt,
        userId: license[0].userId ? '***linked***' : null,
      },
    });
  } catch (error: any) {
    console.error('[AppSumo] License lookup error:', error);
    return c.json({ error: 'Failed to look up license' }, 500);
  }
});

function getRedirectUri(_c?: any): string {
  // Always use the canonical domain — AppSumo OAuth callback must match the
  // registered redirect URI exactly and must never be a Replit infrastructure URL.
  return 'https://adiology.io/api/appsumo/callback';
}

async function activateLifetimePlan(db: any, userId: string) {
  try {
    await db.update(users).set({
      subscriptionPlan: 'lifetime',
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    const existingSub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);

    if (existingSub.length > 0) {
      await db.update(subscriptions).set({
        planName: 'lifetime',
        status: 'active',
        updatedAt: new Date(),
      }).where(eq(subscriptions.userId, userId));
    } else {
      await db.insert(subscriptions).values({
        userId,
        planName: 'lifetime',
        status: 'active',
      });
    }

    console.log(`[AppSumo] Lifetime plan activated for user ${userId}`);
  } catch (error) {
    console.error('[AppSumo] Failed to activate lifetime plan:', error);
  }
}

async function deactivateLifetimePlan(db: any, userId: string) {
  try {
    await db.update(users).set({
      subscriptionPlan: 'free',
      subscriptionStatus: 'inactive',
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    await db.update(subscriptions).set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    }).where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.planName, 'lifetime'),
    ));

    console.log(`[AppSumo] Lifetime plan deactivated for user ${userId}`);
  } catch (error) {
    console.error('[AppSumo] Failed to deactivate lifetime plan:', error);
  }
}
