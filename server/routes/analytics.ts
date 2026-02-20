import { Hono } from 'hono';
import { getDb } from '../db';
import { pageViews } from '../../shared/schema';
import { eq, desc, sql, and, gte, lte, count } from 'drizzle-orm';

export const analyticsRoutes = new Hono();

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

    return c.json({ ok: true });
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    return c.json({ ok: true });
  }
});

analyticsRoutes.get('/stats', async (c) => {
  try {
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
