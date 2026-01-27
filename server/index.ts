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

// User sync endpoint - syncs user data to database
app.post('/api/user/sync', async (c) => {
  try {
    // This endpoint is called after user login to sync user data
    // For now, return success as user data is managed by Nhost
    return c.json({ success: true, message: 'User synced' });
  } catch (error) {
    console.error('User sync error:', error);
    return c.json({ error: 'Failed to sync user' }, 500);
  }
});

// Notifications endpoints
app.get('/api/notifications/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    // Return empty notifications array for now
    // Can be implemented with Nhost GraphQL later
    return c.json({ notifications: [] });
  } catch (error) {
    console.error('Notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

app.put('/api/notifications/:id/read', async (c) => {
  try {
    const id = c.req.param('id');
    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Failed to update notification' }, 500);
  }
});

app.put('/api/notifications/user/:userId/read-all', async (c) => {
  try {
    const userId = c.req.param('userId');
    return c.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ error: 'Failed to update notifications' }, 500);
  }
});

// Workspace projects endpoints
app.get('/api/workspace-projects', async (c) => {
  try {
    // Return empty projects array for now
    // Can be implemented with Nhost GraphQL later
    return c.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Workspace projects error:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

app.post('/api/workspace-projects', async (c) => {
  try {
    const { name } = await c.req.json();
    if (!name) {
      return c.json({ error: 'Project name required' }, 400);
    }
    // Return mock project for now
    // Can be implemented with Nhost GraphQL later
    return c.json({
      success: true,
      data: {
        id: `project-${Date.now()}`,
        name,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Dashboard endpoint
app.get('/api/dashboard/all/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    // Return default dashboard data
    // Can be implemented with Nhost GraphQL later
    return c.json({
      success: true,
      data: {
        stats: {
          totalCampaigns: 0,
          totalSearches: 0,
          unreadNotifications: 0
        },
        recentCampaigns: [],
        workspaces: []
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Error reporting endpoint
app.post('/api/errors', async (c) => {
  try {
    let errorData;
    try {
      // Try to parse JSON, but handle malformed requests gracefully
      const body = await c.req.text();
      if (!body || body.trim() === '') {
        return c.json({ success: false, error: 'Empty request body' }, 400);
      }
      errorData = JSON.parse(body);
    } catch (parseError) {
      console.error('[Client Error] Failed to parse error data:', parseError);
      return c.json({ success: false, error: 'Invalid JSON format' }, 400);
    }
    
    // Log error for monitoring
    console.error('[Client Error]', errorData);
    // Return success to prevent console errors
    return c.json({ success: true, message: 'Error logged' });
  } catch (error) {
    console.error('Error logging error:', error);
    return c.json({ error: 'Failed to log error' }, 500);
  }
});

// Google Ads API endpoints (stubs)
app.get('/api/google-ads/accounts', async (c) => {
  try {
    return c.json({ accounts: [] });
  } catch (error) {
    console.error('Google Ads accounts error:', error);
    return c.json({ error: 'Failed to fetch accounts' }, 500);
  }
});

app.get('/api/google-ads/status', async (c) => {
  try {
    return c.json({ connected: false, message: 'Google Ads API not configured' });
  } catch (error) {
    console.error('Google Ads status error:', error);
    return c.json({ error: 'Failed to fetch status' }, 500);
  }
});

app.get('/api/google-ads/auth-url', async (c) => {
  try {
    return c.json({ url: null, message: 'Google Ads OAuth not configured' });
  } catch (error) {
    console.error('Google Ads auth URL error:', error);
    return c.json({ error: 'Failed to generate auth URL' }, 500);
  }
});

app.get('/api/google-ads/requests', async (c) => {
  try {
    return c.json({ requests: [] });
  } catch (error) {
    console.error('Google Ads requests error:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

app.post('/api/google-ads/search-advertiser', async (c) => {
  try {
    return c.json({ results: [] });
  } catch (error) {
    console.error('Google Ads search advertiser error:', error);
    return c.json({ error: 'Failed to search advertiser' }, 500);
  }
});

app.get('/api/google-ads/search/:id', async (c) => {
  try {
    const id = c.req.param('id');
    return c.json({ id, results: [] });
  } catch (error) {
    console.error('Google Ads search error:', error);
    return c.json({ error: 'Failed to fetch search' }, 500);
  }
});

app.post('/api/google-ads/fetch-ad', async (c) => {
  try {
    return c.json({ ad: null });
  } catch (error) {
    console.error('Google Ads fetch ad error:', error);
    return c.json({ error: 'Failed to fetch ad' }, 500);
  }
});

app.post('/api/google-ads/keyword-planner', async (c) => {
  try {
    const body = await c.req.json();
    // Return empty results for now
    return c.json({ 
      success: false, 
      source: 'fallback', 
      message: 'Keyword planner API not configured',
      keywords: [] 
    });
  } catch (error) {
    console.error('Keyword planner error:', error);
    return c.json({ error: 'Failed to fetch keywords' }, 500);
  }
});

// Item projects endpoints (stubs)
app.get('/api/item-projects/campaign/:id', async (c) => {
  try {
    const id = c.req.param('id');
    return c.json({ id, data: null, message: 'Campaign not found' });
  } catch (error) {
    console.error('Item projects campaign error:', error);
    return c.json({ error: 'Failed to fetch campaign' }, 500);
  }
});

app.get('/api/item-projects/keyword-list/:id', async (c) => {
  try {
    const id = c.req.param('id');
    return c.json({ id, data: null, message: 'Keyword list not found' });
  } catch (error) {
    console.error('Item projects keyword list error:', error);
    return c.json({ error: 'Failed to fetch keyword list' }, 500);
  }
});

app.get('/api/item-projects/:type/:id', async (c) => {
  try {
    const type = c.req.param('type');
    const id = c.req.param('id');
    return c.json({ type, id, data: null, message: 'Item not found' });
  } catch (error) {
    console.error('Item projects error:', error);
    return c.json({ error: 'Failed to fetch item' }, 500);
  }
});

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Starting Admin API Server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Admin API Server running on http://localhost:${info.port}`);
});

// Export for Vercel serverless functions
export { app };
export default app;
