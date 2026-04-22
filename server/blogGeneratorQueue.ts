import { db } from './db';
import { articleGenerationJobs, blogPosts } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateDetailedBlog } from './blogGenerator';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const MAX_CONCURRENT = 3;
let activeJobs = 0;
let workerInterval: NodeJS.Timeout | null = null;

const INDEXNOW_KEY = 'e1d486f466a04ef68e517d49595680ff';

async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'adiology.io',
        key: INDEXNOW_KEY,
        keyLocation: `https://adiology.io/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    console.log(`[IndexNow] Pinged ${urls.length} URL(s): ${urls[0]}`);
  } catch (err) {
    console.error('[IndexNow] Ping failed:', err);
  }
}

function categoryFromKeyword(keyword: string, library?: string | null): string {
  const kw = keyword.toLowerCase();

  if (library === 'blog-2') {
    if (kw.includes('intent') || kw.includes('transactional') || kw.includes('purchase intent')) return 'Intent-Based Campaigns';
    if (kw.includes('location') || kw.includes('geo') || kw.includes('radius') || kw.includes('geographic') || kw.includes('country') || kw.includes('city') || kw.includes('local')) return 'Geographic Targeting';
    if (kw.includes('match type') || kw.includes('broad match') || kw.includes('exact match') || kw.includes('phrase match') || kw.includes('negative match')) return 'Match Types';
    if (kw.includes('performance max') || kw.includes('pmax')) return 'PMax Campaigns';
    if (kw.includes('shopping') || kw.includes('merchant center') || kw.includes('product listing')) return 'Shopping Campaigns';
    if (kw.includes('smart bidding') || kw.includes('target cpa') || kw.includes('target roas') || kw.includes('maximize conversions') || kw.includes('enhanced cpc') || kw.includes('bidding strategy') || kw.includes('bid strategy')) return 'Smart Bidding';
    if (kw.includes('ai max') || kw.includes('ai-powered') || kw.includes('google ai') || kw.includes('ai feature') || kw.includes('ai campaign')) return 'AI Max';
    if (kw.includes('responsive search') || kw.includes('rsa') || kw.includes('expanded text ad')) return 'Responsive Search Ads';
    if (kw.includes('display') || kw.includes('banner') || kw.includes('gdn') || kw.includes('google display')) return 'Display Advertising';
    if (kw.includes('youtube') || kw.includes('video ad') || kw.includes('trueview') || kw.includes('bumper')) return 'YouTube Ads';
    if (kw.includes('competitor') || kw.includes('conquesting') || kw.includes('brand keyword')) return 'Competitor Targeting';
    if (kw.includes('report') || kw.includes('analytics') || kw.includes('metric') || kw.includes('conversion tracking') || kw.includes('auction insights')) return 'Reporting & Analytics';
    if (kw.includes('campaign structure') || kw.includes('ad group') || kw.includes('skag') || kw.includes('account structure')) return 'Campaign Structure';
    return 'Google Ads Strategy';
  }

  if (kw.includes('click fraud') || kw.includes('invalid click') || kw.includes('bot traffic')) return 'Click Guard';
  if (kw.includes('keyword') || kw.includes('kw research') || kw.includes('keyword planner')) return 'Keyword Planning';
  if (kw.includes('domain') || kw.includes('landing page') || kw.includes('quality score')) return 'Domain Monitor';
  if (kw.includes('email') || kw.includes('proxy mail') || kw.includes('spam')) return 'Proxy Mail';
  if (kw.includes('search') || kw.includes('ads search') || kw.includes('competitor ad')) return 'Ads Search';
  if (kw.includes('blog') || kw.includes('content') || kw.includes('article')) return 'Blog Generator';
  return 'Google Ads';
}

async function processNextJob() {
  if (activeJobs >= MAX_CONCURRENT) return;

  let job: any = null;
  try {
    const rows = await db
      .select()
      .from(articleGenerationJobs)
      .where(eq(articleGenerationJobs.status, 'queued'))
      .orderBy(articleGenerationJobs.createdAt)
      .limit(1);

    if (rows.length === 0) return;
    job = rows[0];

    await db
      .update(articleGenerationJobs)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(articleGenerationJobs.id, job.id));

    activeJobs++;

    const keyword = job.keyword.trim();
    const library = job.library || null;
    const category = job.category || categoryFromKeyword(keyword, library);

    const config = {
      topic: keyword,
      keyword: keyword,
      contentType: 'how-to' as const,
      tone: 'professional' as const,
      targetAudience: 'general' as const,
      includeCode: false,
      includeStats: true,
      targetWordCount: library === 'blog-2' ? 1000 : 1200,
    };

    const generated = await generateDetailedBlog(config);

    const slug = generated.slug;
    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(articleGenerationJobs)
        .set({
          status: 'skipped',
          errorMsg: `Slug "${slug}" already exists`,
          completedAt: new Date(),
        })
        .where(eq(articleGenerationJobs.id, job.id));
      activeJobs--;
      return;
    }

    const utmParam = library === 'blog-2'
      ? '?utm_source=organic&utm_medium=blog-2&utm_campaign=google-ads-library'
      : '?utm_source=organic&utm_medium=blog&utm_campaign=bulk';
    const contentWithUtm = (generated.fullContent || '').replace(
      /https:\/\/adiology\.io(?!\?utm)/g,
      `https://adiology.io${utmParam}`
    );
    const htmlContent = await marked.parse(contentWithUtm);

    const inserted = await db
      .insert(blogPosts)
      .values({
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.metaDescription,
        content: htmlContent,
        category: category,
        tags: [keyword, 'Google Ads', category],
        author: 'Adiology Team',
        readTime: `${generated.readingTime} min read`,
        wordCount: generated.wordCount,
        published: true,
        featured: false,
        metaTitle: library === 'blog-2'
          ? `${generated.title} | Google Ads Library — Adiology`
          : `${generated.title} | Adiology`,
        metaDescription: generated.metaDescription,
        library: library,
      })
      .returning({ id: blogPosts.id });

    await db
      .update(articleGenerationJobs)
      .set({
        status: 'completed',
        articleId: inserted[0].id,
        articleSlug: generated.slug,
        wordCount: generated.wordCount,
        completedAt: new Date(),
        errorMsg: null,
      })
      .where(eq(articleGenerationJobs.id, job.id));

    console.log(`[BulkGen] Completed: "${generated.title}" (${generated.wordCount} words) [library: ${library || 'main'}]`);

    // Ping IndexNow for blog-2 articles so Google/Bing index them immediately
    if (library === 'blog-2') {
      pingIndexNow([`https://adiology.io/blog-2/${generated.slug}`]).catch(() => {});
    }
  } catch (err: any) {
    console.error(`[BulkGen] Job ${job?.id} failed:`, err.message);
    if (job) {
      await db
        .update(articleGenerationJobs)
        .set({
          status: 'failed',
          errorMsg: err.message || 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(articleGenerationJobs.id, job.id))
        .catch(() => {});
    }
  } finally {
    if (job) activeJobs = Math.max(0, activeJobs - 1);
  }
}

export function startBlogGeneratorQueue() {
  if (workerInterval) return;
  console.log('[BulkGen] Queue worker started');
  workerInterval = setInterval(async () => {
    try {
      for (let i = activeJobs; i < MAX_CONCURRENT; i++) {
        await processNextJob();
      }
    } catch (err) {
      console.error('[BulkGen] Worker tick error:', err);
    }
  }, 5000);
}

export function stopBlogGeneratorQueue() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}
