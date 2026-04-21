import { db } from '../server/db';
import { blogPosts } from '../shared/schema';

async function main() {
  const articles = await db.select({ id: blogPosts.id, title: blogPosts.title, content: blogPosts.content }).from(blogPosts);
  for (const a of articles) {
    const snippet = (a.content || '').trim().substring(0, 120).replace(/\n/g, '\\n');
    console.log(`[${a.id}] "${a.title}"\n  content: ${snippet}\n`);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
