import { Hono } from 'hono';
import { sql, eq, desc, and, like } from 'drizzle-orm';
import { db } from '../db';
import { users, subscriptions, aiUsageLogs, auditLogs, emailLogs, userEvents } from '../../shared/schema';
import { getUncachableStripeClient } from '../stripeClient';
import crypto from 'crypto';
import { logUserEvent } from '../services/userEventLogger';
import EmailService from '../emailService';

const app = new Hono();

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function generateAdminToken(username: string, password: string): string {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', password).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

function verifyAdminToken(token: string, password: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false };
    const [username, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_MAX_AGE_MS) {
      return { valid: false };
    }
    const payload = `${username}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', password).update(payload).digest('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
    return valid ? { valid: true, username } : { valid: false };
  } catch {
    return { valid: false };
  }
}

async function authMiddleware(c: any, next?: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!password) return c.json({ error: 'Admin not configured' }, 500);
  const result = verifyAdminToken(token, password);
  if (!result.valid) {
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

    const token = generateAdminToken(validUsername, validPassword);

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
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!password) return c.json({ error: 'Admin not configured' }, 500);
  const result = verifyAdminToken(token, password);
  if (!result.valid) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  return c.json({ valid: true, username: result.username });
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
    const totalUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_internal, false) = false`).catch(() => ({ rows: [{ count: 0 }] }));
    const activeSubscriptions = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.status = 'active' AND COALESCE(u.is_internal, false) = false`).catch(() => ({ rows: [{ count: 0 }] }));
    const trialUsers = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE s.status = 'trialing' AND COALESCE(u.is_internal, false) = false`).catch(() => ({ rows: [{ count: 0 }] }));
    const blockedUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE is_blocked = true AND COALESCE(is_internal, false) = false`).catch(() => ({ rows: [{ count: 0 }] }));
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
    await logUserEvent(userId, block ? 'blocked' : 'unblocked', block ? 'Account blocked' : 'Account unblocked', `Account ${block ? 'blocked' : 'unblocked'} by admin`, { email: existing[0].email });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Block user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

app.put('/users/:id', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const { displayName, email, isInternal } = await c.req.json();

    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updates: any = { updatedAt: new Date() };
    if (displayName !== undefined) updates.fullName = displayName;
    if (email !== undefined) updates.email = email;
    if (isInternal !== undefined) updates.isInternal = !!isInternal;

    await db.update(users).set(updates).where(eq(users.id, userId));
    await logAuditAction({ action: 'user_updated', resourceType: 'user', resourceId: userId, oldValues: { fullName: existing[0].fullName, email: existing[0].email }, newValues: updates });
    await logUserEvent(userId, 'admin_edit', 'Profile edited by admin', `User profile updated by superadmin`, { oldValues: { fullName: existing[0].fullName, email: existing[0].email }, newValues: updates });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Mark a user (and all users from the same signup IP) as internal or real
app.post('/users/:id/set-internal', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const { isInternal } = await c.req.json();
    const flag = !!isInternal;

    const existing = await db.execute(sql`SELECT id, email, signup_ip FROM users WHERE id = ${userId} LIMIT 1`);
    if (existing.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    const targetUser = existing.rows[0] as any;

    // Always mark the target user
    await db.execute(sql`UPDATE users SET is_internal = ${flag}, updated_at = NOW() WHERE id = ${userId}`);

    let affectedCount = 1;
    let matchedByIp: string[] = [];

    // If marking internal AND the user has a signup_ip, also mark all users from that same IP
    if (flag && targetUser.signup_ip) {
      const sameIpUsers = await db.execute(sql`
        SELECT id, email FROM users
        WHERE signup_ip = ${targetUser.signup_ip}
          AND id != ${userId}
          AND is_internal = false
      `);
      if (sameIpUsers.rows.length > 0) {
        const ids = sameIpUsers.rows.map((r: any) => r.id);
        matchedByIp = sameIpUsers.rows.map((r: any) => r.email);
        // Bulk update using raw SQL with IN clause
        await db.execute(sql`
          UPDATE users SET is_internal = true, updated_at = NOW()
          WHERE signup_ip = ${targetUser.signup_ip}
            AND id != ${userId}
        `);
        affectedCount += ids.length;
      }
    }

    // Also check user_events table for IP-based matches (for users who registered before signup_ip was added)
    if (flag && targetUser.signup_ip) {
      const eventIpUsers = await db.execute(sql`
        SELECT DISTINCT u.id, u.email
        FROM users u
        JOIN user_events ue ON ue.user_id = u.id
        WHERE ue.ip_address::text = ${targetUser.signup_ip}
          AND u.id != ${userId}
          AND u.is_internal = false
      `);
      if (eventIpUsers.rows.length > 0) {
        const eventIds = eventIpUsers.rows.map((r: any) => r.id);
        const eventEmails = eventIpUsers.rows.map((r: any) => r.email as string);
        matchedByIp = [...new Set([...matchedByIp, ...eventEmails])];
        await db.execute(sql`
          UPDATE users SET is_internal = true, updated_at = NOW()
          WHERE id IN (SELECT DISTINCT u2.id FROM users u2 JOIN user_events ue2 ON ue2.user_id = u2.id WHERE ue2.ip_address::text = ${targetUser.signup_ip} AND u2.id != ${userId})
        `);
        affectedCount += eventIds.length;
      }
    }

    await logAuditAction({
      action: flag ? 'user_marked_internal' : 'user_marked_real',
      resourceType: 'user',
      resourceId: userId,
      details: { email: targetUser.email, affectedCount, matchedByIp: matchedByIp.slice(0, 20) },
    });
    await logUserEvent(userId, 'admin_edit', flag ? 'Marked as internal user' : 'Marked as real user', `User type changed by superadmin`, { isInternal: flag, affectedCount });

    return c.json({ success: true, affectedCount, matchedByIp });
  } catch (error: any) {
    console.error('[SuperAdmin] Set internal error:', error);
    return c.json({ error: 'Failed to update user type' }, 500);
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
    await logUserEvent(userId, 'password_changed', 'Password changed by admin', `Password was changed by superadmin`, { email: existing[0].email });

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

    await logUserEvent(userId, 'deleted', 'Account deleted', `Account deleted by admin`, { email: existing[0].email });
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
    if (existing[0].userId) {
      await logUserEvent(existing[0].userId, 'admin_edit', 'Subscription edited by admin', `Subscription updated by superadmin`, { subscriptionId: subId, oldPlan: existing[0].planName, oldStatus: existing[0].status, newPlan: planName, newStatus: status });
    }

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
      await logUserEvent(existing[0].userId, 'subscription_canceled', 'Subscription canceled by admin', `Subscription canceled by superadmin`, { subscriptionId: subId, planName: existing[0].planName });
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
      await logUserEvent(existing[0].userId, 'subscription_reactivated', 'Subscription reactivated by admin', `Subscription reactivated by superadmin`, { subscriptionId: subId, planName: existing[0].planName });
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
      activeAdminSessions: 1,
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

app.get('/users-unified', authMiddleware, async (c) => {
  try {
    const showInternal = c.req.query('showInternal') === 'true';

    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.full_name as "fullName",
        u.role,
        u.subscription_plan as "subscriptionPlan",
        u.subscription_status as "subscriptionStatus",
        u.is_blocked as "isBlocked",
        COALESCE(u.is_internal, false) as "isInternal",
        u.signup_ip as "signupIp",
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.last_sign_in as "lastSignIn",
        u.email_verified as "emailVerified",
        u.card_validated as "cardValidated",
        u.stripe_customer_id as "stripeCustomerId",
        s.id as "subscriptionId",
        s.plan_name as "subPlanName",
        s.status as "subStatus",
        s.current_period_start as "subPeriodStart",
        s.current_period_end as "subPeriodEnd",
        s.cancel_at_period_end as "subCancelAtPeriodEnd",
        s.trial_start as "subTrialStart",
        s.trial_end as "subTrialEnd",
        s.created_at as "subCreatedAt",
        s.updated_at as "subUpdatedAt",
        COALESCE(p.total_paid, 0) as "totalPaidCents",
        p.last_payment_date as "lastPaymentDate",
        p.last_payment_status as "lastPaymentStatus",
        COALESCE(p.payment_count, 0) as "paymentCount"
      FROM users u
      LEFT JOIN (
        SELECT DISTINCT ON (user_id) *
        FROM subscriptions
        ORDER BY user_id, created_at DESC
      ) s ON s.user_id = u.id
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(amount_cents) as total_paid,
          MAX(paid_at) as last_payment_date,
          (SELECT status FROM payments p2 WHERE p2.user_id = payments.user_id ORDER BY created_at DESC LIMIT 1) as last_payment_status,
          COUNT(*) as payment_count
        FROM payments
        GROUP BY user_id
      ) p ON p.user_id = u.id
      WHERE (${showInternal} = true OR COALESCE(u.is_internal, false) = false)
      ORDER BY u.created_at DESC
    `);

    return c.json({ users: result.rows });
  } catch (error: any) {
    console.error('[SuperAdmin] Users unified error:', error);
    return c.json({ users: [] });
  }
});

