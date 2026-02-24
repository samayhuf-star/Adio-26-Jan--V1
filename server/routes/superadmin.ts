import { Hono } from 'hono';
import { sql, eq, desc, and, like } from 'drizzle-orm';
import { db } from '../db';
import { users, subscriptions, aiUsageLogs, auditLogs, emailLogs } from '../../shared/schema';
import { getUncachableStripeClient } from '../stripeClient';
import crypto from 'crypto';

const app = new Hono();

const activeAdminTokens = new Map<string, { username: string; createdAt: number }>();

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of activeAdminTokens) {
    if (now - data.createdAt > TOKEN_MAX_AGE_MS) {
      activeAdminTokens.delete(token);
    }
  }
}

async function authMiddleware(c: any, next?: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);
  cleanExpiredTokens();
  const session = activeAdminTokens.get(token);
  if (!session) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  if (next) await next();
}

app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    const validUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const validPassword = process.env.SUPERADMIN_PASSWORD;

    if (!validPassword) {
      return c.json({ error: 'Admin login not configured' }, 500);
    }

    if (username !== validUsername || password !== validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.set(token, { username: validUsername, createdAt: Date.now() });

    try {
      await db.insert(auditLogs).values({
        action: 'admin_login',
        resourceType: 'auth',
        details: { username, ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' },
        level: 'info',
      });
    } catch (e) {}

    return c.json({ token, username: validUsername });
  } catch (error) {
    console.error('[SuperAdmin] Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.get('/validate', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);
  cleanExpiredTokens();
  const session = activeAdminTokens.get(token);
  if (!session) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  return c.json({ valid: true, username: session.username });
});

// Helper to log admin actions
async function logAuditAction(data: {
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  details?: any;
  level?: 'info' | 'warn' | 'error';
}) {
  try {
    // We'll use the existing logAdminAction from adminAuthService if possible, 
    // but for simplicity here we use the direct insert since it was already there
    await db.insert(auditLogs).values({
      action: data.action,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      details: data.details || null,
      level: data.level || 'info',
    });
  } catch (error) {
    console.error('[Audit Log] Failed to log admin action:', error);
  }
}

app.get('/stats', authMiddleware, async (c) => {
  try {
    const totalUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users`).catch(() => ({ rows: [{ count: 0 }] }));
    const activeSubscriptions = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`).catch(() => ({ rows: [{ count: 0 }] }));
    const trialUsers = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'trialing'`).catch(() => ({ rows: [{ count: 0 }] }));
    const blockedUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE is_blocked = true`).catch(() => ({ rows: [{ count: 0 }] }));
    const revenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(CASE 
        WHEN plan_name = 'Starter' THEN 2900
        WHEN plan_name = 'Professional' THEN 5900
        WHEN plan_name = 'Agency' THEN 12900
        ELSE 0 
      END), 0) as revenue
      FROM subscriptions WHERE status = 'active'
    `).catch(() => ({ rows: [{ revenue: 0 }] }));

    return c.json({
      totalUsers: Number((totalUsers.rows[0] as any)?.count || 0),
      activeSubscriptions: Number((activeSubscriptions.rows[0] as any)?.count || 0),
      monthlyRevenue: Number((revenueResult.rows[0] as any)?.revenue || 0) / 100,
      trialUsers: Number((trialUsers.rows[0] as any)?.count || 0),
      blockedUsers: Number((blockedUsers.rows[0] as any)?.count || 0),
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Stats error:', error);
    return c.json({ totalUsers: 0, activeSubscriptions: 0, monthlyRevenue: 0, trialUsers: 0, blockedUsers: 0 });
  }
});

app.get('/users', authMiddleware, async (c) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      subscriptionPlan: users.subscriptionPlan,
      subscriptionStatus: users.subscriptionStatus,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignIn: users.lastSignIn,
    }).from(users).orderBy(desc(users.createdAt));

    return c.json({ users: allUsers });
  } catch (error: any) {
    console.error('[SuperAdmin] Users error:', error);
    return c.json({ users: [] });
  }
});

app.post('/users/:id/block', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const { block } = await c.req.json();

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    await db.update(users).set({ isBlocked: !!block, updatedAt: new Date() }).where(eq(users.id, userId));
    await logAuditAction({ action: block ? 'user_blocked' : 'user_unblocked', resourceType: 'user', resourceId: userId, details: { email: existing[0].email } });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Block user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

app.put('/users/:id', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const { displayName, email } = await c.req.json();

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updates: any = { updatedAt: new Date() };
    if (displayName !== undefined) updates.fullName = displayName;
    if (email !== undefined) updates.email = email;

    await db.update(users).set(updates).where(eq(users.id, userId));
    await logAuditAction({ action: 'user_updated', resourceType: 'user', resourceId: userId, oldValues: { fullName: existing[0].fullName, email: existing[0].email }, newValues: updates });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

app.put('/users/:id/password', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const { password } = await c.req.json();

    if (!password || password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const bcryptModule = await import('bcryptjs');
    const bcryptLib = bcryptModule.default || bcryptModule;
    const passwordHash = await bcryptLib.hash(password, 10);

    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
    await logAuditAction({ action: 'user_password_changed', resourceType: 'user', resourceId: userId, details: { email: existing[0].email, changedBy: 'superadmin' } });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Change password error:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

app.delete('/users/:id', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await logAuditAction({ action: 'user_deleted', resourceType: 'user', resourceId: userId, details: { email: existing[0].email } });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

app.get('/subscriptions', authMiddleware, async (c) => {
  try {
    const allSubs = await db.execute(sql`
      SELECT s.id, s.user_id as "userId", u.email as "userEmail", s.plan_name as "planName", 
             s.status, s.current_period_end as "currentPeriodEnd", 
             s.cancel_at_period_end as "cancelAtPeriodEnd", s.created_at as "createdAt",
             s.updated_at as "updatedAt",
             COALESCE(
               (SELECT SUM(p.amount_cents) FROM payments p WHERE p.subscription_id = s.id AND p.status = 'succeeded'),
               0
             ) as "paidAmountCents"
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).catch(() => ({ rows: [] }));

    return c.json({ subscriptions: allSubs.rows });
  } catch (error: any) {
    console.error('[SuperAdmin] Subscriptions error:', error);
    return c.json({ subscriptions: [] });
  }
});

