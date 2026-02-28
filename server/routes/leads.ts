import { Hono } from 'hono';
import { db } from '../db';
import { emailLeads } from '../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

const app = new Hono();

app.post('/capture', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'Invalid email' }, 400);
    }

    const source = (body.source || 'unknown').slice(0, 100);
    const page = (body.page || '').slice(0, 500);
    const referrer = (body.referrer || '').slice(0, 500);
    const userAgent = (c.req.header('user-agent') || '').slice(0, 500);
    const ipAddress = (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'
    ).slice(0, 100);

    const existing = await db
      .select({ id: emailLeads.id })
      .from(emailLeads)
      .where(eq(emailLeads.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(emailLeads).values({
        email,
        source,
        page,
        referrer,
        userAgent,
        ipAddress,
        metadata: body.metadata || {},
      });
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Lead capture error:', error);
    return c.json({ success: false }, 500);
  }
});

export { app as leadsRoutes };
