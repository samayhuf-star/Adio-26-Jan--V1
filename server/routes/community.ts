import { Hono } from 'hono';
import crypto from 'crypto';

const community = new Hono();

const DISCOURSE_URL = process.env.DISCOURSE_URL || 'https://adiology.discourse.group';
const DISCOURSE_API_KEY = process.env.DISCOURSE_API_KEY || '';
const DISCOURSE_SSO_SECRET = process.env.DISCOURSE_SSO_SECRET || '';
const DISCOURSE_CATEGORY_ID = process.env.DISCOURSE_CATEGORY_ID || '5';

interface DiscourseUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

function verifySignature(payload: string, sig: string): boolean {
  const hmac = crypto.createHmac('sha256', DISCOURSE_SSO_SECRET);
  hmac.update(payload);
  const expectedSig = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
}

function decodePayload(sso: string): URLSearchParams {
  const decoded = Buffer.from(sso, 'base64').toString('utf-8');
  return new URLSearchParams(decoded);
}

function createSignedPayload(user: DiscourseUser, nonce: string): string {
  const payload = new URLSearchParams({
    nonce,
    email: user.email,
    external_id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'),
    ...(user.avatarUrl && { avatar_url: user.avatarUrl }),
    suppress_welcome_message: 'true',
  });

  const payloadString = payload.toString();
  const base64Payload = Buffer.from(payloadString).toString('base64');
  const signature = crypto
    .createHmac('sha256', DISCOURSE_SSO_SECRET)
    .update(base64Payload)
    .digest('hex');

  return `sso=${encodeURIComponent(base64Payload)}&sig=${signature}`;
}

community.get('/sso', async (c) => {
  try {
    const sso = c.req.query('sso');
    const sig = c.req.query('sig');

    if (!sso || !sig) {
      return c.json({ error: 'Missing SSO parameters' }, 400);
    }

    if (!DISCOURSE_SSO_SECRET) {
      return c.json({ error: 'SSO not configured' }, 500);
    }

    if (!verifySignature(sso, sig)) {
      return c.json({ error: 'Invalid signature' }, 403);
    }

    const params = decodePayload(sso);
    const nonce = params.get('nonce');
    const returnUrl = params.get('return_sso_url');

    if (!nonce) {
      return c.json({ error: 'Missing nonce in SSO payload' }, 400);
    }

    const sessionUser = c.req.query('user_data');
    let user: DiscourseUser;

    if (sessionUser) {
      try {
        user = JSON.parse(decodeURIComponent(sessionUser));
      } catch {
        return c.json({ error: 'Invalid user data' }, 400);
      }
    } else {
      return c.json({ 
        error: 'User not authenticated',
        authRequired: true,
        returnUrl: c.req.url
      }, 401);
    }

    const signedPayload = createSignedPayload(user, nonce);
    const redirectUrl = `${DISCOURSE_URL}/session/sso_login?${signedPayload}`;

    return c.redirect(redirectUrl);
  } catch (error) {
    console.error('SSO error:', error);
    return c.json({ error: 'SSO processing failed' }, 500);
  }
});

community.post('/sso/initiate', async (c) => {
  try {
    const { user, returnPath } = await c.req.json();

    if (!user?.id || !user?.email) {
      return c.json({ error: 'User data required' }, 400);
    }

    if (!DISCOURSE_SSO_SECRET) {
      return c.json({ error: 'SSO not configured' }, 500);
    }

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      username: user.username,
      avatarUrl: user.avatarUrl,
    }));

    const ssoInitiateUrl = `${DISCOURSE_URL}/session/sso?return_path=${encodeURIComponent(returnPath || '/')}`;

    return c.json({ 
      ssoUrl: ssoInitiateUrl,
      callbackUrl: `/api/community/sso?user_data=${userData}`
    });
  } catch (error) {
    console.error('SSO initiate error:', error);
    return c.json({ error: 'Failed to initiate SSO' }, 500);
  }
});

community.get('/topics', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const category = c.req.query('category');

    // Return mock data if Discourse is not configured
    if (!DISCOURSE_API_KEY) {
      return c.json({
        topics: getMockTopics().slice(0, limit),
        users: [],
        mock: true,
      });
    }

    let url = `${DISCOURSE_URL}/latest.json?per_page=${limit}`;
    if (category) {
      url = `${DISCOURSE_URL}/c/${category}.json?per_page=${limit}`;
    }

    const response = await fetch(url, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Discourse API error: ${response.status}`);
    }

    const data = await response.json();

    const topics =
      data.topic_list?.topics?.slice(0, limit).map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        excerpt: topic.excerpt || '',
        postsCount: topic.posts_count,
        replyCount: topic.reply_count,
        views: topic.views,
        likeCount: topic.like_count,
        createdAt: topic.created_at,
        lastPostedAt: topic.last_posted_at,
        categoryId: topic.category_id,
        pinned: topic.pinned,
        closed: topic.closed,
        author: data.users?.find(
          (u: any) => u.id === topic.posters?.[0]?.user_id
        ),
      })) || [];

    return c.json({ topics, users: data.users || [] });
  } catch (error) {
    console.error('Topics fetch error:', error);
    return c.json({
      topics: getMockTopics(),
      users: [],
      mock: true,
    });
  }
});

community.get('/topics/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    if (!DISCOURSE_API_KEY) {
      const mockTopic = getMockTopics().find(t => t.id === id);
      const mockPosts = getMockPosts(id);
      if (mockTopic) {
        return c.json({
          id: mockTopic.id,
          title: mockTopic.title,
          posts: mockPosts,
          mock: true,
        });
      }
    }

    const response = await fetch(`${DISCOURSE_URL}/t/${id}.json`, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Discourse API error: ${response.status}`);
    }

    const topic = await response.json();

    return c.json({
      id: topic.id,
      title: topic.title,
      posts:
        topic.post_stream?.posts?.map((post: any) => ({
          id: post.id,
          content: post.cooked,
          rawContent: post.raw,
          createdAt: post.created_at,
          author: {
            id: post.user_id,
            username: post.username,
            name: post.name,
            avatarUrl: post.avatar_template
              ? `${DISCOURSE_URL}${post.avatar_template.replace('{size}', '45')}`
              : null,
          },
          likeCount: post.like_count,
          replyCount: post.reply_count,
        })) || [],
    });
  } catch (error) {
    console.error('Topic fetch error:', error);
    return c.json({ error: 'Failed to fetch topic' }, 500);
  }
});