app.get('/users/:id/lifecycle', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userResult.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    const user = userResult[0];

    const events = await db.execute(sql`
      SELECT id, event_type as "eventType", title, description, metadata, created_at as "createdAt"
      FROM user_events
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    const userEmailLogs = await db.execute(sql`
      SELECT id, subject, status, template_id as "templateId", sent_at as "sentAt", 
             opened_at as "openedAt", clicked_at as "clickedAt", bounced_at as "bouncedAt",
             error, opens, clicks
      FROM email_logs
      WHERE recipient = ${user.email}
      ORDER BY sent_at DESC
      LIMIT 50
    `);

    const userAuditLogs = await db.execute(sql`
      SELECT id, action, resource_type as "resourceType", old_values as "oldValues", 
             new_values as "newValues", details, level, created_at as "createdAt"
      FROM audit_logs
      WHERE resource_id = ${userId} OR user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const userPayments = await db.execute(sql`
      SELECT id, amount_cents as "amountCents", currency, status, 
             payment_method_type as "paymentMethodType", description, receipt_url as "receiptUrl",
             paid_at as "paidAt", created_at as "createdAt"
      FROM payments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    const userSubscriptions = await db.execute(sql`
      SELECT id, plan_name as "planName", status, current_period_start as "periodStart",
             current_period_end as "periodEnd", cancel_at_period_end as "cancelAtPeriodEnd",
             canceled_at as "canceledAt", trial_start as "trialStart", trial_end as "trialEnd",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM subscriptions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        isBlocked: user.isBlocked,
        emailVerified: user.emailVerified,
        cardValidated: user.cardValidated,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignIn: user.lastSignIn,
      },
      events: events.rows,
      emailLogs: userEmailLogs.rows,
      auditLogs: userAuditLogs.rows,
      payments: userPayments.rows,
      subscriptions: userSubscriptions.rows,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] User lifecycle error:', error);
    return c.json({ error: 'Failed to fetch user lifecycle' }, 500);
  }
});

app.post('/backfill-user-events', authMiddleware, async (c) => {
  try {
    let count = 0;

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      lastSignIn: users.lastSignIn,
      emailVerified: users.emailVerified,
      cardValidated: users.cardValidated,
      subscriptionPlan: users.subscriptionPlan,
    }).from(users);

    for (const user of allUsers) {
      if (user.createdAt) {
        await logUserEvent(user.id, 'signup', 'Account created', `User signed up with email ${user.email}`, { email: user.email }, user.createdAt);
        count++;
      }
      if (user.emailVerified) {
        await logUserEvent(user.id, 'email_verified', 'Email verified', undefined, { email: user.email }, user.createdAt || new Date());
        count++;
      }
      if (user.cardValidated) {
        await logUserEvent(user.id, 'card_validated', 'Payment card validated', undefined, {}, user.createdAt || new Date());
        count++;
      }
      if (user.lastSignIn) {
        await logUserEvent(user.id, 'login', 'User logged in', undefined, {}, user.lastSignIn);
        count++;
      }
    }

    const allSubs = await db.execute(sql`
      SELECT s.*, u.email FROM subscriptions s LEFT JOIN users u ON s.user_id = u.id
    `);
    for (const sub of allSubs.rows as any[]) {
      await logUserEvent(sub.user_id, 'subscription_created', `Subscription created: ${sub.plan_name}`, 
        `Plan: ${sub.plan_name}, Status: ${sub.status}`, 
        { planName: sub.plan_name, status: sub.status }, sub.created_at);
      count++;
    }

    const allPayments = await db.execute(sql`
      SELECT p.*, u.email FROM payments p LEFT JOIN users u ON p.user_id = u.id
    `);
    for (const pay of allPayments.rows as any[]) {
      const eventType = pay.status === 'succeeded' ? 'payment_succeeded' : 'payment_failed';
      await logUserEvent(pay.user_id, eventType, 
        `Payment ${pay.status}: $${((pay.amount_cents || 0) / 100).toFixed(2)}`,
        pay.description || undefined,
        { amountCents: pay.amount_cents, currency: pay.currency, status: pay.status },
        pay.paid_at || pay.created_at);
      count++;
    }

    const allEmails = await db.execute(sql`
      SELECT e.*, u.id as user_id FROM email_logs e LEFT JOIN users u ON u.email = e.recipient
    `);
    for (const email of allEmails.rows as any[]) {
      if (email.user_id) {
        await logUserEvent(email.user_id, 'email_sent', `Email sent: ${email.subject}`,
          undefined, { templateId: email.template_id, status: email.status }, email.sent_at);
        count++;
      }
    }

    return c.json({ success: true, eventsCreated: count });
  } catch (error: any) {
    console.error('[SuperAdmin] Backfill error:', error);
    return c.json({ error: 'Failed to backfill events' }, 500);
  }
});

app.post('/users/:id/send-credentials', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('id');
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRows.length) {
      return c.json({ error: 'User not found' }, 404);
    }
    const user = userRows[0];
    const result = await EmailService.sendLoginCredentials(user.email, user.fullName || '');
    if (!result.success) {
      return c.json({ error: result.error || 'Failed to send email' }, 500);
    }
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Send credentials error:', error);
    return c.json({ error: 'Failed to send credentials email' }, 500);
  }
});

app.get('/leads', authMiddleware, async (c) => {
  try {
    const { emailLeads } = await import('../../shared/schema');
    const { desc: descOrder } = await import('drizzle-orm');
    const leads = await db
      .select()
      .from(emailLeads)
      .orderBy(descOrder(emailLeads.createdAt))
      .limit(500);
    return c.json({ leads });
  } catch (error: any) {
    console.error('[SuperAdmin] Leads fetch error:', error);
    return c.json({ error: 'Failed to fetch leads' }, 500);
  }
});

