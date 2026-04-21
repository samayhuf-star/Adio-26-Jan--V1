import { db } from '../server/db';
import { blogPosts } from '../shared/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const articles = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    createdAt: blogPosts.createdAt,
    contentStart: blogPosts.content
  }).from(blogPosts).orderBy(desc(blogPosts.createdAt));
  
  console.log(`Total articles: ${articles.length}`);
  for (const a of articles) {
    const snippet = (a.contentStart || '').trim().substring(0, 60).replace(/\n/g, ' ');
    const isMarkdown = snippet.startsWith('#') || (/\*\*/.test(snippet) && !snippet.startsWith('<'));
    console.log(`[${a.id}] ${a.createdAt} | ${isMarkdown ? 'MARKDOWN' : 'HTML'} | "${a.title.substring(0,50)}"`);
    if (isMarkdown) console.log(`  ^^^ SNIPPET: ${snippet}`);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