community.post('/posts', async (c) => {
  try {
    const { title, content, categoryId, userId, userEmail } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: 'Title and content required' }, 400);
    }

    if (!DISCOURSE_API_KEY) {
      return c.json({
        success: true,
        mock: true,
        message: 'Post would be created (Discourse not configured)',
      });
    }

    const response = await fetch(`${DISCOURSE_URL}/posts.json`, {
      method: 'POST',
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': userEmail?.split('@')[0] || 'system',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        raw: content,
        category: categoryId || DISCOURSE_CATEGORY_ID,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discourse API error: ${error}`);
    }

    const post = await response.json();

    return c.json({
      success: true,
      topicId: post.topic_id,
      postId: post.id,
      topicUrl: `${DISCOURSE_URL}/t/${post.topic_slug}/${post.topic_id}`,
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

community.get('/categories', async (c) => {
  try {
    // Return mock data if Discourse is not configured
    if (!DISCOURSE_API_KEY) {
      return c.json({ categories: getMockCategories(), mock: true });
    }

    const response = await fetch(`${DISCOURSE_URL}/categories.json`, {
      headers: {
        'Api-Key': DISCOURSE_API_KEY,
        'Api-Username': 'system',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return c.json({ categories: getMockCategories() });
    }

    const data = await response.json();

    const categories =
      data.category_list?.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        description: cat.description_text,
        topicCount: cat.topic_count,
      })) || [];

    return c.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return c.json({ categories: getMockCategories() });
  }
});

// Mock community members for realistic discussions
const mockMembers = [
  { id: 1, username: 'samay_v', name: 'Samay Vashisht', role: 'Admin' },
  { id: 2, username: 'sarah_ppc', name: 'Sarah Chen', role: 'PPC Expert' },
  { id: 3, username: 'mike_ads', name: 'Mike Rodriguez', role: 'Agency Owner' },
  { id: 4, username: 'emma_digital', name: 'Emma Thompson', role: 'Digital Marketer' },
  { id: 5, username: 'david_roi', name: 'David Park', role: 'Performance Specialist' },
  { id: 6, username: 'lisa_growth', name: 'Lisa Martinez', role: 'Growth Marketer' },
  { id: 7, username: 'alex_sem', name: 'Alex Johnson', role: 'SEM Consultant' },
  { id: 8, username: 'rachel_ecom', name: 'Rachel Kim', role: 'E-commerce Expert' },
  { id: 9, username: 'james_b2b', name: 'James Wilson', role: 'B2B Specialist' },
  { id: 10, username: 'nina_local', name: 'Nina Patel', role: 'Local Ads Expert' },
  { id: 11, username: 'chris_auto', name: 'Chris Brown', role: 'Automation Pro' },
  { id: 12, username: 'kate_creative', name: 'Kate Williams', role: 'Ad Creative Lead' },
  { id: 13, username: 'tom_analytics', name: 'Tom Anderson', role: 'Analytics Expert' },
  { id: 14, username: 'jen_startup', name: 'Jennifer Lee', role: 'Startup Advisor' },
  { id: 15, username: 'mark_scale', name: 'Mark Davis', role: 'Scaling Specialist' },
];

function getMockTopics() {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;
  
  return [
    // Pinned welcome post
    {
      id: 1,
      title: 'Welcome to the Adiology Community! Introduce Yourself Here',
      slug: 'welcome-introduce-yourself',
      excerpt: 'New to the community? Share your Google Ads experience and connect with fellow marketers...',
      postsCount: 47,
      replyCount: 46,
      views: 1892,
      likeCount: 89,
      createdAt: new Date(now - day * 60).toISOString(),
      lastPostedAt: new Date(now - hour * 2).toISOString(),
      categoryId: 5,
      pinned: true,
      closed: false,
      author: mockMembers[0],
    },
    // Campaign Structure
    {
      id: 2,
      title: 'SKAG vs STAG in 2024 - Which structure actually works better?',
      slug: 'skag-vs-stag-2024',
      excerpt: "I've been running SKAG campaigns for years but hearing STAG is more efficient now. What's your experience?",
      postsCount: 23,
      replyCount: 22,
      views: 1456,
      likeCount: 67,
      createdAt: new Date(now - day * 3).toISOString(),
      lastPostedAt: new Date(now - hour * 4).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[3],
    },
    {
      id: 3,
      title: 'How to structure campaigns for a multi-location business?',
      slug: 'multi-location-campaign-structure',
      excerpt: 'Managing ads for a client with 15 locations across 3 states. Best way to organize this?',
      postsCount: 18,
      replyCount: 17,
      views: 892,
      likeCount: 34,
      createdAt: new Date(now - day * 5).toISOString(),
      lastPostedAt: new Date(now - hour * 8).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[9],
    },
    // Bidding & Budget
    {
      id: 4,
      title: 'Target CPA vs Maximize Conversions - When to use which?',
      slug: 'target-cpa-vs-maximize-conversions',
      excerpt: "Started with Maximize Conversions but my CPA is all over the place. Should I switch to Target CPA?",
      postsCount: 31,
      replyCount: 30,
      views: 2134,
      likeCount: 78,
      createdAt: new Date(now - day * 2).toISOString(),
      lastPostedAt: new Date(now - hour * 1).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[4],
    },
    {
      id: 5,
      title: 'My CPC suddenly doubled overnight - what happened?',
      slug: 'cpc-doubled-overnight',
      excerpt: "Woke up to see my average CPC jumped from $2.50 to $5.20. No changes made. Anyone else experiencing this?",
      postsCount: 27,
      replyCount: 26,
      views: 1678,
      likeCount: 45,
      createdAt: new Date(now - day * 1).toISOString(),
      lastPostedAt: new Date(now - hour * 3).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[7],
    },
    {
      id: 6,
      title: 'How much budget do you need for Google Ads to be effective?',
      slug: 'minimum-budget-google-ads',
      excerpt: "Client wants to start with $500/month. Is that enough to get meaningful data or should I push for more?",
      postsCount: 35,
      replyCount: 34,
      views: 2890,
      likeCount: 92,
      createdAt: new Date(now - day * 7).toISOString(),
      lastPostedAt: new Date(now - hour * 5).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[13],
    },
    // Keywords
    {
      id: 7,
      title: 'Broad match keywords destroying my budget - help!',
      slug: 'broad-match-destroying-budget',
      excerpt: "Google rep told me to switch to broad match. Big mistake. Now getting tons of irrelevant clicks.",
      postsCount: 42,
      replyCount: 41,
      views: 3245,
      likeCount: 156,
      createdAt: new Date(now - day * 4).toISOString(),
      lastPostedAt: new Date(now - hour * 2).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[5],
    },
    {
      id: 8,
      title: 'How often do you review and add negative keywords?',
      slug: 'negative-keyword-review-frequency',
      excerpt: "I check search terms weekly but feel like I'm always behind. What's your process?",
      postsCount: 19,
      replyCount: 18,
      views: 1123,
      likeCount: 41,
      createdAt: new Date(now - day * 6).toISOString(),
      lastPostedAt: new Date(now - hour * 12).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[8],
    },
    {
      id: 9,
      title: 'Phrase match vs Exact match - what percentage do you use?',
      slug: 'phrase-vs-exact-match-ratio',
      excerpt: "Building a new account and wondering about the ideal keyword match type mix. Thoughts?",
      postsCount: 24,
      replyCount: 23,
      views: 1567,
      likeCount: 53,
      createdAt: new Date(now - day * 8).toISOString(),
      lastPostedAt: new Date(now - hour * 6).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[6],
    },
    {
      id: 10,
      title: 'Finding high-intent keywords that competitors are missing',
      slug: 'finding-hidden-keywords',
      excerpt: "Share your strategies for discovering keyword opportunities that others overlook.",
      postsCount: 28,
      replyCount: 27,
      views: 1890,
      likeCount: 87,
      createdAt: new Date(now - day * 10).toISOString(),
      lastPostedAt: new Date(now - hour * 9).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[1],
    },
    // Ad Copy & Creative
    {
      id: 11,
      title: 'RSA best practices - how many headlines do you actually need?',
      slug: 'rsa-headline-best-practices',
      excerpt: "Google says 15 headlines but that seems like overkill. What's working for you?",
      postsCount: 33,
      replyCount: 32,
      views: 2456,
      likeCount: 98,
      createdAt: new Date(now - day * 3).toISOString(),
      lastPostedAt: new Date(now - hour * 4).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[11],
    },
    {
      id: 12,
      title: 'Ad copy that actually converts - share your winners!',
      slug: 'winning-ad-copy-examples',
      excerpt: "Let's share ad copy that's performing well. I'll start with my best performing headline...",
      postsCount: 56,
      replyCount: 55,
      views: 4123,
      likeCount: 201,
      createdAt: new Date(now - day * 14).toISOString(),
      lastPostedAt: new Date(now - hour * 1).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[2],
    },
    {
      id: 13,
      title: 'Dynamic Keyword Insertion - still worth using in 2024?',
      slug: 'dki-worth-using-2024',
      excerpt: "DKI used to be my go-to but hearing mixed results lately. What's your take?",
      postsCount: 21,
      replyCount: 20,
      views: 1234,
      likeCount: 45,
      createdAt: new Date(now - day * 9).toISOString(),
      lastPostedAt: new Date(now - hour * 15).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[10],
    },
    // Quality Score
    {
      id: 14,
      title: 'Quality Score dropped from 8 to 4 - how to recover?',
      slug: 'quality-score-dropped-recovery',
      excerpt: "My main keyword's QS tanked after making landing page changes. What should I do?",
      postsCount: 25,
      replyCount: 24,
      views: 1789,
      likeCount: 56,
      createdAt: new Date(now - day * 2).toISOString(),
      lastPostedAt: new Date(now - hour * 7).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[12],
    },
    {
      id: 15,
      title: 'Does Quality Score really matter anymore with smart bidding?',
      slug: 'quality-score-smart-bidding',
      excerpt: "With automated bidding handling everything, should we still obsess over QS?",
      postsCount: 38,
      replyCount: 37,
      views: 2678,
      likeCount: 112,
      createdAt: new Date(now - day * 11).toISOString(),
      lastPostedAt: new Date(now - hour * 3).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[6],
    },
    // Conversion Tracking
    {
      id: 16,
      title: 'Enhanced conversions setup - step by step guide needed',
      slug: 'enhanced-conversions-setup-guide',
      excerpt: "Trying to set up enhanced conversions but the documentation is confusing. Can someone walk me through it?",
      postsCount: 29,
      replyCount: 28,
      views: 2345,
      likeCount: 87,
      createdAt: new Date(now - day * 5).toISOString(),
      lastPostedAt: new Date(now - hour * 2).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[4],
    },
    {
      id: 17,
      title: 'Offline conversion tracking for service businesses',
      slug: 'offline-conversion-tracking-services',
      excerpt: "Most of our leads convert via phone calls days later. How do you track this effectively?",
      postsCount: 22,
      replyCount: 21,
      views: 1456,
      likeCount: 63,
      createdAt: new Date(now - day * 8).toISOString(),
      lastPostedAt: new Date(now - hour * 11).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[9],
    },
    {
      id: 18,
      title: 'GA4 vs Google Ads conversions - numbers don\'t match!',
      slug: 'ga4-google-ads-conversion-mismatch',
      excerpt: "GA4 shows 50 conversions, Google Ads shows 75. Why the discrepancy and which should I trust?",
      postsCount: 31,
      replyCount: 30,
      views: 2890,
      likeCount: 94,
      createdAt: new Date(now - day * 4).toISOString(),
      lastPostedAt: new Date(now - hour * 5).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[12],
    },
    // Performance Max
    {
      id: 19,
      title: 'Performance Max eating my Search budget - how to control it?',
      slug: 'pmax-eating-search-budget',
      excerpt: "Ever since adding PMax, my Search campaigns get barely any impressions. Anyone else?",
      postsCount: 45,
      replyCount: 44,
      views: 3567,
      likeCount: 134,
      createdAt: new Date(now - day * 2).toISOString(),
      lastPostedAt: new Date(now - hour * 1).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[2],
    },
    {
      id: 20,
      title: 'Performance Max asset group strategies that work',
      slug: 'pmax-asset-group-strategies',
      excerpt: "Struggling with how to structure asset groups. Share what's working for your accounts.",
      postsCount: 26,
      replyCount: 25,
      views: 1987,
      likeCount: 72,
      createdAt: new Date(now - day * 6).toISOString(),
      lastPostedAt: new Date(now - hour * 8).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[14],
    },
    {
      id: 21,
      title: 'Is Performance Max just remarketing in disguise?',
      slug: 'pmax-remarketing-disguise',
      excerpt: "Looking at my PMax placements and 80% seems to be remarketing. Is Google gaming us?",
      postsCount: 52,
      replyCount: 51,
      views: 4234,
      likeCount: 187,
      createdAt: new Date(now - day * 12).toISOString(),
      lastPostedAt: new Date(now - hour * 4).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[7],
    },
    // E-commerce
    {
      id: 22,
      title: 'Shopping ads feed optimization tips',
      slug: 'shopping-feed-optimization',
      excerpt: "What feed attributes actually impact performance? Looking to optimize my Merchant Center.",
      postsCount: 34,
      replyCount: 33,
      views: 2123,
      likeCount: 89,
      createdAt: new Date(now - day * 7).toISOString(),
      lastPostedAt: new Date(now - hour * 6).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[7],
    },
    {
      id: 23,
      title: 'ROAS targets for different product categories',
      slug: 'roas-targets-by-category',
      excerpt: "What ROAS do you aim for? I'm at 400% but wondering if I should push higher or scale.",
      postsCount: 29,
      replyCount: 28,
      views: 1876,
      likeCount: 67,
      createdAt: new Date(now - day * 9).toISOString(),
      lastPostedAt: new Date(now - hour * 10).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[14],
    },
    // Local & Service
    {
      id: 24,
      title: 'Local Service Ads vs Search - which is better for contractors?',
      slug: 'lsa-vs-search-contractors',
      excerpt: "Running both for a plumbing client. LSA has lower CPL but Search brings bigger jobs. Thoughts?",
      postsCount: 23,
      replyCount: 22,
      views: 1456,
      likeCount: 54,
      createdAt: new Date(now - day * 4).toISOString(),
      lastPostedAt: new Date(now - hour * 9).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[9],
    },
    {
      id: 25,
      title: 'Setting up location targeting the right way',
      slug: 'location-targeting-setup',
      excerpt: "Presence vs Interest - which setting are you using and why?",
      postsCount: 18,
      replyCount: 17,
      views: 1234,
      likeCount: 43,
      createdAt: new Date(now - day * 13).toISOString(),
      lastPostedAt: new Date(now - hour * 14).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[10],
    },
    // Troubleshooting
    {
      id: 26,
      title: 'Account suspended with no explanation - what now?',
      slug: 'account-suspended-no-explanation',
      excerpt: "Google suspended my client's account for 'circumventing systems' but we did nothing wrong!",
      postsCount: 41,
      replyCount: 40,
      views: 3890,
      likeCount: 123,
      createdAt: new Date(now - day * 1).toISOString(),
      lastPostedAt: new Date(now - hour * 2).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[3],
    },
    {
      id: 27,
      title: 'Disapproved ads - healthcare policy nightmares',
      slug: 'healthcare-ads-disapproved',
      excerpt: "Running ads for a chiropractor and everything gets flagged. How do you navigate healthcare policies?",
      postsCount: 27,
      replyCount: 26,
      views: 1678,
      likeCount: 58,
      createdAt: new Date(now - day * 6).toISOString(),
      lastPostedAt: new Date(now - hour * 7).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[5],
    },
    {
      id: 28,
      title: 'Limited by budget but CPA is way above target',
      slug: 'limited-budget-high-cpa',
      excerpt: "Campaign says 'Limited by budget' but my CPA is 3x target. Doesn't make sense!",
      postsCount: 24,
      replyCount: 23,
      views: 1567,
      likeCount: 61,
      createdAt: new Date(now - day * 5).toISOString(),
      lastPostedAt: new Date(now - hour * 11).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[8],
    },
    // Strategy & Best Practices
    {
      id: 29,
      title: 'How long to wait before making optimization decisions?',
      slug: 'optimization-waiting-period',
      excerpt: "I keep changing things too quickly. What's the right amount of data before making changes?",
      postsCount: 32,
      replyCount: 31,
      views: 2234,
      likeCount: 95,
      createdAt: new Date(now - day * 8).toISOString(),
      lastPostedAt: new Date(now - hour * 3).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[13],
    },
    {
      id: 30,
      title: 'Seasonal businesses - how to scale up and down effectively?',
      slug: 'seasonal-business-scaling',
      excerpt: "Running ads for a tax prep service. How do you handle the massive seasonal swings?",
      postsCount: 19,
      replyCount: 18,
      views: 1123,
      likeCount: 47,
      createdAt: new Date(now - day * 15).toISOString(),
      lastPostedAt: new Date(now - hour * 18).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[11],
    },
    // B2B Specific
    {
      id: 31,
      title: 'B2B lead quality vs quantity - finding the balance',
      slug: 'b2b-lead-quality-quantity',
      excerpt: "Getting tons of leads but sales team says they're garbage. How do you improve lead quality?",
      postsCount: 36,
      replyCount: 35,
      views: 2678,
      likeCount: 108,
      createdAt: new Date(now - day * 3).toISOString(),
      lastPostedAt: new Date(now - hour * 5).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[8],
    },
    {
      id: 32,
      title: 'LinkedIn Ads vs Google Ads for B2B - ROI comparison',
      slug: 'linkedin-vs-google-b2b',
      excerpt: "Spending on both platforms. Google has lower CPL but LinkedIn leads close better. What's your experience?",
      postsCount: 28,
      replyCount: 27,
      views: 1890,
      likeCount: 74,
      createdAt: new Date(now - day * 10).toISOString(),
      lastPostedAt: new Date(now - hour * 8).toISOString(),
      categoryId: 6,
      pinned: false,
      closed: false,
      author: mockMembers[8],
    },
    // Automation & Tools
    {
      id: 33,
      title: 'Best Google Ads scripts for daily management',
      slug: 'best-google-ads-scripts',
      excerpt: "Share your favorite scripts! I use one for anomaly detection that's saved me countless times.",
      postsCount: 43,
      replyCount: 42,
      views: 3456,
      likeCount: 167,
      createdAt: new Date(now - day * 11).toISOString(),
      lastPostedAt: new Date(now - hour * 1).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[10],
    },
    {
      id: 34,
      title: 'Automated rules vs scripts - when to use each?',
      slug: 'automated-rules-vs-scripts',
      excerpt: "I've been using automated rules but wondering if scripts would give more control.",
      postsCount: 21,
      replyCount: 20,
      views: 1345,
      likeCount: 52,
      createdAt: new Date(now - day * 14).toISOString(),
      lastPostedAt: new Date(now - hour * 16).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[6],
    },
    // Reporting & Analysis
    {
      id: 35,
      title: 'What metrics do you include in client reports?',
      slug: 'client-report-metrics',
      excerpt: "Trying to simplify my reporting. What do clients actually care about seeing?",
      postsCount: 25,
      replyCount: 24,
      views: 1567,
      likeCount: 63,
      createdAt: new Date(now - day * 7).toISOString(),
      lastPostedAt: new Date(now - hour * 12).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[2],
    },
    {
      id: 36,
      title: 'Attribution models explained - which should I use?',
      slug: 'attribution-models-explained',
      excerpt: "Data-driven, last click, linear... so many options. What do you recommend?",
      postsCount: 30,
      replyCount: 29,
      views: 2123,
      likeCount: 86,
      createdAt: new Date(now - day * 12).toISOString(),
      lastPostedAt: new Date(now - hour * 6).toISOString(),
      categoryId: 8,
      pinned: false,
      closed: false,
      author: mockMembers[12],
    },
    // Landing Pages
    {
      id: 37,
      title: 'Landing page speed impact on conversion rates',
      slug: 'landing-page-speed-conversions',
      excerpt: "Improved page speed from 4s to 1.5s. Seeing 23% more conversions. What's your experience?",
      postsCount: 22,
      replyCount: 21,
      views: 1678,
      likeCount: 71,
      createdAt: new Date(now - day * 6).toISOString(),
      lastPostedAt: new Date(now - hour * 9).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[4],
    },
    {
      id: 38,
      title: 'Single page vs multi-step landing pages',
      slug: 'single-vs-multistep-landing',
      excerpt: "Testing a multi-step form vs single page. Anyone have data on what converts better?",
      postsCount: 26,
      replyCount: 25,
      views: 1890,
      likeCount: 68,
      createdAt: new Date(now - day * 9).toISOString(),
      lastPostedAt: new Date(now - hour * 4).toISOString(),
      categoryId: 7,
      pinned: false,
      closed: false,
      author: mockMembers[14],
    },
    // Agency & Client Management
    {
      id: 39,
      title: 'How much do you charge for Google Ads management?',
      slug: 'google-ads-management-pricing',
      excerpt: "Trying to figure out fair pricing. Percentage of spend, flat fee, or hybrid?",
      postsCount: 47,
      replyCount: 46,
      views: 4567,
      likeCount: 189,
      createdAt: new Date(now - day * 16).toISOString(),
      lastPostedAt: new Date(now - hour * 2).toISOString(),
      categoryId: 5,
      pinned: false,
      closed: false,
      author: mockMembers[2],
    },
    {
      id: 40,
      title: 'Client wants to see the account - red flag or normal?',
      slug: 'client-account-access',
      excerpt: "New client insisting on admin access to the account. How do you handle this?",
      postsCount: 38,
      replyCount: 37,
      views: 2890,
      likeCount: 124,
      createdAt: new Date(now - day * 4).toISOString(),
      lastPostedAt: new Date(now - hour * 7).toISOString(),
      categoryId: 5,
      pinned: false,
      closed: false,
      author: mockMembers[5],
    },
  ];
}

function getMockPosts(topicId: number) {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  const topicPosts: Record<number, any[]> = {
    // Welcome topic
    1: [
      {
        id: 1,
        content: "<p>Welcome to the Adiology Community! 🎉</p><p>This is a space for Google Ads professionals to share strategies, ask questions, and learn from each other. Whether you're managing $500/month or $500k/month, everyone has something valuable to contribute.</p><p>Please introduce yourself: What's your experience level? What industries do you work with?</p>",
        createdAt: new Date(now - day * 60).toISOString(),
        author: mockMembers[0],
        likeCount: 34,
        replyCount: 0,
      },
      {
        id: 2,
        content: "<p>Hey everyone! I'm Sarah, been doing PPC for about 8 years now. Mostly work with e-commerce clients in fashion and home goods. Excited to be here and share what I've learned!</p>",
        createdAt: new Date(now - day * 58).toISOString(),
        author: mockMembers[1],
        likeCount: 12,
        replyCount: 1,
      },
      {
        id: 3,
        content: "<p>Mike here - agency owner managing about 40 accounts. Love seeing a community focused on Google Ads specifically. Looking forward to the discussions!</p>",
        createdAt: new Date(now - day * 55).toISOString(),
        author: mockMembers[2],
        likeCount: 8,
        replyCount: 0,
      },
    ],
    // SKAG vs STAG
    2: [
      {
        id: 10,
        content: "<p>I've been running SKAG campaigns for years now and they've worked great, but I keep hearing that STAG (Single Theme Ad Groups) is more efficient in 2024 with all the match type changes.</p><p>What's your experience? Is it worth restructuring my accounts?</p>",
        createdAt: new Date(now - day * 3).toISOString(),
        author: mockMembers[3],
        likeCount: 23,
        replyCount: 0,
      },
      {
        id: 11,
        content: "<p>Great question! I made the switch about 6 months ago and here's what I found:</p><ul><li>SKAGs are harder to maintain with close variant matching</li><li>STAGs give Smart Bidding more data to work with</li><li>My CTR dropped slightly but conversion rate improved</li></ul><p>Overall, I'd say STAG is the way to go now, especially for accounts using automated bidding.</p>",
        createdAt: new Date(now - day * 3 + hour * 2).toISOString(),
        author: mockMembers[1],
        likeCount: 45,
        replyCount: 3,
      },
      {
        id: 12,
        content: "<p>I actually still use SKAGs for certain high-value keywords where I need tight control over the messaging. For everything else, I've moved to themed ad groups with 5-10 tightly related keywords.</p><p>The hybrid approach works well for my clients.</p>",
        createdAt: new Date(now - day * 2 + hour * 8).toISOString(),
        author: mockMembers[6],
        likeCount: 28,
        replyCount: 1,
      },
      {
        id: 13,
        content: "<p>@sarah_ppc makes a good point about Smart Bidding. Google's algorithm definitely performs better with more data. I've seen 15-20% improvement in CPA after consolidating from SKAG to STAG structure.</p><p>One tip: make sure your themes are actually cohesive. Don't just dump random keywords together.</p>",
        createdAt: new Date(now - day * 1 + hour * 4).toISOString(),
        author: mockMembers[4],
        likeCount: 19,
        replyCount: 0,
      },
    ],
    // Target CPA vs Maximize Conversions
    4: [
      {
        id: 20,
        content: "<p>Started a new campaign with Maximize Conversions as Google recommended, but my CPA is all over the place. Some days it's $30, other days it's $150.</p><p>Should I switch to Target CPA? How long should I wait before making the change?</p>",
        createdAt: new Date(now - day * 2).toISOString(),
        author: mockMembers[4],
        likeCount: 18,
        replyCount: 0,
      },
      {
        id: 21,
        content: "<p>The variability you're seeing is normal for Maximize Conversions, especially in the first few weeks. Here's my rule of thumb:</p><ol><li>Wait for at least 30-50 conversions before switching strategies</li><li>Once you have enough data, set Target CPA at about 10-15% above your average CPA</li><li>Gradually lower it as the algorithm optimizes</li></ol><p>Patience is key with smart bidding!</p>",
        createdAt: new Date(now - day * 2 + hour * 3).toISOString(),
        author: mockMembers[2],
        likeCount: 52,
        replyCount: 2,
      },
      {
        id: 22,
        content: "<p>I'd also check your conversion tracking. Variable CPA can sometimes indicate tracking issues - like some conversions not firing properly.</p><p>Make sure you're seeing consistent conversion counts day over day before blaming the bidding strategy.</p>",
        createdAt: new Date(now - day * 1 + hour * 6).toISOString(),
        author: mockMembers[12],
        likeCount: 31,
        replyCount: 1,
      },
      {
        id: 23,
        content: "<p>Great points above. One thing I'll add: if you're in a competitive industry, you might see more volatility because auction dynamics change constantly.</p><p>I've had success with Target ROAS for e-commerce and Target CPA for lead gen. Maximize Conversions is really just for learning phases.</p>",
        createdAt: new Date(now - hour * 8).toISOString(),
        author: mockMembers[7],
        likeCount: 24,
        replyCount: 0,
      },
    ],
    // Broad match destroying budget
    7: [
      {
        id: 40,
        content: "<p>So my Google rep convinced me to switch all keywords to broad match. \"The algorithm knows best\" they said. Well, now I'm getting clicks for completely irrelevant searches!</p><p>Yesterday I found clicks for \"free software\" when I'm selling enterprise SaaS at $500/month. This is insane!</p>",
        createdAt: new Date(now - day * 4).toISOString(),
        author: mockMembers[5],
        likeCount: 67,
        replyCount: 0,
      },
      {
        id: 41,
        content: "<p>Classic Google rep advice 🙄</p><p>Here's what you need to do immediately:</p><ol><li>Add \"free\" as a negative keyword across all campaigns</li><li>Review search terms from the last 7 days and add negatives aggressively</li><li>Consider switching your worst performers back to phrase match</li></ol><p>Broad match CAN work but you need strong negative keyword lists and solid conversion data first.</p>",
        createdAt: new Date(now - day * 4 + hour * 1).toISOString(),
        author: mockMembers[1],
        likeCount: 89,
        replyCount: 4,
      },
      {
        id: 42,
        content: "<p>I've been burned by this too. What works for me now:</p><ul><li>Only use broad match for well-established campaigns with 50+ conversions/month</li><li>Start every new campaign with phrase match</li><li>Build negative keyword lists of 200+ terms before going broad</li></ul><p>Google reps have quotas - their advice isn't always in your best interest.</p>",
        createdAt: new Date(now - day * 3 + hour * 5).toISOString(),
        author: mockMembers[6],
        likeCount: 56,
        replyCount: 2,
      },
      {
        id: 43,
        content: "<p>The \"free\" problem is so common. Here's my standard negative keyword list for B2B:</p><p>free, cheap, discount, coupon, DIY, how to, tutorial, training, course, jobs, career, salary, review, vs, alternative, open source</p><p>Add these day one and save yourself the headache!</p>",
        createdAt: new Date(now - day * 2 + hour * 3).toISOString(),
        author: mockMembers[8],
        likeCount: 78,
        replyCount: 1,
      },
    ],
    // RSA best practices
    11: [
      {
        id: 60,
        content: "<p>Google says to use all 15 headlines for RSAs, but that seems like way too many. Half of my headlines end up being filler.</p><p>How many headlines do you actually use? And do you really need 4 descriptions?</p>",
        createdAt: new Date(now - day * 3).toISOString(),
        author: mockMembers[11],
        likeCount: 34,
        replyCount: 0,
      },
      {
        id: 61,
        content: "<p>I aim for 10-12 headlines and 3-4 descriptions. Here's my framework:</p><ul><li>3-4 headlines with main keyword</li><li>2-3 headlines with benefits</li><li>2-3 headlines with offers/CTAs</li><li>2 headlines with social proof or urgency</li></ul><p>Quality > quantity. Don't add headlines just to hit 15.</p>",
        createdAt: new Date(now - day * 3 + hour * 2).toISOString(),
        author: mockMembers[1],
        likeCount: 67,
        replyCount: 3,
      },
      {
        id: 62,
        content: "<p>Great framework @sarah_ppc! I'd add that you should use pinning strategically:</p><ul><li>Pin your brand name to position 1</li><li>Pin your main CTA to position 3</li><li>Let Google test everything else</li></ul><p>Over-pinning kills RSA performance, but some control is necessary.</p>",
        createdAt: new Date(now - day * 2 + hour * 6).toISOString(),
        author: mockMembers[2],
        likeCount: 45,
        replyCount: 1,
      },
      {
        id: 63,
        content: "<p>I've been testing the \"Ad Strength\" recommendations and honestly, chasing \"Excellent\" ad strength doesn't always correlate with better performance.</p><p>I have ads rated \"Good\" outperforming \"Excellent\" ones by 30%+ in CTR and conversion rate. Focus on relevance and clarity, not Google's score.</p>",
        createdAt: new Date(now - hour * 12).toISOString(),
        author: mockMembers[4],
        likeCount: 52,
        replyCount: 0,
      },
    ],
    // Performance Max eating budget
    19: [
      {
        id: 80,
        content: "<p>Ever since I added a Performance Max campaign, my Search campaigns have tanked. Impressions down 60%, clicks down 70%.</p><p>PMax is supposed to COMPLEMENT Search, not replace it. What am I doing wrong?</p>",
        createdAt: new Date(now - day * 2).toISOString(),
        author: mockMembers[2],
        likeCount: 56,
        replyCount: 0,
      },
      {
        id: 81,
        content: "<p>This is THE most common PMax complaint. Here's what's happening:</p><p>PMax has priority for queries it thinks it can convert. If your PMax has similar products/services, it will cannibalize Search.</p><p>Solutions:</p><ol><li>Add your exact match keywords as negative keywords in PMax (use account-level negatives)</li><li>Increase Search campaign budgets significantly</li><li>Make sure you're not targeting identical audiences</li></ol>",
        createdAt: new Date(now - day * 2 + hour * 1).toISOString(),
        author: mockMembers[6],
        likeCount: 89,
        replyCount: 5,
      },
      {
        id: 82,
        content: "<p>I actually shut down PMax for most of my clients. The lack of transparency is a dealbreaker for me.</p><p>You can't see search terms, you can't see which placements are driving conversions, and Google's \"insights\" are useless.</p><p>For e-commerce with strong product feeds, PMax can work. For services? I'd avoid it.</p>",
        createdAt: new Date(now - day * 1 + hour * 8).toISOString(),
        author: mockMembers[7],
        likeCount: 72,
        replyCount: 3,
      },
      {
        id: 83,
        content: "<p>@rachel_ecom has a point about transparency. But I've found PMax works well when:</p><ul><li>You have strong creative assets (10+ images, 5+ videos)</li><li>You have solid conversion data (100+ conversions in last 30 days)</li><li>You set realistic ROAS/CPA targets</li></ul><p>It's not for every account, but it's not garbage either.</p>",
        createdAt: new Date(now - hour * 6).toISOString(),
        author: mockMembers[14],
        likeCount: 45,
        replyCount: 0,
      },
    ],
    // Account suspended
    26: [
      {
        id: 100,
        content: "<p>Just received this message: \"Your account has been suspended for circumventing systems.\"</p><p>We're a legitimate plumbing company! We haven't done anything wrong. No cloaking, no fake reviews, nothing. Been running ads for 3 years without issues.</p><p>Appeals keep getting denied with no explanation. HELP!</p>",
        createdAt: new Date(now - day * 1).toISOString(),
        author: mockMembers[3],
        likeCount: 34,
        replyCount: 0,
      },
      {
        id: 101,
        content: "<p>This is unfortunately common and frustrating. Here's what to check:</p><ul><li>Any recent website changes? New landing pages?</li><li>Did you add any new payment methods?</li><li>Any IP address changes (new office, VPN)?</li><li>Multiple accounts from same device/network?</li></ul><p>Sometimes it's triggered by false positives. Keep appealing with detailed explanations.</p>",
        createdAt: new Date(now - day * 1 + hour * 2).toISOString(),
        author: mockMembers[1],
        likeCount: 45,
        replyCount: 2,
      },
      {
        id: 102,
        content: "<p>I've helped clients through this before. Your best options:</p><ol><li>Submit a VERY detailed appeal explaining exactly what your business does</li><li>Include your business license, address verification, photos of your work</li><li>If you have a Google rep or MCC manager, reach out to them directly</li><li>Consider contacting Google Ads support via Twitter @GoogleAds</li></ol><p>Sometimes creating a new account with fresh verification is faster than fighting, but you risk that getting suspended too.</p>",
        createdAt: new Date(now - day * 1 + hour * 5).toISOString(),
        author: mockMembers[2],
        likeCount: 67,
        replyCount: 4,
      },
      {
        id: 103,
        content: "<p>Just went through this with a dentist client. Took 6 appeals over 3 weeks but we finally got reinstated.</p><p>What worked: I wrote a 2-page document explaining the business, included their state license, BBB rating, 50+ Google reviews, and photos of the actual office.</p><p>Persistence pays off. Don't give up!</p>",
        createdAt: new Date(now - hour * 10).toISOString(),
        author: mockMembers[9],
        likeCount: 38,
        replyCount: 1,
      },
    ],
    // Best Google Ads scripts
    33: [
      {
        id: 120,
        content: "<p>Let's share our favorite Google Ads scripts! I'll start:</p><p>I use an anomaly detection script that alerts me when CTR, CPC, or spend deviates more than 2 standard deviations from the 30-day average. Saved me from many disasters!</p><p>What scripts are you running?</p>",
        createdAt: new Date(now - day * 11).toISOString(),
        author: mockMembers[10],
        likeCount: 78,
        replyCount: 0,
      },
      {
        id: 121,
        content: "<p>Love the anomaly detection idea! Here are my essentials:</p><ol><li><strong>Broken URL checker</strong> - runs daily, catches 404s before they waste spend</li><li><strong>Quality Score tracker</strong> - logs QS changes to a spreadsheet for historical analysis</li><li><strong>Budget pacing</strong> - alerts when campaigns are on track to over/underspend</li></ol><p>All available free at developers.google.com/google-ads/scripts</p>",
        createdAt: new Date(now - day * 11 + hour * 3).toISOString(),
        author: mockMembers[6],
        likeCount: 92,
        replyCount: 5,
      },
      {
        id: 122,
        content: "<p>My favorite is the N-gram analysis script. It analyzes your search terms and finds patterns in what's converting vs what's wasting money.</p><p>Example: Discovered that any search containing \"near me\" was converting at 3x our average. Now I bid higher on those terms specifically.</p>",
        createdAt: new Date(now - day * 10 + hour * 8).toISOString(),
        author: mockMembers[12],
        likeCount: 65,
        replyCount: 3,
      },
      {
        id: 123,
        content: "<p>For anyone not comfortable with scripts, check out Optmyzr or Adalysis. They have built-in automation that does 80% of what scripts do with a nice UI.</p><p>Not free, but worth it if you're managing multiple accounts and don't want to maintain scripts yourself.</p>",
        createdAt: new Date(now - hour * 4).toISOString(),
        author: mockMembers[2],
        likeCount: 41,
        replyCount: 0,
      },
    ],
    // Pricing for management
    39: [
      {
        id: 140,
        content: "<p>Starting to take on more freelance clients and struggling with pricing. How much do you charge for Google Ads management?</p><p>I've seen everything from $500/month flat fee to 20% of ad spend. What's fair?</p>",
        createdAt: new Date(now - day * 16).toISOString(),
        author: mockMembers[2],
        likeCount: 56,
        replyCount: 0,
      },
      {
        id: 141,
        content: "<p>Here's how I structure it:</p><ul><li><strong>Under $5k spend:</strong> $750-1500/month flat fee</li><li><strong>$5k-20k spend:</strong> 12-15% of spend</li><li><strong>$20k+ spend:</strong> 8-10% of spend with minimum</li></ul><p>I also charge setup fees: $500-2000 depending on complexity.</p><p>Don't undervalue yourself. Good PPC management should easily pay for itself 3-5x.</p>",
        createdAt: new Date(now - day * 16 + hour * 2).toISOString(),
        author: mockMembers[1],
        likeCount: 89,
        replyCount: 6,
      },
      {
        id: 142,
        content: "<p>I moved to value-based pricing and never looked back. I charge based on the value I create, not hours worked.</p><p>Example: Client's target CPA is $50. If I can get it to $30, I'm saving them $20 per conversion. At 100 conversions/month, that's $2000 in value. I charge $1000 - everyone wins.</p>",
        createdAt: new Date(now - day * 15 + hour * 5).toISOString(),
        author: mockMembers[4],
        likeCount: 72,
        replyCount: 4,
      },
      {
        id: 143,
        content: "<p>Whatever you do, avoid percentage of spend as your only model. It creates wrong incentives - you get paid more when clients spend more, not when they get better results.</p><p>I prefer: Base retainer + performance bonus based on hitting KPI targets.</p>",
        createdAt: new Date(now - day * 14 + hour * 8).toISOString(),
        author: mockMembers[6],
        likeCount: 63,
        replyCount: 2,
      },
    ],
  };

  return topicPosts[topicId] || [
    {
      id: 999,
      content: "<p>This is a sample discussion topic. Real discussions would appear here when Discourse is connected.</p>",
      createdAt: new Date(now - day * 1).toISOString(),
      author: mockMembers[0],
      likeCount: 5,
      replyCount: 0,
    },
  ];
}

function getMockCategories() {
  return [
    {
      id: 5,
      name: 'General Discussion',
      slug: 'general',
      color: '8B5CF6',
      description: 'Introduce yourself and discuss anything Google Ads related',
      topicCount: 147,
    },
    {
      id: 6,
      name: 'Campaign Strategies',
      slug: 'strategies',
      color: '10B981',
      description: 'Share and discuss campaign strategies, bidding, and optimization',
      topicCount: 234,
    },
    {
      id: 7,
      name: 'Tips & Best Practices',
      slug: 'tips',
      color: 'F59E0B',
      description: 'Keywords, ad copy, landing pages, and conversion tips',
      topicCount: 189,
    },
    {
      id: 8,
      name: 'Troubleshooting & Help',
      slug: 'help',
      color: 'EF4444',
      description: 'Get help with tracking, policies, scripts, and technical issues',
      topicCount: 156,
    },
  ];
}

export { community };
