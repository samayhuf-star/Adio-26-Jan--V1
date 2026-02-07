import { Hono } from 'hono';
import { db } from '../db';
import { clickGuardDomains, clickGuardVisitors, clickGuardBlockedIps, clickGuardFraudEvents } from '../../shared/schema';
import { eq, and, desc, sql, gte, count } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';
import crypto from 'crypto';

export const clickGuardRoutes = new Hono();

async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

function parseUserAgent(ua: string) {
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown';
  let browserVersion = '';
  if (/Edg(?:e)?\/(\d+[\.\d]*)/i.test(ua)) {
    browser = 'Edge';
    browserVersion = RegExp.$1;
  } else if (/OPR\/(\d+[\.\d]*)/i.test(ua)) {
    browser = 'Opera';
    browserVersion = RegExp.$1;
  } else if (/Chrome\/(\d+[\.\d]*)/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = RegExp.$1;
  } else if (/Firefox\/(\d+[\.\d]*)/i.test(ua)) {
    browser = 'Firefox';
    browserVersion = RegExp.$1;
  } else if (/Safari\/(\d+[\.\d]*)/.test(ua) && /Version\/(\d+[\.\d]*)/.test(ua)) {
    browser = 'Safari';
    browserVersion = RegExp.$1;
  }

  let os = 'Unknown';
  let osVersion = '';
  if (/Windows NT (\d+[\.\d]*)/i.test(ua)) {
    os = 'Windows';
    osVersion = RegExp.$1;
  } else if (/Mac OS X (\d+[_\.\d]*)/i.test(ua)) {
    os = 'macOS';
    osVersion = RegExp.$1.replace(/_/g, '.');
  } else if (/iPhone OS (\d+[_\.\d]*)/i.test(ua)) {
    os = 'iOS';
    osVersion = RegExp.$1.replace(/_/g, '.');
  } else if (/Android (\d+[\.\d]*)/i.test(ua)) {
    os = 'Android';
    osVersion = RegExp.$1;
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  return { deviceType, browser, browserVersion, os, osVersion };
}

let ipApiRequestCount = 0;
let ipApiWindowStart = Date.now();

async function getGeoData(ip: string) {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return null;
  }

  const now = Date.now();
  if (now - ipApiWindowStart > 60000) {
    ipApiRequestCount = 0;
    ipApiWindowStart = now;
  }
  if (ipApiRequestCount >= 45) {
    return null;
  }
  ipApiRequestCount++;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp,org,as,proxy,hosting,query,timezone`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (data.status === 'success') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function generateSnippet(siteId: string, domain: string): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const host = devDomain ? `https://${devDomain}` : (process.env.PUBLIC_BASE_URL || '');
  return `<!-- Click Guard by Adiology - Fraud Protection -->
<script src="${host}/t.js?sid=${siteId}" async></script>`;
}

clickGuardRoutes.get('/domains', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domains = await db
      .select()
      .from(clickGuardDomains)
      .where(eq(clickGuardDomains.userId, userId))
      .orderBy(desc(clickGuardDomains.createdAt));

    return c.json(domains);
  } catch (error) {
    console.error('Failed to fetch click guard domains:', error);
    return c.json({ error: 'Failed to fetch domains' }, 500);
  }
});

clickGuardRoutes.post('/domains', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const domain = body.domain?.trim();

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    const existing = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.userId, userId),
        eq(clickGuardDomains.domain, domain)
      ));

    if (existing.length > 0) {
      return c.json({ error: 'Domain already being tracked' }, 400);
    }

    const siteId = crypto.randomBytes(16).toString('hex');

    const [newDomain] = await db
      .insert(clickGuardDomains)
      .values({
        userId,
        domain,
        siteId,
        settings: body.settings || {},
      })
      .returning();

    const snippet = generateSnippet(siteId, domain);

    return c.json({ ...newDomain, snippet }, 201);
  } catch (error) {
    console.error('Failed to add click guard domain:', error);
    return c.json({ error: 'Failed to add domain' }, 500);
  }
});

