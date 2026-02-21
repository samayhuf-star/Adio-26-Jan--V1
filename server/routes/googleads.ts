import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createHmac, randomBytes } from 'crypto';
import { db } from '../db';
import { googleAdsTokens, campaignHistory, clickGuardIpPushLog } from '../../shared/schema';
import { desc, and } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const googleAds = new Hono();

const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || '';
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18/';

const STATE_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || randomBytes(32).toString('hex');

function signOAuthState(userId: string): string {
  const nonce = randomBytes(16).toString('hex');
  const payload = JSON.stringify({ userId, nonce, ts: Date.now() });
  const signature = createHmac('sha256', STATE_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
}

function verifyOAuthState(stateParam: string): { userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    const { payload, signature } = decoded;
    const expectedSig = createHmac('sha256', STATE_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(payload);
    const age = Date.now() - data.ts;
    if (age > 10 * 60 * 1000) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

function getRedirectUri(requestHost?: string): string {
  if (requestHost && !requestHost.includes('adiology.io')) {
    const protocol = 'https';
    return `${protocol}://${requestHost}/api/google-ads/auth/callback`;
  }
  return 'https://adiology.io/api/google-ads/auth/callback';
}

function getGoogleAdsHeaders(accessToken: string, customerId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };
  if (customerId) {
    headers['login-customer-id'] = customerId.replace(/-/g, '');
  }
  return headers;
}

async function getValidAccessToken(userId: string): Promise<{ accessToken: string; customerId: string | null; loginCustomerId: string | null } | null> {
  const tokens = await db
    .select()
    .from(googleAdsTokens)
    .where(eq(googleAdsTokens.userId, userId))
    .limit(1);

  if (tokens.length === 0) return null;

  const tokenRecord = tokens[0];
  const now = new Date();

  if (tokenRecord.accessToken && tokenRecord.accessTokenExpiry && tokenRecord.accessTokenExpiry > now) {
    return {
      accessToken: tokenRecord.accessToken,
      customerId: tokenRecord.customerId,
      loginCustomerId: tokenRecord.loginCustomerId,
    };
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: tokenRecord.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    console.error('[GoogleAds] Token refresh failed:', await tokenResponse.text());
    return null;
  }

  const tokenData = await tokenResponse.json() as { access_token: string; expires_in: number };
  const expiry = new Date(Date.now() + tokenData.expires_in * 1000);

  await db
    .update(googleAdsTokens)
    .set({
      accessToken: tokenData.access_token,
      accessTokenExpiry: expiry,
      updatedAt: new Date(),
    })
    .where(eq(googleAdsTokens.userId, userId));

  return {
    accessToken: tokenData.access_token,
    customerId: tokenRecord.customerId,
    loginCustomerId: tokenRecord.loginCustomerId,
  };
}

googleAds.get('/auth/url', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const host = c.req.header('host') || '';
    const redirectUri = getRedirectUri(host);
    console.log('[GoogleAds] Auth URL - host:', host, 'redirectUri:', redirectUri);

    const stateData = signOAuthState(userId);
    const stateWithHost = Buffer.from(JSON.stringify({ 
      s: stateData, 
      h: host 
    })).toString('base64url');

    const params = new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      prompt: 'consent',
      state: stateWithHost,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return c.json({ url });
  } catch (error: any) {
    console.error('[GoogleAds] Auth URL error:', error);
    return c.json({ error: 'Failed to generate auth URL' }, 500);
  }
});

