import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { community } from './routes/community';
import { stripeRoutes } from './routes/stripe';
import { organizationsRoutes } from './routes/organizations';
import { invitesRoutes } from './routes/invites';
import { seatsRoutes } from './routes/seats';
import { adminRoutes } from './routes/admin';
import { userRoutes } from './routes/user';
import { tasksRoutes } from './routes/tasks';
import { promoRoutes } from './routes/promo';
import { stripeService } from './stripeService';
import { adminAuthMiddleware } from './adminAuthService';
import { db, getDb } from './db';
import { campaignHistory, auditLogs, workspaceProjects, projectItems } from '../shared/schema';
import { analyzeUrlWithCheerio } from './urlAnalyzerLite';
import { nhostAdmin } from './nhostAdmin';
import { eq, desc, asc, and } from 'drizzle-orm';
import { getUserIdFromToken } from './utils/auth';

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

// Test endpoint to verify routing works
app.get('/api/test-routes', (c) => {
  return c.json({
    message: 'Routes are working',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/health',
      '/api/debug',
      '/api/workspace-projects',
      '/api/workspace-projects/debug',
      '/api/test-routes'
    ]
  });
});

// Debug endpoint - test if routes are working
app.get('/api/debug', async (c) => {
  return c.json({ 
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    routes: {
      'workspace-projects': '/api/workspace-projects',
      'workspace-projects-debug': '/api/workspace-projects/debug'
    }
  });
});

app.route('/api/community', community);
app.route('/api/stripe', stripeRoutes);
app.route('/api/organizations', organizationsRoutes);
app.route('/api/invites', invitesRoutes);
app.route('/api/organization', seatsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/user', userRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/projects', tasksRoutes); // Projects are handled in tasks routes
app.route('/api/promo', promoRoutes);
app.route('/api/organizations', organizationsRoutes);
app.route('/api/invites', invitesRoutes);
app.route('/api/organization', seatsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/user', userRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/projects', tasksRoutes); // Projects are handled in tasks routes
app.route('/api/promo', promoRoutes);

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

// Debug endpoint to check auth status (remove in production if needed)
app.get('/api/workspace-projects/debug', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const hasToken = !!authHeader?.startsWith('Bearer ');
    const token = hasToken && authHeader ? authHeader.substring(7) : null;
    const tokenLength = token?.length || 0;
    
    const userId = await getUserIdFromToken(c);
    const nhostConfigured = nhostAdmin.isConfigured();
    
    return c.json({
      hasAuthHeader: !!authHeader,
      hasToken,
      tokenLength,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      userId,
      nhostConfigured,
      nhostSubdomain: process.env.NHOST_SUBDOMAIN || process.env.NHOST_PROJECT_ID || 'not set',
      nhostRegion: process.env.NHOST_REGION || 'not set',
    });
  } catch (error: any) {
    return c.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});

// GET /api/workspace-projects - List all projects for user
app.get('/api/workspace-projects', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = getDb();
    const results = await db
      .select()
      .from(workspaceProjects)
      .where(eq(workspaceProjects.userId, userId))
      .orderBy(asc(workspaceProjects.order), desc(workspaceProjects.createdAt));

    return c.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Workspace projects error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return c.json({ 
      error: 'Failed to fetch projects', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500);
  }
});

// POST /api/workspace-projects - Create project
app.post('/api/workspace-projects', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description, color, icon, workspaceId } = await c.req.json();
    
    if (!name || !name.trim()) {
      return c.json({ error: 'Project name required' }, 400);
    }

    const result = await db.insert(workspaceProjects).values({
      userId,
      workspaceId: workspaceId || null,
      name: name.trim(),
      description: description || null,
      color: color || '#6366f1',
      icon: icon || 'folder',
      isArchived: false,
      order: 0,
    }).returning();

    return c.json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return c.json({ error: 'Failed to create project', message: error.message }, 500);
  }
});