app.get('/visitors', authMiddleware, async (c) => {
  try {
    const { pageViews, emailLeads, users } = await import('../../shared/schema');
    const { getDb } = await import('../db');
    const { sql: drizzleSql, desc: descOrder, gte: gteOp, count: countFn } = await import('drizzle-orm');
    const dbInst = getDb();

    const daysParam = c.req.query('days') || '30';
    const pageParam = parseInt(c.req.query('page') || '1');
    const limitParam = Math.min(parseInt(c.req.query('limit') || '50'), 200);
    const deviceFilter = c.req.query('device') || '';
    const countryFilter = c.req.query('country') || '';
    const offset = (pageParam - 1) * limitParam;

    let startDate = new Date();
    if (daysParam === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (daysParam === 'all') {
      startDate = new Date('2020-01-01');
    } else {
      const days = Math.min(Math.max(parseInt(daysParam) || 30, 1), 365);
      startDate.setDate(startDate.getDate() - days);
    }

    const startIso = startDate.toISOString();
    const deviceClause = deviceFilter ? `AND pv_first.device_type = '${deviceFilter.replace(/'/g, "''")}'` : '';
    const countryClause = countryFilter ? `AND pv_first.country = '${countryFilter.replace(/'/g, "''")}'` : '';
    // Session-grouped query: one row per session_id with aggregated data
    const sessionsQuery = `
      SELECT
        s.session_id,
        pv_first.ip,
        pv_first.country,
        pv_first.city,
        pv_first.region,
        pv_first.isp,
        pv_first.org,
        pv_first.device_type,
        pv_first.browser,
        pv_first.os,
        pv_first.screen_width,
        pv_first.screen_height,
        pv_first.referrer,
        s.first_seen,
        s.last_seen,
        s.page_count,
        s.pages_visited,
        el.email AS captured_email,
        u.email AS registered_email
      FROM (
        SELECT
          session_id,
          MIN(id) AS first_id,
          MIN(created_at) AS first_seen,
          MAX(created_at) AS last_seen,
          COUNT(*) AS page_count,
          array_agg(DISTINCT path ORDER BY path) AS pages_visited
        FROM page_views
        WHERE session_id IS NOT NULL
          AND created_at >= '${startIso}'
          AND (ip IS NULL OR ip NOT IN (SELECT ip FROM blocked_ips))
        GROUP BY session_id
      ) s
      JOIN page_views pv_first ON pv_first.id = s.first_id
        ${deviceClause}
        ${countryClause}
      LEFT JOIN email_leads el ON el.ip_address = pv_first.ip
      LEFT JOIN users u ON u.created_at BETWEEN s.first_seen - INTERVAL '5 minutes' AND s.last_seen + INTERVAL '10 minutes'
        AND (u.email IS NOT NULL)
      ORDER BY s.first_seen DESC
      LIMIT ${limitParam} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT session_id) AS total
      FROM page_views
      WHERE session_id IS NOT NULL
        AND created_at >= '${startIso}'
        AND (ip IS NULL OR ip NOT IN (SELECT ip FROM blocked_ips))
        ${deviceFilter ? `AND device_type = '${deviceFilter.replace(/'/g, "''")}'` : ''}
        ${countryFilter ? `AND country = '${countryFilter.replace(/'/g, "''")}'` : ''}
    `;

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT session_id) AS unique_sessions,
        COUNT(*) AS total_page_views,
        COUNT(DISTINCT CASE WHEN device_type = 'mobile' THEN session_id END) AS mobile_sessions,
        COUNT(DISTINCT CASE WHEN device_type = 'desktop' THEN session_id END) AS desktop_sessions,
        COUNT(DISTINCT CASE WHEN device_type = 'tablet' THEN session_id END) AS tablet_sessions,
        COUNT(DISTINCT country) AS unique_countries
      FROM page_views
      WHERE session_id IS NOT NULL
        AND created_at >= '${startIso}'
    `;

    const topCountriesQuery = `
      SELECT country, COUNT(DISTINCT session_id) AS sessions
      FROM page_views
      WHERE session_id IS NOT NULL AND country IS NOT NULL
        AND created_at >= '${startIso}'
      GROUP BY country
      ORDER BY sessions DESC
      LIMIT 15
    `;

    const [sessionsResult, countResult, summaryResult, topCountriesResult] = await Promise.all([
      dbInst.execute(drizzleSql.raw(sessionsQuery)),
      dbInst.execute(drizzleSql.raw(countQuery)),
      dbInst.execute(drizzleSql.raw(summaryQuery)),
      dbInst.execute(drizzleSql.raw(topCountriesQuery)),
    ]);

    const sessions = (sessionsResult.rows || []).map((row: any) => ({
      sessionId: row.session_id,
      ip: row.ip,
      country: row.country,
      city: row.city,
      region: row.region,
      isp: row.isp,
      org: row.org,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      screenWidth: row.screen_width,
      screenHeight: row.screen_height,
      referrer: row.referrer,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      pageCount: parseInt(row.page_count),
      pagesVisited: row.pages_visited || [],
      capturedEmail: row.captured_email || null,
      registeredEmail: row.registered_email || null,
      converted: !!(row.captured_email || row.registered_email),
      durationSeconds: row.last_seen && row.first_seen
        ? Math.max(Math.round((new Date(row.last_seen).getTime() - new Date(row.first_seen).getTime()) / 1000), row.page_count > 1 ? 1 : 0)
        : 0,
    }));

    const total = parseInt((countResult.rows?.[0] as any)?.total || '0');
    const summary = summaryResult.rows?.[0] as any || {};
    const topCountries = (topCountriesResult.rows || []).map((r: any) => ({
      country: r.country,
      sessions: parseInt(r.sessions),
    }));

    return c.json({
      sessions,
      pagination: {
        total,
        page: pageParam,
        limit: limitParam,
        totalPages: Math.ceil(total / limitParam),
      },
      summary: {
        uniqueSessions: parseInt(summary.unique_sessions || '0'),
        totalPageViews: parseInt(summary.total_page_views || '0'),
        mobileSessions: parseInt(summary.mobile_sessions || '0'),
        desktopSessions: parseInt(summary.desktop_sessions || '0'),
        tabletSessions: parseInt(summary.tablet_sessions || '0'),
        uniqueCountries: parseInt(summary.unique_countries || '0'),
      },
      topCountries,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Visitors fetch error:', error);
    return c.json({ error: 'Failed to fetch visitors', detail: error.message }, 500);
  }
});

app.get('/journeys', authMiddleware, async (c) => {
  try {
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();

    const daysParam = c.req.query('days') || '30';
    const days = Math.min(Math.max(parseInt(daysParam) || 30, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startIso = startDate.toISOString();

    // Fetch individual page views with LEAD to compute per-step duration
    const pageViewsQuery = `
      SELECT
        pv.session_id,
        pv.id,
        pv.path,
        pv.created_at,
        pv.referrer,
        pv.device_type,
        pv.country,
        pv.browser,
        COALESCE(
          EXTRACT(EPOCH FROM (
            LEAD(pv.created_at) OVER (PARTITION BY pv.session_id ORDER BY pv.created_at)
            - pv.created_at
          ))::int,
          30
        ) AS step_duration,
        ROW_NUMBER() OVER (PARTITION BY pv.session_id ORDER BY pv.created_at) AS step_num,
        COUNT(*) OVER (PARTITION BY pv.session_id) AS total_steps,
        MIN(pv.created_at) OVER (PARTITION BY pv.session_id) AS session_start,
        MAX(pv.created_at) OVER (PARTITION BY pv.session_id) AS session_end
      FROM page_views pv
      WHERE pv.session_id IS NOT NULL
        AND pv.created_at >= '${startIso}'
      ORDER BY pv.session_id, pv.created_at
    `;

    // Fetch conversion data (email captures and registrations near sessions)
    const conversionQuery = `
      SELECT DISTINCT pv.session_id
      FROM page_views pv
      LEFT JOIN email_leads el ON el.ip_address = pv.ip AND el.created_at BETWEEN pv.created_at - INTERVAL '10 minutes' AND pv.created_at + INTERVAL '30 minutes'
      LEFT JOIN users u ON u.created_at BETWEEN
        (SELECT MIN(pv2.created_at) FROM page_views pv2 WHERE pv2.session_id = pv.session_id)
        AND
        (SELECT MAX(pv3.created_at) FROM page_views pv3 WHERE pv3.session_id = pv.session_id) + INTERVAL '10 minutes'
      WHERE pv.session_id IS NOT NULL
        AND pv.created_at >= '${startIso}'
        AND (el.email IS NOT NULL OR u.email IS NOT NULL)
    `;

    const [pvResult, convResult] = await Promise.all([
      dbInst.execute(drizzleSql.raw(pageViewsQuery)),
      dbInst.execute(drizzleSql.raw(conversionQuery)),
    ]);

    const convertedSessions = new Set((convResult.rows || []).map((r: any) => r.session_id));

    // Group page views by session
    const sessionMap: Record<string, any[]> = {};
    for (const row of (pvResult.rows || []) as any[]) {
      if (!sessionMap[row.session_id]) sessionMap[row.session_id] = [];
      sessionMap[row.session_id].push(row);
    }

    function deriveSource(referrer: string | null): string {
      if (!referrer) return "Direct";
      const r = referrer.toLowerCase();
      if (r.includes("google") && (r.includes("cpc") || r.includes("gclid") || r.includes("ads"))) return "Google Ads";
      if (r.includes("google.com") || r.includes("google.co")) return "Google Organic";
      if (r.includes("producthunt.com")) return "ProductHunt";
      if (r.includes("reddit.com")) return "Reddit";
      if (r.includes("linkedin.com")) return "LinkedIn";
      if (r.includes("twitter.com") || r.includes("t.co") || r.includes("x.com")) return "Twitter/X";
      if (r.includes("facebook.com") || r.includes("fb.com")) return "Facebook";
      if (r.includes("instagram.com")) return "Instagram";
      if (r.includes("email") || r.includes("newsletter") || r.includes("mailchimp") || r.includes("sendgrid")) return "Email Campaign";
      if (r.includes("bing.com")) return "Bing";
      if (r.includes("yahoo.com")) return "Yahoo";
      return "Referral";
    }

    function deriveDevice(deviceType: string | null): string {
      if (!deviceType) return "Desktop";
      const d = deviceType.toLowerCase();
      if (d === "mobile") return "Mobile";
      if (d === "tablet") return "Tablet";
      return "Desktop";
    }

    const journeys = Object.entries(sessionMap).map(([sessionId, rows], idx) => {
      const sorted = rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const source = deriveSource(first.referrer);
      const device = deriveDevice(first.device_type);
      const country = first.country || "";
      const landingPage = first.path || "/";
      const converted = convertedSessions.has(sessionId);

      const sessionStartMs = new Date(first.session_start || first.created_at).getTime();
      const sessionEndMs = new Date(last.session_end || last.created_at).getTime();
      const totalTime = Math.max(Math.round((sessionEndMs - sessionStartMs) / 1000), sorted.length > 1 ? 1 : 0);

      const steps = sorted.map((row, i) => {
        const isFirst = i === 0;
        const isLast = i === sorted.length - 1;
        const duration = Math.min(Math.max(parseInt(row.step_duration) || 10, 1), 600);
        return {
          page: row.path || "/",
          duration,
          isError: false,
          errorMsg: null as string | null,
          event: isFirst ? "Landing" : isLast && converted ? "Conversion" : "Page View",
        };
      });

      const isBounce = sorted.length === 1;
      const exitReason = converted ? "Converted" : isBounce ? "Bounced" : totalTime < 10 ? "Bounced" : "Closed Tab";

      return {
        id: `SID-${sessionId.slice(-8).toUpperCase()}`,
        source,
        landingPage,
        steps,
        totalTime,
        device,
        country,
        converted,
        hasError: false,
        error: null as string | null,
        exitReason,
        pageCount: sorted.length,
        startTs: sessionStartMs,
      };
    });

    // Sort by most recent first, limit to 500
    journeys.sort((a, b) => b.startTs - a.startTs);
    const limited = journeys.slice(0, 500);

    return c.json({ journeys: limited, total: journeys.length });
  } catch (error: any) {
    console.error('[SuperAdmin] Journeys fetch error:', error);
    return c.json({ error: 'Failed to fetch journeys', detail: error.message }, 500);
  }
});

app.get('/email-monitoring', authMiddleware, async (c) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs`);
    const total = Number((totalResult.rows[0] as any)?.count || 0);

    const sentResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE status = 'sent'`);
    const failedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE status = 'failed'`);
    const openedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE opens > 0`);
    const clickedResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE clicks > 0`);
    const todayResult = await db.execute(sql`SELECT COUNT(*) as count FROM email_logs WHERE sent_at >= ${todayIso}`);

    const sentCount = Number((sentResult.rows[0] as any)?.count || 0);
    const failedCount = Number((failedResult.rows[0] as any)?.count || 0);
    const openedCount = Number((openedResult.rows[0] as any)?.count || 0);
    const sentToday = Number((todayResult.rows[0] as any)?.count || 0);

    const deliveryRate = total > 0 ? Math.round((sentCount / total) * 100) : 0;
    const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
    const bounceRate = total > 0 ? Math.round((failedCount / total) * 100) : 0;

    const recentResult = await db.execute(sql`
      SELECT id, recipient, subject, status, opens, clicks, sent_at
      FROM email_logs
      ORDER BY sent_at DESC
      LIMIT 20
    `);

    const dailyResult = await db.execute(sql`
      SELECT
        DATE(sent_at) as date,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'sent') as delivered,
        COUNT(*) FILTER (WHERE opens > 0) as opened
      FROM email_logs
      WHERE sent_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `);

    const recentEmails = (recentResult.rows as any[]).map(r => ({
      id: r.id,
      to: r.recipient,
      subject: r.subject,
      status: r.status,
      opened: (r.opens || 0) > 0,
      clicked: (r.clicks || 0) > 0,
      sentAt: r.sent_at,
    }));

    const dailyStats = (dailyResult.rows as any[]).map(r => ({
      date: r.date,
      count: Number(r.count),
      delivered: Number(r.delivered),
      opened: Number(r.opened),
    }));

    return c.json({
      sentToday,
      deliveryRate,
      openRate,
      bounceRate,
      totalSent: total,
      recentEmails,
      dailyStats,
    });
  } catch (error: any) {
    console.error('[SuperAdmin] Email monitoring error:', error);
    return c.json({ error: 'Failed to fetch email monitoring data', detail: error.message }, 500);
  }
});

app.get('/system-logs', authMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 500);
    const search = c.req.query('search') || '';
    const source = c.req.query('source') || 'all';
    const offset = (page - 1) * limit;

    let auditRows: any[] = [];
    let eventRows: any[] = [];

    if (source === 'all' || source === 'audit') {
      const searchClause = search
        ? sql`AND (action ILIKE ${'%' + search + '%'} OR resource_type ILIKE ${'%' + search + '%'} OR CAST(details AS TEXT) ILIKE ${'%' + search + '%'})`
        : sql``;
      const res = await db.execute(sql`
        SELECT
          id, user_id, action, resource_type, level,
          details, ip_address, created_at,
          'audit' as log_source
        FROM audit_logs
        WHERE 1=1 ${searchClause}
        ORDER BY created_at DESC
        LIMIT ${limit * 2}
      `);
      auditRows = res.rows as any[];
    }

    if (source === 'all' || source === 'events') {
      const searchClause = search
        ? sql`AND (event_type ILIKE ${'%' + search + '%'} OR title ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})`
        : sql``;
      const res = await db.execute(sql`
        SELECT
          id, user_id, event_type as action, title as resource_type, 'info' as level,
          metadata as details, NULL as ip_address, created_at,
          'event' as log_source
        FROM user_events
        WHERE 1=1 ${searchClause}
        ORDER BY created_at DESC
        LIMIT ${limit * 2}
      `);
      eventRows = res.rows as any[];
    }

    const combined = [...auditRows, ...eventRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)
      .map(r => ({
        id: r.id,
        source: r.log_source,
        userId: r.user_id || null,
        action: r.action,
        resourceType: r.resource_type || null,
        level: r.level || 'info',
        details: r.details || null,
        ipAddress: r.ip_address || null,
        createdAt: r.created_at,
      }));

    const totalCount = auditRows.length + eventRows.length;

    return c.json({ logs: combined, total: totalCount, page, limit });
  } catch (error: any) {
    console.error('[SuperAdmin] System logs error:', error);
    return c.json({ error: 'Failed to fetch system logs', detail: error.message }, 500);
  }
});

// ─── GSC API helper ───────────────────────────────────────────────────────────

async function getGSCClient() {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;

  const { google } = await import('googleapis');
  // Handle escaped newlines stored in the secret
  const privateKey = rawKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return google.searchconsole({ version: 'v1', auth });
}

async function queryGSC(params: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  dimensionFilterGroups?: any[];
}) {
  const gsc = await getGSCClient();
  if (!gsc) return null;
  try {
    const res = await gsc.searchanalytics.query({
      siteUrl: params.siteUrl,
      requestBody: {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions,
        rowLimit: params.rowLimit || 500,
        dimensionFilterGroups: params.dimensionFilterGroups,
      },
    });
    return res.data.rows || [];
  } catch (err: any) {
    console.error('[GSC] Query error:', err?.message || err);
    return null;
  }
}

function dateStr(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

// ─── SEO Dashboard ────────────────────────────────────────────────────────────

app.get('/seo/overview', authMiddleware, async (c) => {
  try {
    const { pageViews } = await import('../../shared/schema');
    const { gte, like, count, ilike } = await import('drizzle-orm');
    const drizzleSql = (await import('drizzle-orm')).sql;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const organicFilter = sql`(
      ${pageViews.referrer} ILIKE '%google.%' OR
      ${pageViews.referrer} ILIKE '%bing.com%' OR
      ${pageViews.referrer} ILIKE '%yahoo.com%' OR
      ${pageViews.referrer} ILIKE '%duckduckgo.com%' OR
      ${pageViews.referrer} ILIKE '%yandex.%'
    )`;

    const [
      totalOrganicRows,
      totalAllRows,
      organicLast7Rows,
      organicPerPage,
      topReferrers,
    ] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` })
        .from(pageViews)
        .where(and(gte(pageViews.createdAt, thirtyDaysAgo), organicFilter)),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(pageViews)
        .where(gte(pageViews.createdAt, thirtyDaysAgo)),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(pageViews)
        .where(and(gte(pageViews.createdAt, sevenDaysAgo), organicFilter)),
      db.select({
        path: pageViews.path,
        visits: sql<number>`COUNT(*)`,
      }).from(pageViews)
        .where(and(gte(pageViews.createdAt, thirtyDaysAgo), organicFilter))
        .groupBy(pageViews.path)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(20),
      db.select({
        referrer: pageViews.referrer,
        visits: sql<number>`COUNT(*)`,
      }).from(pageViews)
        .where(and(gte(pageViews.createdAt, thirtyDaysAgo), organicFilter))
        .groupBy(pageViews.referrer)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(10),
    ]);

    const organicTotal30 = Number(totalOrganicRows[0]?.count || 0);
    const allTotal30 = Number(totalAllRows[0]?.count || 0);
    const organicShare = allTotal30 > 0 ? Math.round((organicTotal30 / allTotal30) * 100) : 0;

    // Pull live GSC summary if connected
    let gscSummary: { clicks: number; impressions: number; ctr: number; avgPosition: number } | null = null;
    const siteUrl = process.env.GSC_PROPERTY_URL;
    if (process.env.GSC_SERVICE_ACCOUNT_EMAIL && siteUrl) {
      try {
        const gscRows = await queryGSC({
          siteUrl,
          startDate: dateStr(30),
          endDate: dateStr(1),
          dimensions: ['date'],
          rowLimit: 30,
        });
        if (gscRows && gscRows.length > 0) {
          const totals = gscRows.reduce((acc: any, row: any) => ({
            clicks: acc.clicks + (row.clicks || 0),
            impressions: acc.impressions + (row.impressions || 0),
            position: acc.position + (row.position || 0),
            count: acc.count + 1,
          }), { clicks: 0, impressions: 0, position: 0, count: 0 });
          gscSummary = {
            clicks: totals.clicks,
            impressions: totals.impressions,
            ctr: totals.impressions > 0 ? +(totals.clicks / totals.impressions * 100).toFixed(2) : 0,
            avgPosition: totals.count > 0 ? +(totals.position / totals.count).toFixed(1) : 0,
          };
        }
      } catch (e) { console.error('[GSC] overview summary error:', e); }
    }

    return c.json({
      organicVisits30d: organicTotal30,
      organicVisits7d: Number(organicLast7Rows[0]?.count || 0),
      totalVisits30d: allTotal30,
      organicSharePct: organicShare,
      gscConnected: !!(process.env.GSC_SERVICE_ACCOUNT_EMAIL),
      gscSummary,
      pagesWithOrganicTraffic: organicPerPage.length,
      topOrganicPages: organicPerPage.map(r => ({ path: r.path, visits: Number(r.visits) })),
      topSearchEngines: topReferrers.map(r => {
        const ref = r.referrer || '';
        let engine = 'Other';
        if (ref.includes('google')) engine = 'Google';
        else if (ref.includes('bing')) engine = 'Bing';
        else if (ref.includes('yahoo')) engine = 'Yahoo';
        else if (ref.includes('duckduckgo')) engine = 'DuckDuckGo';
        else if (ref.includes('yandex')) engine = 'Yandex';
        return { engine, referrer: ref, visits: Number(r.visits) };
      }),
    });
  } catch (error: any) {
    console.error('[SEO] overview error:', error);
    return c.json({ error: 'Failed to fetch SEO overview', detail: error.message }, 500);
  }
});

