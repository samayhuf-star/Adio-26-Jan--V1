import { db } from './db';
import { articleGenerationJobs, blogPosts } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateDetailedBlog } from './blogGenerator';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const MAX_CONCURRENT = 3;
let activeJobs = 0;
let workerInterval: NodeJS.Timeout | null = null;

function categoryFromKeyword(keyword: string): string {
  const kw = keyword.toLowerCase();
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
    const category = job.category || categoryFromKeyword(keyword);

    const config = {
      topic: keyword,
      keyword: keyword,
      contentType: 'how-to' as const,
      tone: 'professional' as const,
      targetAudience: 'general' as const,
      includeCode: false,
      includeStats: true,
      targetWordCount: 1200,
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

    const utmCta = '?utm_source=organic&utm_medium=blog&utm_campaign=bulk';
    const contentWithUtm = (generated.fullContent || '').replace(
      /https:\/\/adiology\.io(?!\?utm)/g,
      `https://adiology.io${utmCta}`
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
        metaTitle: `${generated.title} | Adiology`,
        metaDescription: generated.metaDescription,
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

    console.log(`[BulkGen] Completed: "${generated.title}" (${generated.wordCount} words)`);
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