googleAds.get('/auth/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const stateParam = c.req.query('state');
    const error = c.req.query('error');
    const callbackHost = c.req.header('host') || '';

    console.log('[GoogleAds] Callback received - host:', callbackHost);

    if (error) {
      console.error('[GoogleAds] OAuth error:', error);
      return c.redirect('/?google_ads_error=' + encodeURIComponent(error));
    }

    if (!code || !stateParam) {
      return c.redirect('/?google_ads_error=missing_params');
    }

    let originalHost = '';
    let stateData = '';
    try {
      const stateWrapper = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
      stateData = stateWrapper.s || stateParam;
      originalHost = stateWrapper.h || '';
    } catch {
      stateData = stateParam;
    }

    const state = verifyOAuthState(stateData);
    if (!state) {
      console.error('[GoogleAds] Invalid or expired OAuth state');
      return c.redirect('/?google_ads_error=invalid_state');
    }

    const redirectUri = getRedirectUri(originalHost || callbackHost);
    console.log('[GoogleAds] Token exchange - redirectUri:', redirectUri);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('[GoogleAds] Token exchange failed:', errText);
      return c.redirect('/?google_ads_error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokenData.refresh_token) {
      console.error('[GoogleAds] No refresh token received');
      return c.redirect('/?google_ads_error=no_refresh_token');
    }

    console.log('[GoogleAds] Token exchange successful, fetching accessible customers...');
    const expiry = new Date(Date.now() + tokenData.expires_in * 1000);

    let customerId: string | null = null;
    let loginCustomerId: string | null = null;
    let accessibleAccounts: Array<{ id: string; name: string; isManager: boolean }> = [];

    try {
      const customerResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers:listAccessibleCustomers`,
        {
          headers: getGoogleAdsHeaders(tokenData.access_token),
        }
      );

      const customerResponseText = await customerResponse.text();
      console.log('[GoogleAds] listAccessibleCustomers status:', customerResponse.status, 'response:', customerResponseText.substring(0, 500));

      if (customerResponse.ok) {
        const customerData = JSON.parse(customerResponseText) as { resourceNames?: string[] };
        const resourceNames = customerData.resourceNames || [];
        console.log('[GoogleAds] Found', resourceNames.length, 'accessible customers:', resourceNames);
        
        for (const rn of resourceNames) {
          const cid = rn.replace('customers/', '');
          try {
            const detailRes = await fetch(
              `${GOOGLE_ADS_API_BASE}customers/${cid}`,
              {
                headers: getGoogleAdsHeaders(tokenData.access_token, cid),
              }
            );
            const detailText = await detailRes.text();
            if (detailRes.ok) {
              const detail = JSON.parse(detailText) as { 
                descriptiveName?: string; 
                manager?: boolean;
                id?: string;
              };
              console.log('[GoogleAds] Customer', cid, '- name:', detail.descriptiveName, 'manager:', detail.manager);
              accessibleAccounts.push({
                id: cid,
                name: detail.descriptiveName || `Account ${cid}`,
                isManager: detail.manager === true,
              });
              if (detail.manager === true && !loginCustomerId) {
                loginCustomerId = cid;
              }
            } else {
              console.warn('[GoogleAds] Customer detail fetch failed for', cid, ':', detailText.substring(0, 300));
              accessibleAccounts.push({
                id: cid,
                name: `Account ${cid}`,
                isManager: false,
              });
            }
          } catch (detailErr) {
            console.error('[GoogleAds] Customer detail error for', cid, ':', detailErr);
            accessibleAccounts.push({
              id: cid,
              name: `Account ${cid}`,
              isManager: false,
            });
          }
        }

        const clientAccounts = accessibleAccounts.filter(a => !a.isManager);
        const managerAccounts = accessibleAccounts.filter(a => a.isManager);

        if (clientAccounts.length > 0) {
          customerId = clientAccounts[0].id;
        } else if (managerAccounts.length > 0) {
          customerId = managerAccounts[0].id;
        }

        if (managerAccounts.length > 0) {
          loginCustomerId = managerAccounts[0].id;
        }
      } else {
        console.error('[GoogleAds] listAccessibleCustomers failed - this usually means the developer token is not approved or in test mode');
      }
    } catch (err) {
      console.error('[GoogleAds] Failed to fetch customer IDs:', err);
    }

    console.log('[GoogleAds] Saving tokens - userId:', state.userId, 'customerId:', customerId, 'loginCustomerId:', loginCustomerId, 'accounts found:', accessibleAccounts.length);

    const existing = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, state.userId))
      .limit(1);

    const tokenValues = {
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token,
      accessTokenExpiry: expiry,
      customerId,
      loginCustomerId,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(googleAdsTokens)
        .set(tokenValues)
        .where(eq(googleAdsTokens.userId, state.userId));
    } else {
      await db.insert(googleAdsTokens).values({
        userId: state.userId,
        ...tokenValues,
      });
    }

    console.log('[GoogleAds] Tokens saved successfully, redirecting...');
    return c.redirect('/?google_ads_connected=true');
  } catch (error: any) {
    console.error('[GoogleAds] Callback error:', error);
    return c.redirect('/?google_ads_error=callback_failed');
  }
});

googleAds.get('/auth/status', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokens = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    if (tokens.length === 0) {
      return c.json({ connected: false });
    }

    return c.json({
      connected: true,
      customerId: tokens[0].customerId || undefined,
      loginCustomerId: tokens[0].loginCustomerId || undefined,
    });
  } catch (error: any) {
    console.error('[GoogleAds] Auth status error:', error);
    return c.json({ error: 'Failed to check auth status' }, 500);
  }
});

googleAds.get('/auth/accounts', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokenInfo = await getValidAccessToken(userId);
    if (!tokenInfo) {
      return c.json({ error: 'Google Ads not connected' }, 401);
    }

    const customerResponse = await fetch(
      `${GOOGLE_ADS_API_BASE}customers:listAccessibleCustomers`,
      {
        headers: getGoogleAdsHeaders(tokenInfo.accessToken),
      }
    );

    if (!customerResponse.ok) {
      const errText = await customerResponse.text();
      console.error('[GoogleAds] List customers failed:', errText);
      return c.json({ error: 'Failed to list accounts', details: errText }, 500);
    }

    const customerData = await customerResponse.json() as { resourceNames?: string[] };
    const resourceNames = customerData.resourceNames || [];
    console.log('[GoogleAds] /auth/accounts - found', resourceNames.length, 'accounts for user:', userId);

    const accounts: Array<{ id: string; name: string; isManager: boolean; currencyCode?: string; timezone?: string }> = [];

    for (const rn of resourceNames) {
      const cid = rn.replace('customers/', '');
      try {
        const detailRes = await fetch(
          `${GOOGLE_ADS_API_BASE}customers/${cid}`,
          {
            headers: getGoogleAdsHeaders(tokenInfo.accessToken, cid),
          }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json() as {
            descriptiveName?: string;
            manager?: boolean;
            currencyCode?: string;
            timeZone?: string;
          };
          accounts.push({
            id: cid,
            name: detail.descriptiveName || `Account ${cid}`,
            isManager: detail.manager === true,
            currencyCode: detail.currencyCode,
            timezone: detail.timeZone,
          });
        } else {
          accounts.push({
            id: cid,
            name: `Account ${cid}`,
            isManager: false,
          });
        }
      } catch {
        accounts.push({
          id: cid,
          name: `Account ${cid}`,
          isManager: false,
        });
      }
    }

    const managerAccounts = accounts.filter(a => a.isManager);
    let childAccounts: Array<{ id: string; name: string; isManager: boolean; managerId?: string; currencyCode?: string; timezone?: string }> = [];

    for (const mgr of managerAccounts) {
      try {
        const queryRes = await fetch(
          `${GOOGLE_ADS_API_BASE}customers/${mgr.id}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: getGoogleAdsHeaders(tokenInfo.accessToken, mgr.id),
            body: JSON.stringify({
              query: `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.currency_code, customer_client.time_zone FROM customer_client WHERE customer_client.manager = false AND customer_client.status = 'ENABLED'`,
            }),
          }
        );

        if (queryRes.ok) {
          const queryData = await queryRes.json() as any[];
          const results = queryData?.[0]?.results || [];
          for (const r of results) {
            const cc = r.customerClient;
            if (cc && cc.id) {
              const existsInAccounts = accounts.some(a => a.id === String(cc.id)) || childAccounts.some(a => a.id === String(cc.id));
              if (!existsInAccounts) {
                childAccounts.push({
                  id: String(cc.id),
                  name: cc.descriptiveName || `Account ${cc.id}`,
                  isManager: false,
                  managerId: mgr.id,
                  currencyCode: cc.currencyCode,
                  timezone: cc.timeZone,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`[GoogleAds] Failed to fetch children for MCC ${mgr.id}:`, err);
      }
    }

    const childMap = new Map<string, string>();
    for (const child of childAccounts) {
      if (child.managerId) {
        childMap.set(child.id, child.managerId);
      }
    }

    const allAccounts = [
      ...accounts.map(a => ({
        ...a,
        managerId: childMap.get(a.id) || (a.isManager ? undefined : (managerAccounts.length > 0 ? managerAccounts[0].id : undefined)) as string | undefined,
      })),
      ...childAccounts.filter(c => !accounts.some(a => a.id === c.id)),
    ];

    return c.json({
      accounts: allAccounts,
      selectedCustomerId: tokenInfo.customerId || undefined,
      loginCustomerId: tokenInfo.loginCustomerId || undefined,
    });
  } catch (error: any) {
    console.error('[GoogleAds] List accounts error:', error);
    return c.json({ error: 'Failed to list accounts', message: error.message }, 500);
  }
});

