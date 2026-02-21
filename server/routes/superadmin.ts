import { Hono } from 'hono';
import { db } from '../db';
import { users, subscriptions, auditLogs } from '../../shared/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import crypto from 'crypto';
import { nhostAdmin } from '../nhostAdmin';
import { getUncachableStripeClient } from '../stripeClient';
import { getWhatsAppStatus, setReportingEnabled, sendTestMessage, sendHourlyReport } from '../services/whatsapp';

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

async function logAuditAction(params: {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  details?: any;
  level?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      adminUserId: 'superadmin',
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      oldValues: params.oldValues || null,
      newValues: params.newValues || null,
      details: params.details || null,
      level: params.level || 'info',
    });
  } catch (err) {
    console.error('[Audit] Failed to log action:', err);
  }
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
    await logAuditAction({ action: 'admin_login', resourceType: 'session', details: { ip: clientIp } });
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
              WHEN 'Starter' THEN 49
              WHEN 'Professional' THEN 99
              WHEN 'Agency' THEN 149
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
    await logAuditAction({ action: 'user_updated', resourceType: 'user', resourceId: userId, newValues: { displayName, email } });
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
    await logAuditAction({ action: block ? 'user_blocked' : 'user_unblocked', resourceType: 'user', resourceId: userId });
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
    await logAuditAction({ action: 'user_deleted', resourceType: 'user', resourceId: userId, level: 'warning' });
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
    await logAuditAction({ action: 'subscription_updated', resourceType: 'subscription', resourceId: subId, newValues: { planName, status, cancelAtPeriodEnd } });
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
    await logAuditAction({ action: 'subscription_canceled', resourceType: 'subscription', resourceId: subId, details: { immediate }, level: 'warning' });
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
    await logAuditAction({ action: 'subscription_reactivated', resourceType: 'subscription', resourceId: subId });
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
    await logAuditAction({ action: 'subscription_deleted', resourceType: 'subscription', resourceId: subId, level: 'warning' });
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Delete subscription error:', error);
    return c.json({ error: 'Failed to delete subscription' }, 500);
  }
});