// ── In-memory cache for live page signal checks ───────────────────────────────
// Each entry: { signals, fetchedAt }. TTL = 10 minutes.
// Bypassed when ?bust=1 is passed (triggered by the Refresh button).
const _seoSignalsCache = new Map<string, { signals: LiveSignals; fetchedAt: number }>();
const SEO_SIGNAL_TTL = 10 * 60 * 1000;

interface LiveSignals {
  hasTitle: boolean;
  hasDesc: boolean;
  hasH1: boolean;
  hasStructuredData: boolean;
  hasOG: boolean;
  hasCanonical: boolean;
}

async function fetchLiveSignals(pagePath: string): Promise<LiveSignals | null> {
  const port = process.env.PORT || '3001';
  const url = `http://localhost:${port}${pagePath}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(7000),
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return {
      hasTitle: /<title>[^<]{5,}<\/title>/i.test(html),
      hasDesc:
        /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{15,}["']/i.test(html) ||
        /<meta[^>]+content=["'][^"']{15,}["'][^>]+name=["']description["']/i.test(html),
      hasH1: /<h1[\s>]/i.test(html),
      hasStructuredData:
        html.includes('application/ld+json') && html.includes('"@type"'),
      hasOG:
        /<meta[^>]+property=["']og:title["']/i.test(html) ||
        /<meta[^>]+property=["']og:description["']/i.test(html),
      hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
    };
  } catch (e: any) {
    console.error(`[SEO] live signal fetch failed for ${pagePath}:`, e.message);
    return null;
  }
}

app.get('/seo/pages', authMiddleware, async (c) => {
  try {
    const { pageViews } = await import('../../shared/schema');
    const { gte } = await import('drizzle-orm');
    const bust = c.req.query('bust') === '1';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const organicFilter = sql`(
      ${pageViews.referrer} ILIKE '%google.%' OR
      ${pageViews.referrer} ILIKE '%bing.com%' OR
      ${pageViews.referrer} ILIKE '%yahoo.com%' OR
      ${pageViews.referrer} ILIKE '%duckduckgo.com%'
    )`;

    const [organicPerPage, allPerPage] = await Promise.all([
      db.select({
        path: pageViews.path,
        visits: sql<number>`COUNT(*)`,
      }).from(pageViews)
        .where(and(gte(pageViews.createdAt, thirtyDaysAgo), organicFilter))
        .groupBy(pageViews.path)
        .orderBy(sql`COUNT(*) DESC`),
      db.select({
        path: pageViews.path,
        visits: sql<number>`COUNT(*)`,
      }).from(pageViews)
        .where(gte(pageViews.createdAt, thirtyDaysAgo))
        .groupBy(pageViews.path)
        .orderBy(sql`COUNT(*) DESC`),
    ]);

    const organicMap = new Map(organicPerPage.map(r => [r.path, Number(r.visits)]));
    const allMap = new Map(allPerPage.map(r => [r.path, Number(r.visits)]));

    // Page metadata — only keywords, priority, label, and estimated word count
    // (word count cannot be computed from static HTML of a React SPA)
    const sitemapPages = [
      { path: '/', priority: 1.0, label: 'Homepage', targetKeywords: ['google ads tool', 'google ads automation', 'adiology'], wordCount: 850 },
      { path: '/features/campaign-builder', priority: 0.9, label: 'Campaign Builder', targetKeywords: ['google ads campaign builder', 'build google ads campaigns', 'campaign automation'], wordCount: 620 },
      { path: '/features/keyword-planner', priority: 0.9, label: 'Keyword Planner', targetKeywords: ['google ads keyword planner', 'keyword research tool', 'ppc keywords'], wordCount: 590 },
      { path: '/pricing', priority: 0.9, label: 'Pricing', targetKeywords: ['adiology pricing', 'google ads tool pricing', 'ppc tool cost'], wordCount: 400 },
      { path: '/features/ads-search', priority: 0.8, label: 'Ads Search', targetKeywords: ['google ads search tool', 'competitor ad research'], wordCount: 540 },
      { path: '/features/click-guard', priority: 0.8, label: 'Click Guard', targetKeywords: ['click fraud protection', 'invalid click guard', 'google ads click fraud'], wordCount: 610 },
      { path: '/blog', priority: 0.8, label: 'Blog Index', targetKeywords: ['google ads blog', 'ppc tips blog', 'google ads news'], wordCount: 300 },
      { path: '/features/blog-generator', priority: 0.7, label: 'Blog Generator', targetKeywords: ['ai blog generator', 'seo blog writer', 'content generator'], wordCount: 510 },
      { path: '/features/proxy-mail', priority: 0.7, label: 'Proxy Mail', targetKeywords: ['anonymous email tool', 'competitor research email'], wordCount: 480 },
      { path: '/features/domain-monitor', priority: 0.7, label: 'Domain Monitor', targetKeywords: ['domain monitoring tool', 'google ads domain monitor'], wordCount: 520 },
      { path: '/features/instant-mail', priority: 0.7, label: 'Instant Mail', targetKeywords: ['instant email tool', 'temporary email'], wordCount: 460 },
      { path: '/lifetime-deal', priority: 0.7, label: 'Lifetime Deal', targetKeywords: ['adiology lifetime deal', 'google ads tool lifetime deal', 'saas lifetime deal'], wordCount: 720 },
      { path: '/contact', priority: 0.5, label: 'Contact', targetKeywords: [], wordCount: 180 },
      { path: '/help-center', priority: 0.5, label: 'Help Center', targetKeywords: ['adiology help', 'google ads help', 'ppc support'], wordCount: 350 },
      { path: '/privacy-policy', priority: 0.3, label: 'Privacy Policy', targetKeywords: [], wordCount: 1200 },
      { path: '/terms-of-service', priority: 0.3, label: 'Terms of Service', targetKeywords: [], wordCount: 1400 },
      { path: '/refund-policy', priority: 0.3, label: 'Refund Policy', targetKeywords: [], wordCount: 600 },
    ];

    // Fetch live HTML signals for all pages in parallel (with cache)
    const now = Date.now();
    const signalResults = await Promise.all(
      sitemapPages.map(async (page) => {
        const cached = _seoSignalsCache.get(page.path);
        if (!bust && cached && now - cached.fetchedAt < SEO_SIGNAL_TTL) {
          return { path: page.path, signals: cached.signals, fromCache: true };
        }
        const live = await fetchLiveSignals(page.path);
        if (live) {
          _seoSignalsCache.set(page.path, { signals: live, fetchedAt: now });
          return { path: page.path, signals: live, fromCache: false };
        }
        // Fallback: use stale cache or safe defaults if fetch failed
        if (cached) return { path: page.path, signals: cached.signals, fromCache: true };
        return {
          path: page.path,
          fromCache: false,
          signals: { hasTitle: true, hasDesc: true, hasH1: true, hasStructuredData: false, hasOG: true, hasCanonical: true } as LiveSignals,
        };
      })
    );
    const signalMap = new Map(signalResults.map(r => [r.path, r.signals]));

    const pages = sitemapPages.map(page => {
      const sig = signalMap.get(page.path)!;
      const issues: string[] = [];
      if (!sig.hasStructuredData) issues.push('Missing JSON-LD structured data');
      if (page.wordCount < 300) issues.push('Thin content (under 300 words)');
      if (!sig.hasDesc) issues.push('Missing meta description');
      if (!sig.hasOG) issues.push('Missing Open Graph tags');
      if (page.targetKeywords.length === 0 && page.priority >= 0.5) issues.push('No target keywords defined');
      if (page.wordCount < 500 && page.priority >= 0.7) issues.push('Content too thin for competitive ranking');

      const passCount = [
        sig.hasTitle, sig.hasDesc, sig.hasH1, sig.hasStructuredData,
        sig.hasOG, sig.hasCanonical, page.wordCount >= 400,
        page.targetKeywords.length > 0,
      ].filter(Boolean).length;
      const seoScore = Math.round((passCount / 8) * 100);

      return {
        path: page.path,
        label: page.label,
        priority: page.priority,
        targetKeywords: page.targetKeywords,
        wordCount: page.wordCount,
        seoScore,
        organicVisits30d: organicMap.get(page.path) || 0,
        totalVisits30d: allMap.get(page.path) || 0,
        issues,
        signals: {
          title: sig.hasTitle,
          metaDesc: sig.hasDesc,
          h1: sig.hasH1,
          structuredData: sig.hasStructuredData,
          openGraph: sig.hasOG,
          canonical: sig.hasCanonical,
        },
        inSitemap: true,
      };
    });

    return c.json({ pages, asOf: new Date().toISOString(), busted: bust });
  } catch (error: any) {
    console.error('[SEO] pages error:', error);
    return c.json({ error: 'Failed to fetch SEO pages', detail: error.message }, 500);
  }
});

// ─── GSC Keyword Rankings ─────────────────────────────────────────────────────

app.get('/seo/keywords', authMiddleware, async (c) => {
  const siteUrl = process.env.GSC_PROPERTY_URL;
  if (!process.env.GSC_SERVICE_ACCOUNT_EMAIL || !siteUrl) {
    return c.json({ connected: false, keywords: [] });
  }

  try {
    const days = parseInt(c.req.query('days') || '28');
    const limit = parseInt(c.req.query('limit') || '200');

    const rows = await queryGSC({
      siteUrl,
      startDate: dateStr(days),
      endDate: dateStr(1),
      dimensions: ['query'],
      rowLimit: limit,
    });

    if (!rows) return c.json({ connected: true, keywords: [], error: 'GSC query failed — check service account permissions' });

    const keywords = rows.map((row: any) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr ? +(row.ctr * 100).toFixed(2) : 0,
      position: row.position ? +row.position.toFixed(1) : 0,
    })).sort((a: any, b: any) => b.clicks - a.clicks);

    return c.json({ connected: true, keywords, asOf: new Date().toISOString(), period: `Last ${days} days` });
  } catch (error: any) {
    console.error('[GSC] keywords error:', error);
    return c.json({ connected: true, keywords: [], error: error.message }, 500);
  }
});

// ─── GSC Page Performance ─────────────────────────────────────────────────────

app.get('/seo/gsc-pages', authMiddleware, async (c) => {
  const siteUrl = process.env.GSC_PROPERTY_URL;
  if (!process.env.GSC_SERVICE_ACCOUNT_EMAIL || !siteUrl) {
    return c.json({ connected: false, pages: [] });
  }

  try {
    const rows = await queryGSC({
      siteUrl,
      startDate: dateStr(28),
      endDate: dateStr(1),
      dimensions: ['page'],
      rowLimit: 100,
    });

    if (!rows) return c.json({ connected: true, pages: [] });

    const pages = rows.map((row: any) => {
      const url = row.keys?.[0] || '';
      const path = url.replace(siteUrl.replace(/\/$/, ''), '') || '/';
      return {
        path,
        url,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr ? +(row.ctr * 100).toFixed(2) : 0,
        position: row.position ? +row.position.toFixed(1) : 0,
      };
    }).sort((a: any, b: any) => b.clicks - a.clicks);

    return c.json({ connected: true, pages, asOf: new Date().toISOString() });
  } catch (error: any) {
    console.error('[GSC] pages error:', error);
    return c.json({ connected: true, pages: [], error: error.message }, 500);
  }
});

// ── Blocked IPs management ────────────────────────────────────────────────────

app.get('/blocked-ips', authMiddleware, async (c) => {
  try {
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();
    const result = await dbInst.execute(drizzleSql.raw(`
      SELECT ip, reason, blocked_by, created_at FROM blocked_ips ORDER BY created_at DESC
    `));
    return c.json({ blockedIps: result.rows || [] });
  } catch (error: any) {
    console.error('[SuperAdmin] Blocked IPs fetch error:', error);
    return c.json({ error: 'Failed to fetch blocked IPs' }, 500);
  }
});

app.post('/blocked-ips', authMiddleware, async (c) => {
  try {
    const { ip, reason } = await c.req.json();
    if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
      return c.json({ error: 'IP address is required' }, 400);
    }
    const cleanIp = ip.trim();
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();
    await dbInst.execute(drizzleSql.raw(`
      INSERT INTO blocked_ips (ip, reason, blocked_by)
      VALUES ('${cleanIp.replace(/'/g, "''")}', ${reason ? `'${String(reason).replace(/'/g, "''")}'` : 'NULL'}, 'superadmin')
      ON CONFLICT (ip) DO NOTHING
    `));
    return c.json({ success: true, ip: cleanIp });
  } catch (error: any) {
    console.error('[SuperAdmin] Block IP error:', error);
    return c.json({ error: 'Failed to block IP' }, 500);
  }
});