googleAds.post('/auth/disconnect', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await db
      .delete(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId));

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[GoogleAds] Disconnect error:', error);
    return c.json({ error: 'Failed to disconnect' }, 500);
  }
});

googleAds.post('/push', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokenInfo = await getValidAccessToken(userId);
    if (!tokenInfo) {
      return c.json({ error: 'Google Ads not connected. Please connect your account first.' }, 401);
    }

    const body = await c.req.json();
    const name = body.name || body.campaignName;
    const budget = body.budget || body.dailyBudget;
    const { keywords, ads, adGroups, headlines, descriptions, finalUrl, geoTargets, campaignHistoryId, customerId: bodyCustomerId, loginCustomerId: bodyLoginCustomerId } = body;

    if (!name || !budget) {
      return c.json({ error: 'Campaign name and budget are required' }, 400);
    }

    const customerId = (bodyCustomerId || tokenInfo.customerId)?.replace(/-/g, '');
    if (!customerId) {
      return c.json({ error: 'No Google Ads customer ID found. Please reconnect your account.' }, 400);
    }

    const loginCid = (bodyLoginCustomerId || tokenInfo.loginCustomerId || customerId)?.replace(/-/g, '');
    const headers = getGoogleAdsHeaders(tokenInfo.accessToken, loginCid);

    const budgetResponse = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaignBudgets:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              name: `${name} Budget`,
              amountMicros: String(Math.round(parseFloat(budget) * 1000000)),
              deliveryMethod: 'STANDARD',
            },
          }],
        }),
      }
    );

    if (!budgetResponse.ok) {
      const errText = await budgetResponse.text();
      console.error('[GoogleAds] Budget creation failed:', errText);
      if (campaignHistoryId) {
        await db.update(campaignHistory).set({
          googleAdsPushStatus: 'failed',
          updatedAt: new Date(),
        }).where(eq(campaignHistory.id, campaignHistoryId));
      }
      return c.json({ error: 'Failed to create campaign budget', details: errText }, 500);
    }

    const budgetData = await budgetResponse.json() as { results: { resourceName: string }[] };
    const budgetResourceName = budgetData.results[0].resourceName;

    const campaignResponse = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaigns:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              name,
              status: 'PAUSED',
              advertisingChannelType: 'SEARCH',
              campaignBudget: budgetResourceName,
              networkSettings: {
                targetGoogleSearch: true,
                targetSearchNetwork: true,
                targetContentNetwork: false,
              },
            },
          }],
        }),
      }
    );

    if (!campaignResponse.ok) {
      const errText = await campaignResponse.text();
      console.error('[GoogleAds] Campaign creation failed:', errText);
      if (campaignHistoryId) {
        await db.update(campaignHistory).set({
          googleAdsPushStatus: 'failed',
          updatedAt: new Date(),
        }).where(eq(campaignHistory.id, campaignHistoryId));
      }
      return c.json({ error: 'Failed to create campaign', details: errText }, 500);
    }

    const campaignData = await campaignResponse.json() as { results: { resourceName: string }[] };
    const campaignResourceName = campaignData.results[0].resourceName;
    const googleAdsCampaignId = campaignResourceName.split('/').pop() || '';

    const adGroupResponse = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${customerId}/adGroups:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{
            create: {
              name: `${name} Ad Group`,
              campaign: campaignResourceName,
              status: 'ENABLED',
              type: 'SEARCH_STANDARD',
            },
          }],
        }),
      }
    );

    if (!adGroupResponse.ok) {
      console.error('[GoogleAds] Ad group creation failed:', await adGroupResponse.text());
    }

    const adGroupData = await adGroupResponse.json() as { results: { resourceName: string }[] };
    const adGroupResourceName = adGroupData.results?.[0]?.resourceName;

    if (adGroupResourceName && keywords && Array.isArray(keywords) && keywords.length > 0) {
      const keywordOperations = keywords.map((kw: any) => ({
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          keyword: {
            text: typeof kw === 'string' ? kw : kw.text || kw.keyword,
            matchType: typeof kw === 'string' ? 'BROAD' : (kw.matchType || 'BROAD').toUpperCase(),
          },
        },
      }));

      const keywordResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerId}/adGroupCriteria:mutate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ operations: keywordOperations }),
        }
      );

      if (!keywordResponse.ok) {
        console.error('[GoogleAds] Keywords creation failed:', await keywordResponse.text());
      }
    }

    if (adGroupResourceName && ads && Array.isArray(ads) && ads.length > 0) {
      const adOperations = ads.map((ad: any) => {
        const headlines = (ad.headlines || []).slice(0, 15).map((h: string) => ({ text: h.substring(0, 30) }));
        const descriptions = (ad.descriptions || []).slice(0, 4).map((d: string) => ({ text: d.substring(0, 90) }));

        while (headlines.length < 3) {
          headlines.push({ text: name.substring(0, 30) });
        }
        while (descriptions.length < 2) {
          descriptions.push({ text: `Learn more about ${name}`.substring(0, 90) });
        }

        return {
          create: {
            adGroup: adGroupResourceName,
            ad: {
              responsiveSearchAd: {
                headlines,
                descriptions,
                path1: ad.path1 || '',
                path2: ad.path2 || '',
              },
              finalUrls: ad.finalUrls || ad.finalUrl ? [ad.finalUrl] : ['https://example.com'],
            },
            status: 'ENABLED',
          },
        };
      });

      const adResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerId}/adGroupAds:mutate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ operations: adOperations }),
        }
      );

      if (!adResponse.ok) {
        console.error('[GoogleAds] Ads creation failed:', await adResponse.text());
      }
    }

    if (geoTargets && Array.isArray(geoTargets) && geoTargets.length > 0) {
      const geoOperations = geoTargets.map((geo: any) => ({
        create: {
          campaign: campaignResourceName,
          location: {
            geoTargetConstant: `geoTargetConstants/${geo.id || geo}`,
          },
        },
      }));

      const geoResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaignCriteria:mutate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ operations: geoOperations }),
        }
      );

      if (!geoResponse.ok) {
        console.error('[GoogleAds] Geo targeting failed:', await geoResponse.text());
      }
    }

    if (campaignHistoryId) {
      await db.update(campaignHistory).set({
        googleAdsId: googleAdsCampaignId,
        googleAdsPushStatus: 'pushed',
        googleAdsPushedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(campaignHistory.id, campaignHistoryId));
    }

    return c.json({
      success: true,
      googleAdsCampaignId,
      campaignResourceName,
    });
  } catch (error: any) {
    console.error('[GoogleAds] Push error:', error);
    return c.json({ error: 'Failed to push campaign to Google Ads', message: error.message }, 500);
  }
});