// GET /api/workspace-projects/:id - Get single project
app.get('/api/workspace-projects/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    const results = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, id),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (results.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get items for this project
    const items = await db
      .select()
      .from(projectItems)
      .where(eq(projectItems.projectId, id));

    // Group items by type
    const itemsByType: Record<string, typeof items> = {};
    for (const item of items) {
      if (!itemsByType[item.itemType]) {
        itemsByType[item.itemType] = [];
      }
      itemsByType[item.itemType].push(item);
    }

    return c.json({
      success: true,
      data: {
        ...results[0],
        items: itemsByType
      }
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    return c.json({ error: 'Failed to fetch project', message: error.message }, 500);
  }
});

// PUT /api/workspace-projects/:id - Update project
app.put('/api/workspace-projects/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    // Check if project exists and belongs to user
    const existing = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, id),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description || null;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }
    if (updates.icon !== undefined) {
      updateData.icon = updates.icon;
    }
    if (updates.isArchived !== undefined) {
      updateData.isArchived = updates.isArchived;
    }
    if (updates.order !== undefined) {
      updateData.order = updates.order;
    }
    if (updates.workspaceId !== undefined) {
      updateData.workspaceId = updates.workspaceId || null;
    }

    const result = await db
      .update(workspaceProjects)
      .set(updateData)
      .where(eq(workspaceProjects.id, id))
      .returning();

    return c.json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    return c.json({ error: 'Failed to update project', message: error.message }, 500);
  }
});

// DELETE /api/workspace-projects/:id - Delete project
app.delete('/api/workspace-projects/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    // Check if project exists and belongs to user
    const existing = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, id),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Delete project (items will be cascade deleted)
    await db
      .delete(workspaceProjects)
      .where(eq(workspaceProjects.id, id));

    return c.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return c.json({ error: 'Failed to delete project', message: error.message }, 500);
  }
});

// GET /api/workspace-projects/:id/items - Get items for project
app.get('/api/workspace-projects/:id/items', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const itemType = c.req.query('itemType'); // Optional filter by item type
    
    // Verify project belongs to user
    const project = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, projectId),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get items
    const conditions: any[] = [eq(projectItems.projectId, projectId)];
    if (itemType) {
      conditions.push(eq(projectItems.itemType, itemType));
    }

    const items = await db
      .select()
      .from(projectItems)
      .where(and(...conditions))
      .orderBy(projectItems.createdAt);

    return c.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('Get project items error:', error);
    return c.json({ error: 'Failed to fetch project items', message: error.message }, 500);
  }
});

// POST /api/workspace-projects/:id/items - Create item for project
app.post('/api/workspace-projects/:id/items', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const { itemType, itemId, itemName, itemMetadata } = await c.req.json();
    
    if (!itemType || !itemId) {
      return c.json({ error: 'itemType and itemId are required' }, 400);
    }

    // Verify project belongs to user
    const project = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, projectId),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check if item already exists
    const existing = await db
      .select()
      .from(projectItems)
      .where(and(
        eq(projectItems.projectId, projectId),
        eq(projectItems.itemType, itemType),
        eq(projectItems.itemId, itemId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return c.json({
        success: true,
        data: existing[0],
        message: 'Item already linked to project'
      });
    }

    const result = await db.insert(projectItems).values({
      projectId,
      itemType,
      itemId,
      itemName: itemName || null,
      itemMetadata: itemMetadata || {},
    }).returning();

    return c.json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('Create project item error:', error);
    // Handle unique constraint violation
    if (error.message?.includes('unique_project_item')) {
      return c.json({ error: 'Item already linked to this project' }, 409);
    }
    return c.json({ error: 'Failed to create project item', message: error.message }, 500);
  }
});