app.get('/email-stats', authMiddleware, async (c) => {
  try {
    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM email_logs 
      WHERE created_at >= CURRENT_DATE
    `).catch(() => ({ rows: [{ count: 0 }] }));

    const deliveredResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ delivered: 0, total: 0 }] }));

    const openedResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE opened = true) as opened,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ opened: 0, total: 0 }] }));

    const bouncedResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ bounced: 0, total: 0 }] }));

    const sentToday = Number(sentTodayResult.rows[0]?.count || 0);
    const delivered = Number(deliveredResult.rows[0]?.delivered || 0);
    const totalDelivery = Number(deliveredResult.rows[0]?.total || 0);
    const opened = Number(openedResult.rows[0]?.opened || 0);
    const totalOpened = Number(openedResult.rows[0]?.total || 0);
    const bounced = Number(bouncedResult.rows[0]?.bounced || 0);
    const totalBounced = Number(bouncedResult.rows[0]?.total || 0);

    return c.json({
      sentToday,
      deliveryRate: totalDelivery > 0 ? Math.round((delivered / totalDelivery) * 100) : 0,
      openRate: totalOpened > 0 ? Math.round((opened / totalOpened) * 100) : 0,
      bounceRate: totalBounced > 0 ? Math.round((bounced / totalBounced) * 100) : 0,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Email stats error:', error);
    return c.json({ sentToday: 0, deliveryRate: 0, openRate: 0, bounceRate: 0 });
  }
});

app.get('/stripe-dashboard', authMiddleware, async (c) => {
  try {
    const stripe = await getUncachableStripeClient();

    let totalRevenue = 0;
    let recentTransactions: any[] = [];

    if (stripe) {
      try {
        const charges = await stripe.charges.list({ limit: 100 });
        totalRevenue = charges.data
          .filter((ch) => ch.status === 'succeeded')
          .reduce((sum, ch) => sum + ch.amount, 0) / 100;
      } catch (stripeErr) {
        console.error('[SuperAdmin] Stripe charges error:', stripeErr);
      }

      try {
        const recent = await stripe.charges.list({ limit: 10, expand: ['data.customer'] });
        recentTransactions = recent.data.map((ch) => ({
          amount: ch.amount / 100,
          currency: ch.currency,
          status: ch.status,
          created: new Date(ch.created * 1000).toISOString(),
          customerEmail: typeof ch.customer === 'object' && ch.customer !== null ? (ch.customer as any).email || null : null,
        }));
      } catch (stripeErr) {
        console.error('[SuperAdmin] Stripe recent transactions error:', stripeErr);
      }
    }

    let mrr = 0;
    try {
      const mrrResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CASE
            WHEN status = 'active' THEN
              CASE plan_name
                WHEN 'Starter' THEN 49
                WHEN 'Professional' THEN 99
                WHEN 'Agency' THEN 149
                ELSE 0
              END
            ELSE 0 END), 0)`
        })
        .from(subscriptions);
      mrr = mrrResult[0]?.total || 0;
    } catch (dbErr) {
      console.error('[SuperAdmin] MRR DB error:', dbErr);
    }

    let lifetimeDeals = 0;
    try {
      const [ltResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.subscriptionPlan, 'Lifetime'));
      lifetimeDeals = ltResult?.count || 0;
    } catch (dbErr) {
      console.error('[SuperAdmin] Lifetime deals DB error:', dbErr);
    }
    const lifetimeRevenue = lifetimeDeals * 99;

    let churnRate = 0;
    try {
      const churnResult = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'canceled') as canceled,
          COUNT(*) FILTER (WHERE status = 'active') as active
        FROM subscriptions
      `);
      const canceled = Number(churnResult.rows[0]?.canceled || 0);
      const active = Number(churnResult.rows[0]?.active || 0);
      const total = active + canceled;
      churnRate = total > 0 ? Math.round((canceled / total) * 10000) / 100 : 0;
    } catch (dbErr) {
      console.error('[SuperAdmin] Churn rate DB error:', dbErr);
    }

    let planDistribution: any[] = [];
    try {
      const distResult = await db.execute(sql`
        SELECT subscription_plan as plan, COUNT(*) as count
        FROM users
        GROUP BY subscription_plan
        ORDER BY count DESC
      `);
      planDistribution = distResult.rows.map((row: any) => ({
        plan: row.plan || 'free',
        count: Number(row.count),
      }));
    } catch (dbErr) {
      console.error('[SuperAdmin] Plan distribution DB error:', dbErr);
    }

    return c.json({
      totalRevenue,
      mrr,
      lifetimeDeals,
      lifetimeRevenue,
      churnRate,
      recentTransactions,
      planDistribution,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Stripe dashboard error:', error);
    return c.json({ error: 'Failed to load stripe dashboard' }, 500);
  }
});

app.get('/system-health', authMiddleware, async (c) => {
  try {
    const mem = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    };

    let dbStatus = 'disconnected';
    try {
      await db.execute(sql`SELECT 1`);
      dbStatus = 'connected';
    } catch (dbErr) {
      console.error('[SuperAdmin] DB health check failed:', dbErr);
    }

    let dbStats = { tableCount: 0, dbSize: '0 bytes' };
    try {
      const tableResult = await db.execute(sql`SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`);
      const sizeResult = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size`);
      dbStats = {
        tableCount: Number(tableResult.rows[0]?.table_count || 0),
        dbSize: String(sizeResult.rows[0]?.db_size || '0 bytes'),
      };
    } catch (dbErr) {
      console.error('[SuperAdmin] DB stats error:', dbErr);
    }

    return c.json({
      uptime: process.uptime(),
      memoryUsage,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      dbStatus,
      dbStats,
      serverTime: new Date().toISOString(),
      activeAdminSessions: activeTokens.size,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] System health error:', error);
    return c.json({ error: 'Failed to load system health' }, 500);
  }
});

app.get('/promo-codes', authMiddleware, async (c) => {
  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return c.json({ promoCodes: [] });
    }

    const promoCodes = await stripe.promotionCodes.list({ limit: 20, active: true, expand: ['data.coupon'] });
    const formatted = promoCodes.data.map((pc: any) => ({
      id: pc.id,
      code: pc.code,
      percentOff: pc.coupon?.percent_off || null,
      timesRedeemed: pc.coupon?.times_redeemed || 0,
      maxRedemptions: pc.max_redemptions || null,
      active: pc.active,
      created: new Date(pc.created * 1000).toISOString(),
    }));

    return c.json({ promoCodes: formatted });
  } catch (error: any) {
    console.error('[SuperAdmin] Promo codes error:', error);
    return c.json({ error: 'Failed to load promo codes' }, 500);
  }
});

app.post('/promo-codes', authMiddleware, async (c) => {
  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const { code, percentOff, maxRedemptions, duration } = await c.req.json();

    if (!code || !percentOff) {
      return c.json({ error: 'code and percentOff are required' }, 400);
    }

    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: duration || 'once',
    });

    const promoCode = await (stripe.promotionCodes as any).create({
      coupon: coupon.id,
      code,
      max_redemptions: maxRedemptions || undefined,
    });

    await logAuditAction({ action: 'promo_code_created', resourceType: 'promo_code', resourceId: promoCode.id, newValues: { code, percentOff, maxRedemptions } });

    return c.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        percentOff: coupon.percent_off,
        active: promoCode.active,
      },
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Create promo code error:', error);
    return c.json({ error: error.message || 'Failed to create promo code' }, 500);
  }
});

