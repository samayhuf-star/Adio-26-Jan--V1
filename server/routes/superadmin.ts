import { Hono } from 'hono';
import { db } from '../db';
import { users, subscriptions } from '../../shared/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import crypto from 'crypto';
import { nhostAdmin } from '../nhostAdmin';

const app = new Hono();

const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

const activeTokens = new Map<string, { expires: number }>();
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function isValidToken(token: string): boolean {
  const session = activeTokens.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

function isRateLimited(ip: string): boolean {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return false;
  
  if (Date.now() - attempt.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip: string, success: boolean) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempt.count++;
  attempt.lastAttempt = Date.now();
  loginAttempts.set(ip, attempt);
}

function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  if (!isValidToken(token)) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  return next();
}

app.post('/login', async (c) => {
  try {
    if (!SUPERADMIN_USERNAME || !SUPERADMIN_PASSWORD) {
      console.error('[SuperAdmin] Credentials not configured in environment variables');
      return c.json({ error: 'Admin panel not configured' }, 503);
    }
    
    const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    
    if (isRateLimited(clientIp)) {
      console.log(`[SuperAdmin] Rate limited login attempt from IP: ${clientIp}`);
      return c.json({ error: 'Too many failed attempts. Please try again later.' }, 429);
    }
    
    const { username, password } = await c.req.json();
    
    if (username !== SUPERADMIN_USERNAME || password !== SUPERADMIN_PASSWORD) {
      console.log(`[SuperAdmin] Failed login attempt for username: ${username} from IP: ${clientIp}`);
      recordLoginAttempt(clientIp, false);
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    recordLoginAttempt(clientIp, true);
    
    const token = generateToken();
    const expires = Date.now() + (24 * 60 * 60 * 1000);
    activeTokens.set(token, { expires });
    
    console.log(`[SuperAdmin] Successful login from IP: ${clientIp}`);
    return c.json({ token, expires });
  } catch (error: any) {
    console.error('[SuperAdmin] Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.get('/validate', authMiddleware, async (c) => {
  return c.json({ valid: true });
});

app.post('/logout', authMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.substring(7);
  if (token) {
    activeTokens.delete(token);
  }
  return c.json({ success: true });
});

app.get('/stats', authMiddleware, async (c) => {
  try {
    // Get user count from Nhost
    let totalUsers = 0;
    let blockedUsers = 0;
    
    if (nhostAdmin.isConfigured()) {
      totalUsers = await nhostAdmin.getUserCount();
      blockedUsers = await nhostAdmin.getBlockedUserCount();
    }
    
    // Get subscriptions from local database (Stripe sync)
    let activeSubscriptions = 0;
    let trialUsers = 0;
    let monthlyRevenue = 0;
    
    try {
      const [activeSubCount] = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));
      activeSubscriptions = activeSubCount?.count || 0;
      
      const [trialCount] = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'trialing'));
      trialUsers = trialCount?.count || 0;
      
      const revenueResult = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CASE WHEN status = 'active' THEN 
            CASE plan_name 
              WHEN 'Starter' THEN 29
              WHEN 'Professional' THEN 59
              WHEN 'Agency' THEN 129
              ELSE 0 
            END 
          ELSE 0 END), 0)` 
        })
        .from(subscriptions);
      monthlyRevenue = revenueResult[0]?.total || 0;
    } catch (dbError) {
      console.error('[SuperAdmin] Subscriptions DB error:', dbError);
    }
    
    return c.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue,
      trialUsers,
      blockedUsers
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Stats error:', error);
    return c.json({ error: 'Failed to load stats' }, 500);
  }
});

app.get('/users', authMiddleware, async (c) => {
  try {
    // Get users from Nhost
    if (!nhostAdmin.isConfigured()) {
      console.error('[SuperAdmin] Nhost not configured');
      return c.json({ users: [], error: 'Nhost not configured' });
    }
    
    const nhostUsers = await nhostAdmin.getUsers(200, 0);
    
    // Transform to expected format
    const allUsers = nhostUsers.map((user: any) => ({
      id: user.id,
      email: user.email,
      fullName: user.displayName || user.metadata?.name || '',
      role: user.metadata?.role || 'user',
      subscriptionPlan: user.metadata?.subscriptionPlan || null,
      subscriptionStatus: user.metadata?.subscriptionStatus || null,
      isBlocked: user.disabled || false,
      createdAt: user.createdAt,
      lastSignIn: user.lastSeen
    }));
    
    return c.json({ users: allUsers });
  } catch (error: any) {
    console.error('[SuperAdmin] Users error:', error);
    return c.json({ error: 'Failed to load users' }, 500);
  }
});

// Get single user by ID
app.get('/users/:userId', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!nhostAdmin.isConfigured()) {
      return c.json({ error: 'Nhost not configured' }, 500);
    }
    
    const user = await nhostAdmin.getUserById(userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || '',
        avatarUrl: user.avatarUrl || null,
        disabled: user.disabled || false,
        emailVerified: user.emailVerified || false,
        metadata: user.metadata || {},
        createdAt: user.createdAt,
        lastSeen: user.lastSeen
      }
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Update user details
app.put('/users/:userId', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { displayName, email, metadata } = await c.req.json();
    
    if (!nhostAdmin.isConfigured()) {
      return c.json({ error: 'Nhost not configured' }, 500);
    }
    
    let success = true;
    
    if (displayName !== undefined) {
      success = success && await nhostAdmin.updateUserDisplayName(userId, displayName);
    }
    
    if (email !== undefined) {
      success = success && await nhostAdmin.updateUserEmail(userId, email);
    }
    
    if (metadata !== undefined) {
      success = success && await nhostAdmin.updateUserMetadata(userId, metadata);
    }
    
    if (!success) {
      return c.json({ error: 'Failed to update user' }, 500);
    }
    
    console.log(`[SuperAdmin] User ${userId} updated`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Block/unblock user
app.post('/users/:userId/block', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { block } = await c.req.json();
    
    if (!nhostAdmin.isConfigured()) {
      return c.json({ error: 'Nhost not configured' }, 500);
    }
    
    const success = await nhostAdmin.setUserDisabled(userId, block);
    
    if (!success) {
      return c.json({ error: 'Failed to update user' }, 500);
    }
    
    console.log(`[SuperAdmin] User ${userId} ${block ? 'blocked' : 'unblocked'}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Block user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user
