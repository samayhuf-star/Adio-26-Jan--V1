import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { googleAdsTokens, campaignHistory, clickGuardIpPushLog } from '../../shared/schema';
import { desc } from 'drizzle-orm';
import { getUserIdFromToken } from '../utils/auth';

const googleAds = new Hono();

const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || '';
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const GOOGLE_ADS_MCC_REFRESH_TOKEN = process.env.GOOGLE_ADS_MCC_REFRESH_TOKEN || '';
const GOOGLE_ADS_MCC_CUSTOMER_ID = (process.env.GOOGLE_ADS_MCC_CUSTOMER_ID || '').replace(/-/g, '');
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18/';

let mccAccessToken: string | null = null;
let mccAccessTokenExpiry: Date | null = null;

async function getValidMCCAccessToken(): Promise<string | null> {
  if (!GOOGLE_ADS_MCC_REFRESH_TOKEN) {
    console.error('[GoogleAds] MCC refresh token not configured');
    return null;
  }

  if (mccAccessToken && mccAccessTokenExpiry && mccAccessTokenExpiry > new Date()) {
    return mccAccessToken;
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: GOOGLE_ADS_MCC_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    console.error('[GoogleAds] MCC token refresh failed:', await tokenResponse.text());
    return null;
  }

  const tokenData = await tokenResponse.json() as { access_token: string; expires_in: number };
  mccAccessToken = tokenData.access_token;
  mccAccessTokenExpiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);

  return mccAccessToken;
}

function getGoogleAdsHeaders(accessToken: string, loginCustomerId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');
  }
  return headers;
}