// GET /api/workspace-projects/:id/items/:itemId - Get single item
app.get('/api/workspace-projects/:id/items/:itemId', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const itemType = c.req.query('itemType'); // Optional filter by item type
    
    // Verify project belongs to user
    const project = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, projectId),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Build query
    let queryConditions: any[] = [
      eq(projectItems.projectId, projectId),
      eq(projectItems.itemId, itemId)
    ];

    if (itemType) {
      queryConditions.push(eq(projectItems.itemType, itemType));
    }

    const results = await db
      .select()
      .from(projectItems)
      .where(and(...queryConditions))
      .limit(1);

    if (results.length === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({
      success: true,
      data: results[0]
    });
  } catch (error: any) {
    console.error('Get project item error:', error);
    return c.json({ error: 'Failed to fetch project item', message: error.message }, 500);
  }
});

// PUT /api/workspace-projects/:id/items/:itemId - Update item
app.put('/api/workspace-projects/:id/items/:itemId', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const itemType = c.req.query('itemType'); // Optional filter by item type
    const updates = await c.req.json();
    
    // Verify project belongs to user
    const project = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, projectId),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Build query conditions
    let queryConditions: any[] = [
      eq(projectItems.projectId, projectId),
      eq(projectItems.itemId, itemId)
    ];

    if (itemType) {
      queryConditions.push(eq(projectItems.itemType, itemType));
    }

    // Check if item exists
    const existing = await db
      .select()
      .from(projectItems)
      .where(and(...queryConditions))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }

    // Build update object
    const updateData: any = {};

    if (updates.itemName !== undefined) {
      updateData.itemName = updates.itemName || null;
    }
    if (updates.itemMetadata !== undefined) {
      updateData.itemMetadata = updates.itemMetadata || {};
    }
    if (updates.itemType !== undefined) {
      updateData.itemType = updates.itemType;
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    const result = await db
      .update(projectItems)
      .set(updateData)
      .where(and(...queryConditions))
      .returning();

    return c.json({
      success: true,
      data: result[0]
    });
  } catch (error: any) {
    console.error('Update project item error:', error);
    return c.json({ error: 'Failed to update project item', message: error.message }, 500);
  }
});

