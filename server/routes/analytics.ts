import { Hono } from 'hono';
import { getDb } from '../db';
import { pageViews } from '../../shared/schema';
import { eq, desc, sql, and, gte, lte, count } from 'drizzle-orm';

export const analyticsRoutes = new Hono();

interface ActiveUser {
  sessionId: string;
  path: string;
  referrer: string;
  ip: string;
  browser: string;
  os: string;
  deviceType: string;
  screenWidth: number | null;
  screenHeight: number | null;
  lastSeen: number;
  firstSeen: number;
  country: string | null;
}

const activeUsers = new Map<string, ActiveUser>();

const ACTIVE_TIMEOUT = 60000;

function pruneInactiveUsers() {
  const now = Date.now();
  for (const [key, user] of activeUsers) {
    if (now - user.lastSeen > ACTIVE_TIMEOUT) {
      activeUsers.delete(key);
    }
  }
}

setInterval(pruneInactiveUsers, 30000);

function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  let browser = 'Other';
  let os = 'Other';
  let deviceType = 'desktop';

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/MSIE|Trident/.test(ua)) browser = 'IE';
  else if (/bot|crawl|spider|slurp/i.test(ua)) { browser = 'Bot'; deviceType = 'bot'; }

  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua) && !/Android/.test(ua)) os = 'Linux';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';

  return { browser, os, deviceType };
}

analyticsRoutes.post('/track', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    let body: any;
    if (contentType.includes('application/json')) {
      body = await c.req.json();
    } else {
      const text = await c.req.text();
      try { body = JSON.parse(text); } catch { body = {}; }
    }
    const ua = c.req.header('user-agent') || '';
    const { browser, os, deviceType } = parseUserAgent(ua);

    if (deviceType === 'bot') {
      return c.json({ ok: true });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const db = getDb();
    await db.insert(pageViews).values({
      path: body.path || '/',
      referrer: body.referrer || null,
      userAgent: ua,
      ip,
      sessionId: body.sessionId || null,
      country: null,
      deviceType,
      browser,
      os,
      screenWidth: body.screenWidth || null,
      screenHeight: body.screenHeight || null,
    });

    if (body.sessionId) {
      const now = Date.now();
      const existing = activeUsers.get(body.sessionId);
      activeUsers.set(body.sessionId, {
        sessionId: body.sessionId,
        path: body.path || '/',
        referrer: body.referrer || '',
        ip,
        browser,
        os,
        deviceType,
        screenWidth: body.screenWidth || null,
        screenHeight: body.screenHeight || null,
        lastSeen: now,
        firstSeen: existing?.firstSeen || now,
        country: null,
      });
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    return c.json({ ok: true });
  }
});

analyticsRoutes.post('/heartbeat', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    let body: any;
    if (contentType.includes('application/json')) {
      body = await c.req.json();
    } else {
      const text = await c.req.text();
      try { body = JSON.parse(text); } catch { body = {}; }
    }

    if (!body.sessionId) {
      return c.json({ ok: true });
    }

    const ua = c.req.header('user-agent') || '';
    const { browser, os, deviceType } = parseUserAgent(ua);

    if (deviceType === 'bot') {
      return c.json({ ok: true });
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const now = Date.now();
    const existing = activeUsers.get(body.sessionId);
    activeUsers.set(body.sessionId, {
      sessionId: body.sessionId,
      path: body.path || existing?.path || '/',
      referrer: body.referrer || existing?.referrer || '',
      ip,
      browser,
      os,
      deviceType,
      screenWidth: body.screenWidth || existing?.screenWidth || null,
      screenHeight: body.screenHeight || existing?.screenHeight || null,
      lastSeen: now,
      firstSeen: existing?.firstSeen || now,
      country: null,
    });

    return c.json({ ok: true });
  } catch (error) {
    return c.json({ ok: true });
  }
});