app.delete('/users/:userId', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!nhostAdmin.isConfigured()) {
      return c.json({ error: 'Nhost not configured' }, 500);
    }
    
    const success = await nhostAdmin.deleteUser(userId);
    
    if (!success) {
      return c.json({ error: 'Failed to delete user' }, 500);
    }
    
    console.log(`[SuperAdmin] User ${userId} deleted`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

app.get('/subscriptions', authMiddleware, async (c) => {
  try {
    const allSubs = await db
      .select({
        id: subscriptions.id,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        userId: subscriptions.userId,
        planName: subscriptions.planName,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt
      })
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(200);
    
    const subsWithEmail = await Promise.all(
      allSubs.map(async (sub: typeof allSubs[0]) => {
        let userEmail = null;
        if (sub.userId) {
          // Try to get email from Nhost first
          if (nhostAdmin.isConfigured()) {
            const nhostUser = await nhostAdmin.getUserById(sub.userId);
            userEmail = nhostUser?.email || null;
          }
          // Fallback to local DB
          if (!userEmail) {
            const [user] = await db
              .select({ email: users.email })
              .from(users)
              .where(eq(users.id, sub.userId))
              .limit(1);
            userEmail = user?.email || null;
          }
        }
        return { ...sub, userEmail };
      })
    );
    
    return c.json({ subscriptions: subsWithEmail });
  } catch (error: any) {
    console.error('[SuperAdmin] Subscriptions error:', error);
    return c.json({ error: 'Failed to load subscriptions' }, 500);
  }
});

// Get single subscription
app.get('/subscriptions/:subId', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('subId');
    
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subId))
      .limit(1);
    
    if (!sub) {
      return c.json({ error: 'Subscription not found' }, 404);
    }
    
    return c.json({ subscription: sub });
  } catch (error: any) {
    console.error('[SuperAdmin] Get subscription error:', error);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

// Update subscription
app.put('/subscriptions/:subId', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('subId');
    const { planName, status, cancelAtPeriodEnd } = await c.req.json();
    
    const updateData: any = { updatedAt: new Date() };
    
    if (planName !== undefined) updateData.planName = planName;
    if (status !== undefined) updateData.status = status;
    if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
    
    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, subId));
    
    console.log(`[SuperAdmin] Subscription ${subId} updated`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Update subscription error:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

// Cancel subscription (set to canceled status)
app.post('/subscriptions/:subId/cancel', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('subId');
    const { immediate } = await c.req.json();
    
    if (immediate) {
      await db
        .update(subscriptions)
        .set({ 
          status: 'canceled',
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, subId));
    } else {
      await db
        .update(subscriptions)
        .set({ 
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, subId));
    }
    
    console.log(`[SuperAdmin] Subscription ${subId} ${immediate ? 'canceled' : 'set to cancel at period end'}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Cancel subscription error:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// Reactivate subscription
app.post('/subscriptions/:subId/reactivate', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('subId');
    
    await db
      .update(subscriptions)
      .set({ 
        status: 'active',
        cancelAtPeriodEnd: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subId));
    
    console.log(`[SuperAdmin] Subscription ${subId} reactivated`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Reactivate subscription error:', error);
    return c.json({ error: 'Failed to reactivate subscription' }, 500);
  }
});

// Delete subscription
app.delete('/subscriptions/:subId', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('subId');
    
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, subId));
    
    console.log(`[SuperAdmin] Subscription ${subId} deleted`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Delete subscription error:', error);
    return c.json({ error: 'Failed to delete subscription' }, 500);
  }
});

export { app as superadminRoutes };
