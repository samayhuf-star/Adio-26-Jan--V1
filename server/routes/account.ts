import { Hono } from 'hono';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDatabaseUrl } from '../dbConfig';
import { EmailService } from '../emailService';
import { logUserEvent } from '../services/userEventLogger';
import { getUncachableStripeClient } from '../stripeClient';
import { stripeService } from '../stripeService';

const { Pool } = pg;
const pool = new Pool({ connectionString: getDatabaseUrl() });

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';
const PRODUCTION_URL = process.env.DOMAIN || process.env.APP_URL || 'https://adiology.io';

// The canonical URL used in all email links — must always be the production domain.
// NEVER derive this from request headers: emails are opened in mail clients and
// the link must work regardless of which Replit/deployment server handled the request.
const EMAIL_BASE_URL = 'https://adiology.io';

function getBaseUrl(c: any): string {
  // Always prefer the explicitly configured production URL
  if (PRODUCTION_URL) return PRODUCTION_URL;
  const host = c.req.header('x-forwarded-host') || c.req.header('host');
  if (host) {
    const proto = c.req.header('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return EMAIL_BASE_URL;
}

// Always returns the canonical adiology.io URL for use in emails.
// Do NOT change this to use request headers — Replit deployment domains
// must never end up inside magic links or verification emails.
function getEmailBaseUrl(_c?: any): string {
  return EMAIL_BASE_URL;
}

export const accountRoutes = new Hono();

accountRoutes.post('/register', async (c) => {
  try {
    const { email, password, name, isLifetimeDeal, plan, priceId } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await pool.query(
      'SELECT id, password_hash, subscription_plan, subscription_status FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];

      if (!existing.password_hash) {
        const isLifetime = existing.subscription_plan === 'Lifetime' && existing.subscription_status === 'active';
        await pool.query(
          `UPDATE users 
           SET password_hash = $1, full_name = COALESCE($2, full_name), email_verified = true, card_validated = $4, updated_at = NOW()
           WHERE id = $3`,
          [passwordHash, name || null, existing.id, isLifetime]
        );

        const jwtToken = jwt.sign(
          { userId: existing.id, email: normalizedEmail, role: 'user' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        await pool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [existing.id]);

        await logUserEvent(existing.id, 'signup', 'Account setup completed', `Existing passwordless user completed account setup`, { email: normalizedEmail, plan: existing.subscription_plan });
        await logUserEvent(existing.id, 'login', 'User logged in', `Login after account setup`, { email: normalizedEmail });

        console.log(`[Auth] Existing passwordless user completed setup: ${normalizedEmail} (plan: ${existing.subscription_plan})`);
        return c.json({
          success: true,
          message: 'Account setup complete.',
          userId: existing.id,
          token: jwtToken,
          isLifetimeDeal: isLifetime,
          skipPayment: isLifetime,
          user: {
            id: existing.id,
            email: normalizedEmail,
            subscription_plan: existing.subscription_plan,
            subscription_status: existing.subscription_status,
          },
        });
      }

      return c.json({ success: false, error: 'An account with this email already exists' }, 409);
    }

    const validPlans = ['monthly', 'annual', 'lifetime', 'starter', 'professional', 'agency'];
    const isNewFlow = plan && validPlans.includes(plan);

    if (isNewFlow) {
      const userId = crypto.randomUUID();
      const signupIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null;

      try {
        await pool.query(
          `INSERT INTO users (id, email, full_name, password_hash, email_verified, role, subscription_plan, subscription_status, card_validated, signup_ip, created_at, updated_at)
           VALUES ($1, $2, $3, $4, false, 'user', $5, 'pending_payment', false, $6, NOW(), NOW())`,
          [userId, normalizedEmail, name || null, passwordHash, plan, signupIp]
        );
      } catch (dbError: any) {
        if (dbError.code === '23505') {
          return c.json({ success: false, error: 'An account with this email already exists' }, 409);
        }
        throw dbError;
      }

      await logUserEvent(userId, 'signup', 'User registered', `New account created`, { email: normalizedEmail, plan });

      const LIFETIME_PRICE_ID = 'price_1T2uVCAYv17Z995V7g1xTSwN';

      if (plan === 'lifetime') {
        const stripeClient = await getUncachableStripeClient();
        if (!stripeClient) {
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);
          return c.json({ success: false, error: 'Payment system not configured. Please try again later.' }, 503);
        }

        let stripeCustomerId: string;
        try {
          const customer = await stripeClient.customers.create({ email: normalizedEmail, metadata: { userId } });
          stripeCustomerId = customer.id;
          await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, userId]);
        } catch (stripeErr: any) {
          console.error('[Auth] Stripe customer creation error:', stripeErr);
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);
          return c.json({ success: false, error: 'Failed to set up payment. Please try again.' }, 500);
        }

        const baseUrl = getBaseUrl(c);
        const successUrl = `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/signup?cancelled=true`;
        const resolvedPriceId = priceId || LIFETIME_PRICE_ID;

        let checkoutSession: any;
        try {
          checkoutSession = await stripeClient.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'payment',
            line_items: [{ price: resolvedPriceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
            metadata: { userId, plan: 'lifetime' },
          });
        } catch (sessionErr: any) {
          console.error('[Auth] Stripe session creation error:', sessionErr);
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);
          return c.json({ success: false, error: 'Failed to create payment session. Please try again.' }, 500);
        }

        console.log(`[Auth] Lifetime user registered, redirecting to payment: ${normalizedEmail}`);
        return c.json({
          success: true,
          message: 'Account created. Redirecting to payment...',
          checkoutUrl: checkoutSession.url,
        });
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await pool.query(
        `UPDATE users SET subscription_status = 'trialing', current_period_end = $1, email_verified = true WHERE id = $2`,
        [trialEndDate, userId]
      );

      try {
        const stripeClient = await getUncachableStripeClient();
        if (stripeClient) {
          const customer = await stripeClient.customers.create({ email: normalizedEmail, metadata: { userId, plan } });
          await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
        }
      } catch (stripeErr: any) {
        console.error('[Auth] Stripe customer creation error (non-blocking):', stripeErr);
      }

      const jwtToken = jwt.sign(
        { userId, email: normalizedEmail, role: 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await pool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [userId]);
      await logUserEvent(userId, 'login', 'Trial started', `7-day free trial started`, { email: normalizedEmail, plan, trialEnds: trialEndDate });

      console.log(`[Auth] User registered with 7-day trial: ${normalizedEmail} (plan: ${plan})`);
      return c.json({
        success: true,
        message: 'Account created. Starting your free trial...',
        token: jwtToken,
        user: {
          id: userId,
          email: normalizedEmail,
          subscription_plan: plan,
          subscription_status: 'trialing',
        },
      });
    }

    const userId = crypto.randomUUID();
    const signupIpFree = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null;

    const newPlan = isLifetimeDeal ? 'Lifetime' : 'free';
    const newStatus = isLifetimeDeal ? 'active' : 'active';
    const cardValidated = isLifetimeDeal ? true : false;

    try {
      await pool.query(
        `INSERT INTO users (id, email, full_name, password_hash, email_verified, role, subscription_plan, subscription_status, card_validated, signup_ip, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, 'user', $5, $6, $7, $8, NOW(), NOW())`,
        [userId, normalizedEmail, name || null, passwordHash, newPlan, newStatus, cardValidated, signupIpFree]
      );
    } catch (dbError: any) {
      if (dbError.code === '23505') {
        return c.json({ success: false, error: 'An account with this email already exists' }, 409);
      }
      throw dbError;
    }

    const jwtToken = jwt.sign(
      { userId, email: normalizedEmail, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logUserEvent(userId, 'signup', 'User registered', `New account created`, { email: normalizedEmail, name: name || null, isLifetimeDeal: !!isLifetimeDeal });

    EmailService.sendRaw(normalizedEmail, 'welcome', { name: name || 'there' }).catch(() => {});

    console.log(`[Auth] User registered: ${email} (plan: ${newPlan})`);
    return c.json({
      success: true,
      message: 'Account created successfully.',
      userId,
      token: jwtToken,
      skipPayment: !!isLifetimeDeal,
      isLifetimeDeal: !!isLifetimeDeal,
      user: {
        id: userId,
        email: normalizedEmail,
        subscription_plan: newPlan,
        subscription_status: newStatus,
        card_validated: cardValidated,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    return c.json({ success: false, error: 'Registration failed. Please try again.' }, 500);
  }
});

accountRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      if (user.subscription_plan === 'Lifetime' || user.stripe_customer_id) {
        return c.json({ success: false, error: 'Your payment was received! Please complete your account setup first by clicking "Set Up Your Account" from your confirmation email, or sign up with this email address.' }, 401);
      }
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    if (user.is_blocked) {
      return c.json({ success: false, error: 'Your account has been suspended. Please contact support.' }, 403);
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await pool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [user.id]);
    await logUserEvent(user.id, 'login', 'User logged in', `Successful login`, { email: user.email });

    console.log(`[Auth] User logged in: ${email}`);
    return c.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        ai_usage: user.ai_usage,
        created_at: user.created_at,
        card_validated: user.card_validated,
        selected_plan: user.selected_plan,
        email_verified: user.email_verified || false,
        current_period_end: user.current_period_end || null,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return c.json({ success: false, error: 'Login failed. Please try again.' }, 500);
  }
});

accountRoutes.post('/verify-email', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json({ success: false, error: 'Verification token is required' }, 400);
    }

    const tokenResult = await pool.query(
      `SELECT * FROM email_verification_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return c.json({ success: false, error: 'Invalid or expired verification token' }, 400);
    }

    const tokenRecord = tokenResult.rows[0];

    await pool.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRecord.id]
    );

    await pool.query(
      'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
      [tokenRecord.user_id]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenRecord.user_id]);
    const user = userResult.rows[0];

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await EmailService.sendRaw(user.email, 'welcome', { name: user.full_name || 'there' });
    await logUserEvent(user.id, 'email_verified', 'Email verified', `User verified their email address`, { email: user.email });
    await logUserEvent(user.id, 'email_sent', 'Welcome email sent', `Welcome email dispatched after verification`, { email: user.email, template: 'welcome' });

    console.log(`[Auth] Email verified: ${user.email}`);
    return c.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        ai_usage: user.ai_usage,
        created_at: user.created_at,
        card_validated: user.card_validated,
        selected_plan: user.selected_plan
      }
    });
  } catch (error: any) {
    console.error('[Auth] Email verification error:', error);
    return c.json({ success: false, error: 'Verification failed. Please try again.' }, 500);
  }
});

accountRoutes.post('/resend-verification', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND email_verified = false',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return c.json({ success: true, message: 'If an unverified account exists, a verification email has been sent' });
    }

    const user = userResult.rows[0];

    const recentTokens = await pool.query(
      `SELECT COUNT(*) as cnt FROM email_verification_tokens 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [user.id]
    );
    const recentCount = parseInt(recentTokens.rows[0]?.cnt || '0', 10);
    if (recentCount >= 3) {
      return c.json({ success: false, error: 'Too many verification emails sent. Please try again in an hour.' }, 429);
    }

    await pool.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await pool.query(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [user.id, token, expiresAt]
    );

    const emailBase = getEmailBaseUrl(c);
    const verificationUrl = `${emailBase}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    await EmailService.sendRaw(user.email, 'emailVerification', { verification_url: verificationUrl });
    await logUserEvent(user.id, 'email_verification_sent', 'Verification email resent', `Verification email resent`, { email: user.email, attemptNumber: recentCount + 1 });

    console.log(`[Auth] Verification email resent: ${email} (${recentCount + 1}/3 this hour)`);
    return c.json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    console.error('[Auth] Resend verification error:', error);
    return c.json({ success: false, error: 'Failed to resend verification email' }, 500);
  }
});

// ── Passwordless / Magic Link Auth ────────────────────────────────────────────

accountRoutes.post('/send-magic-link', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || typeof email !== 'string') {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Rate-limit: max 5 magic links per email per hour
    const rateCheck = await pool.query(
      `SELECT COUNT(*) AS cnt FROM magic_link_tokens WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [normalizedEmail]
    );
    if (parseInt(rateCheck.rows[0]?.cnt || '0', 10) >= 5) {
      return c.json({ success: false, error: 'Too many requests. Please try again in an hour.' }, 429);
    }

    // Find or create user
    let userRow: any;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      userRow = existing.rows[0];
    } else {
      // New user — create with 7-day trial
      const userId = crypto.randomUUID();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const signupIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null;
      await pool.query(
        `INSERT INTO users (id, email, email_verified, role, subscription_plan, subscription_status, current_period_end, trial_starts_at, signup_ip, created_at, updated_at)
         VALUES ($1, $2, true, 'user', 'free', 'trialing', $3, NOW(), $4, NOW(), NOW())`,
        [userId, normalizedEmail, trialEnd, signupIp]
      );
      // Create Stripe customer in background (non-blocking)
      try {
        const stripeClient = await getUncachableStripeClient();
        if (stripeClient) {
          const customer = await stripeClient.customers.create({ email: normalizedEmail, metadata: { userId } });
          await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
        }
      } catch {}
      await logUserEvent(userId, 'signup', 'User registered', 'Passwordless signup — magic link', { email: normalizedEmail });
      const freshUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      userRow = freshUser.rows[0];
    }

    if (userRow.is_blocked) {
      return c.json({ success: false, error: 'Account suspended. Please contact support.' }, 403);
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const isNewUser = !existing.rows.length;

    await pool.query(
      `INSERT INTO magic_link_tokens (token, email, user_id, type, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, normalizedEmail, userRow.id, isNewUser ? 'signup' : 'login', expiresAt]
    );

    const baseUrl = getEmailBaseUrl(c);
    const magicUrl = `${baseUrl}/auth/magic?token=${token}`;
    const subjectLine = isNewUser
      ? 'Welcome to Adiology — sign in to start your free trial'
      : 'Your Adiology sign-in link';

    await EmailService.sendRaw(normalizedEmail, 'magic_link', {
      magic_link_url: magicUrl,
      subject_line: subjectLine,
    });

    console.log(`[Auth] Magic link sent to ${normalizedEmail} (new=${isNewUser})`);
    return c.json({ success: true, message: 'Magic link sent. Check your email.', isNewUser });
  } catch (error: any) {
    console.error('[Auth] Send magic link error:', error);
    return c.json({ success: false, error: 'Failed to send magic link. Please try again.' }, 500);
  }
});

accountRoutes.post('/verify-magic-link', async (c) => {
  try {
    const { token } = await c.req.json();
    if (!token || typeof token !== 'string') {
      return c.json({ success: false, error: 'Token is required' }, 400);
    }

    const tokenResult = await pool.query(
      `SELECT * FROM magic_link_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    if (tokenResult.rows.length === 0) {
      return c.json({ success: false, error: 'This link has expired or already been used. Please request a new one.' }, 400);
    }

    const tokenRow = tokenResult.rows[0];

    // Mark token as used
    await pool.query('UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1', [tokenRow.id]);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenRow.user_id]);
    if (userResult.rows.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    const user = userResult.rows[0];

    // Mark email verified if not already
    if (!user.email_verified) {
      await pool.query('UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);
    }

    await pool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [user.id]);

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const isNewSignup = tokenRow.type === 'signup';
    await logUserEvent(user.id, isNewSignup ? 'signup_complete' : 'login', isNewSignup ? 'Magic link signup complete' : 'Magic link login', 'User signed in via magic link', { email: user.email });

    // Send welcome email for brand-new users
    if (isNewSignup) {
      EmailService.sendRaw(user.email, 'welcome', { name: user.full_name || 'there' }).catch(err => {
        console.error('[Auth] Failed to send welcome email after magic link signup:', err);
      });
    }

    console.log(`[Auth] Magic link verified: ${user.email} (new=${isNewSignup})`);
    return c.json({
      success: true,
      token: jwtToken,
      is_new_signup: isNewSignup,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role || 'user',
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        created_at: user.created_at,
        card_validated: user.card_validated || false,
        selected_plan: user.selected_plan || null,
        email_verified: true,
        current_period_end: user.current_period_end || null,
        trial_starts_at: user.trial_starts_at || null,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Verify magic link error:', error);
    return c.json({ success: false, error: 'Verification failed. Please try again.' }, 500);
  }
});

