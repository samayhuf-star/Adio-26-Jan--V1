import { Hono } from 'hono';
import { getDb } from '../db';
import { pageViews, articlePageViews, articleConversions } from '../../shared/schema';
import { eq, desc, sql, and, gte, lte, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'adiology-jwt-secret-key';

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
  city: string | null;
  region: string | null;
  isp: string | null;
  org: string | null;
}

interface GeoData {
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  org: string | null;
}

const activeUsers = new Map<string, ActiveUser>();
const geoCache = new Map<string, GeoData>();
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

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  return false;
}

async function lookupGeo(ip: string): Promise<GeoData> {
  if (isPrivateIp(ip)) {
    return { country: null, city: null, region: null, isp: null, org: null };
  }
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as any;
    const geo: GeoData = data.status === 'success' ? {
      country: data.country || null,
      city: data.city || null,
      region: data.regionName || null,
      isp: data.isp || null,
      org: data.org || null,
    } : { country: null, city: null, region: null, isp: null, org: null };
    geoCache.set(ip, geo);
    if (geoCache.size > 5000) {
      const firstKey = geoCache.keys().next().value;
      if (firstKey) geoCache.delete(firstKey);
    }
    return geo;
  } catch {
    const fallback: GeoData = { country: null, city: null, region: null, isp: null, org: null };
    geoCache.set(ip, fallback);
    return fallback;
  }
}