app.post('/promo-codes/:promoId/deactivate', authMiddleware, async (c) => {
  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const promoId = c.req.param('promoId');
    await stripe.promotionCodes.update(promoId, { active: false });
    await logAuditAction({ action: 'promo_code_deactivated', resourceType: 'promo_code', resourceId: promoId, level: 'warning' });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Deactivate promo code error:', error);
    return c.json({ error: error.message || 'Failed to deactivate promo code' }, 500);
  }
});

app.get('/email-monitoring', authMiddleware, async (c) => {
  try {
    const sentTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM email_logs
      WHERE sent_at >= CURRENT_DATE
    `).catch(() => ({ rows: [{ count: 0 }] }));

    const deliveredResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ delivered: 0, total: 0 }] }));

    const openedResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE opens > 0) as opened,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ opened: 0, total: 0 }] }));

    const bouncedResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ bounced: 0, total: 0 }] }));

    const sentToday = Number(sentTodayResult.rows[0]?.count || 0);
    const delivered = Number(deliveredResult.rows[0]?.delivered || 0);
    const totalDelivery = Number(deliveredResult.rows[0]?.total || 0);
    const opened = Number(openedResult.rows[0]?.opened || 0);
    const totalOpened = Number(openedResult.rows[0]?.total || 0);
    const bounced = Number(bouncedResult.rows[0]?.bounced || 0);
    const totalBounced = Number(bouncedResult.rows[0]?.total || 0);

    let totalSent = 0;
    try {
      const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs`);
      totalSent = Number(totalResult.rows[0]?.count || 0);
    } catch (dbErr) {
      console.error('[SuperAdmin] Email total count error:', dbErr);
    }

    let recentEmails: any[] = [];
    try {
      const recentResult = await db.execute(sql`SELECT id, recipient, subject, status, opens, clicks, sent_at FROM email_logs ORDER BY sent_at DESC LIMIT 15`);
      recentEmails = recentResult.rows.map((row: any) => ({
        id: row.id,
        to: row.recipient,
        subject: row.subject,
        status: row.status,
        opened: (row.opens || 0) > 0,
        clicked: (row.clicks || 0) > 0,
        sentAt: row.sent_at,
      }));
    } catch (dbErr) {
      console.error('[SuperAdmin] Recent emails error:', dbErr);
    }

    let dailyStats: any[] = [];
    try {
      const dailyResult = await db.execute(sql`
        SELECT DATE(sent_at) as date, COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE opens > 0) as opened
        FROM email_logs
        WHERE sent_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
      `);
      dailyStats = dailyResult.rows.map((row: any) => ({
        date: row.date,
        count: Number(row.count),
        delivered: Number(row.delivered),
        opened: Number(row.opened),
      }));
    } catch (dbErr) {
      console.error('[SuperAdmin] Daily email stats error:', dbErr);
    }

    return c.json({
      sentToday,
      deliveryRate: totalDelivery > 0 ? Math.round((delivered / totalDelivery) * 100) : 0,
      openRate: totalOpened > 0 ? Math.round((opened / totalOpened) * 100) : 0,
      bounceRate: totalBounced > 0 ? Math.round((bounced / totalBounced) * 100) : 0,
      totalSent,
      recentEmails,
      dailyStats,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Email monitoring error:', error);
    return c.json({
      sentToday: 0,
      deliveryRate: 0,
      openRate: 0,
      bounceRate: 0,
      totalSent: 0,
      recentEmails: [],
      dailyStats: [],
    });
  }
});

app.get('/audit-logs', authMiddleware, async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const pageLimit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50')));
    const actionFilter = (c.req.query('action') || '').slice(0, 100);
    const resourceFilter = c.req.query('resource') || '';
    const levelFilter = c.req.query('level') || '';
    const offset = (page - 1) * pageLimit;

    const validResources = ['user', 'subscription', 'promo_code', 'session', 'whatsapp'];
    const validLevels = ['info', 'warning', 'error'];

    const conditions: ReturnType<typeof sql>[] = [];
    if (actionFilter) {
      conditions.push(sql`action ILIKE ${'%' + actionFilter + '%'}`);
    }
    if (resourceFilter && validResources.includes(resourceFilter)) {
      conditions.push(sql`resource_type = ${resourceFilter}`);
    }
    if (levelFilter && validLevels.includes(levelFilter)) {
      conditions.push(sql`level = ${levelFilter}`);
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${conditions.reduce((acc, cond, i) => i === 0 ? cond : sql`${acc} AND ${cond}`)}`
      : sql``;

    const [countResult, logsResult] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`),
      db.execute(sql`SELECT id, admin_user_id, action, resource_type, resource_id, old_values, new_values, details, level, created_at FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`),
    ]);
    const total = Number(countResult.rows[0]?.count || 0);

    return c.json({
      logs: logsResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / pageLimit),
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Audit logs error:', error);
    return c.json({ logs: [], total: 0, page: 1, totalPages: 0 });
  }
});

