import { Hono } from 'hono';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { adminAuthMiddleware } from '../adminAuthService';

const app = new Hono();
const authMiddleware = adminAuthMiddleware;

// ─── Platform API Fetchers ────────────────────────────────────────────────────

async function refreshGoogleToken(creds: any): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error('Failed to refresh Google token: ' + (data.error_description || data.error));
  return data.access_token;
}

async function fetchGoogleAds(creds: any, from: string, to: string) {
  const accessToken = await refreshGoogleToken(creds);
  const customerId = (creds.customer_id || creds.account_id || '').replace(/-/g, '');

  const query = `
    SELECT
      campaign.name,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': creds.developer_token,
        'Content-Type': 'application/json',
        ...(creds.login_customer_id ? { 'login-customer-id': creds.login_customer_id.replace(/-/g, '') } : {}),
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  return (data.results || []).map((row: any) => ({
    campaign: row.campaign?.name || 'Unknown',
    spend: (row.metrics?.costMicros || 0) / 1_000_000,
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    conversions: Number(row.metrics?.conversions || 0),
  }));
}

async function fetchMeta(creds: any, from: string, to: string) {
  const accountId = (creds.account_id || '').startsWith('act_')
    ? creds.account_id
    : `act_${creds.account_id}`;

  const params = new URLSearchParams({
    fields: 'campaign_name,spend,impressions,clicks,actions',
    time_range: JSON.stringify({ since: from, until: to }),
    level: 'campaign',
    limit: '100',
    access_token: creds.access_token,
  });

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/insights?${params}`
  );
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.message);

  return (data.data || []).map((row: any) => {
    const conversions = (row.actions || [])
      .filter((a: any) => ['purchase', 'lead', 'complete_registration', 'offsite_conversion'].some(t => a.action_type?.includes(t)))
      .reduce((s: number, a: any) => s + parseFloat(a.value || '0'), 0);
    return {
      campaign: row.campaign_name || 'Unknown',
      spend: parseFloat(row.spend || '0'),
      impressions: parseInt(row.impressions || '0'),
      clicks: parseInt(row.clicks || '0'),
      conversions,
    };
  });
}

async function fetchLinkedIn(creds: any, from: string, to: string) {
  const startDate = from.split('-');
  const endDate = to.split('-');

  const params = new URLSearchParams({
    q: 'analytics',
    pivot: '(value:CAMPAIGN)',
    dateRange: `(start:(year:${startDate[0]},month:${parseInt(startDate[1])},day:${parseInt(startDate[2])}),end:(year:${endDate[0]},month:${parseInt(endDate[1])},day:${parseInt(endDate[2])}))`,
    fields: 'costInLocalCurrency,impressions,clicks,externalWebsiteConversions,pivotValues',
    accounts: `List(urn:li:sponsoredAccount:${creds.account_id})`,
  });

  const res = await fetch(
    `https://api.linkedin.com/rest/adAnalytics?${params}`,
    {
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        'LinkedIn-Version': '202312',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );
  const data = await res.json() as any;
  if (data.message || data.serviceErrorCode) throw new Error(data.message || 'LinkedIn API error');

  return (data.elements || []).map((row: any) => ({
    campaign: (row.pivotValues?.[0] || 'Unknown').replace('urn:li:sponsoredCampaign:', 'Campaign '),
    spend: parseFloat(row.costInLocalCurrency || '0'),
    impressions: parseInt(row.impressions || '0'),
    clicks: parseInt(row.clicks || '0'),
    conversions: parseInt(row.externalWebsiteConversions || '0'),
  }));
}

async function fetchTaboola(creds: any, from: string, to: string) {
  const tokenRes = await fetch('https://backstage.taboola.com/backstage/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      grant_type: 'client_credentials',
    }),
  });
  const tokenData = await tokenRes.json() as any;
  if (!tokenData.access_token) throw new Error('Failed to get Taboola token');

  const res = await fetch(
    `https://backstage.taboola.com/backstage/api/1.0/${creds.account_id}/reports/campaign-summary/dimensions/day?start_date=${from}&end_date=${to}`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const data = await res.json() as any;
  if (data.message) throw new Error(data.message);

  const grouped: Record<string, any> = {};
  for (const row of (data.results || [])) {
    const key = row.campaign_name || 'Unknown';
    if (!grouped[key]) grouped[key] = { campaign: key, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    grouped[key].spend += parseFloat(row.spent || '0');
    grouped[key].impressions += parseInt(row.impressions || '0');
    grouped[key].clicks += parseInt(row.clicks || '0');
    grouped[key].conversions += parseInt(row.cpa_actions_num || '0');
  }
  return Object.values(grouped);
}

async function fetchTwitter(creds: any, from: string, to: string) {
  const OAuth = (await import('oauth-1.0a')).default;
  const crypto = await import('crypto');

  const oauth = new OAuth({
    consumer: { key: creds.consumer_key, secret: creds.consumer_secret },
    signature_method: 'HMAC-SHA1',
    hash_function: (base: string, key: string) =>
      crypto.createHmac('sha1', key).update(base).digest('base64'),
  });

  const url = `https://ads-api.twitter.com/12/stats/accounts/${creds.account_id}?metric_groups=BILLING,ENGAGEMENT&start_time=${from}T00:00:00Z&end_time=${to}T23:59:59Z&entity=CAMPAIGN&granularity=DAY&placement=ALL_ON_TWITTER`;

  const token = { key: creds.access_token, secret: creds.access_token_secret };
  const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token));

  const res = await fetch(url, { headers: { ...authHeader } });
  const data = await res.json() as any;
  if (data.errors) throw new Error(data.errors[0]?.message || 'Twitter API error');

  return (data.data || []).map((row: any) => {
    const metrics = row.id_data?.[0]?.metrics || {};
    return {
      campaign: row.id || 'Unknown',
      spend: (metrics.billed_charge_local_micro?.[0] || 0) / 1_000_000,
      impressions: metrics.impressions?.[0] || 0,
      clicks: (metrics.clicks?.[0] || 0),
      conversions: metrics.conversion_purchases?.[0] || 0,
    };
  });
}

