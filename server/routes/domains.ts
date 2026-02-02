import { Hono } from 'hono';
import { db } from '../db';
import { monitoredDomains, domainSnapshots, domainAlerts } from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';
import { 
  lookupWhois, 
  checkSSL, 
  lookupDNS, 
  normalizeDomain, 
  calculateDaysUntilExpiry,
  detectDNSChanges,
  type WhoisData,
  type SSLData,
  type DNSRecords
} from '../services/domainService';

export const domainsRoutes = new Hono();

async function getUserId(c: any): Promise<string | null> {
  return await getUserIdFromToken(c);
}

domainsRoutes.get('/', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domains = await db
      .select()
      .from(monitoredDomains)
      .where(eq(monitoredDomains.userId, userId))
      .orderBy(desc(monitoredDomains.createdAt));

    return c.json(domains);
  } catch (error) {
    console.error('Failed to fetch domains:', error);
    return c.json({ error: 'Failed to fetch domains' }, 500);
  }
});

// Register /lookup/* before /:id so GET /api/domains/lookup/whois etc. are not matched by /:id
domainsRoutes.get('/lookup/whois', async (c) => {
  try {
    const domain = c.req.query('domain');
    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    const normalized = normalizeDomain(domain);
    const whoisData = await lookupWhois(normalized);
    return c.json(whoisData);
  } catch (error) {
    console.error('WHOIS lookup failed:', error);
    return c.json({ error: 'WHOIS lookup failed' }, 500);
  }
});

domainsRoutes.get('/lookup/ssl', async (c) => {
  try {
    const domain = c.req.query('domain');
    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    const normalized = normalizeDomain(domain);
    const sslData = await checkSSL(normalized);
    return c.json(sslData);
  } catch (error) {
    console.error('SSL check failed:', error);
    return c.json({ error: 'SSL check failed' }, 500);
  }
});

domainsRoutes.get('/lookup/dns', async (c) => {
  try {
    const domain = c.req.query('domain');
    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    const normalized = normalizeDomain(domain);
    const dnsRecords = await lookupDNS(normalized);
    return c.json(dnsRecords);
  } catch (error) {
    console.error('DNS lookup failed:', error);
    return c.json({ error: 'DNS lookup failed' }, 500);
  }
});

domainsRoutes.get('/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');
    const [domain] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!domain) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    return c.json(domain);
  } catch (error) {
    console.error('Failed to fetch domain:', error);
    return c.json({ error: 'Failed to fetch domain' }, 500);
  }
});

domainsRoutes.post('/', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const domain = normalizeDomain(body.domain);

    if (!domain) {
      return c.json({ error: 'Domain is required' }, 400);
    }

    const existing = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.userId, userId),
        eq(monitoredDomains.domain, domain)
      ));

    if (existing.length > 0) {
      return c.json({ error: 'Domain already being monitored' }, 400);
    }

    let whoisData: WhoisData | null = null;
    let sslData: SSLData | null = null;
    let dnsRecords: DNSRecords | null = null;

    try {
      whoisData = await lookupWhois(domain);
    } catch (e) {
      console.error('WHOIS lookup failed:', e);
    }

    try {
      sslData = await checkSSL(domain);
    } catch (e) {
      console.error('SSL check failed:', e);
    }

    try {
      dnsRecords = await lookupDNS(domain);
    } catch (e) {
      console.error('DNS lookup failed:', e);
    }

    const [newDomain] = await db
      .insert(monitoredDomains)
      .values({
        userId,
        domain,
        registrar: whoisData?.registrar || null,
        expiryDate: whoisData?.expiryDate || null,
        createdDate: whoisData?.createdDate || null,
        updatedDate: whoisData?.updatedDate || null,
        nameServers: whoisData?.nameServers || [],
        whoisData: whoisData || {},
        sslIssuer: sslData?.issuer || null,
        sslExpiryDate: sslData?.validTo || null,
        sslValidFrom: sslData?.validFrom || null,
        sslData: sslData || {},
        dnsRecords: dnsRecords || {},
        lastCheckedAt: new Date(),
        alertEmail: body.alertEmail || null,
        notes: body.notes || null,
      })
      .returning();

    if (dnsRecords) {
      await db.insert(domainSnapshots).values({
        domainId: newDomain.id,
        snapshotType: 'dns',
        data: dnsRecords,
        changes: [],
      });
    }

    return c.json(newDomain, 201);
  } catch (error) {
    console.error('Failed to add domain:', error);
    return c.json({ error: 'Failed to add domain' }, 500);
  }
});