googleAds.post('/update', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokenInfo = await getValidAccessToken(userId);
    if (!tokenInfo) {
      return c.json({ error: 'Google Ads not connected' }, 401);
    }

    const updateBody = await c.req.json();
    const { googleAdsCampaignId, keywords, ads, campaignHistoryId, customerId: updateBodyCustomerId, loginCustomerId: updateBodyLoginCustomerId } = updateBody;
    const name = updateBody.name || updateBody.campaignName;
    const budget = updateBody.budget || updateBody.dailyBudget;

    if (!googleAdsCampaignId) {
      return c.json({ error: 'Google Ads campaign ID is required' }, 400);
    }

    const customerId = (updateBodyCustomerId || tokenInfo.customerId)?.replace(/-/g, '');
    if (!customerId) {
      return c.json({ error: 'No Google Ads customer ID found' }, 400);
    }

    const loginCid = (updateBodyLoginCustomerId || tokenInfo.loginCustomerId || customerId)?.replace(/-/g, '');
    const headers = getGoogleAdsHeaders(tokenInfo.accessToken, loginCid);
    const campaignResourceName = `customers/${customerId}/campaigns/${googleAdsCampaignId}`;

    const updateFields: any = {};
    const updateMask: string[] = [];

    if (name) {
      updateFields.name = name;
      updateMask.push('name');
    }

    if (Object.keys(updateFields).length > 0) {
      const updateResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaigns:mutate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            operations: [{
              update: {
                resourceName: campaignResourceName,
                ...updateFields,
              },
              updateMask: updateMask.join(','),
            }],
          }),
        }
      );

      if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        console.error('[GoogleAds] Campaign update failed:', errText);
        return c.json({ error: 'Failed to update campaign', details: errText }, 500);
      }
    }

    if (budget) {
      const queryResponse = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: `SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = ${googleAdsCampaignId}`,
          }),
        }
      );

      if (queryResponse.ok) {
        const queryData = await queryResponse.json() as any[];
        const budgetResourceName = queryData?.[0]?.results?.[0]?.campaign?.campaignBudget;

        if (budgetResourceName) {
          await fetch(
            `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaignBudgets:mutate`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                operations: [{
                  update: {
                    resourceName: budgetResourceName,
                    amountMicros: String(Math.round(parseFloat(budget) * 1000000)),
                  },
                  updateMask: 'amount_micros',
                }],
              }),
            }
          );
        }
      }
    }

    if (campaignHistoryId) {
      await db.update(campaignHistory).set({
        googleAdsPushStatus: 'updated',
        updatedAt: new Date(),
      }).where(eq(campaignHistory.id, campaignHistoryId));
    }

    return c.json({
      success: true,
      googleAdsCampaignId,
    });
  } catch (error: any) {
    console.error('[GoogleAds] Update error:', error);
    return c.json({ error: 'Failed to update campaign', message: error.message }, 500);
  }
});

