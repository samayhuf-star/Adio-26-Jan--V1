import { db } from '../server/db';
import { articleGenerationJobs, blogPosts } from '../shared/schema';
import { eq } from 'drizzle-orm';

const topics: [string, string][] = [
  ['how to target purchase intent keywords in google ads', 'Intent-Based Campaigns'],
  ['transactional vs informational keyword targeting google ads', 'Intent-Based Campaigns'],
  ['how to use audience intent signals in google ads 2024', 'Intent-Based Campaigns'],
  ['google ads intent audiences custom segments guide', 'Intent-Based Campaigns'],
  ['high intent keywords for google ads conversion optimization', 'Intent-Based Campaigns'],
  ['how to build intent-based ad groups google ads', 'Intent-Based Campaigns'],
  ['micro-moment targeting google ads strategy', 'Intent-Based Campaigns'],
  ['google ads consumer intent signals explained', 'Intent-Based Campaigns'],
  ['how to set up google ads radius targeting step by step', 'Geographic Targeting'],
  ['google ads location targeting best practices 2024', 'Geographic Targeting'],
  ['geo-targeting strategies for local google ads campaigns', 'Geographic Targeting'],
  ['how to exclude locations in google ads', 'Geographic Targeting'],
  ['google ads city vs region vs country targeting comparison', 'Geographic Targeting'],
  ['how to use location bid adjustments in google ads', 'Geographic Targeting'],
  ['google ads store visit conversions location targeting', 'Geographic Targeting'],
  ['international google ads campaigns geo-targeting guide', 'Geographic Targeting'],
  ['google ads broad match vs phrase match vs exact match guide', 'Match Types'],
  ['how to use negative keywords with match types effectively', 'Match Types'],
  ['google ads phrase match changes 2023 2024 impact', 'Match Types'],
  ['when to use broad match in google ads smart bidding', 'Match Types'],
  ['google ads exact match keyword strategy', 'Match Types'],
  ['how match types affect quality score google ads', 'Match Types'],
  ['migrating from bmm to phrase match google ads', 'Match Types'],
  ['google ads match type hierarchy and priority explained', 'Match Types'],
  ['google performance max campaign setup complete guide', 'PMax Campaigns'],
  ['how to optimize performance max campaigns 2024', 'PMax Campaigns'],
  ['performance max vs standard shopping campaigns comparison', 'PMax Campaigns'],
  ['pmax audience signals best practices google ads', 'PMax Campaigns'],
  ['how to add negative keywords performance max campaigns', 'PMax Campaigns'],
  ['performance max campaign reporting explained', 'PMax Campaigns'],
  ['pmax asset groups optimization strategies', 'PMax Campaigns'],
  ['performance max campaign budget allocation guide', 'PMax Campaigns'],
  ['google shopping campaigns setup guide for beginners', 'Shopping Campaigns'],
  ['how to optimize google shopping product titles', 'Shopping Campaigns'],
  ['google merchant center feed optimization tips', 'Shopping Campaigns'],
  ['google shopping vs performance max which is better', 'Shopping Campaigns'],
  ['how to use shopping campaign priority settings', 'Shopping Campaigns'],
  ['google ads shopping bid strategies comparison', 'Shopping Campaigns'],
  ['google shopping product listing ad optimization', 'Shopping Campaigns'],
  ['how to fix google merchant center product disapprovals', 'Shopping Campaigns'],
  ['target cpa bidding google ads complete guide', 'Smart Bidding'],
  ['how to set up target roas in google ads', 'Smart Bidding'],
  ['maximize conversions vs target cpa google ads', 'Smart Bidding'],
  ['google ads smart bidding strategies comparison 2024', 'Smart Bidding'],
  ['how to transition to smart bidding from manual cpc', 'Smart Bidding'],
  ['google ads enhanced cpc explained', 'Smart Bidding'],
  ['smart bidding learning period google ads tips', 'Smart Bidding'],
  ['google ads portfolio bid strategies guide', 'Smart Bidding'],
  ['google ads ai max campaign type explained 2024', 'AI Max'],
  ['ai max vs performance max google ads difference', 'AI Max'],
  ['how to use google ads ai max features', 'AI Max'],
  ['google ai powered search campaigns setup guide', 'AI Max'],
  ['ai max campaign optimization strategies', 'AI Max'],
  ['google ads ai max audience expansion explained', 'AI Max'],
  ['ai max vs standard search campaigns comparison', 'AI Max'],
  ['google ads generative ai ad creation guide', 'AI Max'],
  ['responsive search ads best practices 2024', 'Responsive Search Ads'],
  ['how to write high-converting rsa headlines google ads', 'Responsive Search Ads'],
  ['google ads rsa vs expanded text ads comparison', 'Responsive Search Ads'],
  ['how to improve responsive search ad strength', 'Responsive Search Ads'],
  ['responsive search ads pinning strategy guide', 'Responsive Search Ads'],
  ['google ads rsa asset performance reporting', 'Responsive Search Ads'],
  ['how many headlines should a rsa have google ads', 'Responsive Search Ads'],
  ['responsive search ads a b testing strategies', 'Responsive Search Ads'],
  ['google display network targeting options explained', 'Display Advertising'],
  ['how to create effective google display ads', 'Display Advertising'],
  ['google ads remarketing lists for display campaigns', 'Display Advertising'],
  ['display advertising vs search ads which to choose', 'Display Advertising'],
  ['google responsive display ads setup guide', 'Display Advertising'],
  ['how to reduce display ad costs google ads', 'Display Advertising'],
  ['google display placement exclusions guide', 'Display Advertising'],
  ['how to run youtube ads for google ads beginners', 'YouTube Ads'],
  ['youtube skippable vs non-skippable ads comparison', 'YouTube Ads'],
  ['youtube ads targeting options explained', 'YouTube Ads'],
  ['how to lower youtube cpm google ads', 'YouTube Ads'],
  ['youtube discovery ads vs in-stream ads guide', 'YouTube Ads'],
  ['youtube bumper ads strategy and best practices', 'YouTube Ads'],
  ['youtube ads conversion tracking setup guide', 'YouTube Ads'],
  ['how to target competitor keywords in google ads', 'Competitor Targeting'],
  ['google ads competitor conquesting strategy', 'Competitor Targeting'],
  ['branded keyword bidding competitor strategy guide', 'Competitor Targeting'],
  ['how to use auction insights for competitor analysis', 'Competitor Targeting'],
  ['google ads competitor ad copy research techniques', 'Competitor Targeting'],
  ['conquesting campaigns best practices google ads', 'Competitor Targeting'],
  ['brand vs competitor keyword bidding google ads', 'Competitor Targeting'],
  ['google ads conversion tracking setup complete guide', 'Reporting & Analytics'],
  ['how to read google ads quality score report', 'Reporting & Analytics'],
  ['google ads attribution models comparison guide', 'Reporting & Analytics'],
  ['auction insights report google ads interpretation', 'Reporting & Analytics'],
  ['google ads search term report analysis guide', 'Reporting & Analytics'],
  ['how to use google ads scripts for reporting', 'Reporting & Analytics'],
  ['google ads custom columns and segments guide', 'Reporting & Analytics'],
  ['google ads account structure best practices 2024', 'Campaign Structure'],
  ['skag vs stag campaign structure google ads', 'Campaign Structure'],
  ['how to organize ad groups in google ads', 'Campaign Structure'],
  ['google ads campaign budget structure guide', 'Campaign Structure'],
  ['single keyword ad groups pros and cons 2024', 'Campaign Structure'],
  ['google ads campaign naming conventions guide', 'Campaign Structure'],
  ['how to restructure google ads account for performance', 'Campaign Structure'],
];

async function seed() {
  let inserted = 0;
  let skipped = 0;

  for (const [keyword, category] of topics) {
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingPost = await db.select({ id: blogPosts.id }).from(blogPosts)
      .where(eq(blogPosts.slug, slug)).limit(1);
    if (existingPost.length > 0) { skipped++; continue; }

    const existingJob = await db.select({ id: articleGenerationJobs.id }).from(articleGenerationJobs)
      .where(eq(articleGenerationJobs.keyword, keyword)).limit(1);
    if (existingJob.length > 0) { skipped++; continue; }

    await db.insert(articleGenerationJobs).values({
      keyword,
      category,
      status: 'queued',
      batchId: 'seed-blog2-v1',
      library: 'blog-2',
    });
    inserted++;
  }

  console.log(`Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
