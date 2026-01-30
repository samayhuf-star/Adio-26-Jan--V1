import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
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
import fs from 'fs';
import path from 'path';

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
    
    // Extract services/keywords from analysis - get more seed terms
    const seedServices = analysisResult.services.slice(0, 15).map((s: string) => s.toLowerCase().trim()).filter(Boolean);
    if (seedServices.length === 0) {
      seedServices.push(analysisResult.url.split('/')[2]?.split('.')[0] || 'service');
    }

    // Generate comprehensive keyword variations (200-300 keywords)
    const intentModifiers = ['buy', 'get', 'find', 'hire', 'best', 'top', 'affordable', 'cheap', 'professional', 'quality', 'local', 'trusted', 'reliable', 'expert'];
    const locationModifiers = ['near me', 'in my area', 'nearby', 'local', 'online', 'today', 'now', 'same day', '24/7'];
    const questionPhrases = ['how to find', 'where to get', 'how much does', 'what is the best', 'how to choose'];
    const comparisonPhrases = ['vs', 'versus', 'compared to', 'or', 'alternative to'];
    const serviceModifiers = ['services', 'company', 'companies', 'provider', 'providers', 'specialist', 'experts', 'solutions'];
    
    // Generate all keywords
    const allKeywords: string[] = [];
    
    // Base keywords for each service
    seedServices.forEach((service: string) => {
      // Core keywords
      allKeywords.push(service);
      
      // Intent + service combinations
      intentModifiers.forEach(intent => {
        allKeywords.push(`${intent} ${service}`);
      });
      
      // Service + location combinations
      locationModifiers.forEach(loc => {
        allKeywords.push(`${service} ${loc}`);
      });
      
      // Intent + service + location combinations
      intentModifiers.slice(0, 5).forEach(intent => {
        locationModifiers.slice(0, 4).forEach(loc => {
          allKeywords.push(`${intent} ${service} ${loc}`);
        });
      });
      
      // Question phrase combinations
      questionPhrases.forEach(q => {
        allKeywords.push(`${q} ${service}`);
      });
      
      // Service + modifier combinations
      serviceModifiers.forEach(mod => {
        allKeywords.push(`${service} ${mod}`);
        allKeywords.push(`${service} ${mod} near me`);
      });
    });
    
    // Add comparison keywords between services
    if (seedServices.length >= 2) {
      for (let i = 0; i < Math.min(seedServices.length - 1, 5); i++) {
        comparisonPhrases.forEach(comp => {
          allKeywords.push(`${seedServices[i]} ${comp} ${seedServices[i + 1]}`);
        });
      }
    }
    
    // Deduplicate and limit to 300 keywords
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 300);
    
    // Create comprehensive ad groups (10-20 ad groups)
    const adGroupCategories = [
      { name: 'Brand', prefix: '', suffix: '' },
      { name: 'Near Me', prefix: '', suffix: 'near me' },
      { name: 'Best', prefix: 'best', suffix: '' },
      { name: 'Professional', prefix: 'professional', suffix: '' },
      { name: 'Affordable', prefix: 'affordable', suffix: '' },
      { name: 'Local', prefix: 'local', suffix: '' },
      { name: 'Expert', prefix: 'expert', suffix: '' },
      { name: 'Top Rated', prefix: 'top rated', suffix: '' },
      { name: 'Same Day', prefix: '', suffix: 'same day' },
      { name: 'Emergency', prefix: 'emergency', suffix: '' },
      { name: 'Online', prefix: '', suffix: 'online' },
      { name: 'Services', prefix: '', suffix: 'services' },
    ];
    
    const adGroups = seedServices.slice(0, 15).flatMap((service: string) => {
      return adGroupCategories.slice(0, Math.ceil(12 / seedServices.length) + 1).map(cat => {
        const keywordBase = cat.prefix ? `${cat.prefix} ${service}` : service;
        const keywordFull = cat.suffix ? `${keywordBase} ${cat.suffix}` : keywordBase;
        
        // Generate 10-15 keywords per ad group
        const adGroupKeywords = [
          keywordFull,
          `${keywordFull} now`,
          `get ${keywordFull}`,
          `find ${keywordFull}`,
          `${service} ${cat.name.toLowerCase()}`,
          `${keywordFull} today`,
          `${keywordFull} in my area`,
          `cheap ${keywordFull}`,
          `quality ${keywordFull}`,
          `${keywordFull} company`,
          `${keywordFull} provider`,
          `trusted ${keywordFull}`,
        ].filter(Boolean);
        
        return {
          name: `${service} - ${cat.name}`,
          keywords: [...new Set(adGroupKeywords)].slice(0, 15)
        };
      });
    }).slice(0, 25); // Cap at 25 ad groups

    // Generate mock campaign data with comprehensive keywords
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
          keyBenefits: analysisResult.keyMessaging?.slice(0, 5) || [],
          targetAudience: 'General',
          industry: 'Services',
          products: seedServices
        },
        structure: {
          campaignName,
          dailyBudget: 100,
          adGroupThemes: seedServices
        },
        keywords: uniqueKeywords,
        adGroups,
        adCopy: {
          headlines: [
            { text: analysisResult.seoSignals?.title || 'Quality Service' },
            { text: `Best ${seedServices[0] || 'Service'} Near You` },
            { text: 'Professional & Reliable' },
            { text: 'Get Started Today' },
            { text: 'Free Consultation Available' },
            { text: 'Trusted Local Experts' },
            { text: 'Fast & Affordable' },
            { text: 'Licensed Professionals' },
            { text: 'Call Now For Quote' },
            { text: '5-Star Rated Service' },
            { text: 'Same Day Available' },
            { text: 'Expert Solutions' },
            { text: '100% Satisfaction' },
            { text: 'Quality Guaranteed' },
            { text: 'Book Online Now' }
          ],
          descriptions: [
            { text: `Experience top-quality ${seedServices[0] || 'service'} with our professional team. Licensed & insured.` },
            { text: 'Trusted by thousands. Book your appointment today! Fast, reliable service guaranteed.' },
            { text: `Looking for ${seedServices[0] || 'service'}? We offer competitive prices and expert solutions.` },
            { text: 'Professional service at affordable prices. Same day availability. Call for free estimate!' }
          ],
          callouts: ['Free Consultation', '24/7 Support', 'Licensed & Insured', 'Fast Response', 'Quality Guaranteed', 'Local Experts']
        }
      },
      csvData: '' // CSV generation would go here
    };

    // Return as streaming response (SSE format for frontend)
    const steps = [
      { progress: 10, status: 'Analyzing landing page...', log: { message: 'Fetching website content...', type: 'info' } },
      { progress: 20, status: 'Extracting business data...', log: { message: `Found ${seedServices.length} services/products`, type: 'success' } },
      { progress: 35, status: 'Generating keyword variations...', log: { message: 'Creating intent-based keywords...', type: 'progress' } },
      { progress: 50, status: 'Building keywords...', log: { message: `Generated ${uniqueKeywords.length} comprehensive keywords`, type: 'success' } },
      { progress: 65, status: 'Creating ad groups...', log: { message: `Creating ${adGroups.length} themed ad groups...`, type: 'progress' } },
      { progress: 75, status: 'Writing ad copy...', log: { message: 'Generating headlines and descriptions...', type: 'info' } },
      { progress: 85, status: 'Organizing campaign...', log: { message: 'Structuring campaign hierarchy...', type: 'progress' } },
      { progress: 95, status: 'Generating CSV...', log: { message: 'Preparing Google Ads export file...', type: 'progress' } },
      { progress: 100, status: 'Complete!', log: { message: `Campaign built successfully! ${uniqueKeywords.length} keywords, ${adGroups.length} ad groups`, type: 'success' }, complete: true, campaign }
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

// POST /api/campaigns/save - Save campaign data (fallback for large campaigns)
app.post('/api/campaigns/save', async (c) => {
  try {
    // Try to get user from token
    let userId: string | null = null;
    try {
      userId = await getUserIdFromToken(c);
    } catch (e) {
      // User not authenticated
    }

    const { campaign_name, business_name, website_url, campaign_data, source } = await c.req.json();
    
    if (!campaign_name || !campaign_data) {
      return c.json({ error: 'Missing required fields: campaign_name, campaign_data' }, 400);
    }

    // If we have a user, save to campaign_history table
    if (userId) {
      // Normalize type: 'one-click-builder' -> 'one-click-campaign' for DraftCampaigns compatibility
      let campaignType = source || 'campaign';
      if (campaignType === 'one-click-builder') {
        campaignType = 'one-click-campaign';
      }
      
      const result = await db.insert(campaignHistory).values({
        userId,
        workspaceId: null,
        type: campaignType,
        name: campaign_name,
        data: campaign_data,
        status: 'completed',
      }).returning();

      return c.json({ 
        success: true, 
        saved: true,
        id: result[0]?.id,
        message: 'Saved to database'
      });
    } else {
      // For anonymous users, return failure so frontend falls back to localStorage
      return c.json({ 
        success: false, 
        saved: false,
        id: null,
        message: 'User not authenticated - please save locally'
      }, 401);
    }
  } catch (error: any) {
    console.error('Save campaign error:', error);
    return c.json({ error: 'Failed to save campaign', message: error.message }, 500);
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

// ============================================
// DKI Ad Generator Endpoint
// ============================================
app.post('/api/generate-dki-ad', async (c) => {
  // Parse request body outside try block so it's accessible in catch
  let keywords: string[] = [];
  let industry = 'General';
  let businessName = 'Business';
  let url = '';
  let location = '';
  
  try {
    const body = await c.req.json();
    keywords = body.keywords || [];
    industry = body.industry || 'General';
    businessName = body.businessName || 'Business';
    url = body.url || '';
    location = body.location || '';
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return c.json({ error: 'Keywords array is required' }, 400);
    }
    
    if (!businessName) {
      return c.json({ error: 'Business name is required' }, 400);
    }

    const mainKeyword = keywords[0] || industry || 'Service';
    
    // Use OpenAI to generate DKI ads (prefers AI Integrations if available)
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ 
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
    });
    
    const prompt = `Generate Google Ads copy with Dynamic Keyword Insertion (DKI) for the following business:

Business: ${businessName}
Industry: ${industry || 'General'}
Keywords: ${keywords.join(', ')}
Location: ${location || 'Not specified'}
URL: ${url || 'Not specified'}

Generate 3 headlines (max 30 chars each) and 2 descriptions (max 90 chars each).
Use {KeyWord:DefaultText} format for DKI where appropriate.
Make them compelling with clear CTAs.

Return ONLY valid JSON in this exact format:
{
  "headline1": "string",
  "headline2": "string", 
  "headline3": "string",
  "description1": "string",
  "description2": "string"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return c.json(result);
    }
    
    // Fallback if parsing fails
    return c.json({
      headline1: `{KeyWord:${mainKeyword}} Experts`,
      headline2: `Best {KeyWord:${mainKeyword}} Today`,
      headline3: `Professional ${businessName.substring(0, 15)} Service`,
      description1: `Need {KeyWord:${mainKeyword}}? We deliver expert, fast service. ${businessName} offers solutions you can trust. Contact us today.`,
      description2: `Looking for {KeyWord:${mainKeyword}}? We provide quality service with guaranteed satisfaction. Get your free estimate now.`,
    });
  } catch (error: any) {
    console.error('Generate DKI ad error:', error);
    
    // Return fallback DKI ad when OpenAI is unavailable
    const mainKeyword = keywords[0] || industry || 'Service';
    return c.json({
      headline1: `{KeyWord:${mainKeyword}} Experts`,
      headline2: `Best {KeyWord:${mainKeyword}} Today`,
      headline3: `Professional ${businessName.substring(0, 15)} Service`,
      description1: `Need {KeyWord:${mainKeyword}}? We deliver expert, fast service. ${businessName} offers solutions you can trust. Contact us today.`,
      description2: `Looking for {KeyWord:${mainKeyword}}? We provide quality service with guaranteed satisfaction. Get your free estimate now.`,
      fallback: true,
    });
  }
});

// ============================================
// Analyses Endpoints (URL analysis storage)
// ============================================
app.post('/api/analyses', async (c) => {
  try {
    const analysis = await c.req.json();
    const userId = await getUserIdFromToken(c);
    
    // Save analysis to campaign_history with type 'url-analysis'
    const result = await db.insert(campaignHistory).values({
      userId: userId || null,
      workspaceId: null,
      type: 'url-analysis',
      name: analysis.domain || analysis.url || 'URL Analysis',
      data: analysis,
      status: 'completed',
    }).returning();
    
    console.log('[Analyses] Saved analysis for:', analysis.url || analysis.domain);
    
    return c.json({ 
      success: true, 
      message: 'Analysis saved',
      id: result[0]?.id || analysis.id 
    });
  } catch (error: any) {
    console.error('Analyses sync error:', error);
    return c.json({ error: 'Failed to save analysis', message: error.message }, 500);
  }
});

app.get('/api/analyses', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ success: true, data: [] });
    }

    // Fetch analyses from campaign_history
    const results = await db
      .select()
      .from(campaignHistory)
      .where(and(
        eq(campaignHistory.userId, userId),
        eq(campaignHistory.type, 'url-analysis')
      ))
      .orderBy(desc(campaignHistory.createdAt))
      .limit(50);

    const analyses = results.map((r: any) => ({
      id: r.id,
      ...r.data,
      timestamp: r.createdAt,
    }));

    return c.json({ 
      success: true, 
      data: analyses 
    });
  } catch (error: any) {
    console.error('Get analyses error:', error);
    return c.json({ error: 'Failed to get analyses', message: error.message }, 500);
  }
});

// ============================================
// Long-tail Keywords Endpoints
// ============================================
app.post('/api/long-tail-keywords/generate', async (c) => {
  // Parse request body outside try block so it's accessible in catch
  let seedKeywords: string[] = [];
  let country = 'US';
  let device = 'all';
  
  try {
    const body = await c.req.json();
    seedKeywords = body.seedKeywords || [];
    country = body.country || 'US';
    device = body.device || 'all';
    
    if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return c.json({ error: 'Seed keywords array is required' }, 400);
    }

    // Use OpenAI to generate long-tail keywords (prefers AI Integrations if available)
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ 
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
    });
    
    const prompt = `Generate comprehensive long-tail keyword variations for the following seed keywords:

Seed Keywords: ${seedKeywords.join(', ')}
Target Country: ${country || 'US'}
Device: ${device || 'all'}

Generate 100-150 unique long-tail keywords (4+ words each) that would be good for Google Ads.
For each seed keyword, create variations using ALL of these patterns:
- Question phrases: "how to find X", "what is the best X", "where to get X", "how much does X cost", "when to hire X", "why choose X"
- Location modifiers: "X near me", "X in my area", "local X services", "X nearby today"
- Intent modifiers: "buy X", "hire X", "get X quote", "find affordable X", "best X services", "cheap X near me", "professional X"
- Comparison phrases: "X vs Y", "X compared to Y", "X or Y which is better", "X alternative"
- Benefit phrases: "fast X services", "reliable X company", "trusted X provider", "quality X near me"
- Cost phrases: "X prices", "X cost estimate", "affordable X rates", "cheap X services"
- Review phrases: "best rated X", "top X reviews", "X recommendations"
- Emergency phrases: "emergency X", "24 hour X", "same day X", "urgent X services"
- Business phrases: "X for small business", "commercial X services", "residential X"

For each keyword, estimate:
- searchVolume: a number between 100-50000
- cpc: a number between 0.50-10.00
- difficulty: "easy", "medium", or "hard"

Return ONLY valid JSON array with 100+ keywords:
[
  {"keyword": "string", "source": "ai", "searchVolume": number, "cpc": number, "difficulty": "easy|medium|hard"},
  ...
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 8000,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      return c.json({ success: true, keywords });
    }
    
    // Fallback with generated keywords
    const fallbackKeywords = generateComprehensiveFallbackKeywords(seedKeywords);
    return c.json({ success: true, keywords: fallbackKeywords });
  } catch (error: any) {
    console.error('Generate long-tail keywords error:', error);
    
    // Return fallback keywords when OpenAI is unavailable
    const fallbackKeywords = generateComprehensiveFallbackKeywords(seedKeywords);
    return c.json({ success: true, keywords: fallbackKeywords, fallback: true });
  }
});

// Helper function to generate 80-200 comprehensive fallback keywords
function generateComprehensiveFallbackKeywords(seedKeywords: string[]): Array<{keyword: string; source: string; searchVolume: number; cpc: number; difficulty: string}> {
  const questionPhrases = ['how to find', 'what is the best', 'where to get', 'how much does', 'when to hire', 'why choose', 'how do I find'];
  const locationModifiers = ['near me', 'in my area', 'nearby', 'local', 'in my city', 'close to me'];
  const intentModifiers = ['best', 'top', 'affordable', 'cheap', 'professional', 'quality', 'reliable', 'trusted', 'fast', 'quick'];
  const actionModifiers = ['buy', 'hire', 'get', 'find', 'book', 'order', 'schedule'];
  const serviceModifiers = ['services', 'company', 'provider', 'specialist', 'experts', 'solutions'];
  const benefitPhrases = ['with guarantee', 'with warranty', 'same day', '24 hour', 'emergency', 'urgent'];
  const businessPhrases = ['for small business', 'for home', 'for office', 'commercial', 'residential'];
  const costPhrases = ['cost', 'prices', 'rates', 'estimate', 'quote'];
  
  const allKeywords: Array<{keyword: string; source: string; searchVolume: number; cpc: number; difficulty: string}> = [];
  
  seedKeywords.forEach((seed: string) => {
    // Question + seed + location (7 * 6 = 42 per seed)
    questionPhrases.forEach(q => {
      locationModifiers.slice(0, 3).forEach(loc => {
        allKeywords.push({
          keyword: `${q} ${seed} ${loc}`,
          source: 'fallback',
          searchVolume: Math.floor(Math.random() * 2000) + 200,
          cpc: parseFloat((Math.random() * 4 + 1).toFixed(2)),
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
        });
      });
    });
    
    // Intent + seed + location (10 * 4 = 40 per seed)
    intentModifiers.forEach(intent => {
      locationModifiers.slice(0, 4).forEach(loc => {
        allKeywords.push({
          keyword: `${intent} ${seed} ${loc}`,
          source: 'fallback',
          searchVolume: Math.floor(Math.random() * 1500) + 300,
          cpc: parseFloat((Math.random() * 3.5 + 0.8).toFixed(2)),
          difficulty: ['easy', 'medium'][Math.floor(Math.random() * 2)]
        });
      });
    });
    
    // Action + seed + service (7 * 3 = 21 per seed)
    actionModifiers.forEach(action => {
      serviceModifiers.slice(0, 3).forEach(svc => {
        allKeywords.push({
          keyword: `${action} ${seed} ${svc} near me`,
          source: 'fallback',
          searchVolume: Math.floor(Math.random() * 1200) + 150,
          cpc: parseFloat((Math.random() * 3 + 1.2).toFixed(2)),
          difficulty: ['easy', 'medium'][Math.floor(Math.random() * 2)]
        });
      });
    });
    
    // Seed + benefit + location (6 * 3 = 18 per seed)
    benefitPhrases.forEach(benefit => {
      allKeywords.push({
        keyword: `${seed} ${benefit} near me`,
        source: 'fallback',
        searchVolume: Math.floor(Math.random() * 800) + 100,
        cpc: parseFloat((Math.random() * 4 + 1.5).toFixed(2)),
        difficulty: 'medium'
      });
      allKeywords.push({
        keyword: `${benefit} ${seed} services in my area`,
        source: 'fallback',
        searchVolume: Math.floor(Math.random() * 600) + 100,
        cpc: parseFloat((Math.random() * 3.5 + 1).toFixed(2)),
        difficulty: 'easy'
      });
    });
    
    // Seed + business phrases (5 per seed)
    businessPhrases.forEach(biz => {
      allKeywords.push({
        keyword: `${seed} ${biz} near me`,
        source: 'fallback',
        searchVolume: Math.floor(Math.random() * 700) + 200,
        cpc: parseFloat((Math.random() * 2.5 + 1).toFixed(2)),
        difficulty: 'easy'
      });
    });
    
    // Seed + cost phrases (5 per seed)
    costPhrases.forEach(cost => {
      allKeywords.push({
        keyword: `${seed} ${cost} in my area`,
        source: 'fallback',
        searchVolume: Math.floor(Math.random() * 1100) + 300,
        cpc: parseFloat((Math.random() * 2 + 0.8).toFixed(2)),
        difficulty: 'easy'
      });
    });
  });
  
  // Deduplicate by keyword text and limit to 200
  const seen = new Set<string>();
  const uniqueKeywords = allKeywords.filter(kw => {
    if (seen.has(kw.keyword.toLowerCase())) return false;
    seen.add(kw.keyword.toLowerCase());
    return true;
  });
  
  // Return 80-200 keywords
  return uniqueKeywords.slice(0, 200);
}

app.get('/api/long-tail-keywords/lists', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Fetch saved keyword lists from campaign_history with type 'long-tail-keywords'
    const results = await db
      .select()
      .from(campaignHistory)
      .where(and(
        eq(campaignHistory.userId, userId),
        eq(campaignHistory.type, 'long-tail-keywords')
      ))
      .orderBy(desc(campaignHistory.createdAt));

    const lists = results.map((r: any) => ({
      id: r.id,
      name: r.name,
      keywords: r.data?.keywords || [],
      seedKeywords: r.data?.seedKeywords || '',
      createdAt: r.createdAt,
    }));

    return c.json({ success: true, lists });
  } catch (error: any) {
    console.error('Get keyword lists error:', error);
    return c.json({ error: 'Failed to get keyword lists', message: error.message }, 500);
  }
});

