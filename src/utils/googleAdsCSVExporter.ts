/**
 * Google Ads CSV Exporter
 * Follows the exact format from Google Ads Editor CSV template
 * Format: Bid Strategy Type, Budget, Campaign status, Campaign type, Campaign, Ad group status, Ad group, Keyword, Type, Ad Type, Final URL, etc.
 */

// CSV Headers - EXACT format from template
const CSV_HEADERS = [
  'Bid Strategy Type',
  'Budget',
  'Campaign status',
  'Campaign type',
  'Campaign',
  'Networks',
  'EU political ads',
  'Desktop Bid adj.',
  'Mobile Bid adj.',
  'Tablet Bid adj.',
  'Ad group status',
  'Ad group',
  'Max CPC',
  'Keyword',
  'Type',
  'Ad Type',
  'Final URL',
  'Final mobile URL',
  'Path 1',
  'Path 2',
  'Verification URL',
  'Display URL',
  'Business name',
  'Country',
  'Phone number',
  'Headline 1',
  'Headline 1 position',
  'Headline 2',
  'Headline 2 position',
  'Headline 3',
  'Headline 3 position',
  'Description 1',
  'Description 1 position',
  'Description 2',
  'Description 2 position'
];

export interface CampaignData {
  campaignName: string;
  bidStrategy?: string;
  budget?: number;
  campaignStatus?: string;
  campaignType?: string;
  adGroups: AdGroupData[];
}

export interface AdGroupData {
  name: string;
  status?: string;
  keywords?: KeywordData[];
  negativeKeywords?: NegativeKeywordData[];
  ads?: AdData[];
}

export interface KeywordData {
  text: string;
  matchType: 'exact' | 'phrase' | 'broad';
}

export interface NegativeKeywordData {
  text: string;
  matchType: 'Negative Phrase' | 'Negative Exact' | 'Negative Broad';
}

