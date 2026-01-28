import { Hono } from 'hono';
import { db } from '../db';
import { users, subscriptions, auditLogs, securityRules, emailLogs, promoTrials } from '../../shared/schema';
import { eq, desc, sql, and, or, like } from 'drizzle-orm';
import { adminAuthMiddleware, logAdminAction, type AdminContext } from '../adminAuthService';

type AdminEnv = { Variables: { admin: AdminContext } };
const adminRoutes = new Hono<AdminEnv>();

// Apply admin auth middleware to all routes
adminRoutes.use('*', async (c, next) => {
  const authResult = await adminAuthMiddleware(c);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set('admin', authResult);
  await next();
});

// GET /api/admin/stats - Dashboard stats
adminRoutes.get('/stats', async (c) => {
  try {
    const admin = c.get('admin');
    
    // Get total users
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    // Get active subscriptions
    const activeSubscriptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    // Get monthly revenue (simplified - sum of subscription amounts)
    const monthlyRevenue = await db
      .select({ revenue: sql<number>`coalesce(sum(amount_cents), 0)` })
      .from(subscriptions);
    
    // Get error count from audit logs
    const errorCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.level, 'error'));
    
    // Get active trials
    const activeTrials = await db
      .select({ count: sql<number>`count(*)` })
      .from(promoTrials)
      .where(eq(promoTrials.status, 'pending'));
    
    // Get emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const emailsSent = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(sql`${emailLogs.sentAt} >= ${today}`);

    await logAdminAction(admin.user.id, 'view_stats', 'dashboard');

    return c.json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers[0]?.count?.toString() || '0'),
        activeSubscriptions: parseInt(activeSubscriptions[0]?.count?.toString() || '0'),
        monthlyRevenue: parseInt(monthlyRevenue[0]?.revenue?.toString() || '0') / 100, // Convert cents to dollars
        errorCount: parseInt(errorCount[0]?.count?.toString() || '0'),
        activeTrials: parseInt(activeTrials[0]?.count?.toString() || '0'),
        emailsSent: parseInt(emailsSent[0]?.count?.toString() || '0'),
      },
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return c.json({ error: 'Failed to fetch stats', message: error.message }, 500);
  }
});

