import { Hono } from 'hono';
import { db } from '../db';
import { seoPages } from '../../shared/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const app = new Hono();

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
import crypto from 'crypto';

function verifyAdminToken(token: string, password: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [username, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_MAX_AGE_MS) return false;
    const payload = `${username}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', password).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  const token = authHeader.substring(7);
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!password) return c.json({ error: 'Admin not configured' }, 500);
  if (!verifyAdminToken(token, password)) return c.json({ error: 'Invalid token' }, 401);
  await next();
}

function buildPageHtml(niche: string, slug: string, title: string, metaDesc: string, body: string): string {
  const nicheLabel = niche.replace(/-/g, ' ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${metaDesc}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://adiology.io/${slug}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${metaDesc}" />
  <meta property="og:url" content="https://adiology.io/${slug}" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Adiology",
    "description": "${metaDesc}",
    "url": "https://adiology.io/${slug}",
    "applicationCategory": "BusinessApplication",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  }
  </script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;background:#fff;line-height:1.6}
    .hero{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);color:#fff;padding:80px 24px;text-align:center}
    .hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:16px;line-height:1.2}
    .hero p{font-size:1.25rem;opacity:.85;max-width:640px;margin:0 auto 32px}
    .btn{display:inline-block;background:#e94560;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;transition:opacity .2s}
    .btn:hover{opacity:.9}
    .section{padding:64px 24px;max-width:900px;margin:0 auto}
    .section h2{font-size:2rem;font-weight:700;margin-bottom:24px;color:#1a1a2e}
    .section p{font-size:1.05rem;color:#444;margin-bottom:16px}
    .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;padding:48px 24px;max-width:1100px;margin:0 auto}
    .feature{background:#f8f9fc;border-radius:12px;padding:28px;border:1px solid #e8eaf0}
    .feature h3{font-size:1.1rem;font-weight:700;margin-bottom:8px;color:#1a1a2e}
    .feature p{font-size:.95rem;color:#555}
    .cta-section{background:#1a1a2e;color:#fff;padding:64px 24px;text-align:center}
    .cta-section h2{font-size:2.2rem;font-weight:800;margin-bottom:16px}
    .cta-section p{font-size:1.1rem;opacity:.8;max-width:560px;margin:0 auto 32px}
    footer{background:#0a0a18;color:#aaa;padding:24px;text-align:center;font-size:.9rem}
    footer a{color:#e94560;text-decoration:none}
  </style>
</head>
<body>
<header class="hero">
  <h1>${title}</h1>
  <p>${metaDesc}</p>
  <a href="https://adiology.io/signup" class="btn">Start Free Trial</a>
</header>
${body}
<section class="cta-section">
  <h2>Ready to grow your ${nicheLabel} business?</h2>
  <p>Join thousands of businesses using Adiology to run smarter Google Ads campaigns.</p>
  <a href="https://adiology.io/signup" class="btn">Get Started Free</a>
</section>
<footer>
  <p>&copy; ${new Date().getFullYear()} <a href="https://adiology.io">Adiology</a> &mdash; AI-Powered Google Ads Management</p>
</footer>
</body>
</html>`;
}

async function generatePageContent(niche: string): Promise<{ title: string; metaDesc: string; body: string; slug: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const nicheLabel = niche.replace(/-/g, ' ');
  const slug = `adiology-io-for-${niche}`;

  const prompt = `You are writing a landing page for "adiology.io" — an AI-powered Google Ads management platform — targeting ${nicheLabel} businesses.

Write the following JSON (and ONLY valid JSON, no markdown):
{
  "title": "SEO title for the page (50-60 chars, include '${nicheLabel}' and 'Google Ads')",
  "metaDescription": "Meta description 140-155 chars. Mention adiology.io and ${nicheLabel}.",
  "heroSubheading": "1-2 sentence value prop specifically for ${nicheLabel} businesses.",
  "mainSection": {
    "heading": "How Adiology helps ${nicheLabel} teams win on Google Ads",
    "paragraphs": ["paragraph 1 (3-4 sentences)", "paragraph 2 (3-4 sentences)", "paragraph 3 (3-4 sentences)"]
  },
  "features": [
    {"title": "Feature 1 relevant to ${nicheLabel}", "description": "2 sentences"},
    {"title": "Feature 2 relevant to ${nicheLabel}", "description": "2 sentences"},
    {"title": "Feature 3 relevant to ${nicheLabel}", "description": "2 sentences"},
    {"title": "Feature 4 relevant to ${nicheLabel}", "description": "2 sentences"},
    {"title": "Feature 5 relevant to ${nicheLabel}", "description": "2 sentences"},
    {"title": "Feature 6 relevant to ${nicheLabel}", "description": "2 sentences"}
  ]
}`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const data = JSON.parse(resp.choices[0].message.content || '{}');

  const featureCards = (data.features || []).map((f: any) =>
    `<div class="feature"><h3>${f.title}</h3><p>${f.description}</p></div>`
  ).join('\n');

  const paragraphs = (data.mainSection?.paragraphs || []).map((p: string) => `<p>${p}</p>`).join('\n');

  const body = `
<section class="section">
  <h2>${data.mainSection?.heading || 'Why choose Adiology'}</h2>
  ${paragraphs}
</section>
<div class="features">
  ${featureCards}
</div>`;

  return {
    title: data.title || `adiology.io for ${nicheLabel} teams`,
    metaDesc: data.metaDescription || `adiology.io helps ${nicheLabel} teams run smarter Google Ads campaigns with AI.`,
    body,
    slug,
  };
}