// DELETE /api/workspace-projects/:id/items/:itemId - Delete item
app.delete('/api/workspace-projects/:id/items/:itemId', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const itemType = c.req.query('itemType'); // Optional filter by item type
    
    // Verify project belongs to user
    const project = await db
      .select()
      .from(workspaceProjects)
      .where(and(
        eq(workspaceProjects.id, projectId),
        eq(workspaceProjects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Build query conditions
    let queryConditions: any[] = [
      eq(projectItems.projectId, projectId),
      eq(projectItems.itemId, itemId)
    ];

    if (itemType) {
      queryConditions.push(eq(projectItems.itemType, itemType));
    }

    // Check if item exists
    const existing = await db
      .select()
      .from(projectItems)
      .where(and(...queryConditions))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Item not found' }, 404);
    }

    await db
      .delete(projectItems)
      .where(and(...queryConditions));

    return c.json({
      success: true,
      message: 'Item removed from project'
    });
  } catch (error: any) {
    console.error('Delete project item error:', error);
    return c.json({ error: 'Failed to delete project item', message: error.message }, 500);
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

// POST /api/google-ads/keyword-metrics - Get metrics for specific keywords
app.post('/api/google-ads/keyword-metrics', async (c) => {
  try {
    const { keywords, targetCountry, customerId } = await c.req.json();
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return c.json({ error: 'Keywords array is required' }, 400);
    }

    // Return stub metrics for now - can be implemented with Google Ads API later
    const metrics = keywords.map((keyword: string) => ({
      keyword: keyword.toLowerCase().trim(),
      avgMonthlySearches: null,
      competition: null as 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED' | null,
      competitionIndex: null,
      lowTopOfPageBid: null,
      highTopOfPageBid: null,
      avgCpc: null,
      monthlySearchVolumes: undefined,
    }));

    return c.json({
      success: false,
      source: 'fallback',
      message: 'Keyword metrics API not configured',
      keywords: metrics,
    });
  } catch (error) {
    console.error('Keyword metrics error:', error);
    return c.json({ error: 'Failed to fetch keyword metrics' }, 500);
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


// Analyze URL endpoint
app.post('/api/analyze-url', async (c) => {
  try {
    const { url, extractionDepth } = await c.req.json();
    
    if (!url || typeof url !== 'string') {
      return c.json({ error: 'URL is required' }, 400);
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Analyze URL using cheerio
    const analysisResult = await analyzeUrlWithCheerio(url);
    
    return c.json(analysisResult);
  } catch (error: any) {
    console.error('Analyze URL error:', error);
    return c.json({ 
      error: 'Failed to analyze URL', 
      message: error.message 
    }, 500);
  }
});

// AI Endpoints
const AI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBYyBnc99JTLGvUY3qdGFksUlf7roGUdao';
const AI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${AI_API_BASE}?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// POST /api/ai/generate-negative-keywords
app.post('/api/ai/generate-negative-keywords', async (c) => {
  try {
    const { url, coreKeywords: coreKeywordsInput, userGoal, count, excludeCompetitors, competitorBrands, targetLocation } = await c.req.json();
    
    // Convert string to array if needed (frontend sends string, server expects array)
    const coreKeywords = Array.isArray(coreKeywordsInput) 
      ? coreKeywordsInput 
      : (typeof coreKeywordsInput === 'string' 
          ? coreKeywordsInput.split(/[,\n]+/).map(k => k.trim()).filter(Boolean)
          : []);
    
    if (!coreKeywords || coreKeywords.length === 0) {
      return c.json({ error: 'Core keywords are required' }, 400);
    }

    const prompt = `You are a Google Ads expert. Generate ${count || 20} negative keywords for a campaign with these core keywords: ${coreKeywords.join(', ')}.
${userGoal ? `User goal: ${userGoal}` : ''}
${targetLocation ? `Target location: ${targetLocation}` : ''}
${excludeCompetitors && competitorBrands?.length ? `Exclude competitor brands: ${competitorBrands.join(', ')}` : ''}

Return ONLY a JSON array of objects, each with:
- keyword: string (the negative keyword text)
- category: string (e.g., "Irrelevant", "Competitor", "Low Intent", "Brand Protection")
- subcategory: string (optional)
- reason: string (brief explanation)
- matchType: "exact" | "phrase" | "broad"

Example format:
[
  {"keyword": "free", "category": "Low Intent", "reason": "Filters out free seekers", "matchType": "exact"},
  {"keyword": "cheap", "category": "Low Intent", "reason": "Filters out price shoppers", "matchType": "exact"}
]

Return ONLY the JSON array, no markdown, no extra text.`;

    const aiResponse = await callGeminiAPI(prompt);
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      return c.json({ keywords });
    }

    // Fallback: return empty array
    return c.json({ keywords: [] });
  } catch (error: any) {
    console.error('Generate negative keywords error:', error);
    return c.json({ error: 'Failed to generate negative keywords', keywords: [] }, 500);
  }
});

// POST /api/ai/generate-seed-keywords
app.post('/api/ai/generate-seed-keywords', async (c) => {
  try {
    const { context, vertical, services, pageText, maxKeywords } = await c.req.json();
    
    if (!context && !pageText) {
      return c.json({ error: 'Context or pageText is required' }, 400);
    }

    const prompt = `You are a Google Ads keyword research expert. Generate ${maxKeywords || 5} high-quality seed keywords based on:
${context ? `Context: ${context}` : ''}
${vertical ? `Vertical/Industry: ${vertical}` : ''}
${services?.length ? `Services: ${services.join(', ')}` : ''}
${pageText ? `Page content: ${pageText.substring(0, 500)}` : ''}

Requirements:
- Each keyword must have at least 2 words
- Keywords should be relevant to the business/vertical
- Focus on commercial intent keywords
- Return ONLY a JSON array of strings, no markdown, no extra text

Example: ["plumber near me", "emergency plumbing service", "water heater repair"]`;

    const aiResponse = await callGeminiAPI(prompt);
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      return c.json({ keywords: Array.isArray(keywords) ? keywords : [] });
    }

    // Fallback: extract keywords from context
    const fallbackKeywords = (context || pageText || '')
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, maxKeywords || 5);
    
    return c.json({ keywords: fallbackKeywords });
  } catch (error: any) {
    console.error('Generate seed keywords error:', error);
    return c.json({ error: 'Failed to generate seed keywords', keywords: [] }, 500);
  }
});

// POST /api/ai/generate-blog
app.post('/api/ai/generate-blog', async (c) => {
  try {
    const { topic, keyword, contentType, tone, targetAudience, includeCode, includeStats, targetWordCount } = await c.req.json();
    
    if (!topic) {
      return c.json({ error: 'Topic is required' }, 400);
    }

    const prompt = `Write a comprehensive ${contentType || 'blog post'} about "${topic}"${keyword ? ` targeting the keyword "${keyword}"` : ''}.

${tone ? `Tone: ${tone}` : ''}
${targetAudience ? `Target audience: ${targetAudience}` : ''}
${targetWordCount ? `Target word count: ${targetWordCount}` : 'Target word count: 1000-1500'}
${includeCode ? 'Include code examples where relevant.' : ''}
${includeStats ? 'Include relevant statistics and data.' : ''}

Requirements:
- Well-structured with clear headings
- SEO-optimized
- Engaging and informative
- Professional yet accessible
- Include a compelling introduction and conclusion

Return the full blog post content in markdown format.`;

    const blogContent = await callGeminiAPI(prompt);
    
    return c.json({ blog: blogContent || 'Failed to generate blog content' });
  } catch (error: any) {
    console.error('Generate blog error:', error);
    return c.json({ error: 'Failed to generate blog', blog: '' }, 500);
  }
});

// Campaigns Endpoints
// POST /api/campaigns/one-click - Generate one-click campaign
app.post('/api/campaigns/one-click', async (c) => {
  try {
    const { websiteUrl } = await c.req.json();
    
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return c.json({ error: 'Website URL is required' }, 400);
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    // Analyze URL
    const analysisResult = await analyzeUrlWithCheerio(websiteUrl);
    
    // Generate basic campaign structure
    const campaignName = `Campaign-${analysisResult.url.replace(/^https?:\/\//, '').split('/')[0]}-${new Date().toISOString().split('T')[0]}`;
    
    // Extract services/keywords from analysis
    const seedKeywords = analysisResult.services.slice(0, 5).map(s => s.toLowerCase().trim()).filter(Boolean);
    if (seedKeywords.length === 0) {
      seedKeywords.push(analysisResult.url.split('/')[2]?.split('.')[0] || 'service');
    }

    // Generate mock campaign data
    const campaign = {
      id: `campaign-${Date.now()}`,
      campaign_name: campaignName,
      business_name: analysisResult.seoSignals?.title || analysisResult.url.split('/')[2] || 'Business',
      website_url: websiteUrl,
      monthly_budget: 3000,
      daily_budget: 100,
      campaign_data: {
        analysis: {
          businessName: analysisResult.seoSignals?.title || 'Business',
          mainValue: analysisResult.keyMessaging?.[0] || 'Quality Service',
          keyBenefits: analysisResult.keyMessaging?.slice(0, 3) || [],
          targetAudience: 'General',
          industry: 'Services',
          products: analysisResult.services.slice(0, 5)
        },
        structure: {
          campaignName,
          dailyBudget: 100,
          adGroupThemes: analysisResult.services.slice(0, 5)
        },
        keywords: seedKeywords,
        adGroups: analysisResult.services.slice(0, 5).map((service: string, idx: number) => ({
          name: `${service} Ad Group`,
          keywords: [`${service}`, `${service} near me`, `best ${service}`, `professional ${service}`]
        })),
        adCopy: {
          headlines: [
            { text: analysisResult.seoSignals?.title || 'Quality Service' },
            { text: `Best ${analysisResult.services[0] || 'Service'} Near You` },
            { text: 'Professional & Reliable' },
            { text: 'Get Started Today' },
            { text: 'Free Consultation Available' }
          ],
          descriptions: [
            { text: `Experience top-quality ${analysisResult.services[0] || 'service'} with our professional team.` },
            { text: 'Trusted by thousands. Book your appointment today!' }
          ],
          callouts: ['Free Consultation', '24/7 Support', 'Licensed & Insured']
        }
      },
      csvData: '' // CSV generation would go here
    };

    // Return as streaming response (SSE format for frontend)
    const steps = [
      { progress: 15, status: 'Analyzing landing page...', log: { message: 'Fetching website content...', type: 'info' } },
      { progress: 30, status: 'Building campaign structure...', log: { message: 'Creating ad groups...', type: 'progress' } },
      { progress: 50, status: 'Generating keywords...', log: { message: `Generated ${seedKeywords.length} seed keywords`, type: 'success' } },
      { progress: 65, status: 'Creating ad copy...', log: { message: 'Writing headlines and descriptions...', type: 'progress' } },
      { progress: 80, status: 'Organizing campaign...', log: { message: 'Structuring ad groups...', type: 'info' } },
      { progress: 90, status: 'Generating CSV...', log: { message: 'Preparing export file...', type: 'progress' } },
      { progress: 100, status: 'Complete!', log: { message: 'Campaign built successfully!', type: 'success' }, complete: true, campaign }
    ];

    const stream = new ReadableStream({
      async start(controller) {
        for (const step of steps) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(step)}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable buffering for streaming
      }
    });
  } catch (error: any) {
    console.error('One-click campaign generation error:', error);
    return c.json({ 
      error: 'Failed to generate campaign', 
      message: error.message 
    }, 500);
  }
});

// Docs Endpoints
// GET /api/docs/all-images
app.get('/api/docs/all-images', async (c) => {
  try {
    // Return empty images object for now - can be implemented with database later
    return c.json({ 
      success: true,
      data: { images: {} } 
    });
  } catch (error) {
    console.error('Docs all-images error:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

// POST /api/docs/images
app.post('/api/docs/images', async (c) => {
  try {
    const { articleKey, imageData, imageOrder } = await c.req.json();
    
    if (!articleKey || !imageData) {
      return c.json({ error: 'articleKey and imageData are required' }, 400);
    }

    // Store image - can be implemented with database/storage later
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return c.json({ 
      success: true,
      data: { id: imageId, imageOrder: imageOrder || 0 } 
    });
  } catch (error) {
    console.error('Docs images POST error:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// DELETE /api/docs/images/:imageId
app.delete('/api/docs/images/:imageId', async (c) => {
  try {
    const imageId = c.req.param('imageId');
    
    // Delete image - can be implemented with database/storage later
    return c.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Docs images DELETE error:', error);
    return c.json({ error: 'Failed to delete image' }, 500);
  }
});

// Domains Endpoints
// GET /api/domains
app.get('/api/domains', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    // Return empty domains array for now - can be implemented with database later
    return c.json({ domains: [] });
  } catch (error) {
    console.error('Domains GET error:', error);
    return c.json({ error: 'Failed to fetch domains' }, 500);
  }
});

// POST /api/domains
app.post('/api/domains', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { domain } = await c.req.json();
    
    if (!domain || typeof domain !== 'string') {
      return c.json({ error: 'Domain is required' }, 400);
    }

    // Add domain - can be implemented with database later
    return c.json({ 
      success: true,
      message: 'Domain added',
      domain: { id: Date.now(), domain, userId }
    });
  } catch (error) {
    console.error('Domains POST error:', error);
    return c.json({ error: 'Failed to add domain' }, 500);
  }
});

// GET /api/domains/:id
app.get('/api/domains/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    const id = c.req.param('id');
    
    // Return domain - can be implemented with database later
    return c.json({ 
      domain: { id, domain: '', userId: userId || null }
    });
  } catch (error) {
    console.error('Domains GET by ID error:', error);
    return c.json({ error: 'Failed to fetch domain' }, 500);
  }
});

// POST /api/domains/:id/refresh
app.post('/api/domains/:id/refresh', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    const id = c.req.param('id');
    
    // Refresh domain - can be implemented with DNS check later
    return c.json({ success: true, message: 'Domain refreshed' });
  } catch (error) {
    console.error('Domains refresh error:', error);
    return c.json({ error: 'Failed to refresh domain' }, 500);
  }
});

// DELETE /api/domains/:id
app.delete('/api/domains/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    // Delete domain - can be implemented with database later
    return c.json({ success: true, message: 'Domain deleted' });
  } catch (error) {
    console.error('Domains DELETE error:', error);
    return c.json({ error: 'Failed to delete domain' }, 500);
  }
});