app.delete('/blocked-ips/:ip', authMiddleware, async (c) => {
  try {
    const ip = decodeURIComponent(c.req.param('ip') || '');
    if (!ip) return c.json({ error: 'IP address is required' }, 400);
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();
    await dbInst.execute(drizzleSql.raw(`
      DELETE FROM blocked_ips WHERE ip = '${ip.replace(/'/g, "''")}'
    `));
    return c.json({ success: true, ip });
  } catch (error: any) {
    console.error('[SuperAdmin] Unblock IP error:', error);
    return c.json({ error: 'Failed to unblock IP' }, 500);
  }
});

// ─── Replit Dev Spend ───────────────────────────────────────────────────────
app.get('/replit-spend', authMiddleware, async (c) => {
  try {
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();
    const result = await dbInst.execute(drizzleSql.raw(`
      SELECT value, updated_at FROM system_settings WHERE key = 'replit_dev_spend' LIMIT 1
    `));
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0] as any;
      const val = row.value;
      return c.json({
        amount: typeof val === 'object' && val !== null ? val.amount ?? 0 : 0,
        updatedAt: row.updated_at
      });
    }
    return c.json({ amount: 0, updatedAt: null });
  } catch (error: any) {
    console.error('[SuperAdmin] Replit spend fetch error:', error);
    return c.json({ error: 'Failed to fetch Replit spend' }, 500);
  }
});