app.put('/subscriptions/:id', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('id');
    const { planName, status } = await c.req.json();

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    const updates: any = { updatedAt: new Date() };
    if (planName) updates.planName = planName;
    if (status) updates.status = status;

    await db.update(subscriptions).set(updates).where(eq(subscriptions.id, subId));

    if (existing[0].userId && planName) {
      await db.update(users).set({ subscriptionPlan: planName, updatedAt: new Date() }).where(eq(users.id, existing[0].userId));
    }

    await logAuditAction({ action: 'subscription_updated', resourceType: 'subscription', resourceId: subId, oldValues: { planName: existing[0].planName, status: existing[0].status }, newValues: updates });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Update subscription error:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

app.post('/subscriptions/:id/cancel', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('id');

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    await db.update(subscriptions).set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() }).where(eq(subscriptions.id, subId));

    if (existing[0].userId) {
      await db.update(users).set({ subscriptionStatus: 'canceled', updatedAt: new Date() }).where(eq(users.id, existing[0].userId));
    }

    await logAuditAction({ action: 'subscription_canceled', resourceType: 'subscription', resourceId: subId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Cancel subscription error:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

app.post('/subscriptions/:id/reactivate', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('id');

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    await db.update(subscriptions).set({ status: 'active', canceledAt: null, cancelAtPeriodEnd: false, updatedAt: new Date() }).where(eq(subscriptions.id, subId));

    if (existing[0].userId) {
      await db.update(users).set({ subscriptionStatus: 'active', updatedAt: new Date() }).where(eq(users.id, existing[0].userId));
    }

    await logAuditAction({ action: 'subscription_reactivated', resourceType: 'subscription', resourceId: subId });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Reactivate subscription error:', error);
    return c.json({ error: 'Failed to reactivate subscription' }, 500);
  }
});