// GET /api/admin/activity - Recent activity
adminRoutes.get('/activity', async (c) => {
  try {
    const admin = c.get('admin');
    
    const activities = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    await logAdminAction(admin.user.id, 'view_activity', 'audit_logs');

    return c.json({
      success: true,
      data: {
        activities: activities.map((a) => ({
          id: a.id,
          action: a.action,
          resourceType: a.resourceType,
          resourceId: a.resourceId,
          level: a.level,
          details: a.details,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return c.json({ error: 'Failed to fetch activity', message: error.message }, 500);
  }
});

// GET /api/admin/billing/stats - Billing stats
adminRoutes.get('/billing/stats', async (c) => {
  try {
    const admin = c.get('admin');
    
    // Get lifetime plans count
    const lifetimePlans = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(like(subscriptions.planName, '%lifetime%'));
    
    // Get churn rate (simplified calculation)
    const totalSubscriptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions);
    
    const canceledSubscriptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'canceled'));
    
    const total = parseInt(totalSubscriptions[0]?.count?.toString() || '0');
    const canceled = parseInt(canceledSubscriptions[0]?.count?.toString() || '0');
    const churnRate = total > 0 ? (canceled / total) * 100 : 0;
    
    // Get plan breakdown
    const planBreakdown = await db
      .select({
        plan: subscriptions.planName,
        count: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .groupBy(subscriptions.planName);

    await logAdminAction(admin.user.id, 'view_billing_stats', 'billing');

    return c.json({
      success: true,
      data: {
        lifetimePlans: parseInt(lifetimePlans[0]?.count?.toString() || '0'),
        churnRate: Math.round(churnRate * 100) / 100,
        planBreakdown: planBreakdown.map((p) => ({
          plan: p.plan,
          count: parseInt(p.count?.toString() || '0'),
        })),
      },
    });
  } catch (error: any) {
    console.error('Get billing stats error:', error);
    return c.json({ error: 'Failed to fetch billing stats', message: error.message }, 500);
  }
});

// GET /api/admin/email/stats - Email stats
adminRoutes.get('/email/stats', async (c) => {
  try {
    const admin = c.get('admin');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Emails sent today
    const sentToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(sql`${emailLogs.sentAt} >= ${today}`);
    
    // Delivery rate (simplified)
    const delivered = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(and(
        sql`${emailLogs.sentAt} >= ${today}`,
        eq(emailLogs.status, 'sent')
      ));
    
    const total = parseInt(sentToday[0]?.count?.toString() || '0');
    const deliveredCount = parseInt(delivered[0]?.count?.toString() || '0');
    const deliveryRate = total > 0 ? (deliveredCount / total) * 100 : 0;
    
    // Open rate (simplified - using opens field)
    const opened = await db
      .select({ count: sql<number>`sum(${emailLogs.opens})` })
      .from(emailLogs)
      .where(sql`${emailLogs.sentAt} >= ${today}`);
    
    const openRate = total > 0 ? (parseInt(opened[0]?.count?.toString() || '0') / total) * 100 : 0;
    
    // Bounce rate
    const bounced = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(and(
        sql`${emailLogs.sentAt} >= ${today}`,
        eq(emailLogs.status, 'bounced')
      ));
    
    const bounceRate = total > 0 ? (parseInt(bounced[0]?.count?.toString() || '0') / total) * 100 : 0;

    await logAdminAction(admin.user.id, 'view_email_stats', 'emails');

    return c.json({
      success: true,
      data: {
        sentToday: total,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        templates: [], // TODO: Implement template stats
      },
    });
  } catch (error: any) {
    console.error('Get email stats error:', error);
    return c.json({ error: 'Failed to fetch email stats', message: error.message }, 500);
  }
});

// GET /api/admin/users - List users
adminRoutes.get('/users', async (c) => {
  try {
    const admin = c.get('admin');
    
    const userList = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);

    await logAdminAction(admin.user.id, 'view_users', 'users');

    return c.json({
      success: true,
      data: {
        users: userList.map((u) => ({
          id: u.id,
          email: u.email,
          full_name: u.fullName,
          role: u.role,
          subscription_plan: u.subscriptionPlan,
          subscription_status: u.subscriptionStatus,
          is_blocked: u.isBlocked,
          last_sign_in: u.lastSignIn,
          created_at: u.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users', message: error.message }, 500);
  }
});

// GET /api/admin/logs - System logs
adminRoutes.get('/logs', async (c) => {
  try {
    const admin = c.get('admin');
    const level = c.req.query('level') || 'all';
    
    let logs;
    if (level === 'all') {
      logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
    } else {
      logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.level, level))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
    }

    await logAdminAction(admin.user.id, 'view_logs', 'audit_logs', undefined, { level });

    return c.json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          userId: l.userId,
          adminUserId: l.adminUserId,
          action: l.action,
          resourceType: l.resourceType,
          resourceId: l.resourceId,
          level: l.level,
          details: l.details,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get logs error:', error);
    return c.json({ error: 'Failed to fetch logs', message: error.message }, 500);
  }
});

// GET /api/admin/security/rules - Get security rules
adminRoutes.get('/security/rules', async (c) => {
  try {
    const admin = c.get('admin');
    
    const rules = await db
      .select()
      .from(securityRules)
      .where(eq(securityRules.active, true))
      .orderBy(securityRules.priority);

    await logAdminAction(admin.user.id, 'view_security_rules', 'security_rules');

    return c.json({
      success: true,
      data: {
        rules: rules.map((r) => ({
          id: r.id,
          type: r.type,
          value: r.value,
          reason: r.reason,
          active: r.active,
          priority: r.priority,
          expiresAt: r.expiresAt,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get security rules error:', error);
    return c.json({ error: 'Failed to fetch security rules', message: error.message }, 500);
  }
});

// POST /api/admin/security/rules - Add security rule
adminRoutes.post('/security/rules', async (c) => {
  try {
    const admin = c.get('admin');
    const { type, value, reason } = await c.req.json();

    if (!type || !value || !reason) {
      return c.json({ error: 'Type, value, and reason are required' }, 400);
    }

    const rule = await db
      .insert(securityRules)
      .values({
        type,
        value,
        reason,
        active: true,
        priority: 100,
        createdBy: admin.user.id,
      })
      .returning();

    await logAdminAction(admin.user.id, 'create_security_rule', 'security_rules', rule[0].id);

    return c.json({
      success: true,
      data: {
        id: rule[0].id,
        type: rule[0].type,
        value: rule[0].value,
        reason: rule[0].reason,
      },
    });
  } catch (error: any) {
    console.error('Create security rule error:', error);
    return c.json({ error: 'Failed to create security rule', message: error.message }, 500);
  }
});

// DELETE /api/admin/security/rules/:id - Delete security rule
adminRoutes.delete('/security/rules/:id', async (c) => {
  try {
    const admin = c.get('admin');
    const ruleId = c.req.param('id');

    await db
      .delete(securityRules)
      .where(eq(securityRules.id, ruleId));

    await logAdminAction(admin.user.id, 'delete_security_rule', 'security_rules', ruleId);

    return c.json({
      success: true,
      message: 'Security rule deleted',
    });
  } catch (error: any) {
    console.error('Delete security rule error:', error);
    return c.json({ error: 'Failed to delete security rule', message: error.message }, 500);
  }
});

// GET /api/admin/database/tables - List database tables
adminRoutes.get('/database/tables', async (c) => {
  try {
    const admin = c.get('admin');
    
    // Query PostgreSQL information_schema to get table list
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    await logAdminAction(admin.user.id, 'view_database_tables', 'database');

    return c.json({
      success: true,
      data: {
        tables: (tables.rows as any[]).map((t) => t.table_name),
      },
    });
  } catch (error: any) {
    console.error('Get database tables error:', error);
    return c.json({ error: 'Failed to fetch database tables', message: error.message }, 500);
  }
});

// GET /api/admin/database/table/:name - Get table data
adminRoutes.get('/database/table/:name', async (c) => {
  try {
    const admin = c.get('admin');
    const tableName = c.req.param('name');
    
    // Get table columns
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);
    
    // Get table rows (limit to 100 for safety)
    const rows = await db.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      LIMIT 100
    `);

    await logAdminAction(admin.user.id, 'view_database_table', 'database', tableName);

    return c.json({
      success: true,
      data: {
        columns: (columns.rows as any[]).map((c) => ({
          name: c.column_name,
          type: c.data_type,
        })),
        rows: rows.rows,
      },
    });
  } catch (error: any) {
    console.error('Get table data error:', error);
    return c.json({ error: 'Failed to fetch table data', message: error.message }, 500);
  }
});

// POST /api/admin/users/:id/block - Block/unblock user
adminRoutes.post('/users/:id/block', async (c) => {
  try {
    const admin = c.get('admin');
    const userId = c.req.param('id');
    const { blocked } = await c.req.json();

    const updated = await db
      .update(users)
      .set({ isBlocked: blocked })
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    await logAdminAction(
      admin.user.id,
      blocked ? 'block_user' : 'unblock_user',
      'users',
      userId,
      { blocked }
    );

    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        is_blocked: updated[0].isBlocked,
      },
    });
  } catch (error: any) {
    console.error('Block user error:', error);
    return c.json({ error: 'Failed to block/unblock user', message: error.message }, 500);
  }
});

// POST /api/admin/users/:id/role - Update user role
adminRoutes.post('/users/:id/role', async (c) => {
  try {
    const admin = c.get('admin');
    const userId = c.req.param('id');
    const { role } = await c.req.json();

    if (!role) {
      return c.json({ error: 'Role is required' }, 400);
    }

    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    await logAdminAction(
      admin.user.id,
      'update_user_role',
      'users',
      userId,
      { role }
    );

    return c.json({
      success: true,
      data: {
        id: updated[0].id,
        role: updated[0].role,
      },
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return c.json({ error: 'Failed to update user role', message: error.message }, 500);
  }
});

// GET /api/admin/email/logs - Get email logs
adminRoutes.get('/email/logs', async (c) => {
  try {
    const admin = c.get('admin');
    const limit = parseInt(c.req.query('limit') || '50', 10);
    
    const logs = await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit);

    await logAdminAction(admin.user.id, 'view_email_logs', 'email_logs');

    return c.json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          recipient: l.recipient,
          subject: l.subject,
          status: l.status,
          sentAt: l.sentAt,
          openedAt: l.openedAt,
          clickedAt: l.clickedAt,
          bouncedAt: l.bouncedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get email logs error:', error);
    return c.json({ error: 'Failed to fetch email logs', message: error.message }, 500);
  }
});

export { adminRoutes };
