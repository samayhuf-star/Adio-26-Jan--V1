import { db } from '../server/db';
import { blogPosts } from '../shared/schema';
import { marked } from 'marked';
import { eq } from 'drizzle-orm';

marked.setOptions({ gfm: true, breaks: false });

function isMarkdown(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.startsWith('<')) return false;
  return (
    /^#{1,6}\s/m.test(trimmed) ||
    /\*\*[^*]+\*\*/.test(trimmed) ||
    /^- /m.test(trimmed) ||
    /^\d+\. /m.test(trimmed)
  );
}

async function main() {
  console.log('Fetching all blog posts...');
  const articles = await db.select({ id: blogPosts.id, title: blogPosts.title, content: blogPosts.content }).from(blogPosts);
  console.log(`Found ${articles.length} articles`);

  let converted = 0;
  let skipped = 0;

  for (const article of articles) {
    if (!article.content) { skipped++; continue; }
    if (!isMarkdown(article.content)) {
      console.log(`  [skip] "${article.title}" - already HTML`);
      skipped++;
      continue;
    }

    const html = await marked.parse(article.content);
    await db.update(blogPosts).set({ content: html }).where(eq(blogPosts.id, article.id));
    console.log(`  [converted] "${article.title}"`);
    converted++;
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
