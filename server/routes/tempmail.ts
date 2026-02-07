import { Hono } from 'hono';

const TEMP_MAIL_API = 'https://api.temp-mail.io';
const API_KEY = process.env.TEMP_MAIL_API_KEY || '';

async function tempMailFetch(path: string, method: string = 'GET') {
  const res = await fetch(`${TEMP_MAIL_API}${path}`, {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const rateLimitInfo = {
    limit: res.headers.get('X-Ratelimit-Limit'),
    remaining: res.headers.get('X-Ratelimit-Remaining'),
    reset: res.headers.get('X-Ratelimit-Reset'),
  };

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Unknown error' }));
    return { ok: false, status: res.status, error: errorBody, rateLimit: rateLimitInfo };
  }

  const data = await res.json();
  return { ok: true, data, rateLimit: rateLimitInfo };
}

export const tempMailRoutes = new Hono();

tempMailRoutes.use('*', async (c, next) => {
  if (!API_KEY) {
    return c.json({ error: 'Temp Mail service is not configured. TEMP_MAIL_API_KEY is missing.' }, 503);
  }
  await next();
});

tempMailRoutes.get('/domains', async (c) => {
  try {
    const result = await tempMailFetch('/v1/domains');
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch domains:', error);
    return c.json({ error: 'Failed to fetch domains' }, 500);
  }
});

tempMailRoutes.post('/emails', async (c) => {
  try {
    const result = await tempMailFetch('/v1/emails', 'POST');
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json(result.data);
  } catch (error: any) {
    console.error('Failed to create temp email:', error);
    return c.json({ error: 'Failed to create temp email' }, 500);
  }
});

tempMailRoutes.get('/emails/:email/messages', async (c) => {
  try {
    const email = c.req.param('email');
    const result = await tempMailFetch(`/v1/emails/${encodeURIComponent(email)}/messages`);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

tempMailRoutes.get('/messages/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await tempMailFetch(`/v1/messages/${id}`);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch message:', error);
    return c.json({ error: 'Failed to fetch message' }, 500);
  }
});

tempMailRoutes.get('/messages/:id/source', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await tempMailFetch(`/v1/messages/${id}/source`);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch message source:', error);
    return c.json({ error: 'Failed to fetch message source' }, 500);
  }
});

tempMailRoutes.delete('/emails/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const result = await tempMailFetch(`/v1/emails/${encodeURIComponent(email)}`, 'DELETE');
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete email:', error);
    return c.json({ error: 'Failed to delete email' }, 500);
  }
});

tempMailRoutes.delete('/messages/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await tempMailFetch(`/v1/messages/${id}`, 'DELETE');
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as any);
    }
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});