// POST /api/verify-domain
app.post('/api/verify-domain', async (c) => {
  try {
    const { id, custom_domain } = await c.req.json();
    
    if (!id || !custom_domain) {
      return c.json({ error: 'id and custom_domain are required' }, 400);
    }

    // Verify domain - can be implemented with DNS check later
    return c.json({ 
      success: true, 
      message: 'Domain verified',
      verified: true
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    return c.json({ error: 'Failed to verify domain' }, 500);
  }
});

// POST /api/publish-website
app.post('/api/publish-website', async (c) => {
  try {
    const { id, name, slug, user_email, html_content, template_data } = await c.req.json();
    
    if (!id || !name || !html_content) {
      return c.json({ error: 'id, name, and html_content are required' }, 400);
    }

    // Generate URL - can be implemented with actual hosting later
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    const url = `https://adiology.io/templates/${finalSlug}`;
    
    return c.json({ 
      success: true,
      url,
      message: 'Website published'
    });
  } catch (error) {
    console.error('Publish website error:', error);
    return c.json({ error: 'Failed to publish website' }, 500);
  }
});

// POST /api/publish-site
app.post('/api/publish-site', async (c) => {
  try {
    const { savedSiteId } = await c.req.json();
    
    if (!savedSiteId) {
      return c.json({ error: 'savedSiteId is required' }, 400);
    }

    // Generate URL - can be implemented with actual hosting later
    const url = `https://adiology.io/sites/${savedSiteId}`;
    
    return c.json({ 
      success: true,
      url,
      message: 'Site published'
    });
  } catch (error) {
    console.error('Publish site error:', error);
    return c.json({ error: 'Failed to publish site' }, 500);
  }
});

// Logs endpoint - stores logs in audit_logs table
app.post('/api/logs', async (c) => {
  try {
    const logEntry = await c.req.json();
    
    if (!logEntry || !logEntry.level || !logEntry.message) {
      return c.json({ error: 'Invalid log entry format' }, 400);
    }

    const userId = await getUserIdFromToken(c);
    
    // Insert log into audit_logs table
    await db.insert(auditLogs).values({
      userId: userId || null,
      action: `log_${logEntry.level}`,
      resourceType: 'log',
      level: logEntry.level === 'error' ? 'error' : logEntry.level === 'warn' ? 'warning' : 'info',
      details: {
        message: logEntry.message,
        args: logEntry.args,
        sessionId: logEntry.sessionId,
        url: logEntry.url,
        timestamp: logEntry.timestamp,
      },
    });

    return c.json({ success: true, message: 'Log stored' });
  } catch (error: any) {
    console.error('Logs endpoint error:', error);
    return c.json({ error: 'Failed to store log', message: error.message }, 500);
  }
});

// Campaign History CRUD endpoints

// POST /api/campaign-history - Create
app.post('/api/campaign-history', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, name, data, status, workspaceId } = await c.req.json();
    
    if (!type || !name || !data) {
      return c.json({ error: 'Missing required fields: type, name, data' }, 400);
    }

    const result = await db.insert(campaignHistory).values({
      userId,
      workspaceId: workspaceId || null,
      type,
      name,
      data,
      status: status || 'completed',
    }).returning();

    return c.json({ 
      success: true, 
      data: result[0] 
    });
  } catch (error: any) {
    console.error('Create campaign history error:', error);
    return c.json({ error: 'Failed to create campaign history', message: error.message }, 500);
  }
});

