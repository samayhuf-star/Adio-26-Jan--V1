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
import { superadminRoutes } from './routes/superadmin';
import { domainsRoutes } from './routes/domains';
import { accountRoutes } from './routes/account';
import { tempMailRoutes } from './routes/tempmail';
import { clickGuardRoutes } from './routes/clickguard';
import { googleAdsRoutes } from './routes/googleads';
import { analyticsRoutes } from './routes/analytics';
import { appsumoRoutes } from './routes/appsumo';
import { affonsoRoutes } from './routes/affonso';
import { errorsRoutes } from './routes/errors';
import { adPlatformsRoutes } from './routes/adplatforms';
import { leadsRoutes } from './routes/leads';
import { skyvernRoutes } from './routes/skyvern';
import { chatRoutes } from './routes/chat';
import { stripeService } from './stripeService';
import { adminAuthMiddleware } from './adminAuthService';
import { db, getDb } from './db';
import { campaignHistory, auditLogs, workspaceProjects, projectItems, monitoredDomains, clickGuardDomains, feedback, blogPosts, aiUsageLogs } from '../shared/schema';
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

app.use('/assets/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=31536000, immutable');
});

app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

app.get('/sitemap.xml', async (c) => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const sitemapPath = path.resolve(currentDir, '../public/sitemap.xml');
  try {
    const staticXml = fs.readFileSync(sitemapPath, 'utf-8');
    // Dynamically inject all published blog posts from the database
    let blogXml = '';
    try {
      const posts = await db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, createdAt: blogPosts.createdAt })
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.createdAt));
      const today = new Date().toISOString().slice(0, 10);
      for (const post of posts) {
        const lastmod = (post.updatedAt || post.createdAt || new Date()).toISOString().slice(0, 10);
        blogXml += `  <url>\n    <loc>https://adiology.io/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      // Only replace static blog entries when DB has live posts — otherwise keep the
      // hardcoded entries so the sitemap is never stripped bare by an empty DB query.
      if (posts.length > 0) {
        const strippedXml = staticXml.replace(/<url>\s*<loc>https:\/\/adiology\.io\/blog\/[^<]+<\/loc>[\s\S]*?<\/url>\n?/g, '');
        const finalXml = strippedXml.replace('</urlset>', blogXml + '</urlset>');
        return c.text(finalXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
      }
      // No published posts in DB — serve static file unchanged (keeps hardcoded blog entries)
      return c.text(staticXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
    } catch (dbErr) {
      console.error('[Sitemap] DB error, falling back to static:', dbErr);
      return c.text(staticXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
    }
  } catch {
    return c.text('Not found', 404);
  }
});

app.get('/sitemap_v2.xml', async (c) => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const sitemapPath = path.resolve(currentDir, '../public/sitemap_v2.xml');
  try {
    const staticXml = fs.readFileSync(sitemapPath, 'utf-8');
    let blogXml = '';
    try {
      const posts = await db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, createdAt: blogPosts.createdAt })
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .orderBy(desc(blogPosts.createdAt));
      for (const post of posts) {
        const lastmod = (post.updatedAt || post.createdAt || new Date()).toISOString().slice(0, 10);
        blogXml += `  <url>\n    <loc>https://adiology.io/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      const strippedXml = staticXml.replace(/<url>\s*<loc>https:\/\/adiology\.io\/blog\/[^<]+<\/loc>[\s\S]*?<\/url>\n?/g, '');
      const finalXml = strippedXml.replace('</urlset>', blogXml + '</urlset>');
      return c.text(finalXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
    } catch (dbErr) {
      console.error('[Sitemap v2] DB error, falling back to static:', dbErr);
      return c.text(staticXml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
    }
  } catch {
    return c.text('Not found', 404);
  }
});