clickGuardRoutes.delete('/domains/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.id, domainId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    await db.delete(clickGuardFraudEvents).where(eq(clickGuardFraudEvents.siteId, existing.siteId));
    await db.delete(clickGuardBlockedIps).where(eq(clickGuardBlockedIps.siteId, existing.siteId));
    await db.delete(clickGuardVisitors).where(eq(clickGuardVisitors.siteId, existing.siteId));
    await db.delete(clickGuardDomains).where(eq(clickGuardDomains.id, domainId));

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete click guard domain:', error);
    return c.json({ error: 'Failed to delete domain' }, 500);
  }
});

clickGuardRoutes.get('/domains/:id/snippet', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.id, domainId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const snippet = generateSnippet(domain.siteId, domain.domain);

    return c.json({ snippet, siteId: domain.siteId });
  } catch (error) {
    console.error('Failed to get snippet:', error);
    return c.json({ error: 'Failed to get snippet' }, 500);
  }
});

function isValidPublicDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;
  if (domain.includes(':')) return false;
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|fc|fd|fe80)/i.test(domain)) return false;
  if (domain.includes('metadata') || domain.includes('internal') || domain.includes('.local')) return false;
  const validDomain = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return validDomain.test(domain);
}

clickGuardRoutes.post('/domains/:id/verify', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.id, domainId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    if (!isValidPublicDomain(domain.domain)) {
      return c.json({
        verified: false,
        message: 'Invalid domain. Only public domains are allowed for verification.',
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://${domain.domain}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Adiology-ClickGuard-Verifier/1.0' },
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const finalUrl = res.url;
      if (finalUrl) {
        try {
          const redirectHost = new URL(finalUrl).hostname;
          if (!isValidPublicDomain(redirectHost)) {
            return c.json({
              verified: false,
              message: 'Verification blocked: redirect to non-public address detected.',
            });
          }
        } catch {}
      }

      if (!res.ok) {
        return c.json({
          verified: false,
          message: `Could not reach ${domain.domain} (HTTP ${res.status})`,
        });
      }

      const html = await res.text();
      const siteIdPattern = new RegExp(`sid=${domain.siteId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      const snippetFound = siteIdPattern.test(html);

      if (snippetFound) {
        await db
          .update(clickGuardDomains)
          .set({ verified: true, updatedAt: new Date() })
          .where(eq(clickGuardDomains.id, domainId));

        return c.json({
          verified: true,
          message: 'Tracking script detected! Domain verified successfully.',
        });
      } else {
        return c.json({
          verified: false,
          message: 'Tracking script not found. Make sure you added the snippet with your Site ID before </head>.',
        });
      }
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        return c.json({
          verified: false,
          message: `Request to ${domain.domain} timed out. Make sure the site is accessible.`,
        });
      }
      return c.json({
        verified: false,
        message: `Could not reach ${domain.domain}. Make sure the site is live and accessible.`,
      });
    }
  } catch (error) {
    console.error('Failed to verify domain:', error);
    return c.json({ error: 'Failed to verify domain' }, 500);
  }
});

clickGuardRoutes.get('/domains/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.id, domainId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const snippet = generateSnippet(domain.siteId, domain.domain);

    const [visitorCount] = await db
      .select({ count: count() })
      .from(clickGuardVisitors)
      .where(eq(clickGuardVisitors.siteId, domain.siteId));

    const [blockedCount] = await db
      .select({ count: count() })
      .from(clickGuardBlockedIps)
      .where(eq(clickGuardBlockedIps.siteId, domain.siteId));

    const [fraudCount] = await db
      .select({ count: count() })
      .from(clickGuardFraudEvents)
      .where(eq(clickGuardFraudEvents.siteId, domain.siteId));

    return c.json({
      ...domain,
      snippet,
      stats: {
        totalVisitors: visitorCount?.count || 0,
        blockedIPs: blockedCount?.count || 0,
        fraudEvents: fraudCount?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get domain details:', error);
    return c.json({ error: 'Failed to get domain details' }, 500);
  }
});

clickGuardRoutes.options('/track', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.text('', 200);
});

clickGuardRoutes.post('/track', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const raw = await c.req.json();

    const siteId = raw.siteId || raw.sid;
    const fingerprint = raw.fingerprint || raw.fp || null;
    const mouseMovements = raw.mouseMovements ?? raw.mm ?? 0;
    const timeOnPage = raw.timeOnPage ?? raw.top ?? 0;
    const screenWidth = raw.screenWidth || raw.sw || null;
    const screenHeight = raw.screenHeight || raw.sh || null;
    const clickCount = raw.clickCount || raw.cc || 1;
    const headless = raw.headless ?? raw.hb ?? false;
    const pageUrl = raw.pageUrl || raw.url || null;
    const referrer = raw.referrer || raw.ref || null;
    const language = raw.language || raw.lang || null;

    if (!siteId) {
      return c.json({ error: 'siteId is required' }, 400);
    }

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(eq(clickGuardDomains.siteId, siteId));

    if (!domain) {
      return c.json({ error: 'Invalid siteId' }, 404);
    }

    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const userAgent = c.req.header('user-agent') || '';
    const parsed = parseUserAgent(userAgent);

    const geo = await getGeoData(ip);

    let botScore = 0;
    if (headless) botScore += 40;
    if (!mouseMovements || mouseMovements === 0) botScore += 20;
    if (timeOnPage !== undefined && timeOnPage < 2) botScore += 10;
    if (/HeadlessChrome|PhantomJS|Selenium|Bot|Crawl|Spider/i.test(userAgent)) botScore += 30;

    let threatLevel = 'low';
    if (botScore >= 70) threatLevel = 'critical';
    else if (botScore >= 50) threatLevel = 'high';
    else if (botScore >= 30) threatLevel = 'medium';

    const [blockedEntry] = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(and(
        eq(clickGuardBlockedIps.siteId, siteId),
        eq(clickGuardBlockedIps.ipAddress, ip)
      ));

    const isBlocked = !!blockedEntry;

    const [visitor] = await db
      .insert(clickGuardVisitors)
      .values({
        siteId,
        ipAddress: ip,
        userAgent,
        fingerprint,
        country: geo?.country || null,
        city: geo?.city || null,
        region: geo?.regionName || null,
        isp: geo?.isp || null,
        org: geo?.org || null,
        asNumber: geo?.as || null,
        timezone: geo?.timezone || null,
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        browserVersion: parsed.browserVersion,
        os: parsed.os,
        osVersion: parsed.osVersion,
        screenWidth,
        screenHeight,
        language,
        referrer,
        pageUrl,
        isProxy: geo?.proxy || false,
        isVpn: false,
        isBot: botScore >= 50,
        isTor: false,
        botScore,
        threatLevel,
        clickCount,
        mouseMovements,
        timeOnPage,
        blocked: isBlocked,
      })
      .returning();

    if (threatLevel === 'high' || threatLevel === 'critical') {
      await db.insert(clickGuardFraudEvents).values({
        siteId,
        visitorId: visitor.id,
        eventType: botScore >= 70 ? 'bot_detected' : 'suspicious_activity',
        severity: threatLevel,
        ipAddress: ip,
        details: {
          botScore,
          headless,
          mouseMovements,
          timeOnPage,
          userAgent,
        },
      });
    }

    if (botScore >= 70 && !isBlocked) {
      await db.insert(clickGuardBlockedIps).values({
        siteId,
        ipAddress: ip,
        reason: `Auto-blocked: bot score ${botScore}`,
        autoBlocked: true,
      });
    }

    if (!domain.verified) {
      await db
        .update(clickGuardDomains)
        .set({ verified: true, verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(clickGuardDomains.id, domain.id));
    }

    return c.json({ success: true, blocked: isBlocked });
  } catch (error) {
    console.error('Failed to track visitor:', error);
    return c.json({ error: 'Failed to track visitor' }, 500);
  }
});

clickGuardRoutes.get('/analytics/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const siteId = c.req.param('siteId');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total24h] = await db
      .select({ count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last24h)));

    const [total7d] = await db
      .select({ count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last7d)));

    const [total30d] = await db
      .select({ count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)));

    const byDeviceType = await db
      .select({ deviceType: clickGuardVisitors.deviceType, count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)))
      .groupBy(clickGuardVisitors.deviceType);

    const byBrowser = await db
      .select({ browser: clickGuardVisitors.browser, count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)))
      .groupBy(clickGuardVisitors.browser);

    const byOs = await db
      .select({ os: clickGuardVisitors.os, count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)))
      .groupBy(clickGuardVisitors.os);

    const byCountry = await db
      .select({ country: clickGuardVisitors.country, count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)))
      .groupBy(clickGuardVisitors.country);

    const byThreatLevel = await db
      .select({ threatLevel: clickGuardVisitors.threatLevel, count: count() })
      .from(clickGuardVisitors)
      .where(and(eq(clickGuardVisitors.siteId, siteId), gte(clickGuardVisitors.createdAt, last30d)))
      .groupBy(clickGuardVisitors.threatLevel);

    const [fraudEventsCount] = await db
      .select({ count: count() })
      .from(clickGuardFraudEvents)
      .where(and(eq(clickGuardFraudEvents.siteId, siteId), gte(clickGuardFraudEvents.createdAt, last30d)));

    const [blockedCount] = await db
      .select({ count: count() })
      .from(clickGuardBlockedIps)
      .where(eq(clickGuardBlockedIps.siteId, siteId));

    return c.json({
      visitors: {
        last24h: total24h.count,
        last7d: total7d.count,
        last30d: total30d.count,
      },
      byDeviceType,
      byBrowser,
      byOs,
      byCountry,
      byThreatLevel,
      fraudEventsCount: fraudEventsCount.count,
      blockedCount: blockedCount.count,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

clickGuardRoutes.get('/visitors/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const siteId = c.req.param('siteId');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const visitors = await db
      .select()
      .from(clickGuardVisitors)
      .where(eq(clickGuardVisitors.siteId, siteId))
      .orderBy(desc(clickGuardVisitors.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json(visitors);
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    return c.json({ error: 'Failed to fetch visitors' }, 500);
  }
});

clickGuardRoutes.get('/fraud-events/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const siteId = c.req.param('siteId');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const events = await db
      .select()
      .from(clickGuardFraudEvents)
      .where(eq(clickGuardFraudEvents.siteId, siteId))
      .orderBy(desc(clickGuardFraudEvents.createdAt))
      .limit(100);

    return c.json(events);
  } catch (error) {
    console.error('Failed to fetch fraud events:', error);
    return c.json({ error: 'Failed to fetch fraud events' }, 500);
  }
});

clickGuardRoutes.get('/blocked-ips/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const siteId = c.req.param('siteId');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const blockedIps = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(eq(clickGuardBlockedIps.siteId, siteId))
      .orderBy(desc(clickGuardBlockedIps.createdAt));

    return c.json(blockedIps);
  } catch (error) {
    console.error('Failed to fetch blocked IPs:', error);
    return c.json({ error: 'Failed to fetch blocked IPs' }, 500);
  }
});

clickGuardRoutes.post('/blocked-ips/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const siteId = c.req.param('siteId');

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const body = await c.req.json();
    const { ipAddress, reason } = body;

    if (!ipAddress) {
      return c.json({ error: 'IP address is required' }, 400);
    }

    const [existingBlock] = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(and(
        eq(clickGuardBlockedIps.siteId, siteId),
        eq(clickGuardBlockedIps.ipAddress, ipAddress)
      ));

    if (existingBlock) {
      return c.json({ error: 'IP is already blocked' }, 400);
    }

    const [blocked] = await db
      .insert(clickGuardBlockedIps)
      .values({
        siteId,
        ipAddress,
        reason: reason || 'Manually blocked',
        autoBlocked: false,
      })
      .returning();

    return c.json(blocked, 201);
  } catch (error) {
    console.error('Failed to block IP:', error);
    return c.json({ error: 'Failed to block IP' }, 500);
  }
});

clickGuardRoutes.delete('/blocked-ips/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const blockId = c.req.param('id');

    const [blocked] = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(eq(clickGuardBlockedIps.id, blockId));

    if (!blocked) {
      return c.json({ error: 'Blocked IP not found' }, 404);
    }

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, blocked.siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await db.delete(clickGuardBlockedIps).where(eq(clickGuardBlockedIps.id, blockId));

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to unblock IP:', error);
    return c.json({ error: 'Failed to unblock IP' }, 500);
  }
});
