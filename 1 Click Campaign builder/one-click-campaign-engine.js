import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const client = new Anthropic();

/**
 * ONE-CLICK CAMPAIGN GENERATOR
 * Takes a landing page URL and generates complete campaign automatically
 */

export async function generateOneClickCampaign(websiteUrl, userId, onProgress) {
  try {
    // Step 1: Analyze Website
    onProgress?.({
      step: 1,
      status: 'Analyzing landing page...',
      progress: 15
    });

    const websiteAnalysis = await analyzeWebsite(websiteUrl);

    // Step 2: Generate Campaign Structure
    onProgress?.({
      step: 2,
      status: 'Building campaign structure...',
      progress: 30
    });

    const campaignStructure = await generateCampaignStructure(websiteAnalysis);

    // Step 3: Generate Keywords
    onProgress?.({
      step: 3,
      status: 'Generating 100+ keywords...',
      progress: 50
    });

    const { seedKeywords, keywords, negativeKeywords } = 
      await generateKeywords(websiteAnalysis, campaignStructure);

    // Step 4: Generate Ad Copy
    onProgress?.({
      step: 4,
      status: 'Creating ad copy variations...',
      progress: 65
    });

    const adCopy = await generateAdCopy(websiteAnalysis, campaignStructure);

    // Step 5: Create Ad Groups
    onProgress?.({
      step: 5,
      status: 'Organizing ad groups...',
      progress: 80
    });

    const adGroups = createAdGroups(keywords, adCopy);

    // Step 6: Generate CSV
    onProgress?.({
      step: 6,
      status: 'Generating Google Ads CSV...',
      progress: 90
    });

    const csvData = generateGoogleAdsCSV(campaignStructure, adGroups, keywords, adCopy);

    // Step 7: Save Campaign
    onProgress?.({
      step: 7,
      status: 'Saving campaign...',
      progress: 95
    });

    const campaign = await saveCampaign(
      userId,
      websiteAnalysis,
      campaignStructure,
      keywords,
      negativeKeywords,
      adGroups,
      adCopy,
      csvData
    );

    onProgress?.({
      step: 7,
      status: 'Complete!',
      progress: 100
    });

    return {
      success: true,
      campaign,
      websiteAnalysis,
      campaignStructure,
      keywords,
      negativeKeywords,
      adGroups,
      adCopy,
      csvData
    };
  } catch (error) {
    console.error('Error generating campaign:', error);
    throw error;
  }
}

/**
 * Step 1: Analyze Website
 */
async function analyzeWebsite(url) {
  try {
    // Fetch website content
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;

    // Extract text and meta info
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];

    const pageText = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 5000);

    // Use Claude to analyze
    const analysis = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Analyze this website content and extract marketing information. Return as JSON.

Website Title: ${titleMatch?.[1] || 'Unknown'}
Meta Description: ${descMatch?.[1] || 'Unknown'}
Main Heading: ${h1Match?.[1] || 'Unknown'}
Page Content: ${pageText}

Extract and return ONLY valid JSON with:
{
  "businessName": "extracted business name",
  "mainValue": "main value proposition (one sentence)",
  "keyBenefits": ["benefit1", "benefit2", "benefit3"],
  "targetAudience": "who this is for",
  "industry": "industry vertical",
  "products": ["product1", "product2"],
  "cta": "main call to action",
  "keyFeatures": ["feature1", "feature2"]
}

Return ONLY the JSON object, no other text.`
        }
      ]
    });

    const analysisText = analysis.content[0].type === 'text' 
      ? analysis.content[0].text 
      : '';

    // Parse JSON response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      url,
      title: titleMatch?.[1] || 'Unknown',
      description: descMatch?.[1] || '',
      ...analysisData
    };
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
}

/**
 * Step 2: Generate Campaign Structure
 */
async function generateCampaignStructure(analysis) {
  const message = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Based on this business analysis, create a Google Ads campaign structure.

Business: ${analysis.businessName}
Value Prop: ${analysis.mainValue}
Target: ${analysis.targetAudience}
Industry: ${analysis.industry}

Return ONLY JSON:
{
  "campaignName": "campaign name",
  "campaignType": "Search",
  "budget": 2000,
  "dailyBudget": 100,
  "adGroupCount": 5,
  "adGroupThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "targetingDevices": "Mobile,Desktop",
  "targetingNetworks": "Search Network",
  "targetingLocation": "USA",
  "targetingLanguage": "English"
}

Return ONLY the JSON object.`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

/**
 * Step 3: Generate Keywords
 */