googleAds.get('/campaigns', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tokenInfo = await getValidAccessToken(userId);
    if (!tokenInfo) return c.json({ error: 'Not connected to Google Ads' }, 401);

    const customerId = (c.req.query('customerId') || tokenInfo.customerId || '').replace(/-/g, '');
    const loginCustomerId = (c.req.query('loginCustomerId') || tokenInfo.loginCustomerId || '').replace(/-/g, '');

    if (!customerId) {
      return c.json({ error: 'No customer ID specified' }, 400);
    }

    const headers = getGoogleAdsHeaders(tokenInfo.accessToken, loginCustomerId || customerId);

    const response = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleAds] Campaign list error:', errorText);
      return c.json({ error: 'Failed to list campaigns', details: errorText }, 400);
    }

    const data = await response.json() as any[];
    const results = data?.[0]?.results || [];
    const campaigns = results.map((r: any) => ({
      id: r.campaign.id,
      name: r.campaign.name,
      status: r.campaign.status,
      channelType: r.campaign.advertisingChannelType,
      resourceName: r.campaign.resourceName,
    }));

    return c.json({ campaigns });
  } catch (error: any) {
    console.error('[GoogleAds] List campaigns error:', error);
    return c.json({ error: 'Failed to list campaigns', message: error.message }, 500);
  }
});

