import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { community } from './routes/community';
import { stripeService } from './stripeService';
import { adminAuthMiddleware } from './adminAuthService';

const app = new Hono();

app.use('*', logger());

app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Admin-Email', 'X-Admin-Token'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposeHeaders: ['Content-Length', 'Set-Cookie'],
  credentials: true,
  maxAge: 600,
}));

app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/api/community', community);

app.get('/api/products', async (c) => {
  try {
    const products = await stripeService.listProductsWithPrices(true, 50, 0);
    
    const productMap = new Map();
    for (const row of products) {
      if (!productMap.has(row.product_id)) {
        productMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productMap.get(row.product_id).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
          metadata: row.price_metadata
        });
      }
    }
    
    return c.json({ products: Array.from(productMap.values()) });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/api/checkout', async (c) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl, mode } = await c.req.json();
    
    if (!priceId || !customerId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      successUrl || `${c.req.url.split('/api')[0]}/success`,
      cancelUrl || `${c.req.url.split('/api')[0]}/cancel`,
      mode || 'subscription'
    );
    
    return c.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

app.post('/api/portal', async (c) => {
  try {
    const { customerId, returnUrl } = await c.req.json();
    
    if (!customerId) {
      return c.json({ error: 'Customer ID required' }, 400);
    }
    
    const session = await stripeService.createCustomerPortalSession(
      customerId,
      returnUrl || c.req.url.split('/api')[0]
    );
    
    return c.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

app.get('/api/admin/status', async (c) => {
  const authResult = await adminAuthMiddleware(c);
  if (authResult instanceof Response) {
    return authResult;
  }
  return c.json({ success: true, admin: { email: authResult.user.email } });
});

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Starting Admin API Server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Admin API Server running on http://localhost:${info.port}`);
});

export default app;
