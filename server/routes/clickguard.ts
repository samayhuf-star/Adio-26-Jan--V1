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

function getPublicHost(): string {
  return process.env.PUBLIC_BASE_URL
    || (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : '')
    || (process.env.REPLIT_DOMAINS?.split(',')[0]?.trim() ? `https://${process.env.REPLIT_DOMAINS.split(',')[0].trim()}` : '')
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '');
}

function generateSnippet(siteId: string, domain: string): string {
  const host = getPublicHost();
  return `<!-- Click Guard by Adiology - Fraud Protection -->
<script src="${host}/t.js?sid=${siteId}" data-sid="${siteId}" async></script>`;
}

function generateWordPressSnippet(siteId: string, domain: string): string {
  const host = getPublicHost();
  return `// Add to your theme's functions.php or use a Code Snippets plugin
function adiology_clickguard_script() {
    wp_enqueue_script(
        'adiology-clickguard',
        '${host}/t.js?sid=${siteId}',
        array(),
        null,
        false
    );
}
add_action('wp_enqueue_scripts', 'adiology_clickguard_script');

// Add data-sid and data-api attributes to the script tag for reliable detection
function adiology_clickguard_attributes(\$tag, \$handle, \$src) {
    if ('adiology-clickguard' === \$handle) {
        \$tag = '<script data-sid="${siteId}" data-api="${host}" src="' . esc_url(\$src) . '" async></script>' . "\\n";
    }
    return \$tag;
}
add_filter('script_loader_tag', 'adiology_clickguard_attributes', 10, 3);`;
}

function generateWordPressPluginSnippet(siteId: string, domain: string): string {
  const host = getPublicHost();
  return `<!-- Paste this in your WordPress Header using "Insert Headers and Footers" plugin or similar -->
<!-- Go to: Settings > Insert Headers and Footers > Scripts in Header -->
<script data-sid="${siteId}" data-api="${host}" src="${host}/t.js?sid=${siteId}" async></script>`;
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
    const wordpressSnippet = generateWordPressSnippet(siteId, domain);
    const wordpressPluginSnippet = generateWordPressPluginSnippet(siteId, domain);

    return c.json({ ...newDomain, snippet, wordpressSnippet, wordpressPluginSnippet }, 201);
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
    const wordpressSnippet = generateWordPressSnippet(domain.siteId, domain.domain);
    const wordpressPluginSnippet = generateWordPressPluginSnippet(domain.siteId, domain.domain);

    return c.json({ snippet, wordpressSnippet, wordpressPluginSnippet, siteId: domain.siteId });
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
    const wordpressSnippet = generateWordPressSnippet(domain.siteId, domain.domain);
    const wordpressPluginSnippet = generateWordPressPluginSnippet(domain.siteId, domain.domain);

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
      wordpressSnippet,
      wordpressPluginSnippet,
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

clickGuardRoutes.options('/verify', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.text('', 200);
});

clickGuardRoutes.get('/verify', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const sid = c.req.query('sid');
    if (!sid) {
      return c.json({ success: false, error: 'Missing sid parameter', checks: { cors: true, endpoint: true, siteId: false } }, 400);
    }

    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(eq(clickGuardDomains.siteId, sid));

    if (!domain) {
      return c.json({ success: false, error: 'Site ID not found in database', checks: { cors: true, endpoint: true, siteId: false } }, 404);
    }

    const recentVisitors = await db
      .select({ count: count() })
      .from(clickGuardVisitors)
      .where(and(
        eq(clickGuardVisitors.siteId, sid),
        gte(clickGuardVisitors.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      ));

    return c.json({
      success: true,
      checks: {
        cors: true,
        endpoint: true,
        siteId: true,
        domain: domain.domain,
        verified: domain.verified,
        recentVisitors24h: recentVisitors[0]?.count || 0,
      },
      message: domain.verified
        ? 'Your Click Guard installation is working correctly!'
        : 'Connection verified. Waiting for first tracking data from your site.',
    });
  } catch (error) {
    console.error('Verify endpoint error:', error);
    return c.json({ success: false, error: 'Server error during verification', checks: { cors: true, endpoint: true, siteId: false } }, 500);
  }
});

clickGuardRoutes.options('/track', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.text('', 200);
});