app.delete('/subscriptions/:id', authMiddleware, async (c) => {
  try {
    const subId = c.req.param('id');

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, subId));
    await logAuditAction({ action: 'subscription_deleted', resourceType: 'subscription', resourceId: subId, details: { planName: existing[0].planName, userId: existing[0].userId } });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Delete subscription error:', error);
    return c.json({ error: 'Failed to delete subscription' }, 500);
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
    `).catch((err) => {
      console.error('[AI Usage] Recent logs error:', err);
      return { rows: [] };
    });

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
      recentLogs: recentResult.rows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        feature: r.feature,
        model: r.model,
        prompt_tokens: Number(r.prompt_tokens),
        completion_tokens: Number(r.completion_tokens),
        total_tokens: Number(r.total_tokens),
        cost_cents: r.cost_cents,
        duration_ms: Number(r.duration_ms),
        status: r.status,
        created_at: r.created_at,
      })),
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

// WhatsApp reporting status
import { getWhatsAppStatus, setReportingEnabled, sendTestMessage, sendHourlyReport } from '../services/whatsapp';

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

app.get('/system-health', authMiddleware, async (c) => {
  try {
    const memoryUsage = process.memoryUsage();

    let dbStatus = 'disconnected';
    let dbStats = { tableCount: 0, dbSize: '0 MB' };
    try {
      const tableResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'
      `);
      const sizeResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      dbStatus = 'connected';
      dbStats = {
        tableCount: Number((tableResult.rows[0] as any)?.count || 0),
        dbSize: (sizeResult.rows[0] as any)?.size || '0 MB',
      };
    } catch (e) {
      dbStatus = 'error';
    }

    return c.json({
      uptime: process.uptime(),
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      dbStatus,
      dbStats,
      serverTime: new Date().toISOString(),
      activeAdminSessions: activeAdminTokens.size,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] System health error:', error);
    return c.json({ error: 'Failed to fetch system health' }, 500);
  }
});