export interface AdData {
  type: 'Expanded text ad' | 'Call-only ad' | 'Responsive search ad';
  finalUrl?: string;
  finalMobileUrl?: string;
  path1?: string;
  path2?: string;
  verificationUrl?: string;
  displayUrl?: string;
  businessName?: string;
  country?: string;
  phoneNumber?: string;
  headlines?: string[];
  headlinePositions?: number[];
  descriptions?: string[];
  descriptionPositions?: number[];
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV rows from campaign data
 */
function generateCSVRows(campaign: CampaignData): string[][] {
  const rows: string[][] = [];

  // Row 1: Headers
  rows.push([...CSV_HEADERS]);

  // Row 2: Campaign row
  rows.push([
    escapeCSV(campaign.bidStrategy || 'cpc'),
    escapeCSV(campaign.budget?.toString() || '100'),
    escapeCSV(campaign.campaignStatus || 'Paused'),
    escapeCSV(campaign.campaignType || 'Search Only'),
    escapeCSV(campaign.campaignName),
    'Google search', // Networks
    'No', // EU political ads
    '-100%', // Desktop Bid adj.
    '0%', // Mobile Bid adj.
    '-100%', // Tablet Bid adj.
    '', // Ad group status
    '', // Ad group
    '', // Max CPC
    '', // Keyword
    '', // Type
    '', // Ad Type
    '', // Final URL
    '', // Final mobile URL
    '', // Path 1
    '', // Path 2
    '', // Verification URL
    '', // Display URL
    '', // Business name
    '', // Country
    '', // Phone number
    '', // Headline 1
    '', // Headline 1 position
    '', // Headline 2
    '', // Headline 2 position
    '', // Headline 3
    '', // Headline 3 position
    '', // Description 1
    '', // Description 1 position
    '', // Description 2
    ''  // Description 2 position
  ]);

  // Process each ad group
  campaign.adGroups.forEach((adGroup) => {
    // Row: Ad group header
    rows.push([
      '', // Bid Strategy Type
      '', // Budget
      '', // Campaign status
      '', // Campaign type
      escapeCSV(campaign.campaignName),
      '', // Networks
      '', // EU political ads
      '', // Desktop Bid adj.
      '', // Mobile Bid adj.
      '', // Tablet Bid adj.
      escapeCSV(adGroup.status || 'enabled'),
      escapeCSV(adGroup.name),
      '1.00', // Max CPC - default 1 USD
      '', // Keyword
      '', // Type
      '', // Ad Type
      '', // Final URL
      '', // Final mobile URL
      '', // Path 1
      '', // Path 2
      '', // Verification URL
      '', // Display URL
      '', // Business name
      '', // Country
      '', // Phone number
      '', // Headline 1
      '', // Headline 1 position
      '', // Headline 2
      '', // Headline 2 position
      '', // Headline 3
      '', // Headline 3 position
      '', // Description 1
      '', // Description 1 position
      '', // Description 2
      ''  // Description 2 position
    ]);

    // Keywords (positive)
    if (adGroup.keywords) {
      adGroup.keywords.forEach((keyword) => {
        rows.push([
          '', // Bid Strategy Type
          '', // Budget
          '', // Campaign status
          '', // Campaign type
          escapeCSV(campaign.campaignName),
          '', // Networks
          '', // EU political ads
          '', // Desktop Bid adj.
          '', // Mobile Bid adj.
          '', // Tablet Bid adj.
          '', // Ad group status
          escapeCSV(adGroup.name),
          '', // Max CPC
          escapeCSV(keyword.text),
          escapeCSV(keyword.matchType),
          '', // Ad Type
          '', // Final URL
          '', // Final mobile URL
          '', // Path 1
          '', // Path 2
          '', // Verification URL
          '', // Display URL
          '', // Business name
          '', // Country
          '', // Phone number
          '', // Headline 1
          '', // Headline 1 position
          '', // Headline 2
          '', // Headline 2 position
          '', // Headline 3
          '', // Headline 3 position
          '', // Description 1
          '', // Description 1 position
          '', // Description 2
          ''  // Description 2 position
        ]);
      });
    }

    // Negative Keywords
    if (adGroup.negativeKeywords) {
      adGroup.negativeKeywords.forEach((negativeKeyword) => {
        rows.push([
          '', // Bid Strategy Type
          '', // Budget
          '', // Campaign status
          '', // Campaign type
          escapeCSV(campaign.campaignName),
          '', // Networks
          '', // EU political ads
          '', // Desktop Bid adj.
          '', // Mobile Bid adj.
          '', // Tablet Bid adj.
          '', // Ad group status
          escapeCSV(adGroup.name),
          '', // Max CPC
          escapeCSV(negativeKeyword.text),
          escapeCSV(negativeKeyword.matchType),
          '', // Ad Type
          '', // Final URL
          '', // Final mobile URL
          '', // Path 1
          '', // Path 2
          '', // Verification URL
          '', // Display URL
          '', // Business name
          '', // Country
          '', // Phone number
          '', // Headline 1
          '', // Headline 1 position
          '', // Headline 2
          '', // Headline 2 position
          '', // Headline 3
          '', // Headline 3 position
          '', // Description 1
          '', // Description 1 position
          '', // Description 2
          ''  // Description 2 position
        ]);
      });
    }

    // Ads
    if (adGroup.ads) {
      adGroup.ads.forEach((ad) => {
        const row: string[] = [
          '', // Bid Strategy Type
          '', // Budget
          '', // Campaign status
          '', // Campaign type
          escapeCSV(campaign.campaignName),
          '', // Networks
          '', // EU political ads
          '', // Desktop Bid adj.
          '', // Mobile Bid adj.
          '', // Tablet Bid adj.
          '', // Ad group status
          escapeCSV(adGroup.name),
          '', // Max CPC
          '', // Keyword
          '', // Type
          escapeCSV(ad.type),
          escapeCSV(ad.finalUrl || ''),
          escapeCSV(ad.finalMobileUrl || ''),
          escapeCSV(ad.path1 || ''),
          escapeCSV(ad.path2 || ''),
          escapeCSV(ad.verificationUrl || ''),
          escapeCSV(ad.displayUrl || ''),
          escapeCSV(ad.businessName || ''),
          escapeCSV(ad.country || ''),
          escapeCSV(ad.phoneNumber || ''),
          '', // Headline 1
          '', // Headline 1 position
          '', // Headline 2
          '', // Headline 2 position
          '', // Headline 3
          '', // Headline 3 position
          '', // Description 1
          '', // Description 1 position
          '', // Description 2
          ''  // Description 2 position
        ];

        // Add headlines and descriptions based on ad type
        // With new columns, indexes shifted by 7 (new columns added)
        if (ad.type === 'Expanded text ad') {
          // Expanded text ad: Headlines and descriptions without positions
          if (ad.headlines && ad.headlines.length > 0) {
            if (ad.headlines[0]) row[26] = escapeCSV(ad.headlines[0]); // Headline 1
            if (ad.headlines[1]) row[28] = escapeCSV(ad.headlines[1]); // Headline 2
            if (ad.headlines[2]) row[30] = escapeCSV(ad.headlines[2]); // Headline 3
          }
          if (ad.descriptions && ad.descriptions.length > 0) {
            if (ad.descriptions[0]) row[32] = escapeCSV(ad.descriptions[0]); // Description 1
            if (ad.descriptions[1]) row[34] = escapeCSV(ad.descriptions[1]); // Description 2
          }
        } else if (ad.type === 'Responsive search ad') {
          // Responsive search ad: Can have positions or actual content
          if (ad.headlines && ad.headlines.length > 0) {
            ad.headlines.forEach((headline, index) => {
              if (index < 3) {
                const headlineNum = index + 1;
                const headlineIndex = 26 + (index * 2); // Headline 1 at 26, Headline 2 at 28, Headline 3 at 30
                const positionIndex = headlineIndex + 1; // Position right after headline
                
                row[headlineIndex] = escapeCSV(headline);
                if (ad.headlinePositions && ad.headlinePositions[index] !== undefined) {
                  row[positionIndex] = escapeCSV(ad.headlinePositions[index].toString());
                } else {
                  row[positionIndex] = escapeCSV(headlineNum.toString());
                }
              }
            });
          }
          if (ad.descriptions && ad.descriptions.length > 0) {
            ad.descriptions.forEach((description, index) => {
              if (index < 2) {
                const descNum = index + 1;
                const descIndex = 32 + (index * 2); // Description 1 at 32, Description 2 at 34
                const positionIndex = descIndex + 1; // Position right after description
                
                row[descIndex] = escapeCSV(description);
                if (ad.descriptionPositions && ad.descriptionPositions[index] !== undefined) {
                  row[positionIndex] = escapeCSV(ad.descriptionPositions[index].toString());
                } else {
                  row[positionIndex] = escapeCSV(descNum.toString());
                }
              }
            });
          }
        }

        rows.push(row);
      });
    }
  });

  return rows;
}

/**
 * Convert rows to CSV string
 */
function rowsToCSVString(rows: string[][]): string {
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export campaign to CSV
 */
export function exportCampaignToCSV(campaign: CampaignData, filename: string = 'campaign_export.csv'): void {
  const rows = generateCSVRows(campaign);
  const csvContent = rowsToCSVString(rows);

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert CampaignBuilder data to CampaignData format
 * Helper function to convert from CampaignBuilder's internal format
 */
export function convertCampaignBuilderData(
  campaignName: string,
  adGroups: Array<{
    name: string;
    keywords: string[];
  }>,
  generatedAds: any[],
  baseUrl: string = 'https://www.example.com'
): CampaignData {
  const campaign: CampaignData = {
    campaignName,
    bidStrategy: 'cpc',
    budget: 100,
    campaignStatus: 'Paused',
    campaignType: 'Search Only',
    adGroups: adGroups.map((adGroup) => {
      // Get ads for this ad group
      const groupAds = generatedAds.filter(ad => 
        ad.adGroup === adGroup.name || ad.adGroup === 'ALL_AD_GROUPS'
      );

      // Convert keywords - extract match type and text
      const keywords: KeywordData[] = [];
      adGroup.keywords.forEach((keyword) => {
        const trimmed = keyword.trim();
        let matchType: 'exact' | 'phrase' | 'broad' = 'broad';
        let text = trimmed;

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          matchType = 'exact';
          text = trimmed.slice(1, -1);
        } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          matchType = 'phrase';
          text = trimmed.slice(1, -1);
        }

        keywords.push({ text, matchType });
      });

      // Convert ads
      const ads: AdData[] = groupAds
        .filter(ad => ad.type === 'rsa' || ad.type === 'dki' || ad.type === 'callonly')
        .map((ad) => {
          if (ad.type === 'rsa' || ad.type === 'dki') {
            return {
              type: 'Responsive search ad' as const,
              finalUrl: ad.finalUrl || baseUrl,
              path1: ad.path1 || '',
              path2: ad.path2 || '',
              headlines: [
                ad.headline1 || '',
                ad.headline2 || '',
                ad.headline3 || ''
              ].filter(h => h),
              descriptions: [
                ad.description1 || '',
                ad.description2 || ''
              ].filter(d => d)
            };
          } else if (ad.type === 'callonly') {
            return {
              type: 'Call-only ad' as const,
              verificationUrl: ad.finalUrl || baseUrl,
              displayUrl: baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
              businessName: ad.businessName || 'Business Name',
              country: 'US',
              phoneNumber: ad.phone || '123 456 789'
            };
          }
          return null;
        })
        .filter((ad): ad is AdData => ad !== null);

      return {
        name: adGroup.name,
        status: 'enabled',
        keywords,
        ads
      };
    })
  };

  return campaign;
}

/**
 * Export preset to CSV
 * Converts preset data to CampaignData format and exports
 * Follows the exact format from the template CSV
 * 
 * Usage example:
 * import { exportPresetToCSV } from '../utils/googleAdsCSVExporter';
 * exportPresetToCSV(AD_FILL_INFO_PRESETS[0], 'My Campaign', 'campaign.csv');
 */
export function exportPresetToCSV(
  preset: {
    baseUrl: string;
    adGroups: Array<{
      name: string;
      keywords: string[];
    }>;
  },
  campaignName: string = 'Preset Campaign',
  filename: string = 'preset_export.csv'
): void {
  const campaign: CampaignData = {
    campaignName,
    bidStrategy: 'cpc',
    budget: 100,
    campaignStatus: 'Paused',
    campaignType: 'Search Only',
    adGroups: preset.adGroups.map((adGroup) => {
      // Get first keyword for generating ad content
      const firstKeyword = adGroup.keywords[0] || adGroup.name;
      const keywordTitle = firstKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      return {
        name: adGroup.name,
        status: 'enabled',
        keywords: [
          // Add all three match types for each keyword
          ...adGroup.keywords.flatMap(kw => [
            { text: kw, matchType: 'exact' as const },
            { text: kw, matchType: 'phrase' as const },
            { text: kw, matchType: 'broad' as const }
          ])
        ],
        negativeKeywords: [
          // Generate some negative keywords from other ad groups
          ...preset.adGroups
            .filter(ag => ag.name !== adGroup.name)
            .flatMap(ag => ag.keywords.slice(0, 2))
            .map(kw => ({ text: kw, matchType: 'Negative Phrase' as const }))
        ],
        ads: [
          // Expanded text ad
          {
            type: 'Expanded text ad' as const,
            finalUrl: `${preset.baseUrl}/?q=${firstKeyword.toLowerCase().replace(/\s+/g, '-')}`,
            headlines: [keywordTitle, 'Online Store', 'Free Delivery'],
            descriptions: [`Buy online ${firstKeyword.toLowerCase()}`, `Vast collection of ${firstKeyword.toLowerCase()}`]
          },
          // Call-only ad
          {
            type: 'Call-only ad' as const,
            verificationUrl: `${preset.baseUrl}/contacts`,
            displayUrl: preset.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            businessName: 'Acme Book Shop',
            country: 'US',
            phoneNumber: '123 456 789'
          },
          // Responsive search ad (placeholder with positions)
          {
            type: 'Responsive search ad' as const,
            headlines: [],
            headlinePositions: [1, 2, 3],
            descriptions: [],
            descriptionPositions: [1, 2]
          },
          // Responsive search ad (with actual content)
          {
            type: 'Responsive search ad' as const,
            finalUrl: preset.baseUrl,
            headlines: [keywordTitle.substring(0, 6), keywordTitle.substring(0, 5), keywordTitle.substring(0, 7)],
            headlinePositions: [1, 2, 3],
            descriptions: [`${keywordTitle.substring(0, 5)} description`, `${keywordTitle.substring(0, 7)} description`],
            descriptionPositions: [1, 2]
          }
        ]
      };
    })
  };

  exportCampaignToCSV(campaign, filename);
}