async function generateKeywords(analysis, structure) {
  const message = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Generate comprehensive keyword list for this campaign.

Business: ${analysis.businessName}
Value: ${analysis.mainValue}
Products: ${analysis.products?.join(', ')}
Benefits: ${analysis.keyBenefits?.join(', ')}
Target: ${analysis.targetAudience}
Ad Group Themes: ${structure.adGroupThemes?.join(', ')}

Generate JSON with:
{
  "seedKeywords": ["kw1", "kw2", "kw3"],
  "keywords": {
    "theme1": ["kw1", "kw2", "kw3"],
    "theme2": ["kw4", "kw5", "kw6"]
  },
  "longTailKeywords": ["long tail kw1", "long tail kw2"],
  "negativeKeywords": ["negative1", "negative2", "negative3"]
}

Generate 100+ keywords total across all categories.
Return ONLY JSON.`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const keywordData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  // Flatten keywords for storage
  const allKeywords = [];
  if (keywordData.keywords) {
    Object.values(keywordData.keywords).forEach(kws => {
      if (Array.isArray(kws)) {
        allKeywords.push(...kws);
      }
    });
  }

  return {
    seedKeywords: keywordData.seedKeywords || [],
    keywords: allKeywords,
    negativeKeywords: keywordData.negativeKeywords || []
  };
}

/**
 * Step 4: Generate Ad Copy
 */
async function generateAdCopy(analysis, structure) {
  const message = await client.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Generate high-converting ad copy for this campaign.

Business: ${analysis.businessName}
Value: ${analysis.mainValue}
Benefits: ${analysis.keyBenefits?.join(', ')}
CTA: ${analysis.cta}

Return JSON:
{
  "headlines": [
    {"text": "headline 1", "pinned": false},
    {"text": "headline 2", "pinned": false},
    {"text": "headline 3", "pinned": false},
    {"text": "headline 4", "pinned": false},
    {"text": "headline 5", "pinned": false}
  ],
  "descriptions": [
    {"text": "description 1"},
    {"text": "description 2"},
    {"text": "description 3"}
  ],
  "sitelinks": [
    {"text": "sitelink 1", "description": "desc1"},
    {"text": "sitelink 2", "description": "desc2"}
  ],
  "callouts": ["callout1", "callout2", "callout3"]
}

Each headline max 30 chars, description max 90 chars.
Return ONLY JSON.`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

/**
 * Step 5: Create Ad Groups
 */
function createAdGroups(keywords, adCopy) {
  const themes = [
    'Core Product',
    'Features & Benefits',
    'Brand Awareness',
    'Promotions',
    'Information'
  ];

  const adGroups = [];
  const keywordsPerGroup = Math.ceil(keywords.length / themes.length);

  themes.forEach((theme, index) => {
    const groupKeywords = keywords.slice(
      index * keywordsPerGroup,
      (index + 1) * keywordsPerGroup
    );

    adGroups.push({
      name: theme,
      maxCpc: 1.5,
      keywords: groupKeywords,
      ads: [
        {
          type: 'responsive_search_ad',
          headlines: adCopy.headlines?.slice(0, 3) || [],
          descriptions: adCopy.descriptions?.slice(0, 2) || []
        }
      ]
    });
  });

  return adGroups;
}

/**
 * Step 6: Generate Google Ads Editor CSV
 */
function generateGoogleAdsCSV(campaign, adGroups, keywords, adCopy) {
  let csv = '';

  // Campaign row
  csv += `Campaign,Ad Group,Headline 1,Headline 2,Headline 3,Description Line 1,Description Line 2,Final URL,Status\n`;

  // For each ad group
  adGroups.forEach(group => {
    group.ads.forEach(ad => {
      const h1 = ad.headlines?.[0]?.text || '';
      const h2 = ad.headlines?.[1]?.text || '';
      const h3 = ad.headlines?.[2]?.text || '';
      const d1 = ad.descriptions?.[0]?.text || '';
      const d2 = ad.descriptions?.[1]?.text || '';

      csv += `${campaign.campaignName},${group.name},"${h1}","${h2}","${h3}","${d1}","${d2}","${campaign.url}",Enabled\n`;
    });
  });

  // Keywords
  csv += `\nKeyword,Match Type,Bid,Campaign,Ad Group,Status\n`;
  adGroups.forEach(group => {
    group.keywords.forEach(keyword => {
      csv += `${keyword},Broad,${group.maxCpc},${campaign.campaignName},${group.name},Enabled\n`;
    });
  });

  return csv;
}

/**
 * Step 7: Save Campaign to Database
 */
async function saveCampaign(
  userId,
  analysis,
  campaign,
  keywords,
  negativeKeywords,
  adGroups,
  adCopy,
  csvData
) {
  // This would call your backend API to save to Supabase
  // For now, return the campaign object
  return {
    id: generateId(),
    user_id: userId,
    campaign_name: campaign.campaignName,
    business_name: analysis.businessName,
    website_url: analysis.url,
    business_type: analysis.industry,
    target_audience: analysis.targetAudience,
    monthly_budget: campaign.budget,
    daily_budget: campaign.dailyBudget,
    status: 'draft',
    seed_keywords: keywords,
    campaign_data: {
      analysis,
      structure: campaign,
      adGroups,
      adCopy,
      csvData
    },
    created_at: new Date(),
    updated_at: new Date()
  };
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  generateOneClickCampaign
};