googleAds.post('/push-ip-exclusions', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const tokenInfo = await getValidAccessToken(userId);
    if (!tokenInfo) return c.json({ error: 'Not connected to Google Ads' }, 401);

    const body = await c.req.json();
    const { ipAddresses, campaignIds, customerId: reqCustomerId, loginCustomerId: reqLoginCustomerId, siteId } = body;

    if (!ipAddresses || !Array.isArray(ipAddresses) || ipAddresses.length === 0) {
      return c.json({ error: 'No IP addresses provided' }, 400);
    }
    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return c.json({ error: 'No campaign IDs provided' }, 400);
    }

    const customerId = (reqCustomerId || tokenInfo.customerId || '').replace(/-/g, '');
    const loginCustomerId = (reqLoginCustomerId || tokenInfo.loginCustomerId || '').replace(/-/g, '');

    if (!customerId) {
      return c.json({ error: 'No customer ID specified' }, 400);
    }

    const headers = getGoogleAdsHeaders(tokenInfo.accessToken, loginCustomerId || customerId);

    const results: any[] = [];
    const errors: any[] = [];

    for (const campaignId of campaignIds) {
      const operations = ipAddresses.map((ip: string) => ({
        create: {
          campaign: `customers/${customerId}/campaigns/${campaignId}`,
          negative: true,
          ip_block: {
            ip_address: ip,
          },
        },
      }));

      try {
        const response = await fetch(
          `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaignCriteria:mutate`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ operations }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            campaignId,
            success: true,
            count: ipAddresses.length,
            results: data.results?.length || 0,
          });
        } else {
          const errorText = await response.text();
          let parsedError;
          try { parsedError = JSON.parse(errorText); } catch { parsedError = errorText; }

          const alreadyExists = typeof errorText === 'string' && errorText.includes('CRITERION_ALREADY_EXISTS');
          if (alreadyExists) {
            const newOps = [];
            for (const ip of ipAddresses) {
              const singleOp = [{
                create: {
                  campaign: `customers/${customerId}/campaigns/${campaignId}`,
                  negative: true,
                  ip_block: { ip_address: ip },
                },
              }];
              try {
                const singleRes = await fetch(
                  `${GOOGLE_ADS_API_BASE}customers/${customerId}/campaignCriteria:mutate`,
                  { method: 'POST', headers, body: JSON.stringify({ operations: singleOp }) }
                );
                if (singleRes.ok) {
                  newOps.push(ip);
                }
              } catch {}
            }
            results.push({
              campaignId,
              success: true,
              count: newOps.length,
              skippedDuplicates: ipAddresses.length - newOps.length,
            });
          } else {
            errors.push({ campaignId, error: parsedError });
          }
        }
      } catch (err: any) {
        errors.push({ campaignId, error: err.message });
      }
    }

    const pushedAt = new Date();
    const status = errors.length === 0 ? 'success' : (results.length > 0 ? 'partial' : 'failed');

    if (siteId) {
      await db.insert(clickGuardIpPushLog).values({
        siteId,
        userId,
        googleAdsCustomerId: customerId,
        campaignIds: campaignIds,
        ipsCount: ipAddresses.length,
        ipsPushed: ipAddresses,
        status,
        errorMessage: errors.length > 0 ? JSON.stringify(errors) : null,
        pushedAt,
      });
    }

    return c.json({
      success: errors.length === 0,
      status,
      results,
      errors: errors.length > 0 ? errors : undefined,
      pushedAt: pushedAt.toISOString(),
      totalIpsPushed: ipAddresses.length,
      totalCampaigns: campaignIds.length,
    });
  } catch (error: any) {
    console.error('[GoogleAds] Push IP exclusions error:', error);
    return c.json({ error: 'Failed to push IP exclusions', message: error.message }, 500);
  }
});

googleAds.get('/ip-push-history/:siteId', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const siteId = c.req.param('siteId');

    const logs = await db
      .select()
      .from(clickGuardIpPushLog)
      .where(eq(clickGuardIpPushLog.siteId, siteId))
      .orderBy(desc(clickGuardIpPushLog.pushedAt))
      .limit(10);

    const lastPush = logs.length > 0 ? logs[0] : null;

    return c.json({
      lastPush: lastPush ? {
        pushedAt: lastPush.pushedAt,
        ipsCount: lastPush.ipsCount,
        campaignIds: lastPush.campaignIds,
        status: lastPush.status,
        googleAdsCustomerId: lastPush.googleAdsCustomerId,
      } : null,
      history: logs.map(l => ({
        id: l.id,
        pushedAt: l.pushedAt,
        ipsCount: l.ipsCount,
        campaignIds: l.campaignIds,
        status: l.status,
        googleAdsCustomerId: l.googleAdsCustomerId,
        errorMessage: l.errorMessage,
      })),
    });
  } catch (error: any) {
    console.error('[GoogleAds] IP push history error:', error);
    return c.json({ error: 'Failed to fetch push history', message: error.message }, 500);
  }
});

export const googleAdsRoutes = googleAds;
