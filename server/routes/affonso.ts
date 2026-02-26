import { Hono } from 'hono';
import { getUserIdFromToken } from '../utils/auth';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const affonsoRoutes = new Hono();

const AFFONSO_API_BASE = 'https://api.affonso.io/v1';
const AFFONSO_PROGRAM_ID = process.env.AFFONSO_PROGRAM_ID || 'cmm3pjxd4002t12ijzoookmni';

affonsoRoutes.post('/embed-token', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = process.env.AFFONSO_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'Affonso not configured' }, 500);
    }

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRows.length) {
      return c.json({ error: 'User not found' }, 404);
    }
    const user = userRows[0];

    const response = await fetch(`${AFFONSO_API_BASE}/embed/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        programId: AFFONSO_PROGRAM_ID,
        partner: {
          email: user.email,
          name: user.fullName || undefined,
        },
        externalUserId: user.id,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[Affonso] Failed to generate embed token:', errData);
      return c.json({ error: 'Failed to generate referral token' }, 502);
    }

    const data = await response.json();
    return c.json({ success: true, token: data.publicToken });
  } catch (error: any) {
    console.error('[Affonso] Embed token error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { affonsoRoutes };