googleAds.post('/link-account', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const customerIdRaw = (body.customerId || '').replace(/[-\s]/g, '');

    if (!customerIdRaw || customerIdRaw.length !== 10 || !/^\d+$/.test(customerIdRaw)) {
      return c.json({ error: 'Invalid Customer ID. Must be a 10-digit number (e.g. 123-456-7890).' }, 400);
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ error: 'Google Ads MCC not configured. Please contact the administrator.' }, 500);
    }

    let accountName = `Account ${customerIdRaw}`;
    let verified = false;
    let inviteSent = false;

    try {
      const detailRes = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${customerIdRaw}`,
        {
          headers: getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID),
        }
      );

      if (detailRes.ok) {
        const detail = await detailRes.json() as {
          descriptiveName?: string;
          manager?: boolean;
          currencyCode?: string;
          timeZone?: string;
        };
        accountName = detail.descriptiveName || accountName;
        verified = true;
        console.log('[GoogleAds] Verified customer', customerIdRaw, '- name:', accountName);
      } else {
        const errText = await detailRes.text();
        console.warn('[GoogleAds] Could not verify customer', customerIdRaw, ':', errText.substring(0, 300));

        if (errText.includes('PERMISSION_DENIED') || errText.includes('USER_PERMISSION_DENIED')) {
          // MCC doesn't have access yet — send client link invitation FROM MCC TO user's account
          // Must use customerClientLinks:mutate (manager's perspective), NOT customerManagerLinks
          console.log('[GoogleAds] Sending client link invite to customer', customerIdRaw);
          const inviteRes = await fetch(
            `${GOOGLE_ADS_API_BASE}customers/${GOOGLE_ADS_MCC_CUSTOMER_ID}/customerClientLinks:mutate`,
            {
              method: 'POST',
              headers: getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID),
              body: JSON.stringify({
                operations: [{
                  create: {
                    clientCustomer: `customers/${customerIdRaw}`,
                    status: 'PENDING',
                  },
                }],
              }),
            }
          );

          const inviteText = await inviteRes.text();
          console.log('[GoogleAds] Invite response:', inviteRes.status, inviteText.substring(0, 400));

          if (inviteRes.ok || inviteText.includes('ALREADY_INVITED') || inviteText.includes('ALREADY_MANAGED')) {
            inviteSent = true;
            console.log('[GoogleAds] Manager invite sent/already pending for customer', customerIdRaw);
          } else {
            console.error('[GoogleAds] Failed to send invite:', inviteText);
            return c.json({
              error: `Could not send invitation to Google Ads account ${customerIdRaw.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}. Please verify the Customer ID is correct and try again.`,
              details: inviteText.substring(0, 200),
            }, 400);
          }
        }
      }
    } catch (err) {
      console.error('[GoogleAds] Error verifying/inviting customer:', err);
    }

    const existing = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    const tokenValues = {
      refreshToken: 'mcc_managed',
      accessToken: null as string | null,
      accessTokenExpiry: null as Date | null,
      customerId: customerIdRaw,
      loginCustomerId: GOOGLE_ADS_MCC_CUSTOMER_ID,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(googleAdsTokens)
        .set(tokenValues)
        .where(eq(googleAdsTokens.userId, userId));
    } else {
      await db.insert(googleAdsTokens).values({
        userId,
        ...tokenValues,
      });
    }

    return c.json({
      success: true,
      customerId: customerIdRaw,
      accountName,
      verified,
      inviteSent,
    });
  } catch (error: any) {
    console.error('[GoogleAds] Link account error:', error);
    return c.json({ error: 'Failed to link Google Ads account', message: error.message }, 500);
  }
});

googleAds.post('/unlink-account', async (c) => {
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
    console.error('[GoogleAds] Unlink error:', error);
    return c.json({ error: 'Failed to unlink account' }, 500);
  }
});

googleAds.post('/check-link-status', async (c) => {
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

    if (tokens.length === 0 || !tokens[0].customerId) {
      return c.json({ linked: false, verified: false });
    }

    const customerIdRaw = tokens[0].customerId;
    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ error: 'MCC not configured' }, 500);
    }

    const detailRes = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${customerIdRaw}`,
      { headers: getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID) }
    );

    if (detailRes.ok) {
      const detail = await detailRes.json() as { descriptiveName?: string };
      return c.json({
        linked: true,
        verified: true,
        customerId: customerIdRaw,
        accountName: detail.descriptiveName || `Account ${customerIdRaw}`,
      });
    } else {
      const errText = await detailRes.text();
      const isPending = errText.includes('PERMISSION_DENIED') || errText.includes('USER_PERMISSION_DENIED');
      return c.json({
        linked: true,
        verified: false,
        pending: isPending,
        customerId: customerIdRaw,
      });
    }
  } catch (error: any) {
    console.error('[GoogleAds] Check link status error:', error);
    return c.json({ error: 'Failed to check link status' }, 500);
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

    if (tokens.length === 0 || !tokens[0].customerId) {
      return c.json({ connected: false });
    }

    return c.json({
      connected: true,
      customerId: tokens[0].customerId,
      loginCustomerId: tokens[0].loginCustomerId || GOOGLE_ADS_MCC_CUSTOMER_ID || undefined,
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

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ error: 'MCC not configured' }, 500);
    }

    const queryRes = await fetch(
      `${GOOGLE_ADS_API_BASE}customers/${GOOGLE_ADS_MCC_CUSTOMER_ID}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID),
        body: JSON.stringify({
          query: `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.currency_code, customer_client.time_zone FROM customer_client WHERE customer_client.manager = false AND customer_client.status = 'ENABLED'`,
        }),
      }
    );

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      console.error('[GoogleAds] List MCC child accounts failed:', errText);
      return c.json({ error: 'Failed to list accounts', details: errText }, 500);
    }

    const queryData = await queryRes.json() as any[];
    const results = queryData?.[0]?.results || [];
    const accounts = results.map((r: any) => ({
      id: String(r.customerClient.id),
      name: r.customerClient.descriptiveName || `Account ${r.customerClient.id}`,
      isManager: false,
      managerId: GOOGLE_ADS_MCC_CUSTOMER_ID,
      currencyCode: r.customerClient.currencyCode,
      timezone: r.customerClient.timeZone,
    }));

    const userToken = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    return c.json({
      accounts,
      selectedCustomerId: userToken.length > 0 ? userToken[0].customerId : undefined,
      loginCustomerId: GOOGLE_ADS_MCC_CUSTOMER_ID,
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

googleAds.get('/mcc/status', async (c) => {
  try {
    const configured = !!(GOOGLE_ADS_MCC_REFRESH_TOKEN && GOOGLE_ADS_MCC_CUSTOMER_ID);
    if (!configured) {
      return c.json({ configured: false, connected: false });
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ configured: true, connected: false, error: 'Failed to get access token' });
    }

    let mccName = '';
    try {
      const detailRes = await fetch(
        `${GOOGLE_ADS_API_BASE}customers/${GOOGLE_ADS_MCC_CUSTOMER_ID}`,
        {
          headers: getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID),
        }
      );
      if (detailRes.ok) {
        const detail = await detailRes.json() as { descriptiveName?: string };
        mccName = detail.descriptiveName || '';
      }
    } catch {}

    return c.json({
      configured: true,
      connected: true,
      mccCustomerId: GOOGLE_ADS_MCC_CUSTOMER_ID,
      mccName,
    });
  } catch (error: any) {
    return c.json({ configured: false, connected: false, error: error.message }, 500);
  }
});

googleAds.post('/push', async (c) => {
  try {
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userToken = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    if (userToken.length === 0 || !userToken[0].customerId) {
      return c.json({ error: 'Google Ads account not linked. Please link your Customer ID first.' }, 401);
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ error: 'Google Ads MCC not configured. Please contact the administrator.' }, 500);
    }

    const body = await c.req.json();
    const name = body.name || body.campaignName;
    const budget = body.budget || body.dailyBudget;
    const { keywords, ads, adGroups, headlines, descriptions, finalUrl, geoTargets, campaignHistoryId } = body;

    if (!name || !budget) {
      return c.json({ error: 'Campaign name and budget are required' }, 400);
    }

    const customerId = userToken[0].customerId.replace(/-/g, '');
    const loginCid = GOOGLE_ADS_MCC_CUSTOMER_ID;
    const headers = getGoogleAdsHeaders(accessToken, loginCid);

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
        const adHeadlines = (ad.headlines || []).slice(0, 15).map((h: string) => ({ text: h.substring(0, 30) }));
        const adDescriptions = (ad.descriptions || []).slice(0, 4).map((d: string) => ({ text: d.substring(0, 90) }));

        while (adHeadlines.length < 3) {
          adHeadlines.push({ text: name.substring(0, 30) });
        }
        while (adDescriptions.length < 2) {
          adDescriptions.push({ text: `Learn more about ${name}`.substring(0, 90) });
        }

        return {
          create: {
            adGroup: adGroupResourceName,
            ad: {
              responsiveSearchAd: {
                headlines: adHeadlines,
                descriptions: adDescriptions,
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
      campaignId: googleAdsCampaignId,
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

    const userToken = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    if (userToken.length === 0 || !userToken[0].customerId) {
      return c.json({ error: 'Google Ads account not linked' }, 401);
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) {
      return c.json({ error: 'MCC not configured' }, 500);
    }

    const updateBody = await c.req.json();
    const { googleAdsCampaignId, keywords, ads, campaignHistoryId } = updateBody;
    const name = updateBody.name || updateBody.campaignName;
    const budget = updateBody.budget || updateBody.dailyBudget;

    if (!googleAdsCampaignId) {
      return c.json({ error: 'Google Ads campaign ID is required' }, 400);
    }

    const customerId = userToken[0].customerId.replace(/-/g, '');
    const loginCid = GOOGLE_ADS_MCC_CUSTOMER_ID;
    const headers = getGoogleAdsHeaders(accessToken, loginCid);
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
      campaignId: googleAdsCampaignId,
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

    const userToken = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    if (userToken.length === 0 || !userToken[0].customerId) {
      return c.json({ error: 'Google Ads account not linked' }, 401);
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) return c.json({ error: 'MCC not configured' }, 500);

    const customerId = userToken[0].customerId.replace(/-/g, '');
    const headers = getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID);

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

    const userToken = await db
      .select()
      .from(googleAdsTokens)
      .where(eq(googleAdsTokens.userId, userId))
      .limit(1);

    if (userToken.length === 0 || !userToken[0].customerId) {
      return c.json({ error: 'Google Ads account not linked' }, 401);
    }

    const accessToken = await getValidMCCAccessToken();
    if (!accessToken) return c.json({ error: 'MCC not configured' }, 500);

    const body = await c.req.json();
    const { ipAddresses, campaignIds, siteId } = body;

    if (!ipAddresses || !Array.isArray(ipAddresses) || ipAddresses.length === 0) {
      return c.json({ error: 'No IP addresses provided' }, 400);
    }
    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return c.json({ error: 'No campaign IDs provided' }, 400);
    }

    const customerId = userToken[0].customerId.replace(/-/g, '');
    const headers = getGoogleAdsHeaders(accessToken, GOOGLE_ADS_MCC_CUSTOMER_ID);

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