app.get('/robots.txt', (c) => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const robotsPath = path.resolve(currentDir, '../public/robots.txt');
  try {
    const content = fs.readFileSync(robotsPath, 'utf-8');
    return c.text(content, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch {
    return c.text('Not found', 404);
  }
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
app.route('/api/projects', tasksRoutes);
app.route('/api/promo', promoRoutes);
app.route('/api/superadmin', superadminRoutes);
app.route('/api/domains', domainsRoutes);
app.route('/api/account', accountRoutes);
app.route('/api/tempmail', tempMailRoutes);
app.route('/api/clickguard', clickGuardRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/google-ads', googleAdsRoutes);
app.route('/api/appsumo', appsumoRoutes);
app.route('/api/affonso', affonsoRoutes);
app.route('/api/errors', errorsRoutes);
app.route('/api/leads', leadsRoutes);
app.route('/api/skyvern', skyvernRoutes);
app.route('/api/superadmin', adPlatformsRoutes);
app.route('/api/chat', chatRoutes);

// SSR meta injection for blog pages — lets Googlebot see per-post title/description
function readIndexHtml(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'build/index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../build/index.html'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../index.html'),
  ];
  for (const p of possiblePaths) {
    try { return fs.readFileSync(p, 'utf-8'); } catch {}
  }
  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function injectBlogMeta(html: string, meta: {
  title: string; description: string; canonical: string;
  ogTitle?: string; ogDesc?: string; ogImage?: string;
  jsonLd?: string; articleHtml?: string;
}): string {
  const escaped = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let result = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escaped(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${escaped(meta.description)}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${meta.canonical}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${escaped(meta.ogTitle || meta.title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${escaped(meta.ogDesc || meta.description)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${meta.canonical}"`);

  if (meta.ogImage) {
    result = result.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${meta.ogImage}"`);
  }

  // Inject JSON-LD schema into <head>
  if (meta.jsonLd) {
    result = result.replace('</head>', `${meta.jsonLd}\n</head>`);
  }

  // Inject crawlable article content before <div id="root"> so Google sees real text
  if (meta.articleHtml) {
    result = result.replace('<div id="root"', `${meta.articleHtml}\n<div id="root" style="position:relative"`);
  }

  return result;
}

app.get('/blog', async (c) => {
  const html = readIndexHtml();
  if (!html) return c.text('Not found', 404);

  // Fetch recent posts to show in SSR for /blog index page
  let recentPostsHtml = '';
  try {
    const recent = await db
      .select({ title: blogPosts.title, slug: blogPosts.slug, excerpt: blogPosts.excerpt, category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.createdAt))
      .limit(10);
    if (recent.length > 0) {
      const items = recent.map(p =>
        `<li><a href="/blog/${p.slug}"><strong>${p.title}</strong></a>${p.excerpt ? ` — ${p.excerpt}` : ''}</li>`
      ).join('\n');
      recentPostsHtml = `<div id="ssr-blog-index" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;" aria-hidden="true"><h1>Google Ads Blog — Adiology</h1><ul>${items}</ul></div>`;
    }
  } catch {}

  const jsonLd = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Blog","name":"Adiology Blog","url":"https://adiology.io/blog","description":"Expert Google Ads tips, guides and PPC strategies."}</script>`;

  const injected = injectBlogMeta(html, {
    title: 'Google Ads Blog — Tips, Guides & Strategies | Adiology',
    description: 'Expert Google Ads tips, step-by-step guides and PPC strategies to help you build better campaigns and lower costs.',
    canonical: 'https://adiology.io/blog',
    ogTitle: 'Google Ads Blog — Adiology',
    ogDesc: 'Expert guides and tips for Google Ads professionals.',
    jsonLd,
    articleHtml: recentPostsHtml,
  });
  return c.html(injected);
});

app.get('/blog/:slug', async (c) => {
  const slug = c.req.param('slug');
  const html = readIndexHtml();
  if (!html) return c.text('Not found', 404);
  try {
    const results = await db
      .select({
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        imageUrl: blogPosts.imageUrl,
        author: blogPosts.author,
        category: blogPosts.category,
        slug: blogPosts.slug,
        published: blogPosts.published,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);

    if (results.length === 0) {
      return c.html(html);
    }

    const post = results[0];
    const pageTitle = post.metaTitle || `${post.title} | Adiology Blog`;
    const pageDesc = post.metaDescription || post.excerpt || 'Read this article on the Adiology blog.';
    const canonical = `https://adiology.io/blog/${post.slug}`;
    const datePublished = (post.createdAt || new Date()).toISOString();
    const dateModified = (post.updatedAt || post.createdAt || new Date()).toISOString();
    const ogImage = post.imageUrl || 'https://adiology.io/og-image.png';

    // JSON-LD Article schema — Google uses this to understand and rank articles
    const jsonLd = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": pageDesc,
      "url": canonical,
      "image": ogImage,
      "author": { "@type": "Person", "name": post.author || "Adiology Team" },
      "publisher": {
        "@type": "Organization",
        "name": "Adiology",
        "logo": { "@type": "ImageObject", "url": "https://adiology.io/og-image.png" }
      },
      "datePublished": datePublished,
      "dateModified": dateModified,
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonical }
    })}</script>`;

    // Extract plain text from content for Googlebot to read
    const plainText = stripHtml(post.content || '').slice(0, 5000);
    const articleHtml = `<article id="ssr-article-content" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
  <h1>${post.title}</h1>
  ${post.category ? `<p>Category: ${post.category}</p>` : ''}
  ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
  <div>${plainText}</div>
</article>`;

    const injected = injectBlogMeta(html, {
      title: pageTitle,
      description: pageDesc,
      canonical,
      ogImage,
      jsonLd,
      articleHtml,
    });
    return c.html(injected);
  } catch (err) {
    console.error('[Blog SSR] Error fetching post meta:', err);
    return c.html(html);
  }
});

app.get('/googlebc7aae8bc89f46c1.html', async (c) => {
  try {
    const filePath = path.resolve(process.cwd(), 'public/googlebc7aae8bc89f46c1.html');
    const content = fs.readFileSync(filePath, 'utf-8');
    c.header('Content-Type', 'text/html');
    return c.body(content);
  } catch (e) {
    return c.text('Not found', 404);
  }
});

app.get('/t.js', async (c) => {
  try {
    const scriptPath = path.resolve(process.cwd(), 'public/t.js');
    const script = fs.readFileSync(scriptPath, 'utf-8');
    c.header('Content-Type', 'application/javascript');
    c.header('Cache-Control', 'public, max-age=300');
    c.header('Access-Control-Allow-Origin', '*');
    return c.body(script);
  } catch (e) {
    return c.text('// tracking script unavailable', 500);
  }
});

app.get('/api/products', async (c) => {
  try {
    const products = await stripeService.listProductsWithPrices(true, 50, 0);
    
    const formattedProducts = products.map((product: any) => ({
      id: product.product_id,
      name: product.product_name,
      description: product.product_description,
      active: product.product_active,
      metadata: product.product_metadata,
      prices: product.prices?.map((price: any) => ({
        id: price.price_id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        active: price.price_active,
        metadata: price.price_metadata
      })) || []
    }));
    
    return c.json({ products: formattedProducts });
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
    const database = getDb();

    let totalCampaigns = 0;
    let recentCampaigns: any[] = [];
    let totalDomains = 0;
    let totalClickGuardDomains = 0;

    if (database) {
      try {
        const campaigns = await database
          .select()
          .from(campaignHistory)
          .where(eq(campaignHistory.userId, userId))
          .orderBy(desc(campaignHistory.createdAt));
        totalCampaigns = campaigns.length;
        recentCampaigns = campaigns.slice(0, 5).map((c: any) => ({
          id: c.id,
          campaign_name: c.name,
          structure_type: c.data?.structureType || 'standard',
          step: c.status === 'completed' ? 7 : (c.data?.step || 1),
          created_at: c.createdAt,
          updated_at: c.updatedAt || c.createdAt,
        }));
      } catch (e) {
        console.warn('Dashboard: campaign_history query failed:', e);
      }

      try {
        const domains = await database
          .select()
          .from(monitoredDomains)
          .where(eq(monitoredDomains.userId, userId));
        totalDomains = domains.length;
      } catch (e) {
        console.warn('Dashboard: monitored_domains query failed:', e);
      }

      try {
        const cgDomains = await database
          .select()
          .from(clickGuardDomains)
          .where(eq(clickGuardDomains.userId, userId));
        totalClickGuardDomains = cgDomains.length;
      } catch (e) {
        console.warn('Dashboard: click_guard_domains query failed:', e);
      }
    }

    return c.json({
      success: true,
      data: {
        stats: {
          totalCampaigns,
          totalSearches: 0,
          unreadNotifications: 0,
          totalDomains,
          totalClickGuardDomains,
        },
        recentCampaigns,
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
const AI_API_KEY = process.env.GEMINI_API_KEY || '';
const AI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('Gemini API key is not configured. Set the GEMINI_API_KEY environment variable.');
  }
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
    const seedServices = analysisResult.services
      .slice(0, 15)
      .map((s: string) => s.toLowerCase().trim())
      .filter((s: string) => {
        if (!s || s.length < 3) return false;
        const junkTerms = ['www', 'http', 'https', 'com', 'org', 'net', 'home', 'menu', 'click here', 'read more', 'learn more', 'submit', 'search', 'login', 'sign up', 'subscribe', 'close', 'open', 'back', 'next', 'previous', 'loading', 'copyright', 'all rights reserved', 'privacy policy', 'terms of service', 'cookie'];
        return !junkTerms.includes(s) && !/^https?:\/\//.test(s) && !/^www\./.test(s);
      });

    if (seedServices.length === 0) {
      // Try to extract meaningful keywords from page title, meta description, and headings
      const fallbackSources = [
        analysisResult.seoSignals?.title,
        analysisResult.seoSignals?.metaDescription,
        analysisResult.seoSignals?.ogTitle,
        analysisResult.seoSignals?.ogDescription,
        ...analysisResult.headings.filter(h => h.level === 'h1' || h.level === 'h2').map(h => h.text)
      ].filter(Boolean);

      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'we', 'our', 'your', 'their', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'he', 'she', 'his', 'her', 'they', 'them', 'you', 'us', 'who', 'what', 'which', 'when', 'where', 'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again', 'also', 'am', 'as', 'because', 'before', 'below', 'between', 'from', 'get', 'here', 'if', 'into', 'like', 'make', 'much', 'new', 'now', 'over', 'out', 'then', 'up', 'www', 'com', 'http', 'https', 'org', 'net', 'home', 'welcome']);

      for (const source of fallbackSources) {
        if (source && seedServices.length < 5) {
          const words = source.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
          // Extract meaningful 2-3 word phrases from the source
          const cleanSource = source.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          const sourceWords = cleanSource.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
          // Add individual meaningful words
          for (const word of sourceWords) {
            if (word.length >= 4 && seedServices.length < 10 && !seedServices.includes(word)) {
              seedServices.push(word);
            }
          }
          // Add 2-word phrases
          for (let i = 0; i < sourceWords.length - 1; i++) {
            const phrase = `${sourceWords[i]} ${sourceWords[i + 1]}`;
            if (seedServices.length < 10 && !seedServices.includes(phrase)) {
              seedServices.push(phrase);
            }
          }
        }
      }

      // Last resort: extract the actual brand/domain name (not "www")
      if (seedServices.length === 0) {
        try {
          const parsedUrl = new URL(websiteUrl);
          const hostname = parsedUrl.hostname.replace(/^www\./, '');
          const domainName = hostname.split('.')[0];
          if (domainName && domainName.length >= 3 && domainName !== 'www') {
            seedServices.push(domainName);
          } else {
            seedServices.push('service');
          }
        } catch {
          seedServices.push('service');
        }
      }
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

// Note: Domain monitoring routes are handled by domainsRoutes mounted at /api/domains (line 88)

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

    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const durationMs = Date.now() - startTime;
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    // Estimate cost for gpt-4o-mini: $0.15 per 1M tokens ($0.000015 per 100 tokens)
    const costCents = (totalTokens / 1000) * 0.015;

    try {
      const userId = await getUserIdFromToken(c);
      await db.insert(aiUsageLogs).values({
        userId: userId || null,
        feature: 'campaign-builder-dki',
        model: 'gpt-4o-mini',
        promptTokens,
        completionTokens,
        totalTokens,
        costCents: costCents.toString(),
        durationMs,
        status: 'success',
      });
    } catch (logErr) {
      console.error('[AI Usage Log] Failed to log in DKI:', logErr);
    }

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
// Feedback Endpoints
// ============================================
app.post('/api/feedback', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, userEmail, type, rating, message, pageUrl, pageName, browserInfo, screenSize, screenshots } = body;

    if (!message || !type) {
      return c.json({ error: 'Message and type are required' }, 400);
    }

    const database = getDb();
    await database.insert(feedback).values({
      userId: userId || null,
      userEmail: userEmail || null,
      type,
      rating: rating || null,
      message,
      status: 'new',
    });

    // Send email notification
    try {
      const { EmailService } = await import('./emailService');
      const typeLabel = type === 'bug_report' ? 'Bug Report' : type === 'feature_request' ? 'Feature Request' : 'Feedback';
      const subject = `${typeLabel} from ${userEmail || 'Anonymous User'}`;

      await EmailService.sendRaw('samayhuf@gmail.com', 'feedbackNotification' as any, {
        type: typeLabel,
        rating: rating ? `${rating}/5` : 'N/A',
        user: userEmail || 'Anonymous',
        page: pageName || 'Unknown',
        url: pageUrl || 'Unknown',
        message: message,
        screenshots: screenshots?.length ? `${screenshots.length} attached` : 'None',
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Feedback email notification error:', emailError);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

app.get('/api/feedback', async (c) => {
  try {
    const database = getDb();
    const results = await database
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt))
      .limit(100);

    return c.json({ success: true, feedback: results });
  } catch (error: any) {
    console.error('Get feedback error:', error);
    return c.json({ error: 'Failed to get feedback' }, 500);
  }
});

app.patch('/api/feedback/:id/status', async (c) => {
  try {
    const feedbackId = c.req.param('id');
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const database = getDb();
    await database
      .update(feedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedback.id, feedbackId));

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Update feedback status error:', error);
    return c.json({ error: 'Failed to update feedback status' }, 500);
  }
});

// ============================================
// Long-tail Keywords Endpoints
// ============================================
app.post('/api/long-tail-keywords/generate', async (c) => {
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

    const keywords = generateComprehensiveFallbackKeywords(seedKeywords);
    return c.json({ success: true, keywords });
  } catch (error: any) {
    console.error('Generate long-tail keywords error:', error);
    const keywords = generateComprehensiveFallbackKeywords(seedKeywords);
    return c.json({ success: true, keywords });
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
    const results = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        tags: blogPosts.tags,
        author: blogPosts.author,
        readTime: blogPosts.readTime,
        wordCount: blogPosts.wordCount,
        imageUrl: blogPosts.imageUrl,
        featured: blogPosts.featured,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.createdAt))
      .limit(50);

    return c.json({ blogs: results });
  } catch (error: any) {
    console.error('Get blogs error:', error);
    return c.json({ error: 'Failed to get blogs', message: error.message }, 500);
  }
});

app.get('/api/blogs/categories/list', async (c) => {
  try {
    const results = await db
      .select({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    
    const categories = [...new Set(results.map(r => r.category).filter(Boolean))].sort();
    return c.json({ categories });
  } catch (error: any) {
    return c.json({ error: 'Failed to get categories' }, 500);
  }
});

app.get('/api/blogs/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const results = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);
    
    if (results.length === 0) {
      return c.json({ error: 'Article not found' }, 404);
    }

    const related = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        readTime: blogPosts.readTime,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .where(and(
        eq(blogPosts.published, true),
        eq(blogPosts.category, results[0].category || '')
      ))
      .orderBy(desc(blogPosts.createdAt))
      .limit(4);
    
    const relatedArticles = related.filter(r => r.slug !== slug).slice(0, 3);

    return c.json({ 
      article: results[0],
      related: relatedArticles
    });
  } catch (error: any) {
    console.error('Get blog article error:', error);
    return c.json({ error: 'Failed to get article', message: error.message }, 500);
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

// ── SPA page SEO: page-specific JSON-LD + title + description per route ──────
// Googlebot needs this before JS executes. Injected into index.html server-side
// for every route that has meaningful structured data to add.
function getSpaPageSeo(requestPath: string): { title?: string; description?: string; jsonLd?: string } {
  const base = 'https://adiology.io';
  const canonical = `${base}${requestPath === '/' ? '' : requestPath}`;
  const org = `{"@type":"Organization","@id":"${base}/#organization","name":"Adiology","url":"${base}"}`;
  const appBase = `{"@type":"SoftwareApplication","applicationCategory":"BusinessApplication","operatingSystem":"Web","publisher":${org},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD","description":"7-day free trial, no credit card required"}}`;

  const faqSchema = (items: Array<{ q: string; a: string }>) =>
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });

  const softwareSchema = (name: string, desc: string, features: string[]) =>
    JSON.stringify({
      '@context': 'https://schema.org',
      ...JSON.parse(appBase),
      name,
      description: desc,
      featureList: features,
      url: canonical,
    });

  if (requestPath === '/' || requestPath === '') {
    const faq = faqSchema([
      { q: 'What is Adiology?', a: 'Adiology is an AI-powered Google Ads management platform with 8 integrated tools: campaign builder, keyword planner, click fraud protection, domain monitoring, proxy mail, negative keyword manager, long-tail keyword generator, and direct Google Ads integration.' },
      { q: 'How does the free trial work?', a: 'Every new account gets a full 7-day free trial with access to all features. No credit card is required to start.' },
      { q: 'Does Adiology connect directly to Google Ads?', a: 'Yes. You can connect your Google Ads account and launch campaigns directly from the Adiology dashboard without switching tabs.' },
      { q: 'What campaign structures does Adiology support?', a: 'Adiology supports 13 campaign structures including SKAG, STAG, Intent-Based, Alpha-Beta, Geo-Targeted, Funnel-Based, and more, with AI-generated keywords and ad copy for each.' },
      { q: 'Is there a free plan?', a: 'Adiology offers a 7-day free trial. After the trial, a paid subscription is required to continue. Visit the pricing page for current plan details.' },
    ]);
    return { jsonLd: `<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/campaign-builder') {
    const sw = softwareSchema('Adiology Campaign Builder', 'AI-powered Google Ads campaign builder supporting 13 campaign structures. Generate 1,600+ keywords, RSA ad copy, and launch directly to Google Ads in minutes.', ['13 campaign structures (SKAG, STAG, Alpha-Beta, Geo-Targeted, Funnel-Based and more)', 'AI keyword generation (1,600+ per campaign)', 'Responsive Search Ad copy generation', 'One-click Google Ads launch', 'CSV export']);
    const faq = faqSchema([
      { q: 'What is a Google Ads campaign builder?', a: 'A campaign builder automates the creation of Google Ads campaigns, including keyword research, ad group structure, and ad copy, saving hours of manual work.' },
      { q: 'What campaign structures does Adiology support?', a: 'Adiology supports 13 structures including Single Keyword Ad Groups (SKAG), Single Theme Ad Groups (STAG), Intent-Based, Alpha-Beta split, Geo-Targeted with 30K+ ZIP locations, and Funnel-Based campaigns.' },
      { q: 'How many keywords can the AI generate?', a: 'The AI can generate over 1,600 keywords per campaign, covering broad, phrase, and exact match types.' },
      { q: 'Can I export the campaign to Google Ads?', a: 'Yes. You can launch campaigns directly to your connected Google Ads account or export to CSV for manual upload.' },
      { q: 'Does Adiology create the ad copy too?', a: 'Yes. The AI generates Responsive Search Ads (RSA) with multiple headlines and descriptions for each ad group.' },
    ]);
    return { title: 'AI Google Ads Campaign Builder — 13 Structures, 1,600+ Keywords | Adiology', description: 'Build Google Ads campaigns in minutes with AI. Supports 13 campaign structures, generates 1,600+ keywords and RSA ad copy. Connect and launch directly to Google Ads.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/click-guard') {
    const sw = softwareSchema('Adiology Click Guard', 'Click fraud protection for Google Ads. Automatically detects and blocks bots, VPNs, proxy servers, and repeat clickers to protect your ad budget.', ['Real-time bot detection', 'VPN and proxy server blocking', 'IP exclusion automation', 'Suspicious click pattern analysis', 'Domain-level protection', 'Google Ads IP exclusion sync']);
    const faq = faqSchema([
      { q: 'What is click fraud in Google Ads?', a: 'Click fraud is the practice of repeatedly clicking your ads — by bots, competitors, or malicious users — to drain your ad budget without generating real conversions.' },
      { q: 'How does Click Guard detect fraudulent clicks?', a: 'Click Guard analyses traffic patterns, device fingerprints, click frequency, IP reputation, and VPN/proxy usage to identify and block invalid traffic in real time.' },
      { q: 'Does Click Guard automatically block bad IPs?', a: 'Yes. Detected malicious IPs are automatically added to your Google Ads IP exclusion list, stopping future ad spend on those sources.' },
      { q: 'Will Click Guard reduce my Google Ads CPC?', a: 'By eliminating invalid clicks, Click Guard ensures your budget is spent on genuine potential customers, which typically lowers effective CPC and improves conversion rates.' },
      { q: 'Does it work with all Google Ads campaign types?', a: 'Yes. Click Guard works across Search, Display, Shopping, and Performance Max campaign types.' },
    ]);
    return { title: 'Google Ads Click Fraud Protection — Block Bots & VPNs | Adiology Click Guard', description: 'Stop wasting ad budget on click fraud. Adiology Click Guard detects bots, VPNs, and repeat clickers, then automatically syncs IP exclusions to Google Ads.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/keyword-planner') {
    const sw = softwareSchema('Adiology Keyword Planner', 'Google Ads keyword research tool with keyword mixer, negative keyword manager, and long-tail keyword generator.', ['Keyword Planner with search volume estimates', 'Keyword Mixer for ad group building', 'Long-tail keyword generator', 'Negative keyword manager', 'Match type suggestions', 'CSV and Google Ads export']);
    const faq = faqSchema([
      { q: 'What does the Adiology Keyword Planner do?', a: 'It generates keyword ideas, estimates search volumes, organises keywords into ad groups, and helps build negative keyword lists — all in one place.' },
      { q: 'How is the Keyword Mixer different from the Planner?', a: 'The Keyword Planner finds keyword ideas from seed terms. The Keyword Mixer combines those terms with modifiers to build exhaustive ad group keyword sets instantly.' },
      { q: 'Can I manage negative keywords?', a: 'Yes. The Negative Keyword Manager lets you build and maintain negative keyword lists to prevent irrelevant searches from triggering your ads.' },
      { q: 'Does it support long-tail keywords?', a: 'Yes. The Long-tail Keyword Generator expands seed keywords into hundreds of specific, low-competition phrases using AI and Google autocomplete data.' },
      { q: 'Can I export keywords to Google Ads?', a: 'Yes. Keywords can be exported as CSV or pushed directly to your connected Google Ads account.' },
    ]);
    return { title: 'Google Ads Keyword Planner, Mixer & Negative Keyword Manager | Adiology', description: 'Research, mix, and manage Google Ads keywords in one tool. Generate long-tail keywords, build negative lists, and export to Google Ads in minutes.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/domain-monitor') {
    const sw = softwareSchema('Adiology Domain Monitor', 'Domain monitoring tool that tracks SSL certificate expiry, DNS changes, WHOIS data, and competitor ad campaigns.', ['SSL certificate expiry alerts', 'DNS change monitoring', 'WHOIS data tracking', 'Uptime monitoring', 'Competitor domain analysis', 'Email alerts']);
    const faq = faqSchema([
      { q: 'What does domain monitoring do?', a: 'Domain monitoring tracks your domains (and competitor domains) for SSL expiry, DNS changes, WHOIS updates, and downtime, alerting you before problems affect your campaigns.' },
      { q: 'Can I monitor competitor domains?', a: 'Yes. Add any domain — including competitor domains — to get alerts about changes to their SSL, DNS, or ad presence.' },
      { q: 'How early does it alert about SSL expiry?', a: 'Adiology Domain Monitor sends alerts 30, 14, and 7 days before an SSL certificate expires, giving you time to renew before your site goes down.' },
      { q: 'Does it monitor DNS changes?', a: 'Yes. Any change to A, CNAME, MX, or NS records triggers an immediate alert so you can investigate and respond quickly.' },
      { q: 'Is uptime monitoring included?', a: 'Yes. Domain Monitor checks site availability and alerts you if a monitored domain goes offline.' },
    ]);
    return { title: 'Domain Monitoring — SSL, DNS, WHOIS & Competitor Tracking | Adiology', description: 'Monitor domains for SSL expiry, DNS changes, WHOIS updates, and uptime. Get early alerts before problems affect your Google Ads campaigns.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/proxy-mail' || requestPath === '/features/instant-mail') {
    const sw = softwareSchema('Adiology Proxy Mail', 'Anonymous temporary email tool for signing up to competitor tools and ad platforms without revealing your real address.', ['Instant temporary email addresses', 'Anonymous competitor intelligence', 'No sign-up required for temp addresses', 'Inbox with full email reading', 'Works with any email-based sign-up form']);
    const faq = faqSchema([
      { q: 'What is Proxy Mail?', a: 'Proxy Mail generates anonymous temporary email addresses you can use to sign up for competitor tools, ad networks, or research platforms without revealing your real identity.' },
      { q: 'How do I create a temporary email?', a: 'Click "New Address" in the Proxy Mail tool and an instant inbox is created. Use the address anywhere — emails arrive in real time.' },
      { q: 'Are the emails real and functional?', a: 'Yes. You receive real emails and can read them in full inside the Adiology dashboard. This is useful for competitor research or verifying sign-up flows.' },
      { q: 'Do I need to sign up to use Proxy Mail?', a: 'You need an Adiology account to access Proxy Mail, but no additional sign-up or configuration is required.' },
      { q: 'How long do temporary addresses last?', a: 'Temporary email addresses and their contents are available during your session and cleaned up automatically to protect your privacy.' },
    ]);
    return { title: 'Anonymous Temporary Email for Competitor Research | Adiology Proxy Mail', description: 'Generate anonymous temporary email addresses instantly. Sign up for competitor tools and ad platforms without revealing your real email address.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/features/ads-search') {
    const sw = softwareSchema('Adiology Ads Search', 'Google Ads transparency search tool. Research competitor ad copy, keywords, and campaign strategies using the Google Ads Transparency Centre.', ['Competitor ad copy research', 'Google Ads Transparency Centre integration', 'Ad history tracking', 'Cross-advertiser comparison', 'Keyword intelligence']);
    const faq = faqSchema([
      { q: 'What is the Ads Search tool?', a: 'Ads Search connects to the Google Ads Transparency Centre, letting you research any advertiser\'s active ads, keywords, and messaging strategies directly from your Adiology dashboard.' },
      { q: 'Can I see competitor ad copy?', a: 'Yes. Search any domain or brand name to see their current Google Ads, including headlines, descriptions, and display URLs.' },
      { q: 'Is this data live?', a: 'Data is sourced from the Google Ads Transparency Centre, which reflects recent ad activity and is updated regularly.' },
      { q: 'How do I use this for my own campaigns?', a: 'Use competitor insights to identify strong messaging angles, spot gaps in their keyword coverage, and craft more competitive ad copy for your own campaigns.' },
    ]);
    return { title: 'Google Ads Competitor Research Tool — Ad Copy & Keyword Intelligence | Adiology', description: 'Research competitor Google Ads using the Transparency Centre. See their ad copy, keywords, and messaging strategies to build better campaigns.', jsonLd: `<script type="application/ld+json">${sw}</script>\n<script type="application/ld+json">${faq}</script>` };
  }

  if (requestPath === '/pricing') {
    const faq = faqSchema([
      { q: 'Is there a free trial?', a: 'Yes. All new accounts get a 7-day free trial with full access to every feature. No credit card required to start.' },
      { q: 'Can I cancel at any time?', a: 'Yes. You can cancel your subscription at any time from your account settings. There are no cancellation fees or lock-in contracts.' },
      { q: 'What happens after the free trial?', a: 'After 7 days you can choose a paid plan to continue. If you do not upgrade, your account will be limited to the free tier.' },
      { q: 'Do you offer a lifetime deal?', a: 'Yes. Adiology offers a one-time lifetime access option on the pricing page. Pay once and get permanent access without recurring fees.' },
      { q: 'Is there a discount for annual billing?', a: 'Yes. Annual plans are offered at a significant discount compared to monthly billing. Check the pricing page for current rates.' },
      { q: 'What payment methods do you accept?', a: 'Adiology accepts all major credit and debit cards via Stripe. All payments are secured with industry-standard encryption.' },
    ]);
    return { title: 'Adiology Pricing — 7-Day Free Trial, No Credit Card Required', description: 'Start with a 7-day free trial. Choose from monthly, annual, or lifetime plans. Cancel anytime, no contracts.', jsonLd: `<script type="application/ld+json">${faq}</script>` };
  }

  return {};
}

function injectSpaPageSeo(html: string, requestPath: string): string {
  const seo = getSpaPageSeo(requestPath);
  if (!seo.title && !seo.description && !seo.jsonLd) return html;
  let result = html;
  if (seo.title) {
    result = result.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
    result = result.replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${seo.title}$2`);
    result = result.replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${seo.title}$2`);
  }
  if (seo.description) {
    result = result.replace(/(<meta name="description" content=")[^"]*(")/,  `$1${seo.description}$2`);
    result = result.replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${seo.description}$2`);
    result = result.replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${seo.description}$2`);
  }
  const canonicalUrl = `https://adiology.io${requestPath === '/' ? '' : requestPath}`;
  result = result.replace(/(<link rel="canonical" href=")[^"]*(")/,  `$1${canonicalUrl}$2`);
  result = result.replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${canonicalUrl}$2`);
  if (seo.jsonLd) {
    result = result.replace('</head>', `${seo.jsonLd}\n</head>`);
  }
  return result;
}

// Serve static files
const isProduction = process.env.NODE_ENV === 'production';
const buildPath = path.resolve(process.cwd(), 'build');

if (fs.existsSync(buildPath)) {
  console.log('Serving static files from build directory');
  
  // Serve static assets
  app.use('/assets/*', serveStatic({ root: './build' }));
  
  // Serve other static files (favicon, etc.)
  app.use('/*', serveStatic({ root: './build' }));
  
  // SPA fallback - serve index.html for all non-API routes
  // Injects page-specific JSON-LD, title, description, and canonical for Googlebot.
  app.get('*', async (c) => {
    const requestPath = c.req.path;
    // Don't serve index.html for API routes or file requests
    if (requestPath.startsWith('/api') || requestPath.includes('.')) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const rawHtml = fs.readFileSync(indexPath, 'utf-8');
      const html = injectSpaPageSeo(rawHtml, requestPath);
      return c.html(html);
    }
    return c.text('Not found', 404);
  });
}

const port = parseInt(process.env.PORT || (isProduction ? '5000' : '3001'), 10);

console.log(`Starting Admin API Server on port ${port}...`);
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

async function seedBlogPosts() {
  try {
    const database = getDb();
    if (!database) return;

    const existing = await database.select({ id: blogPosts.id }).from(blogPosts).limit(1);
    if (existing.length > 0) {
      console.log('[Blog Seed] Blog posts already exist, skipping seed.');
      return;
    }

    console.log('[Blog Seed] No blog posts found, seeding...');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    let currentDir: string;
    try {
      currentDir = path.dirname(fileURLToPath(import.meta.url));
    } catch {
      currentDir = __dirname;
    }

    const possiblePaths = [
      path.join(currentDir, 'data', 'blogSeedData.json'),
      path.join(process.cwd(), 'server', 'data', 'blogSeedData.json'),
    ];
    const dataPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (!dataPath) {
      console.log('[Blog Seed] Seed data file not found. Tried:', possiblePaths.join(', '));
      return;
    }

    console.log(`[Blog Seed] Loading seed data from: ${dataPath}`);
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const posts = JSON.parse(rawData);

    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('[Blog Seed] Seed data is empty or invalid');
      return;
    }

    let seeded = 0;
    for (const post of posts) {
      try {
        await database.insert(blogPosts).values({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          tags: post.tags,
          author: post.author,
          readTime: post.readTime,
          wordCount: post.wordCount,
          imageUrl: post.imageUrl,
          featured: post.featured,
          published: post.published,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        });
        seeded++;
      } catch (insertErr: any) {
        if (insertErr.message?.includes('duplicate') || insertErr.code === '23505') {
          console.log(`[Blog Seed] Skipping duplicate: ${post.slug}`);
        } else {
          console.error(`[Blog Seed] Failed to insert "${post.slug}":`, insertErr.message);
        }
      }
    }

    console.log(`[Blog Seed] Successfully seeded ${seeded}/${posts.length} blog posts.`);
  } catch (error: any) {
    console.error('[Blog Seed] Error seeding blog posts:', error.message);
  }
}

async function seedClickGuardDomains() {
  try {
    const database = getDb();
    if (!database) return;

    const requiredDomains = [
      {
        userId: '80f89e58-674d-49ef-a0e3-ac996a37b380',
        domain: 'www.clickblock.co',
        siteId: 'b9c309afd23cb9d3ff7d78dd958d7c36',
        verified: true,
      },
      {
        userId: '80f89e58-674d-49ef-a0e3-ac996a37b380',
        domain: 'trackabletravel.com',
        siteId: 'ef6e06adc7f2faed812405426cc45013',
        verified: true,
      },
    ];

    for (const d of requiredDomains) {
      const [existing] = await database
        .select()
        .from(clickGuardDomains)
        .where(eq(clickGuardDomains.siteId, d.siteId));

      if (!existing) {
        await database.insert(clickGuardDomains).values(d);
        console.log(`[ClickGuard Seed] Added domain ${d.domain} with siteId ${d.siteId}`);
      }
    }
  } catch (error) {
    console.error('[ClickGuard Seed] Error seeding domains:', error);
  }
}

// ============================================
// Alphabet Soup Keyword Generation (Google Autocomplete)
// ============================================

async function fetchGoogleAutocomplete(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data[1] || []).filter((s: string) => typeof s === 'string' && s.trim().length > 0);
  } catch (err) {
    return [];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/api/keywords/alphabet-soup', async (c) => {
  try {
    const body = await c.req.json();
    const { seedKeywords } = body;

    if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return c.json({ error: 'seedKeywords array is required' }, 400);
    }

    // Quality caps — prevents 1900-keyword noise floods
    const MAX_PER_LETTER = 2;   // keep only top 2 suggestions per letter query
    const MAX_PER_SEED   = 60;  // hard cap per seed before frontend filters
    const MAX_TOTAL_RAW  = 300; // absolute ceiling before returning

    const allKeywords = new Set<string>();
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const DELAY_MS = 80;

    for (const seed of seedKeywords.slice(0, 5)) {
      const trimmedSeed = seed.trim().toLowerCase();
      if (!trimmedSeed || trimmedSeed.length < 2) continue;

      const seedKeywordsCollected: string[] = [];

      // Suffix pass: "plumber a", "plumber b" …
      for (const letter of alphabet) {
        if (seedKeywordsCollected.length >= MAX_PER_SEED) break;
        const suggestions = await fetchGoogleAutocomplete(`${trimmedSeed} ${letter}`);
        let addedThisLetter = 0;
        for (const suggestion of suggestions) {
          if (addedThisLetter >= MAX_PER_LETTER) break;
          const cleaned = suggestion.toLowerCase().trim();
          if (cleaned.length >= 3 && cleaned.length <= 80 && !allKeywords.has(cleaned)) {
            seedKeywordsCollected.push(cleaned);
            allKeywords.add(cleaned);
            addedThisLetter++;
          }
        }
        await sleep(DELAY_MS);
        if (allKeywords.size >= MAX_TOTAL_RAW) break;
      }

      // Prefix pass: "a plumber", "b plumber" … (only if seed budget remains)
      if (seedKeywordsCollected.length < MAX_PER_SEED) {
        for (const letter of alphabet) {
          if (seedKeywordsCollected.length >= MAX_PER_SEED) break;
          const suggestions = await fetchGoogleAutocomplete(`${letter} ${trimmedSeed}`);
          let addedThisLetter = 0;
          for (const suggestion of suggestions) {
            if (addedThisLetter >= MAX_PER_LETTER) break;
            const cleaned = suggestion.toLowerCase().trim();
            if (cleaned.length >= 3 && cleaned.length <= 80 && !allKeywords.has(cleaned)) {
              seedKeywordsCollected.push(cleaned);
              allKeywords.add(cleaned);
              addedThisLetter++;
            }
          }
          await sleep(DELAY_MS);
          if (allKeywords.size >= MAX_TOTAL_RAW) break;
        }
      }

      if (allKeywords.size >= MAX_TOTAL_RAW) break;
    }

    const keywordsArray = Array.from(allKeywords).map((kw) => ({
      keyword: kw,
      source: 'google_autocomplete',
      matchType: 'broad' as const,
    }));

    console.log(`[Alphabet Soup] Generated ${keywordsArray.length} raw keywords from ${seedKeywords.length} seeds (capped at ${MAX_PER_LETTER}/letter, ${MAX_PER_SEED}/seed)`);

    return c.json({
      success: true,
      keywords: keywordsArray,
      total: keywordsArray.length,
      method: 'alphabet_soup',
      seedCount: seedKeywords.length,
    });
  } catch (error: any) {
    console.error('[Alphabet Soup] Error:', error);
    return c.json({ error: 'Failed to generate keywords', message: error.message }, 500);
  }
});

// SPA catch-all: serve index.html for any route not matched by API/blog/static routes
// This ensures client-side routes like /auth/magic, /dashboard, /pricing, etc.
// return the React SPA when accessed directly (e.g. from an email link).
app.get('*', async (c) => {
  const html = readIndexHtml();
  if (!html) return c.text('Not found', 404);
  return c.html(html);
});

import { startHourlyReporting } from './services/whatsapp';
import { startUptimeMonitoring } from './services/uptimeMonitor';

serve({
  fetch: app.fetch,
  port,
}, async (info) => {
  console.log(`Admin API Server running on http://localhost:${info.port}`);
  await seedBlogPosts();
  await seedClickGuardDomains();
  startHourlyReporting();
  startUptimeMonitoring();

  // Ensure stripe_invoice_id unique index exists for payment deduplication
  try {
    const { Pool: StartupPool } = (await import('pg')).default;
    const startupPool = new StartupPool({ connectionString: (await import('./dbConfig')).getDatabaseUrl() });
    await startupPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_invoice_id_unique
      ON payments (stripe_invoice_id)
      WHERE stripe_invoice_id IS NOT NULL
    `);
    // Add is_internal column if not exists
    await startupPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false
    `);
    // Add signup_ip column if not exists (for tracking registration IP)
    await startupPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip text
    `);
    // Create ad_platform_connections table
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS ad_platform_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        platform text NOT NULL UNIQUE,
        account_id text,
        account_name text,
        credentials jsonb,
        status text DEFAULT 'disconnected',
        last_error text,
        last_synced timestamp,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `);
    // Create blocked_ips table for superadmin IP filtering
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ip text NOT NULL UNIQUE,
        reason text,
        blocked_by text,
        created_at timestamp DEFAULT NOW()
      )
    `);
    // Create magic_link_tokens table for passwordless auth
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS magic_link_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token text NOT NULL UNIQUE,
        email text NOT NULL,
        user_id uuid,
        type text NOT NULL DEFAULT 'login',
        expires_at timestamp NOT NULL,
        used_at timestamp,
        created_at timestamp DEFAULT NOW()
      )
    `);
    // Add trial_starts_at column for trial tracking
    await startupPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_starts_at timestamp
    `);
    // Chat support tables
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT UNIQUE NOT NULL,
        user_id UUID,
        user_email TEXT,
        user_name TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        page_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await startupPool.query(`CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id)`);
    await startupPool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id)`);
    // System settings table (used by chatbot and other features)
    await startupPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await startupPool.end();
    console.log('[Startup] DB schema ensured (payments index, is_internal, signup_ip, ad_platform_connections, blocked_ips, magic_link_tokens, trial_starts_at, chat_conversations, chat_messages, system_settings)');
  } catch (e: any) {
    console.log('[Startup] DB schema check (non-fatal):', e?.message);
  }
});

// Export for Vercel serverless functions
export { app };
export default app;