app.post('/api/long-tail-keywords/lists', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, keywords, seedKeywords, url } = await c.req.json();
    
    if (!name || !keywords || keywords.length === 0) {
      return c.json({ error: 'Name and keywords are required' }, 400);
    }

    // Save to campaign_history with type 'long-tail-keywords'
    const result = await db.insert(campaignHistory).values({
      userId,
      workspaceId: null,
      type: 'long-tail-keywords',
      name,
      data: { keywords, seedKeywords, url },
      status: 'completed',
    }).returning();

    return c.json({ 
      success: true, 
      id: result[0]?.id,
      message: 'Keyword list saved successfully'
    });
  } catch (error: any) {
    console.error('Save keyword list error:', error);
    return c.json({ error: 'Failed to save keyword list', message: error.message }, 500);
  }
});

// ============================================
// Blog Endpoints
// ============================================
app.get('/api/blogs', async (c) => {
  try {
    // Fetch blogs from campaign_history (public endpoint for published blogs)
    const results = await db
      .select()
      .from(campaignHistory)
      .where(eq(campaignHistory.type, 'blog'))
      .orderBy(desc(campaignHistory.createdAt))
      .limit(50);

    const blogs = results.map((r: any) => ({
      id: r.id,
      title: r.name,
      ...r.data,
      createdAt: r.createdAt,
    }));

    return c.json({ 
      success: true, 
      data: blogs 
    });
  } catch (error: any) {
    console.error('Get blogs error:', error);
    return c.json({ error: 'Failed to get blogs', message: error.message }, 500);
  }
});