domainsRoutes.put('/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');
    const body = await c.req.json();

    const [existing] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const [updated] = await db
      .update(monitoredDomains)
      .set({
        alertsEnabled: body.alertsEnabled ?? existing.alertsEnabled,
        alertDays: body.alertDays ?? existing.alertDays,
        alertEmail: body.alertEmail ?? existing.alertEmail,
        notes: body.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(monitoredDomains.id, domainId))
      .returning();

    return c.json(updated);
  } catch (error) {
    console.error('Failed to update domain:', error);
    return c.json({ error: 'Failed to update domain' }, 500);
  }
});

domainsRoutes.delete('/:id', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    await db.delete(monitoredDomains).where(eq(monitoredDomains.id, domainId));

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete domain:', error);
    return c.json({ error: 'Failed to delete domain' }, 500);
  }
});

domainsRoutes.post('/:id/refresh', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const domain = existing.domain;
    let whoisData: WhoisData | null = null;
    let sslData: SSLData | null = null;
    let dnsRecords: DNSRecords | null = null;
    const dnsChanges: string[] = [];

    try {
      whoisData = await lookupWhois(domain);
    } catch (e) {
      console.error('WHOIS lookup failed:', e);
    }

    try {
      sslData = await checkSSL(domain);
    } catch (e) {
      console.error('SSL check failed:', e);
    }

    try {
      dnsRecords = await lookupDNS(domain);
      if (existing.dnsRecords && dnsRecords) {
        const changes = detectDNSChanges(existing.dnsRecords as DNSRecords, dnsRecords);
        dnsChanges.push(...changes);
      }
    } catch (e) {
      console.error('DNS lookup failed:', e);
    }

    const [updated] = await db
      .update(monitoredDomains)
      .set({
        registrar: whoisData?.registrar || existing.registrar,
        expiryDate: whoisData?.expiryDate || existing.expiryDate,
        createdDate: whoisData?.createdDate || existing.createdDate,
        updatedDate: whoisData?.updatedDate || existing.updatedDate,
        nameServers: whoisData?.nameServers || existing.nameServers,
        whoisData: whoisData || existing.whoisData,
        sslIssuer: sslData?.issuer || existing.sslIssuer,
        sslExpiryDate: sslData?.validTo || existing.sslExpiryDate,
        sslValidFrom: sslData?.validFrom || existing.sslValidFrom,
        sslData: sslData || existing.sslData,
        dnsRecords: dnsRecords || existing.dnsRecords,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(monitoredDomains.id, domainId))
      .returning();

    if (dnsChanges.length > 0 && dnsRecords) {
      await db.insert(domainSnapshots).values({
        domainId,
        snapshotType: 'dns_change',
        data: dnsRecords,
        changes: dnsChanges,
      });
    }

    return c.json({ ...updated, dnsChanges });
  } catch (error) {
    console.error('Failed to refresh domain:', error);
    return c.json({ error: 'Failed to refresh domain' }, 500);
  }
});

domainsRoutes.get('/:id/snapshots', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const snapshots = await db
      .select()
      .from(domainSnapshots)
      .where(eq(domainSnapshots.domainId, domainId))
      .orderBy(desc(domainSnapshots.createdAt))
      .limit(50);

    return c.json(snapshots);
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return c.json({ error: 'Failed to fetch snapshots' }, 500);
  }
});

domainsRoutes.get('/:id/alerts', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('id');

    const [existing] = await db
      .select()
      .from(monitoredDomains)
      .where(and(
        eq(monitoredDomains.id, domainId),
        eq(monitoredDomains.userId, userId)
      ));

    if (!existing) {
      return c.json({ error: 'Domain not found' }, 404);
    }

    const alerts = await db
      .select()
      .from(domainAlerts)
      .where(eq(domainAlerts.domainId, domainId))
      .orderBy(desc(domainAlerts.createdAt))
      .limit(50);

    return c.json(alerts);
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});