app.put('/replit-spend', authMiddleware, async (c) => {
  try {
    const { amount } = await c.req.json();
    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount < 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }
    const { getDb } = await import('../db');
    const { sql: drizzleSql } = await import('drizzle-orm');
    const dbInst = getDb();
    await dbInst.execute(drizzleSql.raw(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('replit_dev_spend', '${JSON.stringify({ amount: numAmount })}'::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = '${JSON.stringify({ amount: numAmount })}'::jsonb, updated_at = NOW()
    `));
    return c.json({ success: true, amount: numAmount });
  } catch (error: any) {
    console.error('[SuperAdmin] Replit spend update error:', error);
    return c.json({ error: 'Failed to update Replit spend' }, 500);
  }
});

// ============================================
// Bulk Blog Generation Routes
// ============================================

app.post('/blog/bulk-generate', authMiddleware, async (c) => {
  try {
    const { keywords, batchId } = await c.req.json();
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return c.json({ error: 'keywords must be a non-empty array' }, 400);
    }
    if (keywords.length > 500) {
      return c.json({ error: 'Maximum 500 keywords per batch' }, 400);
    }

    const { articleGenerationJobs, blogPosts } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');
    const bid = batchId || `batch_${Date.now()}`;

    let queued = 0;
    let skipped = 0;
    for (const raw of keywords) {
      const keyword = String(raw).trim();
      if (!keyword) { skipped++; continue; }

      const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (existing.length > 0) { skipped++; continue; }

      const existingJob = await db
        .select({ id: articleGenerationJobs.id })
        .from(articleGenerationJobs)
        .where(eq(articleGenerationJobs.keyword, keyword))
        .limit(1);

      if (existingJob.length > 0 && !['failed', 'skipped'].includes((existingJob[0] as any).status || '')) {
        skipped++;
        continue;
      }

      await db.insert(articleGenerationJobs).values({
        keyword,
        status: 'queued',
        batchId: bid,
      });
      queued++;
    }

    return c.json({ success: true, queued, skipped, batchId: bid });
  } catch (error: any) {
    console.error('[SuperAdmin] Bulk generate error:', error);
    return c.json({ error: 'Failed to queue articles', message: error.message }, 500);
  }
});

app.get('/blog/bulk-queue', authMiddleware, async (c) => {
  try {
    const { articleGenerationJobs } = await import('../../shared/schema');
    const { desc, sql: drizzleSql } = await import('drizzle-orm');

    const jobs = await db
      .select()
      .from(articleGenerationJobs)
      .orderBy(desc(articleGenerationJobs.createdAt))
      .limit(500);

    const counts = await db.execute(drizzleSql.raw(`
      SELECT status, COUNT(*) as count FROM article_generation_jobs GROUP BY status
    `));

    const summary: Record<string, number> = {};
    for (const row of (counts.rows || []) as any[]) {
      summary[row.status] = Number(row.count);
    }

    return c.json({ jobs, summary });
  } catch (error: any) {
    console.error('[SuperAdmin] Bulk queue fetch error:', error);
    return c.json({ error: 'Failed to fetch queue', message: error.message }, 500);
  }
});

app.post('/blog/bulk-retry', authMiddleware, async (c) => {
  try {
    const { jobIds } = await c.req.json();
    const { articleGenerationJobs } = await import('../../shared/schema');
    const { inArray } = await import('drizzle-orm');

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return c.json({ error: 'jobIds must be a non-empty array' }, 400);
    }

    await db
      .update(articleGenerationJobs)
      .set({ status: 'queued', errorMsg: null, startedAt: null, completedAt: null })
      .where(inArray(articleGenerationJobs.id, jobIds));

    return c.json({ success: true, retried: jobIds.length });
  } catch (error: any) {
    console.error('[SuperAdmin] Bulk retry error:', error);
    return c.json({ error: 'Failed to retry jobs', message: error.message }, 500);
  }
});

app.delete('/blog/bulk-clear', authMiddleware, async (c) => {
  try {
    const { status } = await c.req.json().catch(() => ({}));
    const { articleGenerationJobs } = await import('../../shared/schema');
    const { eq, inArray } = await import('drizzle-orm');

    const validStatuses = ['completed', 'skipped', 'failed'];
    const statuses = Array.isArray(status) ? status.filter((s: string) => validStatuses.includes(s)) : validStatuses;

    await db
      .delete(articleGenerationJobs)
      .where(inArray(articleGenerationJobs.status, statuses));

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[SuperAdmin] Bulk clear error:', error);
    return c.json({ error: 'Failed to clear jobs', message: error.message }, 500);
  }
});

app.get('/blog/bulk-export-csv', authMiddleware, async (c) => {
  try {
    const { articleGenerationJobs } = await import('../../shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    const jobs = await db
      .select()
      .from(articleGenerationJobs)
      .where(eq(articleGenerationJobs.status, 'completed'))
      .orderBy(desc(articleGenerationJobs.completedAt));

    const rows = [
      ['keyword', 'title_slug', 'url', 'word_count', 'category', 'completed_at'],
      ...jobs.map((j) => [
        j.keyword,
        j.articleSlug || '',
        j.articleSlug ? `https://adiology.io/blog/${j.articleSlug}` : '',
        String(j.wordCount || 0),
        j.category || '',
        j.completedAt ? new Date(j.completedAt).toISOString() : '',
      ]),
    ];

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', 'attachment; filename="bulk-articles.csv"');
    return c.text(csv);
  } catch (error: any) {
    console.error('[SuperAdmin] Export CSV error:', error);
    return c.json({ error: 'Failed to export CSV', message: error.message }, 500);
  }
});