function ipMatchesCidr(ip: string, cidr: string): boolean {
  try {
    if (!cidr.includes('/')) return ip === cidr;
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const netNum = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipNum & mask) === (netNum & mask);
  } catch {
    return ip === cidr;
  }
}

function ipInList(ip: string, list: string[]): boolean {
  return list.some(entry => ipMatchesCidr(ip, entry.trim()));
}

clickGuardRoutes.post('/track', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  c.header('Access-Control-Max-Age', '86400');

  try {
    let raw: any;
    const text = await c.req.text();
    try {
      raw = JSON.parse(text);
    } catch {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

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

    const settings = (domain.settings as any) || {};
    const rules = {
      ...DEFAULT_PROTECTION_RULES,
      ...settings.protectionRules,
    };
    const vpnRules = { ...DEFAULT_PROTECTION_RULES.vpnProxyBlocking, ...rules.vpnProxyBlocking };
    const clickRules = { ...DEFAULT_PROTECTION_RULES.repetitiveClickDetection, ...rules.repetitiveClickDetection };
    const aiRules = { ...DEFAULT_PROTECTION_RULES.aiFraudDetection, ...rules.aiFraudDetection };
    const ipListRules = { ...DEFAULT_PROTECTION_RULES.ipWhitelistBlacklist, ...rules.ipWhitelistBlacklist };
    const vpnClickRules = { ...DEFAULT_PROTECTION_RULES.vpnClickFraud, ...rules.vpnClickFraud };
    const clusterRules = { ...DEFAULT_PROTECTION_RULES.ipClusterBlocking, ...rules.ipClusterBlocking };

    let shouldBlock = false;
    let blockReason = '';
    let fraudEventType = '';

    const [existingBlock] = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(and(
        eq(clickGuardBlockedIps.siteId, siteId),
        eq(clickGuardBlockedIps.ipAddress, ip)
      ));

    if (existingBlock) {
      shouldBlock = true;
      blockReason = existingBlock.reason || 'Previously blocked';
    }

    if (ipListRules.enabled && !shouldBlock) {
      const whitelist: string[] = ipListRules.whitelist || [];
      const blacklist: string[] = ipListRules.blacklist || [];
      if (whitelist.length > 0 && ipInList(ip, whitelist)) {
        const geo = await getGeoData(ip);
        const [visitor] = await db.insert(clickGuardVisitors).values({
          siteId, ipAddress: ip, userAgent, fingerprint,
          country: geo?.country || null, city: geo?.city || null,
          region: geo?.regionName || null, isp: geo?.isp || null,
          org: geo?.org || null, asNumber: geo?.as || null,
          timezone: geo?.timezone || null,
          deviceType: parsed.deviceType, browser: parsed.browser,
          browserVersion: parsed.browserVersion, os: parsed.os, osVersion: parsed.osVersion,
          screenWidth, screenHeight, language, referrer, pageUrl,
          isProxy: false, isVpn: false, isBot: false, isTor: false,
          botScore: 0, threatLevel: 'low', clickCount, mouseMovements, timeOnPage,
          blocked: false,
        }).returning();
        if (!domain.verified) {
          await db.update(clickGuardDomains)
            .set({ verified: true, verifiedAt: new Date(), updatedAt: new Date() })
            .where(eq(clickGuardDomains.id, domain.id));
        }
        return c.json({ success: true, blocked: false });
      }
      if (blacklist.length > 0 && ipInList(ip, blacklist)) {
        shouldBlock = true;
        blockReason = 'IP blacklisted by protection rules';
        fraudEventType = 'blacklisted_ip';
      }
    }

    const geo = await getGeoData(ip);

    const isProxy = geo?.proxy || false;
    const isHosting = geo?.hosting || false;
    const isVpn = isHosting;
    const ispLower = (geo?.isp || '').toLowerCase();
    const orgLower = (geo?.org || '').toLowerCase();
    const isTor = /\btor\b|tor exit|tor relay|torproject/i.test(ispLower)
      || /\btor\b|tor exit|tor relay|torproject/i.test(orgLower);

    if (vpnRules.enabled && !shouldBlock) {
      if (vpnRules.blockProxy && isProxy) {
        shouldBlock = true;
        blockReason = `Proxy detected (ISP: ${geo?.isp || 'unknown'})`;
        fraudEventType = 'proxy_blocked';
      }
      if (vpnRules.blockVpn && isVpn && !shouldBlock) {
        shouldBlock = true;
        blockReason = `VPN/Datacenter detected (ISP: ${geo?.isp || 'unknown'}, Org: ${geo?.org || 'unknown'})`;
        fraudEventType = 'vpn_blocked';
      }
      if (vpnRules.blockTor && isTor && !shouldBlock) {
        shouldBlock = true;
        blockReason = `Tor exit node detected (ISP: ${geo?.isp || 'unknown'})`;
        fraudEventType = 'tor_blocked';
      }
    }

    const sensitivityMultiplier = aiRules.sensitivity === 'high' ? 1.3 : aiRules.sensitivity === 'low' ? 0.7 : 1.0;

    let botScore = 0;
    if (headless) botScore += Math.round(40 * sensitivityMultiplier);
    if (!mouseMovements || mouseMovements === 0) botScore += Math.round(20 * sensitivityMultiplier);
    if (timeOnPage !== undefined && timeOnPage < 2) botScore += Math.round(10 * sensitivityMultiplier);
    if (/HeadlessChrome|PhantomJS|Selenium|Bot|Crawl|Spider/i.test(userAgent)) botScore += Math.round(30 * sensitivityMultiplier);

    if (isProxy || isVpn) botScore += Math.round(15 * sensitivityMultiplier);
    if (isTor) botScore += Math.round(25 * sensitivityMultiplier);

    botScore = Math.min(botScore, 100);

    const autoBlockThreshold = aiRules.enabled ? (aiRules.threshold || 70) : 70;

    let threatLevel = 'low';
    if (botScore >= autoBlockThreshold) threatLevel = 'critical';
    else if (botScore >= Math.round(autoBlockThreshold * 0.7)) threatLevel = 'high';
    else if (botScore >= Math.round(autoBlockThreshold * 0.43)) threatLevel = 'medium';

    if (aiRules.enabled && aiRules.autoBlock && botScore >= autoBlockThreshold && !shouldBlock) {
      shouldBlock = true;
      blockReason = `Auto-blocked: bot score ${botScore} (threshold: ${autoBlockThreshold}, sensitivity: ${aiRules.sensitivity})`;
      fraudEventType = 'bot_detected';
    }

    if (clickRules.enabled && !shouldBlock) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const [minuteResult] = await db
        .select({ cnt: count() })
        .from(clickGuardVisitors)
        .where(and(
          eq(clickGuardVisitors.siteId, siteId),
          eq(clickGuardVisitors.ipAddress, ip),
          gte(clickGuardVisitors.createdAt, oneMinuteAgo)
        ));

      const clicksPerMinute = Number(minuteResult?.cnt || 0);
      if (clicksPerMinute >= (clickRules.maxClicksPerMinute || 5)) {
        shouldBlock = true;
        blockReason = `Repetitive clicks: ${clicksPerMinute + 1} clicks in 1 minute (limit: ${clickRules.maxClicksPerMinute})`;
        fraudEventType = 'repetitive_clicks';
      }

      if (!shouldBlock) {
        const [hourResult] = await db
          .select({ cnt: count() })
          .from(clickGuardVisitors)
          .where(and(
            eq(clickGuardVisitors.siteId, siteId),
            eq(clickGuardVisitors.ipAddress, ip),
            gte(clickGuardVisitors.createdAt, oneHourAgo)
          ));

        const clicksPerHour = Number(hourResult?.cnt || 0);
        if (clicksPerHour >= (clickRules.maxClicksPerHour || 10)) {
          shouldBlock = true;
          blockReason = `Repetitive clicks: ${clicksPerHour + 1} clicks in 1 hour (limit: ${clickRules.maxClicksPerHour})`;
          fraudEventType = 'repetitive_clicks';
        }
      }
    }

    if (vpnClickRules.enabled && (isProxy || isVpn || isTor) && !shouldBlock) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [vpnClickResult] = await db
        .select({ cnt: count() })
        .from(clickGuardVisitors)
        .where(and(
          eq(clickGuardVisitors.siteId, siteId),
          eq(clickGuardVisitors.ipAddress, ip),
          gte(clickGuardVisitors.createdAt, oneHourAgo)
        ));
      const vpnClicks = Number(vpnClickResult?.cnt || 0);
      if (vpnClicks >= (vpnClickRules.autoBlockAfterClicks || 2)) {
        shouldBlock = true;
        blockReason = `VPN/Proxy user exceeded click limit: ${vpnClicks + 1} clicks (limit: ${vpnClickRules.autoBlockAfterClicks} for VPN/Proxy)`;
        fraudEventType = 'vpn_click_fraud';
      }
    }

    if (clusterRules.enabled && !shouldBlock) {
      const clusterPrefix = clusterRules.clusterRange || 24;
      const ipParts = ip.split('.');
      if (ipParts.length === 4) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let subnetPattern = '';
        if (clusterPrefix >= 24) subnetPattern = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.%`;
        else if (clusterPrefix >= 16) subnetPattern = `${ipParts[0]}.${ipParts[1]}.%`;
        else subnetPattern = `${ipParts[0]}.%`;

        const clusterResult = await db.execute(sql`
          SELECT COUNT(DISTINCT ip_address) as cnt
          FROM click_guard_visitors
          WHERE site_id = ${siteId}
            AND ip_address LIKE ${subnetPattern}
            AND created_at >= ${oneHourAgo}
        `);
        const clusterCount = Number((clusterResult.rows[0] as any)?.cnt || 0);
        if (clusterCount >= (clusterRules.maxClicksFromCluster || 20)) {
          shouldBlock = true;
          blockReason = `IP cluster attack: ${clusterCount} unique IPs from /${clusterPrefix} subnet in 1 hour`;
          fraudEventType = 'ip_cluster';
        }
      }
    }

    if (shouldBlock && !existingBlock) {
      try {
        await db.insert(clickGuardBlockedIps).values({
          siteId,
          ipAddress: ip,
          reason: blockReason,
          autoBlocked: true,
        });
      } catch (blockErr: any) {
        if (!blockErr?.message?.includes('duplicate')) {
          console.error('[ClickGuard] Failed to insert block:', blockErr);
        }
      }
    }

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
        isProxy,
        isVpn,
        isBot: botScore >= Math.round(autoBlockThreshold * 0.7),
        isTor,
        botScore,
        threatLevel,
        clickCount,
        mouseMovements,
        timeOnPage,
        blocked: shouldBlock,
      })
      .returning();

    if (shouldBlock || threatLevel === 'high' || threatLevel === 'critical') {
      await db.insert(clickGuardFraudEvents).values({
        siteId,
        visitorId: visitor.id,
        eventType: fraudEventType || (botScore >= autoBlockThreshold ? 'bot_detected' : 'suspicious_activity'),
        severity: shouldBlock ? 'critical' : threatLevel,
        ipAddress: ip,
        details: {
          botScore,
          headless,
          mouseMovements,
          timeOnPage,
          userAgent,
          isProxy,
          isVpn,
          isTor,
          blockReason: blockReason || null,
          geoIsp: geo?.isp || null,
          geoOrg: geo?.org || null,
          rulesApplied: {
            vpnProxyBlocking: vpnRules.enabled,
            repetitiveClickDetection: clickRules.enabled,
            aiFraudDetection: aiRules.enabled,
            vpnClickFraud: vpnClickRules.enabled,
            ipClusterBlocking: clusterRules.enabled,
          },
        },
      });
    }

    if (!domain.verified) {
      await db
        .update(clickGuardDomains)
        .set({ verified: true, verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(clickGuardDomains.id, domain.id));
    }

    return c.json({ success: true, blocked: shouldBlock });
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

    const safeEvents = events.map((ev: any) => ({
      ...ev,
      details: typeof ev.details === 'object' ? JSON.stringify(ev.details) : ev.details,
    }));

    return c.json(safeEvents);
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

// ========== Protection Rules Endpoints ==========

const DEFAULT_PROTECTION_RULES = {
  repetitiveClickDetection: {
    enabled: true,
    maxClicksPerMinute: 5,
    maxClicksPerHour: 10,
    blockDuration: 24,
  },
  vpnProxyBlocking: {
    enabled: true,
    blockVpn: true,
    blockProxy: true,
    blockTor: true,
  },
  aiFraudDetection: {
    enabled: true,
    threshold: 70,
    autoBlock: true,
    sensitivity: 'medium' as 'low' | 'medium' | 'high',
  },
  ipClusterBlocking: {
    enabled: false,
    maxClicksFromCluster: 20,
    clusterRange: 24,
  },
  ipWhitelistBlacklist: {
    enabled: true,
    whitelist: [] as string[],
    blacklist: [] as string[],
  },
  vpnClickFraud: {
    enabled: true,
    autoBlockAfterClicks: 2,
    blockDuration: 48,
  },
};

clickGuardRoutes.get('/protection-rules/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const siteId = c.req.param('siteId');
    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) return c.json({ error: 'Domain not found' }, 404);

    const settings = (domain.settings as any) || {};
    const protectionRules = settings.protectionRules || DEFAULT_PROTECTION_RULES;

    return c.json({ protectionRules });
  } catch (error) {
    console.error('Failed to get protection rules:', error);
    return c.json({ error: 'Failed to get protection rules' }, 500);
  }
});

clickGuardRoutes.put('/protection-rules/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const siteId = c.req.param('siteId');
    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) return c.json({ error: 'Domain not found' }, 404);

    const body = await c.req.json();
    const { protectionRules } = body;

    if (!protectionRules || typeof protectionRules !== 'object') return c.json({ error: 'Protection rules are required' }, 400);

    const validKeys = ['repetitiveClickDetection', 'vpnProxyBlocking', 'aiFraudDetection', 'ipClusterBlocking', 'ipWhitelistBlacklist', 'vpnClickFraud'];
    const sanitized: Record<string, any> = {};
    for (const key of validKeys) {
      if (protectionRules[key] && typeof protectionRules[key] === 'object') {
        sanitized[key] = { ...DEFAULT_PROTECTION_RULES[key as keyof typeof DEFAULT_PROTECTION_RULES], ...protectionRules[key] };
      } else {
        sanitized[key] = DEFAULT_PROTECTION_RULES[key as keyof typeof DEFAULT_PROTECTION_RULES];
      }
    }

    const existingSettings = (domain.settings as any) || {};
    const updatedSettings = { ...existingSettings, protectionRules: sanitized };

    await db
      .update(clickGuardDomains)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(clickGuardDomains.id, domain.id));

    return c.json({ protectionRules, message: 'Protection rules updated' });
  } catch (error) {
    console.error('Failed to update protection rules:', error);
    return c.json({ error: 'Failed to update protection rules' }, 500);
  }
});

// Export blocked IPs for Google Ads exclusion
clickGuardRoutes.get('/export-blocked-ips/:siteId', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const siteId = c.req.param('siteId');
    const [domain] = await db
      .select()
      .from(clickGuardDomains)
      .where(and(
        eq(clickGuardDomains.siteId, siteId),
        eq(clickGuardDomains.userId, userId)
      ));

    if (!domain) return c.json({ error: 'Domain not found' }, 404);

    const blocked = await db
      .select()
      .from(clickGuardBlockedIps)
      .where(eq(clickGuardBlockedIps.siteId, siteId))
      .orderBy(desc(clickGuardBlockedIps.createdAt));

    const format = c.req.query('format') || 'csv';

    if (format === 'csv') {
      const csvLines = ['IP Address,Reason,Type,Date Blocked'];
      blocked.forEach(b => {
        csvLines.push(`${b.ipAddress},"${b.reason || ''}",${b.autoBlocked ? 'Auto' : 'Manual'},${new Date(b.createdAt!).toISOString()}`);
      });
      return c.text(csvLines.join('\n'), 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="blocked-ips-${siteId}.csv"`,
      });
    }

    // Google Ads format - just IP list, one per line
    const googleAdsFormat = blocked.map(b => b.ipAddress).join('\n');
    return c.text(googleAdsFormat, 200, {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="google-ads-ip-exclusions-${siteId}.txt"`,
    });
  } catch (error) {
    console.error('Failed to export blocked IPs:', error);
    return c.json({ error: 'Failed to export blocked IPs' }, 500);
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