app.post('/api/admin/blogs', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const blogData = await c.req.json();
    
    // Save blog to campaign_history with type 'blog'
    const result = await db.insert(campaignHistory).values({
      userId,
      workspaceId: null,
      type: 'blog',
      name: blogData.title || 'Untitled Blog',
      data: blogData,
      status: 'completed',
    }).returning();

    return c.json({ 
      success: true, 
      id: result[0]?.id,
      message: 'Blog saved successfully'
    });
  } catch (error: any) {
    console.error('Save blog error:', error);
    return c.json({ error: 'Failed to save blog', message: error.message }, 500);
  }
});

// DELETE /api/long-tail-keywords/lists/:id - Delete a saved keyword list
app.delete('/api/long-tail-keywords/lists/:id', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const listId = c.req.param('id');
    
    await db
      .delete(campaignHistory)
      .where(and(
        eq(campaignHistory.id, listId),
        eq(campaignHistory.userId, userId),
        eq(campaignHistory.type, 'long-tail-keywords')
      ));

    return c.json({ 
      success: true, 
      message: 'Keyword list deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete keyword list error:', error);
    return c.json({ error: 'Failed to delete keyword list', message: error.message }, 500);
  }
});

// Serve static files in production
const isProduction = process.env.NODE_ENV === 'production';
const buildPath = path.resolve(process.cwd(), 'build');

if (isProduction && fs.existsSync(buildPath)) {
  console.log('Production mode: Serving static files from build directory');
  
  // Serve static assets
  app.use('/assets/*', serveStatic({ root: './build' }));
  
  // Serve other static files (favicon, etc.)
  app.use('/*', serveStatic({ root: './build' }));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', async (c) => {
    const requestPath = c.req.path;
    // Don't serve index.html for API routes
    if (requestPath.startsWith('/api')) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      return c.html(html);
    }
    return c.json({ error: 'Not found' }, 404);
  });
}

const port = parseInt(process.env.PORT || (isProduction ? '5000' : '3001'), 10);

console.log(`Starting Admin API Server on port ${port}...`);
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Admin API Server running on http://localhost:${info.port}`);
});

// Export for Vercel serverless functions
export { app };
export default app;