// ── Complete Profile (after magic link signup) ────────────────────────────────
accountRoutes.post('/complete-profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    const { full_name, password } = await c.req.json();
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 1) {
      return c.json({ success: false, error: 'Full name is required' }, 400);
    }
    if (password && typeof password === 'string' && password.length < 8) {
      return c.json({ success: false, error: 'Password must be at least 8 characters' }, 400);
    }

    const updates: string[] = ['full_name = $1', 'updated_at = NOW()'];
    const values: any[] = [full_name.trim()];

    if (password && typeof password === 'string' && password.trim().length >= 8) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${values.length + 1}`);
      values.push(hash);
    }

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    console.log(`[Auth] Profile completed for user: ${user.email}`);
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role || 'user',
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        card_validated: user.card_validated || false,
        selected_plan: user.selected_plan || null,
        email_verified: user.email_verified,
        current_period_end: user.current_period_end || null,
        trial_starts_at: user.trial_starts_at || null,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Complete profile error:', error);
    return c.json({ success: false, error: 'Failed to update profile. Please try again.' }, 500);
  }
});

// ── Google OAuth Sign-In ──────────────────────────────────────────────────────
accountRoutes.post('/auth/google', async (c) => {
  try {
    const { credential } = await c.req.json();
    if (!credential) return c.json({ success: false, error: 'No credential provided' }, 400);

    // Verify the Google ID token via Google's tokeninfo endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) return c.json({ success: false, error: 'Invalid Google token' }, 401);
    const googleData: any = await googleRes.json();

    if (googleData.error_description) {
      return c.json({ success: false, error: 'Google token verification failed' }, 401);
    }

    // Optionally verify audience matches our client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && googleData.aud !== clientId) {
      return c.json({ success: false, error: 'Token audience mismatch' }, 401);
    }

    const email = googleData.email?.toLowerCase()?.trim();
    const name = googleData.name || '';
    const avatar = googleData.picture || null;

    if (!email) return c.json({ success: false, error: 'No email returned from Google' }, 400);

    // Find or create user
    let userRow: any;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      userRow = existing.rows[0];
      // Update avatar if not already set, and ensure email is verified
      await pool.query(
        'UPDATE users SET last_sign_in = NOW(), email_verified = true, avatar_url = COALESCE(avatar_url, $1), updated_at = NOW() WHERE id = $2',
        [avatar, userRow.id]
      );
    } else {
      // New user — create with 7-day trial
      const userId = crypto.randomUUID();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const signupIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null;
      await pool.query(
        `INSERT INTO users (id, email, full_name, avatar_url, email_verified, role, subscription_plan, subscription_status, current_period_end, trial_starts_at, signup_ip, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, 'user', 'free', 'trialing', $5, NOW(), $6, NOW(), NOW())`,
        [userId, email, name, avatar, trialEnd, signupIp]
      );
      try {
        const stripeClient = await getUncachableStripeClient();
        if (stripeClient) {
          const customer = await stripeClient.customers.create({ email, name, metadata: { userId } });
          await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customer.id, userId]);
        }
      } catch {}
      await logUserEvent(userId, 'signup', 'User registered', 'Google OAuth signup', { email });
      const freshUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      userRow = freshUser.rows[0];
    }

    if (userRow.is_blocked) {
      return c.json({ success: false, error: 'Account suspended. Please contact support.' }, 403);
    }

    await pool.query('UPDATE users SET last_sign_in = NOW() WHERE id = $1', [userRow.id]);

    const jwtToken = jwt.sign(
      { userId: userRow.id, email: userRow.email, role: userRow.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await logUserEvent(userRow.id, 'login', 'Google OAuth login', 'User signed in via Google', { email });

    console.log(`[Auth] Google sign-in: ${email}`);
    return c.json({
      success: true,
      token: jwtToken,
      user: {
        id: userRow.id,
        email: userRow.email,
        full_name: userRow.full_name || name,
        avatar_url: userRow.avatar_url || avatar,
        role: userRow.role || 'user',
        subscription_plan: userRow.subscription_plan,
        subscription_status: userRow.subscription_status,
        stripe_customer_id: userRow.stripe_customer_id,
        created_at: userRow.created_at,
        card_validated: userRow.card_validated || false,
        selected_plan: userRow.selected_plan || null,
        email_verified: true,
        current_period_end: userRow.current_period_end || null,
        trial_starts_at: userRow.trial_starts_at || null,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Google auth error:', error);
    return c.json({ success: false, error: 'Google sign-in failed. Please try again.' }, 500);
  }
});

accountRoutes.get('/verification-status', async (c) => {
  try {
    const email = c.req.query('email');
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const result = await pool.query(
      'SELECT email_verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ 
      success: true, 
      verified: result.rows[0].email_verified === true 
    });
  } catch (error: any) {
    console.error('[Auth] Verification status check error:', error);
    return c.json({ success: false, error: 'Failed to check verification status' }, 500);
  }
});

accountRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [user.id]
      );

      const token = crypto.randomUUID();

      await pool.query(
        `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
         VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '1 hour', NOW())`,
        [user.id, token]
      );

      const resetUrl = `${EMAIL_BASE_URL}/reset-password?token=${token}`;
      const emailResult = await EmailService.sendRaw(user.email, 'passwordReset', { reset_url: resetUrl });
      await logUserEvent(user.id, 'password_reset_requested', 'Password reset requested', `Password reset email sent`, { email: normalizedEmail });

      if (emailResult.success) {
        console.log(`[Auth] Password reset email sent to: ${normalizedEmail}`);
      } else {
        console.error(`[Auth] Failed to send password reset email to ${normalizedEmail}:`, emailResult.error);
      }
    }

    return c.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent' });
  } catch (error: any) {
    console.error('[Auth] Forgot password error:', error);
    return c.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent' });
  }
});

accountRoutes.post('/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password) {
      return c.json({ success: false, error: 'Token and new password are required' }, 400);
    }

    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return c.json({ success: false, error: 'Invalid or expired reset token' }, 400);
    }

    const tokenRecord = tokenResult.rows[0];

    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRecord.id]
    );

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, email_verified = true, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRecord.user_id]
    );

    await logUserEvent(tokenRecord.user_id, 'password_reset_completed', 'Password reset completed', `Password was successfully reset`);

    console.log(`[Auth] Password reset completed for user: ${tokenRecord.user_id} (email auto-verified)`);
    return c.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('[Auth] Reset password error:', error);
    return c.json({ success: false, error: 'Password reset failed. Please try again.' }, 500);
  }
});

accountRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const user = result.rows[0];

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        ai_usage: user.ai_usage,
        is_blocked: user.is_blocked,
        last_sign_in: user.last_sign_in,
        created_at: user.created_at,
        updated_at: user.updated_at,
        card_validated: user.card_validated || false,
        selected_plan: user.selected_plan || null,
        email_verified: user.email_verified || false,
        current_period_end: user.current_period_end || null,
        trial_starts_at: user.trial_starts_at || null,
      }
    });
  } catch (error: any) {
    console.error('[Auth] Get user error:', error);
    return c.json({ success: false, error: 'Failed to get user data' }, 500);
  }
});

accountRoutes.get('/reditus-token', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    const result = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const user = result.rows[0];
    const productSecret = process.env.REDITUS_PRODUCT_SECRET;
    if (!productSecret) {
      return c.json({ success: false, error: 'Referral widget not configured' }, 500);
    }

    const referralToken = jwt.sign(
      { email: user.email, name: user.full_name || user.email },
      productSecret,
      { expiresIn: '1h' }
    );

    return c.json({ success: true, token: referralToken });
  } catch (error: any) {
    console.error('[Reditus] Token generation error:', error);
    return c.json({ success: false, error: 'Failed to generate referral token' }, 500);
  }
});