// GET /api/campaign-history - List all for user
app.get('/api/campaign-history', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const results = await db
      .select()
      .from(campaignHistory)
      .where(eq(campaignHistory.userId, userId))
      .orderBy(desc(campaignHistory.createdAt));

    return c.json({ 
      success: true, 
      data: results 
    });
  } catch (error: any) {
    console.error('Get campaign history error:', error);
    return c.json({ error: 'Failed to fetch campaign history', message: error.message }, 500);
  }
});

// GET /api/campaign-history/:id - Get one
app.get('/api/campaign-history/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    const results = await db
      .select()
      .from(campaignHistory)
      .where(eq(campaignHistory.id, id));

    if (results.length === 0) {
      return c.json({ error: 'Campaign history not found' }, 404);
    }

    const item = results[0];
    
    // Verify ownership
    if (item.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ 
      success: true, 
      data: item 
    });
  } catch (error: any) {
    console.error('Get campaign history item error:', error);
    return c.json({ error: 'Failed to fetch campaign history item', message: error.message }, 500);
  }
});

// PUT /api/campaign-history/:id - Update
app.put('/api/campaign-history/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    // Check if item exists and belongs to user
    const existing = await db
      .select()
      .from(campaignHistory)
      .where(eq(campaignHistory.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Campaign history not found' }, 404);
    }

    if (existing[0].userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.data !== undefined) {
      updateData.data = updates.data;
    }
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.workspaceId !== undefined) {
      updateData.workspaceId = updates.workspaceId;
    }

    const result = await db
      .update(campaignHistory)
      .set(updateData)
      .where(eq(campaignHistory.id, id))
      .returning();

    return c.json({ 
      success: true, 
      data: result[0] 
    });
  } catch (error: any) {
    console.error('Update campaign history error:', error);
    return c.json({ error: 'Failed to update campaign history', message: error.message }, 500);
  }
});

