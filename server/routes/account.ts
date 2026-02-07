import { Hono } from 'hono';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDatabaseUrl } from '../dbConfig';
import { EmailService } from '../emailService';

const { Pool } = pg;
const pool = new Pool({ connectionString: getDatabaseUrl() });

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';
const BASE_URL = process.env.DOMAIN || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://adiology.io');

export const accountRoutes = new Hono();

accountRoutes.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    try {
      await pool.query(
        `INSERT INTO users (id, email, full_name, password_hash, email_verified, role, subscription_plan, subscription_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, 'user', 'free', 'active', NOW(), NOW())`,
        [userId, email.toLowerCase().trim(), name || null, passwordHash]
      );
    } catch (dbError: any) {
      if (dbError.code === '23505') {
        return c.json({ success: false, error: 'An account with this email already exists' }, 409);
      }
      throw dbError;
    }

    const token = crypto.randomUUID();
    await pool.query(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '24 hours', NOW())`,
      [userId, token]
    );

    const verificationUrl = `${BASE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email.toLowerCase().trim())}`;
    await EmailService.sendRaw(email.toLowerCase().trim(), 'emailVerification', { verification_url: verificationUrl });

    console.log(`[Auth] User registered: ${email}`);
    return c.json({
      success: true,
      message: 'Please check your email to verify your account',
      needsEmailVerification: true
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
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    if (!user.email_verified) {
      return c.json({ success: false, error: 'Please verify your email before signing in', needsEmailVerification: true }, 403);
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
        created_at: user.created_at
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
        created_at: user.created_at
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

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND email_verified = false',
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return c.json({ success: true, message: 'If an unverified account exists, a verification email has been sent' });
    }

    const user = userResult.rows[0];

    await pool.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    const token = crypto.randomUUID();
    await pool.query(
      `INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '24 hours', NOW())`,
      [user.id, token]
    );

    const verificationUrl = `${BASE_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    await EmailService.sendRaw(user.email, 'emailVerification', { verification_url: verificationUrl });

    console.log(`[Auth] Verification email resent: ${email}`);
    return c.json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    console.error('[Auth] Resend verification error:', error);
    return c.json({ success: false, error: 'Failed to resend verification email' }, 500);
  }
});

accountRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const token = crypto.randomUUID();

      await pool.query(
        `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
         VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '1 hour', NOW())`,
        [user.id, token]
      );

      const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
      await EmailService.sendRaw(user.email, 'passwordReset', { reset_url: resetUrl });

      console.log(`[Auth] Password reset requested: ${email}`);
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
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRecord.user_id]
    );

    console.log(`[Auth] Password reset completed for user: ${tokenRecord.user_id}`);
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
        updated_at: user.updated_at
      }
    });
  } catch (error: any) {
    console.error('[Auth] Get user error:', error);
    return c.json({ success: false, error: 'Failed to get user data' }, 500);
  }
});