app.get('/ai-usage', authMiddleware, async (c) => {
  try {
    const totalResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as total_cost_cents
      FROM ai_usage_logs
    `).catch(() => ({ rows: [{ total_requests: 0, total_prompt_tokens: 0, total_completion_tokens: 0, total_tokens: 0, total_cost_cents: 0 }] }));

    const todayResult = await db.execute(sql`
      SELECT 
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      WHERE created_at >= CURRENT_DATE
    `).catch(() => ({ rows: [{ requests: 0, tokens: 0, cost_cents: 0 }] }));

    const byModelResult = await db.execute(sql`
      SELECT model, 
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      GROUP BY model
      ORDER BY cost_cents DESC
    `).catch(() => ({ rows: [] }));

    const byFeatureResult = await db.execute(sql`
      SELECT feature, 
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      GROUP BY feature
      ORDER BY requests DESC
    `).catch(() => ({ rows: [] }));

    const dailyResult = await db.execute(sql`
      SELECT DATE(created_at) as date,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).catch(() => ({ rows: [] }));

    const topUsersResult = await db.execute(sql`
      SELECT user_id, 
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      WHERE user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY cost_cents DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    const recentResult = await db.execute(sql`
      SELECT id, user_id, feature, model, prompt_tokens, completion_tokens, total_tokens, cost_cents, duration_ms, status, created_at
      FROM ai_usage_logs
      ORDER BY created_at DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    const stats = totalResult.rows[0] || {};
    const today = todayResult.rows[0] || {};

    return c.json({
      overview: {
        totalRequests: Number(stats.total_requests || 0),
        totalTokens: Number(stats.total_tokens || 0),
        totalPromptTokens: Number(stats.total_prompt_tokens || 0),
        totalCompletionTokens: Number(stats.total_completion_tokens || 0),
        totalCostCents: Number(stats.total_cost_cents || 0),
        todayRequests: Number(today.requests || 0),
        todayTokens: Number(today.tokens || 0),
        todayCostCents: Number(today.cost_cents || 0),
      },
      byModel: byModelResult.rows.map((r: any) => ({
        model: r.model,
        requests: Number(r.requests),
        tokens: Number(r.tokens),
        costCents: Number(r.cost_cents),
      })),
      byFeature: byFeatureResult.rows.map((r: any) => ({
        feature: r.feature,
        requests: Number(r.requests),
        tokens: Number(r.tokens),
        costCents: Number(r.cost_cents),
      })),
      dailyTrend: dailyResult.rows.map((r: any) => ({
        date: r.date,
        requests: Number(r.requests),
        tokens: Number(r.tokens),
        costCents: Number(r.cost_cents),
      })),
      topUsers: topUsersResult.rows.map((r: any) => ({
        userId: r.user_id,
        requests: Number(r.requests),
        tokens: Number(r.tokens),
        costCents: Number(r.cost_cents),
      })),
      recentLogs: recentResult.rows,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] AI usage error:', error);
    return c.json({
      overview: { totalRequests: 0, totalTokens: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalCostCents: 0, todayRequests: 0, todayTokens: 0, todayCostCents: 0 },
      byModel: [],
      byFeature: [],
      dailyTrend: [],
      topUsers: [],
      recentLogs: [],
    });
  }
});

app.get('/whatsapp-status', authMiddleware, async (c) => {
  return c.json(getWhatsAppStatus());
});

app.post('/whatsapp-toggle', authMiddleware, async (c) => {
  const { enabled } = await c.req.json();
  setReportingEnabled(enabled);
  await logAuditAction({ action: enabled ? 'whatsapp_reporting_enabled' : 'whatsapp_reporting_disabled', resourceType: 'whatsapp', details: { enabled } });
  return c.json({ success: true, enabled });
});

app.post('/whatsapp-test', authMiddleware, async (c) => {
  const success = await sendTestMessage();
  await logAuditAction({ action: 'whatsapp_test_sent', resourceType: 'whatsapp', details: { success } });
  return c.json({ success });
});

app.post('/whatsapp-send-report', authMiddleware, async (c) => {
  const success = await sendHourlyReport();
  await logAuditAction({ action: 'whatsapp_manual_report', resourceType: 'whatsapp', details: { success } });
  return c.json({ success });
});

export { app as superadminRoutes };