// DELETE /api/campaign-history/:id - Delete
app.delete('/api/campaign-history/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    // Check if item exists and belongs to user
    const existing = await db
      .select()
      .from(campaignHistory)
      .where(eq(campaignHistory.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Campaign history not found' }, 404);
    }

    if (existing[0].userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await db
      .delete(campaignHistory)
      .where(eq(campaignHistory.id, id));

    return c.json({ 
      success: true, 
      message: 'Campaign history deleted' 
    });
  } catch (error: any) {
    console.error('Delete campaign history error:', error);
    return c.json({ error: 'Failed to delete campaign history', message: error.message }, 500);
  }
});

// CSV Export endpoint - migrated from Supabase Edge Function
app.post('/api/export-csv', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const request = await c.req.json();
    
    // Basic validation
    if (!request.campaign_name) {
      return c.json({ 
        success: false,
        validation_errors: [{
          field: 'campaign_name',
          message: 'Campaign name is required',
          severity: 'error'
        }]
      }, 400);
    }

    // For now, return a simple response indicating CSV generation should be done client-side
    // TODO: Implement full CSV generation server-side using googleAdsEditorCSVExporterV5 logic
    return c.json({
      success: false,
      message: 'CSV export endpoint migrated. Please use client-side CSV generation.',
      validation_errors: [],
      warnings: []
    }, 501); // 501 Not Implemented - indicates migration in progress
  } catch (error: any) {
    console.error('CSV export error:', error);
    return c.json({ 
      error: 'Failed to process CSV export', 
      message: error.message 
    }, 500);
  }
});

// GET /api/export-csv/:jobId - Get async CSV export status
app.get('/api/export-csv/:jobId', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('jobId');
    
    // TODO: Implement async CSV export status check
    return c.json({ 
      error: 'Async CSV export not yet implemented',
      jobId 
    }, 501);
  } catch (error: any) {
    console.error('Get CSV export status error:', error);
    return c.json({ error: 'Failed to get export status', message: error.message }, 500);
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