function normalizeReferrer(referrer: string | null | undefined, requestHost?: string): string | null {
  if (!referrer || referrer.trim() === '') return null;
  try {
    const url = new URL(referrer);
    const hostname = url.hostname;
    if (hostname.includes('__replco') || referrer.includes('__replco') || referrer.includes('workspace_iframe')) return null;
    if (hostname.includes('.janeway.replit.dev') || hostname.includes('.replit.dev')) return null;
    if (requestHost && hostname === requestHost) return null;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
    return hostname;
  } catch {
    return referrer.trim() || null;
  }
}

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

    const ip = c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const requestHost = c.req.header('host')?.split(':')[0] || '';
    const normalizedReferrer = normalizeReferrer(body.referrer, requestHost);

    const db = getDb();

    lookupGeo(ip).then(async (geo) => {
      try {
        await db.insert(pageViews).values({
          path: body.path || '/',
          referrer: normalizedReferrer,
          userAgent: ua,
          ip,
          sessionId: body.sessionId || null,
          country: geo.country,
          city: geo.city,
          region: geo.region,
          isp: geo.isp,
          org: geo.org,
          deviceType,
          browser,
          os,
          screenWidth: body.screenWidth || null,
          screenHeight: body.screenHeight || null,
        });
      } catch (dbErr) {
        console.error('[Analytics] DB insert error:', dbErr);
      }
    });

    if (body.sessionId) {
      const now = Date.now();
      const existing = activeUsers.get(body.sessionId);
      const cachedGeo = geoCache.get(ip);
      activeUsers.set(body.sessionId, {
        sessionId: body.sessionId,
        path: body.path || '/',
        referrer: normalizedReferrer || '',
        ip,
        browser,
        os,
        deviceType,
        screenWidth: body.screenWidth || null,
        screenHeight: body.screenHeight || null,
        lastSeen: now,
        firstSeen: existing?.firstSeen || now,
        country: cachedGeo?.country || existing?.country || null,
        city: cachedGeo?.city || existing?.city || null,
        region: cachedGeo?.region || existing?.region || null,
        isp: cachedGeo?.isp || existing?.isp || null,
        org: cachedGeo?.org || existing?.org || null,
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

    const ip = c.req.header('cf-connecting-ip')
      || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const requestHost = c.req.header('host')?.split(':')[0] || '';
    const normalizedRef = normalizeReferrer(body.referrer, requestHost);

    const now = Date.now();
    const existing = activeUsers.get(body.sessionId);
    const cachedGeo = geoCache.get(ip);
    activeUsers.set(body.sessionId, {
      sessionId: body.sessionId,
      path: body.path || existing?.path || '/',
      referrer: normalizedRef || existing?.referrer || '',
      ip,
      browser,
      os,
      deviceType,
      screenWidth: body.screenWidth || existing?.screenWidth || null,
      screenHeight: body.screenHeight || existing?.screenHeight || null,
      lastSeen: now,
      firstSeen: existing?.firstSeen || now,
      country: cachedGeo?.country || existing?.country || null,
      city: cachedGeo?.city || existing?.city || null,
      region: cachedGeo?.region || existing?.region || null,
      isp: cachedGeo?.isp || existing?.isp || null,
      org: cachedGeo?.org || existing?.org || null,
    });

    // Update the last page view for this session to extend duration
    const db = getDb();
    db.execute(sql`
      UPDATE page_views 
      SET created_at = NOW() 
      WHERE id = (
        SELECT id FROM page_views 
        WHERE session_id = ${body.sessionId} 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    `).catch(err => console.error('[Analytics] Heartbeat DB update error:', err));

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
        city: u.city,
        region: u.region,
        isp: u.isp,
        org: u.org,
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
    const daysQuery = c.req.query('days');
    let days = 30;
    let startDate = new Date();
    let endDate: Date | null = null;

    if (daysQuery === 'today') {
      days = 0;
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (daysQuery === 'yesterday') {
      days = 1;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (daysQuery === '2') {
      days = 2;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      startDate.setHours(0, 0, 0, 0);
    } else {
      days = Math.min(Math.max(parseInt(daysQuery || '30') || 30, 1), 365);
      startDate.setDate(startDate.getDate() - days);
    }

    const dateFilter = endDate
      ? and(gte(pageViews.createdAt, startDate), lte(pageViews.createdAt, endDate))
      : gte(pageViews.createdAt, startDate);

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

analyticsRoutes.post('/article-view', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { slug, sessionId, utmSource, utmMedium, utmCampaign, referrer } = body;

    if (!slug || !sessionId) {
      return c.json({ ok: false, error: 'Missing slug or sessionId' }, 400);
    }

    const ua = c.req.header('user-agent') || '';
    if (/bot|crawl|spider|slurp/i.test(ua)) {
      return c.json({ ok: true });
    }

    const db = getDb();
    await db.insert(articlePageViews).values({
      articleSlug: slug,
      sessionId,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      referrer: referrer || null,
    });

    return c.json({ ok: true });
  } catch (err) {
    console.error('[Analytics] article-view error:', err);
    return c.json({ ok: false }, 500);
  }
});

analyticsRoutes.post('/article-conversion', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    let userId: number | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId ? parseInt(decoded.userId) : null;
      } catch {
        // no-op — unauthenticated conversions still tracked
      }
    }

    const body = await c.req.json().catch(() => ({}));
    const { sessionId, eventType, planName, revenueCents, articleSlug } = body;

    if (!sessionId || !eventType) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const db = getDb();

    let resolvedSlug = articleSlug || null;

    if (!resolvedSlug) {
      const firstView = await db
        .select({ articleSlug: articlePageViews.articleSlug })
        .from(articlePageViews)
        .where(eq(articlePageViews.sessionId, sessionId))
        .orderBy(articlePageViews.createdAt)
        .limit(1);

      if (firstView.length > 0) {
        resolvedSlug = firstView[0].articleSlug;
      }
    }

    if (!resolvedSlug) {
      return c.json({ ok: false, error: 'No article attribution found for session' });
    }

    const existing = await db
      .select({ id: articleConversions.id })
      .from(articleConversions)
      .where(
        and(
          eq(articleConversions.sessionId, sessionId),
          eq(articleConversions.eventType, eventType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({ ok: true, skipped: true });
    }

    await db.insert(articleConversions).values({
      articleSlug: resolvedSlug,
      sessionId,
      userId: userId || null,
      eventType,
      planName: planName || null,
      revenueCents: revenueCents || 0,
    });

    return c.json({ ok: true, articleSlug: resolvedSlug });
  } catch (err) {
    console.error('[Analytics] article-conversion error:', err);
    return c.json({ ok: false }, 500);
  }
});