async function fetchReddit(creds: any, from: string, to: string) {
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${creds.client_id}:${creds.client_secret}`).toString('base64')}`,
      'User-Agent': 'adiology/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    }),
  });
  const tokenData = await tokenRes.json() as any;
  if (!tokenData.access_token) throw new Error('Failed to get Reddit token');

  const res = await fetch(
    `https://ads-api.reddit.com/api/v3/accounts/${creds.account_id}/campaigns?date_start=${from}&date_end=${to}&fields=name,spend_amount,impressions,clicks,conversions`,
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'adiology/1.0',
      },
    }
  );
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error);

  return (data.data || []).map((row: any) => ({
    campaign: row.name || 'Unknown',
    spend: parseFloat(row.spend_amount || '0') / 100,
    impressions: parseInt(row.impressions || '0'),
    clicks: parseInt(row.clicks || '0'),
    conversions: parseInt(row.conversions || '0'),
  }));
}

const PLATFORM_FETCHERS: Record<string, (creds: any, from: string, to: string) => Promise<any[]>> = {
  google: fetchGoogleAds,
  meta: fetchMeta,
  linkedin: fetchLinkedIn,
  taboola: fetchTaboola,
  twitter: fetchTwitter,
  reddit: fetchReddit,
};

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/ad-platforms', authMiddleware, async (c) => {
  try {
    const result = await db.execute(sql`
      SELECT id, platform, account_id as "accountId", account_name as "accountName",
             status, last_error as "lastError", last_synced as "lastSynced",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM ad_platform_connections
      ORDER BY platform
    `);
    return c.json({ connections: result.rows });
  } catch (error: any) {
    console.error('[AdPlatforms] List error:', error);
    return c.json({ connections: [] });
  }
});

app.post('/ad-platforms', authMiddleware, async (c) => {
  try {
    const { platform, accountId, accountName, credentials } = await c.req.json();

    if (!platform || !credentials) {
      return c.json({ error: 'platform and credentials are required' }, 400);
    }

    await db.execute(sql`
      INSERT INTO ad_platform_connections (platform, account_id, account_name, credentials, status, updated_at)
      VALUES (${platform}, ${accountId || null}, ${accountName || null}, ${JSON.stringify(credentials)}::jsonb, 'connected', NOW())
      ON CONFLICT (platform) DO UPDATE
        SET account_id = EXCLUDED.account_id,
            account_name = EXCLUDED.account_name,
            credentials = EXCLUDED.credentials,
            status = 'connected',
            last_error = NULL,
            updated_at = NOW()
    `);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[AdPlatforms] Save error:', error);
    return c.json({ error: error.message || 'Failed to save connection' }, 500);
  }
});