// List all pages
app.get('/list', authMiddleware, async (c) => {
  try {
    const pages = await db.select().from(seoPages).orderBy(desc(seoPages.createdAt)).limit(500);
    const total = pages.length;
    const published = pages.filter(p => p.status === 'published').length;
    const ready = pages.filter(p => p.status === 'generated').length;
    return c.json({ pages, total, published, ready });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Generate pages for multiple niches
app.post('/generate', authMiddleware, async (c) => {
  try {
    const { niches } = await c.req.json();
    if (!Array.isArray(niches) || niches.length === 0) return c.json({ error: 'niches must be a non-empty array' }, 400);
    if (niches.length > 50) return c.json({ error: 'Max 50 niches per batch' }, 400);

    const results: Array<{ niche: string; status: string; id?: number; error?: string }> = [];

    for (const rawNiche of niches) {
      const niche = String(rawNiche).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!niche) continue;

      const slug = `adiology-io-for-${niche}`;
      const existing = await db.select({ id: seoPages.id }).from(seoPages).where(eq(seoPages.slug, slug)).limit(1);
      if (existing.length > 0) { results.push({ niche, status: 'skipped' }); continue; }

      try {
        const { title, metaDesc, body, slug: generatedSlug } = await generatePageContent(niche);
        const html = buildPageHtml(niche, generatedSlug, title, metaDesc, body);
        const [inserted] = await db.insert(seoPages).values({
          niche,
          slug: generatedSlug,
          title,
          metaDescription: metaDesc,
          htmlContent: html,
          status: 'generated',
        }).returning({ id: seoPages.id });
        results.push({ niche, status: 'generated', id: inserted.id });
      } catch (e: any) {
        results.push({ niche, status: 'failed', error: e.message });
      }
    }

    return c.json({ success: true, results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Publish pages to GitHub
app.post('/publish-github', authMiddleware, async (c) => {
  try {
    const { pageIds, repo } = await c.req.json();
    if (!Array.isArray(pageIds) || pageIds.length === 0) return c.json({ error: 'pageIds required' }, 400);
    if (!repo) return c.json({ error: 'repo required (e.g. owner/repo-name)' }, 400);

    const token = process.env.GITHUB_TOKEN;
    if (!token) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);

    const pages = await db.select().from(seoPages).where(inArray(seoPages.id, pageIds));
    if (pages.length === 0) return c.json({ error: 'No pages found' }, 404);

    const results: Array<{ id: number; slug: string; status: string; url?: string; error?: string }> = [];

    for (const page of pages) {
      const filePath = `${page.slug}.html`;
      const content = Buffer.from(page.htmlContent || '').toString('base64');
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      try {
        // Check if file already exists (to get SHA for update)
        let existingSha: string | undefined;
        const checkRes = await fetch(apiUrl, {
          headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
        });
        if (checkRes.ok) {
          const existing = await checkRes.json() as any;
          existingSha = existing.sha;
        }

        const body: any = {
          message: `Add SEO landing page: ${page.title}`,
          content,
        };
        if (existingSha) body.sha = existingSha;

        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!putRes.ok) {
          const errData = await putRes.json() as any;
          throw new Error(errData.message || `GitHub API error ${putRes.status}`);
        }

        const putData = await putRes.json() as any;
        const githubUrl = `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/${page.slug}.html`;

        await db.update(seoPages).set({
          status: 'published',
          githubPath: filePath,
          githubSha: putData.content?.sha,
          githubRepo: repo,
          publishedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(seoPages.id, page.id));

        results.push({ id: page.id, slug: page.slug, status: 'published', url: githubUrl });
      } catch (e: any) {
        results.push({ id: page.id, slug: page.slug, status: 'failed', error: e.message });
      }
    }

    const published = results.filter(r => r.status === 'published').length;
    const failed = results.filter(r => r.status === 'failed').length;
    return c.json({ success: true, published, failed, results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Delete pages
app.delete('/delete', authMiddleware, async (c) => {
  try {
    const { pageIds } = await c.req.json();
    if (!Array.isArray(pageIds) || pageIds.length === 0) return c.json({ error: 'pageIds required' }, 400);
    await db.delete(seoPages).where(inArray(seoPages.id, pageIds));
    return c.json({ success: true, deleted: pageIds.length });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get GitHub repo info
app.get('/github-repo', authMiddleware, async (c) => {
  try {
    const repoParam = c.req.query('repo');
    if (!repoParam) return c.json({ error: 'repo query param required' }, 400);
    const token = process.env.GITHUB_TOKEN;
    if (!token) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);

    const res = await fetch(`https://api.github.com/repos/${repoParam}`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return c.json({ error: 'Repo not found or no access' }, 404);
    const data = await res.json() as any;
    return c.json({ name: data.full_name, defaultBranch: data.default_branch, private: data.private, url: data.html_url });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// List user's GitHub repos
app.get('/github-repos', authMiddleware, async (c) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);

    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50&type=all', {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return c.json({ repos: [] });
    const data = await res.json() as any[];
    const repos = data.map((r: any) => ({ name: r.full_name, private: r.private, url: r.html_url, updatedAt: r.updated_at }));
    return c.json({ repos });
  } catch (e: any) {
    return c.json({ repos: [] });
  }
});

export { app as seoPagesRoutes };