app.get('/blog/article-performance', authMiddleware, async (c) => {
  try {
    const { articlePageViews, articleConversions, blogPosts } = await import('../../shared/schema');
    const { eq, desc, sql: drizzleSql, and, gte, count } = await import('drizzle-orm');

    const periodParam = c.req.query('period') || '30';
    const period = parseInt(periodParam, 10) || 30;
    const sortParam = c.req.query('sort') || 'views_30d';

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    const viewsAllTime = await db
      .select({
        articleSlug: articlePageViews.articleSlug,
        total: count(),
      })
      .from(articlePageViews)
      .groupBy(articlePageViews.articleSlug);

    const views7d = await db
      .select({
        articleSlug: articlePageViews.articleSlug,
        total: count(),
      })
      .from(articlePageViews)
      .where(gte(articlePageViews.createdAt, new Date(Date.now() - 7 * 86400000)))
      .groupBy(articlePageViews.articleSlug);

    const views30d = await db
      .select({
        articleSlug: articlePageViews.articleSlug,
        total: count(),
      })
      .from(articlePageViews)
      .where(gte(articlePageViews.createdAt, new Date(Date.now() - 30 * 86400000)))
      .groupBy(articlePageViews.articleSlug);

    const signups = await db
      .select({
        articleSlug: articleConversions.articleSlug,
        total: count(),
      })
      .from(articleConversions)
      .where(eq(articleConversions.eventType, 'signup'))
      .groupBy(articleConversions.articleSlug);

    const paidConversions = await db
      .select({
        articleSlug: articleConversions.articleSlug,
        total: count(),
        revenue: drizzleSql<number>`COALESCE(SUM(${articleConversions.revenueCents}), 0)`,
      })
      .from(articleConversions)
      .where(eq(articleConversions.eventType, 'paid'))
      .groupBy(articleConversions.articleSlug);

    const articles = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, createdAt: blogPosts.createdAt })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));

    const allSlugs = new Set([
      ...viewsAllTime.map((r) => r.articleSlug),
      ...articles.map((a) => a.slug),
    ]);

    const allTimeMap = Object.fromEntries(viewsAllTime.map((r) => [r.articleSlug, Number(r.total)]));
    const v7Map = Object.fromEntries(views7d.map((r) => [r.articleSlug, Number(r.total)]));
    const v30Map = Object.fromEntries(views30d.map((r) => [r.articleSlug, Number(r.total)]));
    const signupMap = Object.fromEntries(signups.map((r) => [r.articleSlug, Number(r.total)]));
    const paidMap = Object.fromEntries(paidConversions.map((r) => [r.articleSlug, { count: Number(r.total), revenue: Number(r.revenue) }]));
    const articleMeta = Object.fromEntries(articles.map((a) => [a.slug, { title: a.title, createdAt: a.createdAt }]));

    const rows = Array.from(allSlugs).map((slug) => {
      const views = allTimeMap[slug] || 0;
      const views7 = v7Map[slug] || 0;
      const views30 = v30Map[slug] || 0;
      const signupCount = signupMap[slug] || 0;
      const paid = paidMap[slug] || { count: 0, revenue: 0 };
      const conversionRate = views > 0 ? ((signupCount / views) * 100).toFixed(2) : '0.00';

      return {
        slug,
        title: articleMeta[slug]?.title || slug,
        url: `https://adiology.io/blog/${slug}`,
        viewsAllTime: views,
        views7d: views7,
        views30d: views30,
        signups: signupCount,
        paidConversions: paid.count,
        revenueCents: paid.revenue,
        conversionRate: parseFloat(conversionRate),
        createdAt: articleMeta[slug]?.createdAt || null,
      };
    });

    const sortFns: Record<string, (a: any, b: any) => number> = {
      views_alltime: (a, b) => b.viewsAllTime - a.viewsAllTime,
      views_30d: (a, b) => b.views30d - a.views30d,
      views_7d: (a, b) => b.views7d - a.views7d,
      signups: (a, b) => b.signups - a.signups,
      paid: (a, b) => b.paidConversions - a.paidConversions,
      revenue: (a, b) => b.revenueCents - a.revenueCents,
      conversion_rate: (a, b) => b.conversionRate - a.conversionRate,
      newest: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    };

    rows.sort(sortFns[sortParam] || sortFns['views_30d']);

    return c.json({ success: true, rows, period, sort: sortParam });
  } catch (error: any) {
    console.error('[SuperAdmin] article-performance error:', error);
    return c.json({ error: 'Failed to fetch article performance', message: error.message }, 500);
  }
});

app.get('/blog/article-daily/:slug', authMiddleware, async (c) => {
  try {
    const { articlePageViews, articleConversions } = await import('../../shared/schema');
    const { eq, and, gte, sql: drizzleSql, count } = await import('drizzle-orm');

    const slug = c.req.param('slug');
    const days = 30;
    const since = new Date(Date.now() - days * 86400000);

    const daily = await db
      .select({
        day: drizzleSql<string>`DATE(${articlePageViews.createdAt})`,
        views: count(),
      })
      .from(articlePageViews)
      .where(and(eq(articlePageViews.articleSlug, slug), gte(articlePageViews.createdAt, since)))
      .groupBy(drizzleSql`DATE(${articlePageViews.createdAt})`)
      .orderBy(drizzleSql`DATE(${articlePageViews.createdAt})`);

    const conversionList = await db
      .select()
      .from(articleConversions)
      .where(eq(articleConversions.articleSlug, slug));

    return c.json({ success: true, daily, conversions: conversionList });
  } catch (error: any) {
    console.error('[SuperAdmin] article-daily error:', error);
    return c.json({ error: 'Failed to fetch daily stats', message: error.message }, 500);
  }
});

export { app as superadminRoutes };