app.get('/stripe-dashboard', authMiddleware, async (c) => {
  try {
    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const charges = await stripeClient.charges.list({ limit: 100 });
    const succeededCharges = charges.data.filter(ch => ch.status === 'succeeded');
    const totalRevenue = succeededCharges.reduce((sum, ch) => sum + ch.amount, 0);

    const activeStripeSubscriptions = await stripeClient.subscriptions.list({ status: 'active', limit: 100 });
    const mrr = activeStripeSubscriptions.data.reduce((sum, sub) => {
      const item = sub.items?.data?.[0];
      const amount = item?.price?.unit_amount || 0;
      const interval = item?.price?.recurring?.interval || 'month';
      
      // Normalize to monthly
      if (interval === 'year') {
        return sum + Math.round(amount / 12);
      }
      return sum + amount;
    }, 0);

    const lifetimeUsers = await db.execute(sql`
      SELECT COUNT(*) as count FROM users WHERE LOWER(subscription_plan) = 'lifetime'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    const lifetimeDeals = Number((lifetimeUsers.rows[0] as any)?.count || 0);
    const lifetimeRevenue = lifetimeDeals * 9900;

    const churnedSubs = await stripeClient.subscriptions.list({ status: 'canceled', limit: 100 });
    const totalSubs = activeStripeSubscriptions.data.length + churnedSubs.data.length;
    const churnRate = totalSubs > 0 ? (churnedSubs.data.length / totalSubs) * 100 : 0;

    const recentPayments = await stripeClient.paymentIntents.list({ limit: 20 });
    const recentTransactions = recentPayments.data.map(pi => ({
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      created: new Date(pi.created * 1000).toISOString(),
      customerEmail: (pi as any).receipt_email || null,
      description: pi.description || null,
    }));

    const planResult = await db.execute(sql`
      SELECT COALESCE(subscription_plan, 'free') as plan, COUNT(*) as count
      FROM users
      GROUP BY subscription_plan
      ORDER BY count DESC
    `).catch(() => ({ rows: [] }));
    const planDistribution = planResult.rows.map((r: any) => ({
      plan: r.plan || 'free',
      count: Number(r.count),
    }));

    return c.json({
      totalRevenue,
      mrr,
      lifetimeDeals,
      lifetimeRevenue,
      churnRate: Math.round(churnRate * 100) / 100,
      recentTransactions,
      planDistribution,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Stripe dashboard error:', error);
    return c.json({ error: 'Failed to fetch Stripe data' }, 500);
  }
});

app.get('/promo-codes', authMiddleware, async (c) => {
  try {
    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ promoCodes: [] });
    }

    const promotionCodes = await stripeClient.promotionCodes.list({ limit: 50, expand: ['data.coupon'] });
    const promoCodes = promotionCodes.data.map((pc: any) => ({
      id: pc.id,
      code: pc.code,
      percentOff: pc.coupon?.percent_off || 0,
      amountOff: pc.coupon?.amount_off || 0,
      timesRedeemed: pc.times_redeemed || 0,
      maxRedemptions: pc.max_redemptions || null,
      active: pc.active,
      created: new Date(pc.created * 1000).toISOString(),
      duration: pc.coupon?.duration || 'forever',
    }));

    return c.json({ promoCodes });
  } catch (error: any) {
    console.error('[SuperAdmin] List promo codes error:', error);
    return c.json({ promoCodes: [] });
  }
});

app.post('/promo-codes', authMiddleware, async (c) => {
  try {
    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const body = await c.req.json();
    const { code, percentOff, maxRedemptions, duration } = body;

    if (!code || !percentOff) {
      return c.json({ error: 'Code and percentOff are required' }, 400);
    }

    const coupon = await stripeClient.coupons.create({
      percent_off: Number(percentOff),
      duration: duration || 'forever',
      name: `${percentOff}% Off - ${code.toUpperCase()}`,
      metadata: { created_by: 'superadmin' },
    });

    const promoParams: any = {
      coupon: coupon.id,
      code: code.toUpperCase(),
    };
    if (maxRedemptions) {
      promoParams.max_redemptions = Number(maxRedemptions);
    }

    const promoCode = await stripeClient.promotionCodes.create(promoParams);

    await logAuditAction({
      action: 'promo_code_created',
      resourceType: 'promo_code',
      resourceId: promoCode.id,
      details: { code: promoCode.code, percentOff, maxRedemptions, duration },
    });

    return c.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        percentOff: coupon.percent_off,
        timesRedeemed: 0,
        maxRedemptions: promoCode.max_redemptions || null,
        active: promoCode.active,
        created: new Date(promoCode.created * 1000).toISOString(),
        duration: coupon.duration,
      },
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Create promo code error:', error);
    return c.json({ error: error?.message || 'Failed to create promo code' }, 500);
  }
});

app.post('/promo-codes/:id/deactivate', authMiddleware, async (c) => {
  try {
    const stripeClient = await getUncachableStripeClient();
    if (!stripeClient) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const promoId = c.req.param('id');
    await stripeClient.promotionCodes.update(promoId, { active: false });

    await logAuditAction({
      action: 'promo_code_deactivated',
      resourceType: 'promo_code',
      resourceId: promoId,
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Deactivate promo code error:', error);
    return c.json({ error: error?.message || 'Failed to deactivate promo code' }, 500);
  }
});

app.get('/email-logs', authMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const search = c.req.query('search') || '';
    const statusFilter = c.req.query('status') || '';
    const offset = (page - 1) * limit;

    const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs`);
    const total = Number((totalResult.rows[0] as any)?.count || 0);

    const sentResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE status = 'sent'`);
    const failedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE status = 'failed'`);
    const openedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE opens > 0`);
    const clickedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE clicks > 0`);

    const stats = {
      total,
      sent: Number((sentResult.rows[0] as any)?.count || 0),
      failed: Number((failedResult.rows[0] as any)?.count || 0),
      opened: Number((openedResult.rows[0] as any)?.count || 0),
      clicked: Number((clickedResult.rows[0] as any)?.count || 0),
    };

    let logsQuery = sql`
      SELECT id, recipient, subject, template_id, sequence_id, status, message_id,
             opens, clicks, sent_at, opened_at, clicked_at, bounced_at, error
      FROM email_logs
    `;

    const conditions: any[] = [];
    if (search) {
      logsQuery = sql`
        SELECT id, recipient, subject, template_id, sequence_id, status, message_id,
               opens, clicks, sent_at, opened_at, clicked_at, bounced_at, error
        FROM email_logs
        WHERE (recipient ILIKE ${'%' + search + '%'} OR subject ILIKE ${'%' + search + '%'})
      `;
      if (statusFilter && statusFilter !== 'all') {
        logsQuery = sql`
          SELECT id, recipient, subject, template_id, sequence_id, status, message_id,
                 opens, clicks, sent_at, opened_at, clicked_at, bounced_at, error
          FROM email_logs
          WHERE (recipient ILIKE ${'%' + search + '%'} OR subject ILIKE ${'%' + search + '%'})
            AND status = ${statusFilter}
        `;
      }
    } else if (statusFilter && statusFilter !== 'all') {
      logsQuery = sql`
        SELECT id, recipient, subject, template_id, sequence_id, status, message_id,
               opens, clicks, sent_at, opened_at, clicked_at, bounced_at, error
        FROM email_logs
        WHERE status = ${statusFilter}
      `;
    }

    const finalQuery = sql`${logsQuery} ORDER BY sent_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const logsResult = await db.execute(finalQuery);

    return c.json({
      logs: logsResult.rows,
      total,
      stats,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Email logs error:', error);
    return c.json({ logs: [], total: 0, stats: { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 } });
  }
});

export { app as superadminRoutes };

