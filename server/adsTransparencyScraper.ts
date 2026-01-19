import { chromium, Browser, Page } from 'playwright';
import { getDatabaseUrl } from './dbConfig';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

interface AdResult {
  keyword: string;
  advertiser: string;
  headline: string;
  description: string;
  destination_url: string;
  ad_format: string;
  platform: string;
  first_shown: string | null;
  last_shown: string | null;
  region: string;
  raw_data: any;
}

export async function scrapeGoogleAdsTransparency(keywords: string[]): Promise<AdResult[]> {
  const results: AdResult[] = [];
  let browser: Browser | null = null;

  try {
    console.log('[Scraper] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US'
    });

    const page = await context.newPage();

    for (const keyword of keywords) {
      if (!keyword.trim()) continue;

      console.log(`[Scraper] Searching for keyword: ${keyword}`);
      
      try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const url = `https://adstransparency.google.com/?region=US&text=${encodedKeyword}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait longer for dynamic content to load
        await page.waitForTimeout(5000);
        
        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(2000);

        const adsData = await page.evaluate(() => {
          const ads: any[] = [];
          
          // Try multiple selector strategies for the current page structure
          // Strategy 1: Look for creative preview cards (common structure)
          const creativeCards = document.querySelectorAll('creative-preview, [class*="creative"], [class*="card"], [data-creative]');
          console.log('Strategy 1 - creative cards:', creativeCards.length);
          
          // Strategy 2: Look for any links to advertisers
          const advertiserLinks = document.querySelectorAll('a[href*="/advertiser/"]');
          console.log('Strategy 2 - advertiser links:', advertiserLinks.length);
          
          // Strategy 3: Look for material design cards or list items
          const mdCards = document.querySelectorAll('mat-card, .mat-card, [role="article"], [role="listitem"], .mdc-card');
          console.log('Strategy 3 - MD cards:', mdCards.length);
          
          // Strategy 4: Look for any container with text content that looks like an ad
          const allDivs = document.querySelectorAll('div[class]');
          let potentialAds = 0;
          
          allDivs.forEach((div) => {
            const text = div.textContent || '';
            const hasAdvertiserLink = div.querySelector('a[href*="/advertiser/"]');
            if (hasAdvertiserLink && text.length > 50 && text.length < 1000) {
              potentialAds++;
              const advertiser = hasAdvertiserLink.textContent?.trim() || 'Unknown';
              const allText = text.replace(advertiser, '').trim();
              
              // Extract headline (usually first significant text)
              const textParts = allText.split('\n').filter(t => t.trim().length > 5);
              const headline = textParts[0]?.trim() || '';
              const description = textParts.slice(1, 3).join(' ').trim() || '';
              
              if (headline && !ads.find(a => a.headline === headline)) {
                ads.push({
                  advertiser,
                  headline: headline.substring(0, 100),
                  description: description.substring(0, 200),
                  url: hasAdvertiserLink.getAttribute('href') || '',
                  platform: 'Search',
                  dateRange: '',
                  format: 'text'
                });
              }
            }
          });
          console.log('Strategy 4 - potential ads:', potentialAds);
          
          // Strategy 5: Parse any embedded JSON data
          const scripts = document.querySelectorAll('script');
          scripts.forEach((script) => {
            const content = script.textContent || '';
            if (content.includes('advertiser') && content.includes('creative')) {
              try {
                // Try to find JSON objects in the script
                const jsonMatch = content.match(/\{[^{}]*"advertiser"[^{}]*\}/g);
                if (jsonMatch) {
                  jsonMatch.forEach((match) => {
                    try {
                      const data = JSON.parse(match);
                      if (data.advertiser || data.headline) {
                        ads.push({
                          advertiser: data.advertiser?.name || data.advertiserName || 'Unknown',
                          headline: data.headline || data.title || '',
                          description: data.description || '',
                          url: data.url || data.destinationUrl || '',
                          platform: 'Search',
                          dateRange: '',
                          format: 'text',
                          raw: data
                        });
                      }
                    } catch (e) {}
                  });
                }
              } catch (e) {}
            }
          });

          // Log page info for debugging
          console.log('Page title:', document.title);
          console.log('Body text length:', document.body?.textContent?.length);
          
          return ads;
        });

        console.log(`[Scraper] Found ${adsData.length} ads for "${keyword}"`);

        adsData.forEach((ad) => {
          results.push({
            keyword: keyword.trim(),
            advertiser: ad.advertiser || 'Unknown',
            headline: ad.headline || '',
            description: ad.description || '',
            destination_url: ad.url || '',
            ad_format: ad.format || 'text',
            platform: ad.platform || 'Search',
            first_shown: null,
            last_shown: null,
            region: 'US',
            raw_data: ad.raw || ad
          });
        });

        await page.waitForTimeout(2000);

      } catch (err) {
        console.error(`[Scraper] Error scraping keyword "${keyword}":`, err);
      }
    }

    await context.close();

  } catch (err) {
    console.error('[Scraper] Browser error:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results;
}

export async function processAdSearchRequest(requestId: number): Promise<void> {
  console.log(`[Scraper] Processing request ${requestId}...`);

  try {
    await pool.query(
      'UPDATE ad_search_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processing', requestId]
    );

    const requestResult = await pool.query(
      'SELECT * FROM ad_search_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      console.error(`[Scraper] Request ${requestId} not found`);
      return;
    }

    const request = requestResult.rows[0];
    const keywords = request.keywords;

    console.log(`[Scraper] Scraping keywords: ${keywords.join(', ')}`);

    const results = await scrapeGoogleAdsTransparency(keywords);

    console.log(`[Scraper] Got ${results.length} results, saving to database...`);

    if (results.length === 0) {
      console.warn(`[Scraper] No ads found for request ${requestId}. Google Ads Transparency may be blocking automated access.`);
      await pool.query(
        'UPDATE ad_search_requests SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', 'No ads found. The Google Ads Transparency Center may be blocking automated access or no ads exist for these keywords.', requestId]
      );
      return;
    }

    await pool.query(
      'DELETE FROM ad_search_results WHERE request_id = $1',
      [requestId]
    );

    for (const result of results) {
      await pool.query(
        `INSERT INTO ad_search_results 
         (request_id, keyword, advertiser, headline, description, destination_url, ad_format, platform, first_shown, last_shown, region, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          requestId,
          result.keyword,
          result.advertiser,
          result.headline,
          result.description,
          result.destination_url,
          result.ad_format,
          result.platform,
          result.first_shown,
          result.last_shown,
          result.region,
          JSON.stringify(result.raw_data)
        ]
      );
    }

    await pool.query(
      'UPDATE ad_search_requests SET status = $1, processed_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['completed', requestId]
    );

    console.log(`[Scraper] Request ${requestId} completed successfully with ${results.length} ads`);

  } catch (err: any) {
    console.error(`[Scraper] Error processing request ${requestId}:`, err);

    await pool.query(
      'UPDATE ad_search_requests SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
      ['failed', err.message || 'Unknown error', requestId]
    );
  }
}

export async function processPendingRequests(): Promise<void> {
  console.log('[Scraper] Checking for pending requests...');

  try {
    const pendingResult = await pool.query(
      `SELECT id FROM ad_search_requests 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 10`
    );

    if (pendingResult.rows.length === 0) {
      console.log('[Scraper] No pending requests found');
      return;
    }

    console.log(`[Scraper] Found ${pendingResult.rows.length} pending requests`);

    for (const row of pendingResult.rows) {
      await processAdSearchRequest(row.id);
    }

  } catch (err) {
    console.error('[Scraper] Error processing pending requests:', err);
  }
}

export async function runCronJob(): Promise<void> {
  console.log('[Cron] Starting hourly ad scraper job...');
  
  await processPendingRequests();
  
  console.log('[Cron] Job completed');
}