app.delete('/ad-platforms/:platform', authMiddleware, async (c) => {
  try {
    const platform = c.req.param('platform');
    await db.execute(sql`DELETE FROM ad_platform_connections WHERE platform = ${platform}`);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to disconnect platform' }, 500);
  }
});

app.post('/ad-platforms/:platform/fetch', authMiddleware, async (c) => {
  const platform = c.req.param('platform');
  try {
    const { from, to } = await c.req.json();

    const connResult = await db.execute(sql`
      SELECT credentials, account_id, account_name FROM ad_platform_connections
      WHERE platform = ${platform} AND status = 'connected'
      LIMIT 1
    `);

    if (connResult.rows.length === 0) {
      return c.json({ error: 'Platform not connected' }, 404);
    }

    const conn = connResult.rows[0] as any;
    const credentials = conn.credentials;

    const fetcher = PLATFORM_FETCHERS[platform];
    if (!fetcher) {
      return c.json({ error: 'Unsupported platform' }, 400);
    }

    const campaigns = await fetcher(credentials, from, to);

    const totals = campaigns.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        impressions: acc.impressions + (c.impressions || 0),
        clicks: acc.clicks + (c.clicks || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    await db.execute(sql`
      UPDATE ad_platform_connections
      SET last_synced = NOW(), status = 'connected', last_error = NULL, updated_at = NOW()
      WHERE platform = ${platform}
    `);

    return c.json({
      platform,
      accountName: conn.account_name,
      ...totals,
      campaigns: campaigns.slice(0, 50),
    });
  } catch (error: any) {
    console.error(`[AdPlatforms] Fetch ${platform} error:`, error);
    await db.execute(sql`
      UPDATE ad_platform_connections
      SET status = 'error', last_error = ${error.message}, updated_at = NOW()
      WHERE platform = ${platform}
    `).catch(() => {});
    return c.json({ error: error.message || 'Failed to fetch data' }, 500);
  }
});

app.post('/ad-platforms/fetch-all', authMiddleware, async (c) => {
  try {
    const { from, to } = await c.req.json();

    const connResult = await db.execute(sql`
      SELECT platform, credentials, account_name FROM ad_platform_connections
      WHERE status = 'connected'
    `);

    const results = await Promise.allSettled(
      connResult.rows.map(async (conn: any) => {
        const fetcher = PLATFORM_FETCHERS[conn.platform];
        if (!fetcher) return null;
        const campaigns = await fetcher(conn.credentials, from, to);
        const totals = campaigns.reduce(
          (acc: any, c: any) => ({
            spend: acc.spend + (c.spend || 0),
            impressions: acc.impressions + (c.impressions || 0),
            clicks: acc.clicks + (c.clicks || 0),
            conversions: acc.conversions + (c.conversions || 0),
          }),
          { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
        );
        await db.execute(sql`
          UPDATE ad_platform_connections
          SET last_synced = NOW(), status = 'connected', last_error = NULL, updated_at = NOW()
          WHERE platform = ${conn.platform}
        `).catch(() => {});
        return { platform: conn.platform, accountName: conn.account_name, ...totals, campaigns };
      })
    );

    const platforms: any[] = [];
    const errors: any[] = [];

    results.forEach((r, i) => {
      const conn = connResult.rows[i] as any;
      if (r.status === 'fulfilled' && r.value) {
        platforms.push(r.value);
      } else if (r.status === 'rejected') {
        errors.push({ platform: conn.platform, error: r.reason?.message });
        db.execute(sql`
          UPDATE ad_platform_connections
          SET status = 'error', last_error = ${r.reason?.message || 'Unknown error'}, updated_at = NOW()
          WHERE platform = ${conn.platform}
        `).catch(() => {});
      }
    });

    return c.json({ platforms, errors });
  } catch (error: any) {
    console.error('[AdPlatforms] Fetch all error:', error);
    return c.json({ platforms: [], errors: [{ platform: 'all', error: error.message }] });
  }
});

export const adPlatformsRoutes = app;