analyticsRoutes.get('/realtime', async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    if (!adminToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    pruneInactiveUsers();

    const users = Array.from(activeUsers.values())
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .map(u => ({
        sessionId: u.sessionId.substring(0, 8) + '...',
        path: u.path,
        referrer: u.referrer,
        ip: u.ip,
        browser: u.browser,
        os: u.os,
        deviceType: u.deviceType,
        screenWidth: u.screenWidth,
        screenHeight: u.screenHeight,
        duration: Math.round((Date.now() - u.firstSeen) / 1000),
        lastActivity: Math.round((Date.now() - u.lastSeen) / 1000),
        country: u.country,
      }));

    const pageCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};

    for (const u of activeUsers.values()) {
      pageCounts[u.path] = (pageCounts[u.path] || 0) + 1;
      const source = u.referrer ? (() => { try { return new URL(u.referrer).hostname; } catch { return u.referrer; } })() : 'Direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      deviceCounts[u.deviceType] = (deviceCounts[u.deviceType] || 0) + 1;
      browserCounts[u.browser] = (browserCounts[u.browser] || 0) + 1;
      osCounts[u.os] = (osCounts[u.os] || 0) + 1;
    }

    const toSorted = (obj: Record<string, number>) =>
      Object.entries(obj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return c.json({
      activeCount: activeUsers.size,
      users,
      activePages: toSorted(pageCounts),
      sources: toSorted(sourceCounts),
      devices: toSorted(deviceCounts),
      browsers: toSorted(browserCounts),
      operatingSystems: toSorted(osCounts),
    });
  } catch (error) {
    console.error('[Analytics] Realtime error:', error);
    return c.json({ activeCount: 0, users: [], activePages: [], sources: [], devices: [], browsers: [], operatingSystems: [] });
  }
});

analyticsRoutes.get('/stats', async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    if (!adminToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = getDb();
    const days = Math.min(Math.max(parseInt(c.req.query('days') || '30') || 30, 1), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dateFilter = gte(pageViews.createdAt, startDate);

    const [
      totalViewsResult,
      uniqueSessionsResult,
      topPagesResult,
      topReferrersResult,
      browserStatsResult,
      deviceStatsResult,
      osStatsResult,
      dailyViewsResult,
      recentViewsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(pageViews).where(dateFilter),

      db.select({ count: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})` })
        .from(pageViews).where(and(dateFilter, sql`${pageViews.sessionId} IS NOT NULL`)),

      db.select({
        path: pageViews.path,
        views: count(),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
      }).from(pageViews).where(dateFilter)
        .groupBy(pageViews.path)
        .orderBy(desc(count()))
        .limit(20),

      db.select({
        referrer: pageViews.referrer,
        count: count(),
      }).from(pageViews).where(and(dateFilter, sql`${pageViews.referrer} IS NOT NULL AND ${pageViews.referrer} != ''`))
        .groupBy(pageViews.referrer)
        .orderBy(desc(count()))
        .limit(10),

      db.select({
        browser: pageViews.browser,
        count: count(),
      }).from(pageViews).where(dateFilter)
        .groupBy(pageViews.browser)
        .orderBy(desc(count()))
        .limit(10),

      db.select({
        deviceType: pageViews.deviceType,
        count: count(),
      }).from(pageViews).where(dateFilter)
        .groupBy(pageViews.deviceType)
        .orderBy(desc(count())),

      db.select({
        os: pageViews.os,
        count: count(),
      }).from(pageViews).where(dateFilter)
        .groupBy(pageViews.os)
        .orderBy(desc(count()))
        .limit(10),

      db.select({
        date: sql<string>`DATE(${pageViews.createdAt})`.as('date'),
        views: count(),
        uniqueVisitors: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
      }).from(pageViews).where(dateFilter)
        .groupBy(sql`DATE(${pageViews.createdAt})`)
        .orderBy(sql`DATE(${pageViews.createdAt})`),

      db.select().from(pageViews)
        .where(dateFilter)
        .orderBy(desc(pageViews.createdAt))
        .limit(50),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFilter = gte(pageViews.createdAt, todayStart);

    const [todayViewsResult, todayUniqueResult] = await Promise.all([
      db.select({ count: count() }).from(pageViews).where(todayFilter),
      db.select({ count: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})` })
        .from(pageViews).where(and(todayFilter, sql`${pageViews.sessionId} IS NOT NULL`)),
    ]);

    return c.json({
      totalViews: totalViewsResult[0]?.count || 0,
      uniqueVisitors: uniqueSessionsResult[0]?.count || 0,
      todayViews: todayViewsResult[0]?.count || 0,
      todayUnique: todayUniqueResult[0]?.count || 0,
      topPages: topPagesResult,
      topReferrers: topReferrersResult,
      browsers: browserStatsResult,
      devices: deviceStatsResult,
      operatingSystems: osStatsResult,
      dailyViews: dailyViewsResult,
      recentViews: recentViewsResult,
      period: days,
    });
  } catch (error) {
    console.error('[Analytics] Stats error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});
