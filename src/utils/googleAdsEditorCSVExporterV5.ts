/**
 * Google Ads Editor CSV Exporter V5 - Master Format (183 Columns)
 * 
 * This exporter uses the complete Google Ads Editor format with all 183 columns
 * including all asset extensions, location targeting, and complete ad structure.
 * 
 * Based on the master CSV template: Campaign_Enhanced_Full_Assets.csv
 */

// Complete 183-column header array matching Google Ads Editor format
export const MASTER_CSV_HEADERS = [
  'Campaign',
  'Campaign Daily Budget',
  'Campaign Type',
  'Bid Strategy Type',
  'Networks',
  'EU political ads',
  'Desktop Bid adj.',
  'Mobile Bid adj.',
  'Tablet Bid adj.',
  'Start Date',
  'End Date',
  'Campaign Status',
  'Campaign Labels',
  'Ad Group',
  'Max CPC',
  'Ad Group Status',
  'Ad Group Labels',
  'Keyword',
  'Criterion Type',
  'Keyword Status',
  'Max CPC Bid',
  'Keyword Labels',
  'Bid Modifier',
  'Keyword (Negative)',
  'Criterion Type (Negative)',
  'Negative Keyword Status',
  'Audience ID',
  'Audience Name',
  'Audience Type',
  'Audience Status',
  'Location',
  'Location Type',
  'Location Status',
  'Bid Adjustment (%)',
  'City',
  'State/Region',
  'Postal Code',
  'Country Code',
  'Latitude',
  'Longitude',
  'Radius',
  'Radius Units',
  'Ad Type',
  'Final URL',
  'Final URL Suffix',
  'Mobile Final URL',
  'Tracking Template',
  'Custom Parameter',
  'Headline 1',
  'Headline 2',
  'Headline 3',
  'Headline 4',
  'Headline 5',
  'Headline 6',
  'Headline 7',
  'Headline 8',
  'Headline 9',
  'Headline 10',
  'Headline 11',
  'Headline 12',
  'Headline 13',
  'Headline 14',
  'Headline 15',
  'Description 1',
  'Description 2',
  'Description 3',
  'Description 4',
  'Path 1',
  'Path 2',
  'Dynamic Search Ad Description 1',
  'Dynamic Search Ad Description 2',
  'Dynamic Search Ad Domain Language',
  'PhoneNumber',
  'VerificationURL',
  'Call Extension Status',
  'Call Extension Scheduling',
  'Call Only Ads',
  'Sitelink 1 Text',
  'Sitelink 1 Description 1',
  'Sitelink 1 Description 2',
  'Sitelink 1 Final URL',
  'Sitelink 1 Status',
  'Sitelink 1 Start Date',
  'Sitelink 1 End Date',
  'Sitelink 2 Text',
  'Sitelink 2 Description 1',
  'Sitelink 2 Description 2',
  'Sitelink 2 Final URL',
  'Sitelink 2 Status',
  'Sitelink 2 Start Date',
  'Sitelink 2 End Date',
  'Sitelink 3 Text',
  'Sitelink 3 Description 1',
  'Sitelink 3 Description 2',
  'Sitelink 3 Final URL',
  'Sitelink 3 Status',
  'Sitelink 3 Start Date',
  'Sitelink 3 End Date',
  'Sitelink 4 Text',
  'Sitelink 4 Description 1',
  'Sitelink 4 Description 2',
  'Sitelink 4 Final URL',
  'Sitelink 4 Status',
  'Sitelink 4 Start Date',
  'Sitelink 4 End Date',
  'Callout 1 Text',
  'Callout 1 Status',
  'Callout 1 Start Date',
  'Callout 1 End Date',
  'Callout 2 Text',
  'Callout 2 Status',
  'Callout 2 Start Date',
  'Callout 2 End Date',
  'Callout 3 Text',
  'Callout 3 Status',
  'Callout 3 Start Date',
  'Callout 3 End Date',
  'Callout 4 Text',
  'Callout 4 Status',
  'Callout 4 Start Date',
  'Callout 4 End Date',
  'Structured Snippet Header',
  'Structured Snippet Values',
  'Structured Snippet 1 Header',
  'Structured Snippet 1 Values',
  'Structured Snippet 2 Header',
  'Structured Snippet 2 Values',
  'Price Extension Type',
  'Price Extension Price Qualifier',
  'Price Extension Item Header',
  'Price Extension Item Price',
  'Price Extension Item Final URL',
  'Price Extension 1 Type',
  'Price Extension 1 Price Qualifier',
  'Price Extension 1 Item 1 Header',
  'Price Extension 1 Item 1 Price',
  'Price Extension 1 Item 1 Final URL',
  'Price Extension 1 Item 2 Header',
  'Price Extension 1 Item 2 Price',
  'Price Extension 1 Item 2 Final URL',
  'Price Extension 1 Item 3 Header',
  'Price Extension 1 Item 3 Price',
  'Price Extension 1 Item 3 Final URL',
  'Price Extension 1 Item 4 Header',
  'Price Extension 1 Item 4 Price',
  'Price Extension 1 Item 4 Final URL',
  'Promotion Target',
  'Promotion Discount Modifier',
  'Promotion Percent Off',
  'Promotion Money Amount Off',
  'Promotion Final URL',
  'Promotion Status',
  'Promotion Start Date',
  'Promotion End Date',
  'App ID',
  'App Store',
  'App Link Text',
  'App Final URL',
  'App Status',
  'Message Text',
  'Message Final URL',
  'Message Business Name',
  'Message Country Code',
  'Message Phone Number',
  'Message Status',
  'Lead Form ID',
  'Lead Form Name',
  'Lead Form Headline',
  'Lead Form Description',
  'Lead Form Call-to-action',
  'Lead Form Status',
  'Image Asset Name',
  'Image Asset URL',
  'Image Asset Status',
  'Video Asset ID',
  'Video Asset Name',
  'Video Asset URL',
  'Video Asset Status',
  'Business Profile Location',
  'Business Name',
  'Business Address',
  'Business Phone',
  'Business Website',
  'Link Text',
  'Description Line 1',
  'Description Line 2',
  'Callout Text',
  'Snippet Header',
  'Snippet Values'
];

// Column index map for quick access
export const COLUMN_INDEX: { [key: string]: number } = {};
MASTER_CSV_HEADERS.forEach((header, idx) => {
  COLUMN_INDEX[header] = idx;
});

// Helper to escape CSV field values
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Create an empty row with all 183 columns
function createEmptyRow(): string[] {
  return new Array(MASTER_CSV_HEADERS.length).fill('');
}

// Types for campaign data
export interface CampaignDataV5 {
  campaignName: string;
  dailyBudget?: number;
  campaignType?: string;
  bidStrategy?: string;
  networks?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  labels?: string;
  url?: string;
  adGroups: AdGroupV5[];
  negativeKeywords?: string[];
  locations?: LocationDataV5;
  sitelinks?: SitelinkV5[];
  callouts?: CalloutV5[];
  snippets?: SnippetV5[];
  callExtensions?: CallExtensionV5[];
  priceExtensions?: PriceExtensionV5[];
  promotions?: PromotionV5[];
  appExtensions?: AppExtensionV5[];
  messageExtensions?: MessageExtensionV5[];
  leadFormExtensions?: LeadFormExtensionV5[];
  imageAssets?: ImageAssetV5[];
  videoAssets?: VideoAssetV5[];
  businessInfo?: BusinessInfoV5;
}

export interface AdGroupV5 {
  name: string;
  maxCpc?: number;
  status?: string;
  labels?: string;
  keywords: KeywordV5[];
  ads: AdV5[];
}

export interface KeywordV5 {
  text: string;
  matchType: 'Broad' | 'Phrase' | 'Exact';
  status?: string;
  maxCpcBid?: number;
  labels?: string;
  finalUrl?: string;
}

export interface AdV5 {
  type: 'RSA' | 'DKI' | 'CallOnly';
  headlines: string[];
  descriptions: string[];
  path1?: string;
  path2?: string;
  finalUrl: string;
  mobileUrl?: string;
  phoneNumber?: string;
  verificationUrl?: string;
  businessName?: string;
  status?: string;
}

export interface LocationDataV5 {
  countries?: string[];
  states?: string[];
  cities?: string[];
  zipCodes?: string[];
  countryCode?: string;
}

export interface SitelinkV5 {
  text: string;
  description1?: string;
  description2?: string;
  finalUrl: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CalloutV5 {
  text: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SnippetV5 {
  header: string;
  values: string;
  status?: string;
}

export interface PriceExtensionV5 {
  type: string;
  priceQualifier?: string;
  items: { header: string; price: string; finalUrl: string }[];
}

export interface PromotionV5 {
  target: string;
  discountModifier?: string;
  percentOff?: string;
  moneyAmountOff?: string;
  finalUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CallExtensionV5 {
  phoneNumber: string;
  countryCode?: string;
  verificationUrl?: string;
  status?: string;
  scheduling?: string;
  startDate?: string;
  endDate?: string;
  devicePreference?: 'All' | 'Mobile' | 'Desktop';
}

export interface AppExtensionV5 {
  appId: string;
  appStore: 'Google Play' | 'Apple App Store';
  linkText: string;
  finalUrl: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  devicePreference?: 'All' | 'Mobile' | 'Desktop';
}

export interface MessageExtensionV5 {
  text: string;
  finalUrl?: string;
  businessName: string;
  countryCode: string;
  phoneNumber: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  devicePreference?: 'All' | 'Mobile' | 'Desktop';
}

export interface LeadFormExtensionV5 {
  id: string;
  name: string;
  headline: string;
  description: string;
  callToAction: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface VideoAssetV5 {
  id: string;
  name: string;
  url: string;
  status?: string;
}

export interface ImageAssetV5 {
  name: string;
  url: string;
  status?: string;
}

export interface BusinessInfoV5 {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  location?: string;
}

/**
 * Generate a complete CSV with all 183 columns from campaign data
 */
export function generateMasterCSV(campaign: CampaignDataV5): string {
  const rows: string[][] = [];
  
  // Header row
  rows.push([...MASTER_CSV_HEADERS]);
  
  // Campaign row (first data row) - REQUIRED for Google Ads Editor
  const campaignRow = createEmptyRow();
  campaignRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
  campaignRow[COLUMN_INDEX['Campaign Daily Budget']] = String(campaign.dailyBudget || 100);
  campaignRow[COLUMN_INDEX['Campaign Type']] = campaign.campaignType || 'Search';
  campaignRow[COLUMN_INDEX['Bid Strategy Type']] = campaign.bidStrategy || 'Maximize Conversions';
  campaignRow[COLUMN_INDEX['Networks']] = campaign.networks || 'Google search';
  campaignRow[COLUMN_INDEX['EU political ads']] = 'No';
  campaignRow[COLUMN_INDEX['Desktop Bid adj.']] = '0%';
  campaignRow[COLUMN_INDEX['Mobile Bid adj.']] = '0%';
  campaignRow[COLUMN_INDEX['Tablet Bid adj.']] = '0%';
  campaignRow[COLUMN_INDEX['Start Date']] = campaign.startDate || '';
  campaignRow[COLUMN_INDEX['End Date']] = campaign.endDate || '';
  campaignRow[COLUMN_INDEX['Campaign Status']] = campaign.status || 'Enabled';
  campaignRow[COLUMN_INDEX['Campaign Labels']] = campaign.labels || '';
  
  // Add call extensions
  if (campaign.callExtensions && campaign.callExtensions.length > 0) {
    const callExt = campaign.callExtensions[0]; // Use first call extension
    campaignRow[COLUMN_INDEX['PhoneNumber']] = callExt.phoneNumber || '';
    campaignRow[COLUMN_INDEX['VerificationURL']] = callExt.verificationUrl || '';
    campaignRow[COLUMN_INDEX['Call Extension Status']] = callExt.status || 'Enabled';
    campaignRow[COLUMN_INDEX['Call Extension Scheduling']] = callExt.scheduling || '';
  }
  
  // Add price extensions
  if (campaign.priceExtensions && campaign.priceExtensions.length > 0) {
    const priceExt = campaign.priceExtensions[0]; // Use first price extension
    campaignRow[COLUMN_INDEX['Price Extension Type']] = priceExt.type || '';
    campaignRow[COLUMN_INDEX['Price Extension Price Qualifier']] = priceExt.priceQualifier || '';
    
    // Add price extension items (up to 4)
    if (priceExt.items && priceExt.items.length > 0) {
      campaignRow[COLUMN_INDEX['Price Extension Item Header']] = priceExt.items[0]?.header || '';
      campaignRow[COLUMN_INDEX['Price Extension Item Price']] = priceExt.items[0]?.price || '';
      campaignRow[COLUMN_INDEX['Price Extension Item Final URL']] = priceExt.items[0]?.finalUrl || '';
      
      // Additional price extension items
      for (let i = 0; i < Math.min(4, priceExt.items.length); i++) {
        const item = priceExt.items[i];
        const itemNum = i + 1;
        campaignRow[COLUMN_INDEX[`Price Extension 1 Item ${itemNum} Header`]] = item.header || '';
        campaignRow[COLUMN_INDEX[`Price Extension 1 Item ${itemNum} Price`]] = item.price || '';
        campaignRow[COLUMN_INDEX[`Price Extension 1 Item ${itemNum} Final URL`]] = item.finalUrl || '';
      }
    }
  }
  
  // Add promotion extensions
  if (campaign.promotions && campaign.promotions.length > 0) {
    const promotion = campaign.promotions[0]; // Use first promotion
    campaignRow[COLUMN_INDEX['Promotion Target']] = promotion.target || '';
    campaignRow[COLUMN_INDEX['Promotion Discount Modifier']] = promotion.discountModifier || '';
    campaignRow[COLUMN_INDEX['Promotion Percent Off']] = promotion.percentOff || '';
    campaignRow[COLUMN_INDEX['Promotion Money Amount Off']] = promotion.moneyAmountOff || '';
    campaignRow[COLUMN_INDEX['Promotion Final URL']] = promotion.finalUrl || '';
    campaignRow[COLUMN_INDEX['Promotion Status']] = promotion.status || 'Enabled';
    campaignRow[COLUMN_INDEX['Promotion Start Date']] = promotion.startDate || '';
    campaignRow[COLUMN_INDEX['Promotion End Date']] = promotion.endDate || '';
  }
  
  // Add app extensions
  if (campaign.appExtensions && campaign.appExtensions.length > 0) {
    const appExt = campaign.appExtensions[0]; // Use first app extension
    campaignRow[COLUMN_INDEX['App ID']] = appExt.appId || '';
    campaignRow[COLUMN_INDEX['App Store']] = appExt.appStore || '';
    campaignRow[COLUMN_INDEX['App Link Text']] = appExt.linkText || '';
    campaignRow[COLUMN_INDEX['App Final URL']] = appExt.finalUrl || '';
    campaignRow[COLUMN_INDEX['App Status']] = appExt.status || 'Enabled';
  }
  
  // Add message extensions
  if (campaign.messageExtensions && campaign.messageExtensions.length > 0) {
    const msgExt = campaign.messageExtensions[0]; // Use first message extension
    campaignRow[COLUMN_INDEX['Message Text']] = msgExt.text || '';
    campaignRow[COLUMN_INDEX['Message Final URL']] = msgExt.finalUrl || '';
    campaignRow[COLUMN_INDEX['Message Business Name']] = msgExt.businessName || '';
    campaignRow[COLUMN_INDEX['Message Country Code']] = msgExt.countryCode || '';
    campaignRow[COLUMN_INDEX['Message Phone Number']] = msgExt.phoneNumber || '';
    campaignRow[COLUMN_INDEX['Message Status']] = msgExt.status || 'Enabled';
  }
  
  // Add lead form extensions
  if (campaign.leadFormExtensions && campaign.leadFormExtensions.length > 0) {
    const leadForm = campaign.leadFormExtensions[0]; // Use first lead form
    campaignRow[COLUMN_INDEX['Lead Form ID']] = leadForm.id || '';
    campaignRow[COLUMN_INDEX['Lead Form Name']] = leadForm.name || '';
    campaignRow[COLUMN_INDEX['Lead Form Headline']] = leadForm.headline || '';
    campaignRow[COLUMN_INDEX['Lead Form Description']] = leadForm.description || '';
    campaignRow[COLUMN_INDEX['Lead Form Call-to-action']] = leadForm.callToAction || '';
    campaignRow[COLUMN_INDEX['Lead Form Status']] = leadForm.status || 'Enabled';
  }
  
  // Add business info
  if (campaign.businessInfo) {
    campaignRow[COLUMN_INDEX['Business Name']] = campaign.businessInfo.name || '';
    campaignRow[COLUMN_INDEX['Business Address']] = campaign.businessInfo.address || '';
    campaignRow[COLUMN_INDEX['Business Phone']] = campaign.businessInfo.phone || '';
    campaignRow[COLUMN_INDEX['Business Website']] = campaign.businessInfo.website || '';
    campaignRow[COLUMN_INDEX['Business Profile Location']] = campaign.businessInfo.location || '';
  }
  
  rows.push(campaignRow);
  
  // Ad Group rows (one per ad group) - REQUIRED for Google Ads Editor
  campaign.adGroups.forEach(adGroup => {
    const agRow = createEmptyRow();
    agRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
    agRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
    agRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
    agRow[COLUMN_INDEX['Max CPC']] = String(adGroup.maxCpc || 2.00);
    agRow[COLUMN_INDEX['Ad Group Status']] = adGroup.status || 'Enabled';
    agRow[COLUMN_INDEX['Ad Group Labels']] = adGroup.labels || '';
    rows.push(agRow);
  });
  
  // Keyword rows - REQUIRED for Google Ads Editor
  campaign.adGroups.forEach(adGroup => {
    adGroup.keywords.forEach(keyword => {
      const kwRow = createEmptyRow();
      kwRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      kwRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      kwRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
      kwRow[COLUMN_INDEX['Max CPC']] = String(adGroup.maxCpc || 2.00);
      kwRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
      kwRow[COLUMN_INDEX['Keyword']] = keyword.text;
      kwRow[COLUMN_INDEX['Criterion Type']] = keyword.matchType;
      kwRow[COLUMN_INDEX['Keyword Status']] = keyword.status || 'Enabled';
      kwRow[COLUMN_INDEX['Max CPC Bid']] = keyword.maxCpcBid ? String(keyword.maxCpcBid) : '';
      kwRow[COLUMN_INDEX['Keyword Labels']] = keyword.labels || '';
      kwRow[COLUMN_INDEX['Final URL']] = keyword.finalUrl || campaign.url || '';
      rows.push(kwRow);
    });
  });
  
  // Ad rows (RSA, DKI, Call-Only) - REQUIRED for Google Ads Editor
  campaign.adGroups.forEach(adGroup => {
    adGroup.ads.forEach(ad => {
      // Skip ads with no headlines or descriptions (invalid ads)
      const validHeadlines = (ad.headlines || []).filter((h: string) => h && h.trim());
      const validDescriptions = (ad.descriptions || []).filter((d: string) => d && d.trim());
      
      // RSA requires at least 3 headlines and 2 descriptions for Google Ads
      // But we'll be lenient here and only skip if completely empty
      if (validHeadlines.length < 1 || validDescriptions.length < 1) {
        console.warn(`Skipping invalid ad in group "${adGroup.name}": insufficient headlines (${validHeadlines.length}) or descriptions (${validDescriptions.length})`);
        return;
      }
      
      // Deduplicate headlines (case-insensitive comparison)
      const seenHeadlines = new Set<string>();
      const uniqueHeadlines: string[] = [];
      for (const h of validHeadlines) {
        const normalized = h.toLowerCase().trim();
        if (!seenHeadlines.has(normalized)) {
          seenHeadlines.add(normalized);
          uniqueHeadlines.push(h);
        }
      }
      
      // Fallback headlines for padding (all unique and Google Ads compliant)
      const fallbackHeadlines = [
        'Get Started Today',
        'Learn More Now',
        'Contact Us Today',
        'Free Consultation',
        'Expert Service',
        'Top Rated Provider',
        'Call For Quote',
        'Fast Response Time',
        'Trusted Professionals',
        'Quality Guaranteed'
      ];
      
      // Pad headlines to minimum 3 if we have less (for RSA compliance) - use unique fallbacks
      let fallbackIndex = 0;
      while (uniqueHeadlines.length < 3 && fallbackIndex < fallbackHeadlines.length) {
        const fallback = fallbackHeadlines[fallbackIndex];
        const normalized = fallback.toLowerCase().trim();
        if (!seenHeadlines.has(normalized)) {
          seenHeadlines.add(normalized);
          uniqueHeadlines.push(fallback);
        }
        fallbackIndex++;
      }
      
      // Deduplicate descriptions (case-insensitive comparison)
      const seenDescriptions = new Set<string>();
      const uniqueDescriptions: string[] = [];
      for (const d of validDescriptions) {
        const normalized = d.toLowerCase().trim();
        if (!seenDescriptions.has(normalized)) {
          seenDescriptions.add(normalized);
          uniqueDescriptions.push(d);
        }
      }
      
      // Fallback descriptions for padding
      const fallbackDescriptions = [
        'Contact us today for professional service. Fast, reliable, and affordable.',
        'Get expert help from our experienced team. Call now for a free quote.',
        'Quality service you can trust. Satisfaction guaranteed on every job.',
        'Available 24/7 for your needs. Licensed and insured professionals.'
      ];
      
      // Pad descriptions to minimum 2 if we have less (for RSA compliance) - use unique fallbacks
      let descFallbackIndex = 0;
      while (uniqueDescriptions.length < 2 && descFallbackIndex < fallbackDescriptions.length) {
        const fallback = fallbackDescriptions[descFallbackIndex];
        const normalized = fallback.toLowerCase().trim();
        if (!seenDescriptions.has(normalized)) {
          seenDescriptions.add(normalized);
          uniqueDescriptions.push(fallback);
        }
        descFallbackIndex++;
      }
      
      // Use the deduplicated arrays
      const finalHeadlines = uniqueHeadlines;
      const finalDescriptions = uniqueDescriptions;
      
      const adRow = createEmptyRow();
      adRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      adRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      adRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
      adRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
      adRow[COLUMN_INDEX['Ad Type']] = ad.type === 'RSA' ? 'Responsive search ad' : 
                                       ad.type === 'CallOnly' ? 'Call-only ad' : 
                                       'Responsive search ad';
      adRow[COLUMN_INDEX['Final URL']] = ad.finalUrl;
      adRow[COLUMN_INDEX['Mobile Final URL']] = ad.mobileUrl || '';
      
      // Headlines (up to 15) - use deduplicated unique headlines
      for (let i = 0; i < Math.min(15, finalHeadlines.length); i++) {
        const headlineCol = `Headline ${i + 1}`;
        if (COLUMN_INDEX[headlineCol] !== undefined) {
          adRow[COLUMN_INDEX[headlineCol]] = finalHeadlines[i].substring(0, 30);
        }
      }
      
      // Descriptions (up to 4) - use deduplicated unique descriptions
      for (let i = 0; i < Math.min(4, finalDescriptions.length); i++) {
        const descCol = `Description ${i + 1}`;
        if (COLUMN_INDEX[descCol] !== undefined) {
          adRow[COLUMN_INDEX[descCol]] = finalDescriptions[i].substring(0, 90);
        }
      }
      
      adRow[COLUMN_INDEX['Path 1']] = (ad.path1 || '').substring(0, 15);
      adRow[COLUMN_INDEX['Path 2']] = (ad.path2 || '').substring(0, 15);
      
      // Call-only specific fields
      if (ad.type === 'CallOnly') {
        adRow[COLUMN_INDEX['PhoneNumber']] = ad.phoneNumber || '';
        adRow[COLUMN_INDEX['VerificationURL']] = ad.verificationUrl || '';
        adRow[COLUMN_INDEX['Business Name']] = ad.businessName || '';
        adRow[COLUMN_INDEX['Call Only Ads']] = 'Yes';
      }
      
      rows.push(adRow);
    });
  });
  
  // Negative keyword rows - IMPORTANT for Google Ads Editor
  if (campaign.negativeKeywords && campaign.negativeKeywords.length > 0) {
    campaign.negativeKeywords.forEach(negKw => {
      const negRow = createEmptyRow();
      negRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      negRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      negRow[COLUMN_INDEX['Keyword (Negative)']] = negKw;
      negRow[COLUMN_INDEX['Criterion Type (Negative)']] = 'Phrase';
      negRow[COLUMN_INDEX['Negative Keyword Status']] = 'Enabled';
      rows.push(negRow);
    });
  }
  
  // Location targeting rows - REQUIRED for Google Ads Editor
  if (campaign.locations) {
    const countryCode = campaign.locations.countryCode || 'US';
    
    // Countries
    if (campaign.locations.countries && campaign.locations.countries.length > 0) {
      campaign.locations.countries.forEach(country => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = country;
        locRow[COLUMN_INDEX['Location Type']] = 'Country';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // States
    if (campaign.locations.states && campaign.locations.states.length > 0) {
      campaign.locations.states.forEach(state => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = state;
        locRow[COLUMN_INDEX['Location Type']] = 'Region';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['State/Region']] = state;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // Cities
    if (campaign.locations.cities && campaign.locations.cities.length > 0) {
      campaign.locations.cities.forEach(city => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = city;
        locRow[COLUMN_INDEX['Location Type']] = 'City';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['City']] = city;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // ZIP Codes
    if (campaign.locations.zipCodes && campaign.locations.zipCodes.length > 0) {
      campaign.locations.zipCodes.forEach(zip => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = zip;
        locRow[COLUMN_INDEX['Location Type']] = 'Postal Code';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Postal Code']] = zip;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
  }
  
  // Sitelink asset rows - using dedicated asset columns (Link Text, not numbered Sitelink N columns)
  if (campaign.sitelinks && campaign.sitelinks.length > 0) {
    campaign.sitelinks.forEach((sl) => {
      const slRow = createEmptyRow();
      slRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      slRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      slRow[COLUMN_INDEX['Link Text']] = sl.text || '';
      slRow[COLUMN_INDEX['Description Line 1']] = sl.description1 || '';
      slRow[COLUMN_INDEX['Description Line 2']] = sl.description2 || '';
      slRow[COLUMN_INDEX['Final URL']] = sl.finalUrl || campaign.url || '';
      rows.push(slRow);
    });
  }
  
  // Callout asset rows
  if (campaign.callouts && campaign.callouts.length > 0) {
    campaign.callouts.forEach((co) => {
      const coRow = createEmptyRow();
      coRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      coRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      coRow[COLUMN_INDEX['Callout Text']] = co.text || '';
      rows.push(coRow);
    });
  }
  
  // Structured snippet asset rows
  if (campaign.snippets && campaign.snippets.length > 0) {
    campaign.snippets.forEach((sn) => {
      const snRow = createEmptyRow();
      snRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      snRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      snRow[COLUMN_INDEX['Snippet Header']] = sn.header || '';
      snRow[COLUMN_INDEX['Snippet Values']] = sn.values || '';
      rows.push(snRow);
    });
  }
  
  // Image asset rows
  if (campaign.imageAssets && campaign.imageAssets.length > 0) {
    campaign.imageAssets.forEach(img => {
      const imgRow = createEmptyRow();
      imgRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      imgRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      imgRow[COLUMN_INDEX['Image Asset Name']] = img.name;
      imgRow[COLUMN_INDEX['Image Asset URL']] = img.url;
      imgRow[COLUMN_INDEX['Image Asset Status']] = img.status || 'Enabled';
      rows.push(imgRow);
    });
  }
  
  // Video asset rows
  if (campaign.videoAssets && campaign.videoAssets.length > 0) {
    campaign.videoAssets.forEach(video => {
      const videoRow = createEmptyRow();
      videoRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      videoRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      videoRow[COLUMN_INDEX['Video Asset ID']] = video.id;
      videoRow[COLUMN_INDEX['Video Asset Name']] = video.name;
      videoRow[COLUMN_INDEX['Video Asset URL']] = video.url;
      videoRow[COLUMN_INDEX['Video Asset Status']] = video.status || 'Enabled';
      rows.push(videoRow);
    });
  }
  
  // Convert rows to CSV string with proper escaping
  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
  
  // Add UTF-8 BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

/**
 * Download the generated CSV
 */
export function downloadMasterCSV(campaign: CampaignDataV5, filename?: string): void {
  const csvContent = generateMasterCSV(campaign);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `${campaign.campaignName.replace(/[^a-zA-Z0-9]/g, '_')}_GoogleAds.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert legacy campaign data to V5 format
 */
export function convertToV5Format(legacyData: any): CampaignDataV5 {
  const campaign: CampaignDataV5 = {
    campaignName: legacyData.campaignName || 'Campaign',
    dailyBudget: legacyData.dailyBudget || 100,
    campaignType: 'Search',
    bidStrategy: 'Maximize Conversions',
    networks: 'Google search',
    status: 'Enabled',
    url: legacyData.url || legacyData.finalUrl || '',
    adGroups: [],
    negativeKeywords: legacyData.negativeKeywords || [],
    locations: {
      countries: legacyData.locations?.countries || [],
      states: legacyData.locations?.states || [],
      cities: legacyData.locations?.cities || [],
      zipCodes: legacyData.locations?.zipCodes || [],
      countryCode: 'US'
    },
    sitelinks: [],
    callouts: [],
    snippets: []
  };
  
  // Convert ad groups
  if (legacyData.adGroups && Array.isArray(legacyData.adGroups)) {
    campaign.adGroups = legacyData.adGroups.map((ag: any) => ({
      name: ag.name || ag.adgroup_name || 'Ad Group',
      maxCpc: ag.maxCpc || ag.max_cpc || 2.00,
      status: 'Enabled',
      keywords: (ag.keywords || []).map((kw: any) => ({
        text: typeof kw === 'string' ? kw : (kw.text || kw.keyword || ''),
        matchType: typeof kw === 'string' ? 'Broad' : (kw.matchType || kw.match_type || 'Broad'),
        status: 'Enabled',
        finalUrl: legacyData.url || ''
      })),
      ads: []
    }));
  }
  
  // Convert ads
  if (legacyData.ads && Array.isArray(legacyData.ads)) {
    legacyData.ads.forEach((ad: any) => {
      const adGroupName = ad.adGroup || ad.ad_group || 'Ad Group 1';
      let targetGroup = campaign.adGroups.find(ag => ag.name === adGroupName);
      
      if (!targetGroup && campaign.adGroups.length > 0) {
        targetGroup = campaign.adGroups[0];
      } else if (!targetGroup) {
        targetGroup = { name: adGroupName, keywords: [], ads: [], maxCpc: 2.00, status: 'Enabled' };
        campaign.adGroups.push(targetGroup);
      }
      
      const convertedAd: AdV5 = {
        type: ad.type === 'call_only' ? 'CallOnly' : 
              ad.type === 'dki' ? 'DKI' : 'RSA',
        headlines: [
          ad.headline1 || '',
          ad.headline2 || '',
          ad.headline3 || '',
          ad.headline4 || '',
          ad.headline5 || ''
        ].filter(h => h),
        descriptions: [
          ad.description1 || '',
          ad.description2 || ''
        ].filter(d => d),
        path1: ad.path1 || '',
        path2: ad.path2 || '',
        finalUrl: ad.finalUrl || ad.final_url || legacyData.url || '',
        phoneNumber: ad.phoneNumber || '',
        verificationUrl: ad.verificationUrl || '',
        businessName: ad.businessName || ''
      };
      
      targetGroup.ads.push(convertedAd);
    });
  }
  
  // Convert sitelinks - check both direct array and extensions format
  if (legacyData.sitelinks && Array.isArray(legacyData.sitelinks)) {
    campaign.sitelinks = legacyData.sitelinks.slice(0, 4).map((sl: any) => ({
      text: sl.text || '',
      description1: sl.description1 || '',
      description2: sl.description2 || '',
      finalUrl: sl.finalUrl || legacyData.url || legacyData.final_url || '',
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const sitelinkExts = legacyData.extensions.filter((e: any) => e.type === 'sitelink');
    campaign.sitelinks = sitelinkExts.slice(0, 4).map((sl: any) => ({
      text: sl.text || sl.linkText || '',
      description1: sl.description1 || sl.descriptionLine1 || '',
      description2: sl.description2 || sl.descriptionLine2 || '',
      finalUrl: sl.finalUrl || sl.url || '',
      status: 'Enabled'
    }));
  }
  
  // Convert callouts - check both direct array and extensions format
  if (legacyData.callouts && Array.isArray(legacyData.callouts)) {
    campaign.callouts = legacyData.callouts.slice(0, 4).map((co: any) => ({
      text: co.text || '',
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const calloutExts = legacyData.extensions.filter((e: any) => e.type === 'callout');
    campaign.callouts = calloutExts.slice(0, 4).map((co: any) => ({
      text: co.text || '',
      status: 'Enabled'
    }));
  }
  
  // Convert structured snippets - check both direct array and extensions format
  if (legacyData.structured_snippets && Array.isArray(legacyData.structured_snippets)) {
    campaign.snippets = legacyData.structured_snippets.slice(0, 2).map((sn: any) => ({
      header: sn.header || '',
      values: Array.isArray(sn.values) ? sn.values.join('; ') : (sn.values || ''),
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const snippetExts = legacyData.extensions.filter((e: any) => e.type === 'snippet');
    campaign.snippets = snippetExts.slice(0, 2).map((sn: any) => ({
      header: sn.header || '',
      values: sn.values || '',
      status: 'Enabled'
    }));
  }
  
  // Convert call extensions
  if (legacyData.callExtensions && Array.isArray(legacyData.callExtensions)) {
    campaign.callExtensions = legacyData.callExtensions.map((ce: any) => ({
      phoneNumber: ce.phoneNumber || ce.phone || '',
      countryCode: ce.countryCode || 'US',
      verificationUrl: ce.verificationUrl || ce.verification_url || '',
      status: ce.status || 'Enabled',
      scheduling: ce.scheduling || ''
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const callExts = legacyData.extensions.filter((e: any) => e.type === 'call');
    campaign.callExtensions = callExts.map((ce: any) => ({
      phoneNumber: ce.phoneNumber || ce.phone || '',
      countryCode: ce.countryCode || 'US',
      verificationUrl: ce.verificationUrl || '',
      status: ce.status || 'Enabled',
      scheduling: ce.scheduling || ''
    }));
  }
  
  // Convert price extensions
  if (legacyData.priceExtensions && Array.isArray(legacyData.priceExtensions)) {
    campaign.priceExtensions = legacyData.priceExtensions.map((pe: any) => ({
      type: pe.type || 'Services',
      priceQualifier: pe.priceQualifier || pe.price_qualifier || '',
      items: pe.items || []
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const priceExts = legacyData.extensions.filter((e: any) => e.type === 'price');
    campaign.priceExtensions = priceExts.map((pe: any) => ({
      type: pe.type || 'Services',
      priceQualifier: pe.priceQualifier || '',
      items: pe.items || []
    }));
  }
  
  // Convert app extensions
  if (legacyData.appExtensions && Array.isArray(legacyData.appExtensions)) {
    campaign.appExtensions = legacyData.appExtensions.map((ae: any) => ({
      appId: ae.appId || ae.app_id || '',
      appStore: ae.appStore || ae.app_store || 'Google Play',
      linkText: ae.linkText || ae.link_text || 'Download App',
      finalUrl: ae.finalUrl || ae.final_url || '',
      status: ae.status || 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const appExts = legacyData.extensions.filter((e: any) => e.type === 'app');
    campaign.appExtensions = appExts.map((ae: any) => ({
      appId: ae.appId || '',
      appStore: ae.appStore || 'Google Play',
      linkText: ae.linkText || 'Download App',
      finalUrl: ae.finalUrl || '',
      status: ae.status || 'Enabled'
    }));
  }
  
  // Convert message extensions
  if (legacyData.messageExtensions && Array.isArray(legacyData.messageExtensions)) {
    campaign.messageExtensions = legacyData.messageExtensions.map((me: any) => ({
      text: me.text || '',
      finalUrl: me.finalUrl || me.final_url || '',
      businessName: me.businessName || me.business_name || '',
      countryCode: me.countryCode || me.country_code || 'US',
      phoneNumber: me.phoneNumber || me.phone_number || '',
      status: me.status || 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const msgExts = legacyData.extensions.filter((e: any) => e.type === 'message');
    campaign.messageExtensions = msgExts.map((me: any) => ({
      text: me.text || '',
      finalUrl: me.finalUrl || '',
      businessName: me.businessName || '',
      countryCode: me.countryCode || 'US',
      phoneNumber: me.phoneNumber || '',
      status: me.status || 'Enabled'
    }));
  }
  
  // Convert lead form extensions
  if (legacyData.leadFormExtensions && Array.isArray(legacyData.leadFormExtensions)) {
    campaign.leadFormExtensions = legacyData.leadFormExtensions.map((lf: any) => ({
      id: lf.id || '',
      name: lf.name || '',
      headline: lf.headline || '',
      description: lf.description || '',
      callToAction: lf.callToAction || lf.call_to_action || 'Learn More',
      status: lf.status || 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const leadFormExts = legacyData.extensions.filter((e: any) => e.type === 'leadform');
    campaign.leadFormExtensions = leadFormExts.map((lf: any) => ({
      id: lf.id || '',
      name: lf.name || '',
      headline: lf.headline || '',
      description: lf.description || '',
      callToAction: lf.callToAction || 'Learn More',
      status: lf.status || 'Enabled'
    }));
  }
  
  // Convert promotions
  if (legacyData.promotions && Array.isArray(legacyData.promotions)) {
    campaign.promotions = legacyData.promotions.map((p: any) => ({
      target: p.target || '',
      discountModifier: p.discountModifier || p.discount_modifier || '',
      percentOff: p.percentOff || p.percent_off || '',
      moneyAmountOff: p.moneyAmountOff || p.money_amount_off || '',
      finalUrl: p.finalUrl || p.final_url || '',
      status: p.status || 'Enabled',
      startDate: p.startDate || p.start_date || '',
      endDate: p.endDate || p.end_date || ''
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const promoExts = legacyData.extensions.filter((e: any) => e.type === 'promotion');
    campaign.promotions = promoExts.map((p: any) => ({
      target: p.target || '',
      discountModifier: p.discountModifier || '',
      percentOff: p.percentOff || '',
      moneyAmountOff: p.moneyAmountOff || '',
      finalUrl: p.finalUrl || '',
      status: p.status || 'Enabled',
      startDate: p.startDate || '',
      endDate: p.endDate || ''
    }));
  }
  
  // Convert image assets
  if (legacyData.imageAssets && Array.isArray(legacyData.imageAssets)) {
    campaign.imageAssets = legacyData.imageAssets.map((img: any) => ({
      name: img.name || '',
      url: img.url || '',
      status: img.status || 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const imgExts = legacyData.extensions.filter((e: any) => e.type === 'image');
    campaign.imageAssets = imgExts.map((img: any) => ({
      name: img.name || '',
      url: img.url || '',
      status: img.status || 'Enabled'
    }));
  }
  
  // Convert video assets
  if (legacyData.videoAssets && Array.isArray(legacyData.videoAssets)) {
    campaign.videoAssets = legacyData.videoAssets.map((video: any) => ({
      id: video.id || '',
      name: video.name || '',
      url: video.url || '',
      status: video.status || 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const videoExts = legacyData.extensions.filter((e: any) => e.type === 'video');
    campaign.videoAssets = videoExts.map((video: any) => ({
      id: video.id || '',
      name: video.name || '',
      url: video.url || '',
      status: video.status || 'Enabled'
    }));
  }
  
  return campaign;
}

/**
 * Get statistics about the generated CSV
 */
export function getCSVStatistics(campaign: CampaignDataV5): {
  columns: number;
  campaigns: number;
  adGroups: number;
  keywords: number;
  ads: number;
  negativeKeywords: number;
  locations: number;
  sitelinks: number;
  callouts: number;
  callExtensions: number;
  priceExtensions: number;
  appExtensions: number;
  messageExtensions: number;
  leadFormExtensions: number;
  promotions: number;
  imageAssets: number;
  videoAssets: number;
} {
  let totalLocations = 0;
  if (campaign.locations) {
    totalLocations = (campaign.locations.countries?.length || 0) +
                     (campaign.locations.states?.length || 0) +
                     (campaign.locations.cities?.length || 0) +
                     (campaign.locations.zipCodes?.length || 0);
  }
  
  return {
    columns: MASTER_CSV_HEADERS.length,
    campaigns: 1,
    adGroups: campaign.adGroups.length,
    keywords: campaign.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0),
    ads: campaign.adGroups.reduce((sum, ag) => sum + ag.ads.length, 0),
    negativeKeywords: campaign.negativeKeywords?.length || 0,
    locations: totalLocations,
    sitelinks: campaign.sitelinks?.length || 0,
    callouts: campaign.callouts?.length || 0,
    callExtensions: campaign.callExtensions?.length || 0,
    priceExtensions: campaign.priceExtensions?.length || 0,
    appExtensions: campaign.appExtensions?.length || 0,
    messageExtensions: campaign.messageExtensions?.length || 0,
    leadFormExtensions: campaign.leadFormExtensions?.length || 0,
    promotions: campaign.promotions?.length || 0,
    imageAssets: campaign.imageAssets?.length || 0,
    videoAssets: campaign.videoAssets?.length || 0
  };
}

/**
 * Validation interface for extension data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all extension data before CSV export
 */
export function validateExtensionData(campaign: CampaignDataV5): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate sitelinks
  if (campaign.sitelinks) {
    if (campaign.sitelinks.length > 4) {
      warnings.push(`Too many sitelinks (${campaign.sitelinks.length}). Only first 4 will be exported.`);
    }
    
    campaign.sitelinks.forEach((sitelink, index) => {
      if (!sitelink.text || sitelink.text.length > 25) {
        errors.push(`Sitelink ${index + 1}: Text must be 1-25 characters`);
      }
      if (sitelink.description1 && sitelink.description1.length > 35) {
        errors.push(`Sitelink ${index + 1}: Description 1 must be ≤35 characters`);
      }
      if (sitelink.description2 && sitelink.description2.length > 35) {
        errors.push(`Sitelink ${index + 1}: Description 2 must be ≤35 characters`);
      }
      if (!sitelink.finalUrl) {
        errors.push(`Sitelink ${index + 1}: Final URL is required`);
      }
    });
  }
  
  // Validate callouts
  if (campaign.callouts) {
    if (campaign.callouts.length > 4) {
      warnings.push(`Too many callouts (${campaign.callouts.length}). Only first 4 will be exported.`);
    }
    
    campaign.callouts.forEach((callout, index) => {
      if (!callout.text || callout.text.length > 25) {
        errors.push(`Callout ${index + 1}: Text must be 1-25 characters`);
      }
    });
  }
  
  // Validate structured snippets
  if (campaign.snippets) {
    if (campaign.snippets.length > 2) {
      warnings.push(`Too many structured snippets (${campaign.snippets.length}). Only first 2 will be exported.`);
    }
    
    campaign.snippets.forEach((snippet, index) => {
      if (!snippet.header) {
        errors.push(`Structured Snippet ${index + 1}: Header is required`);
      }
      if (!snippet.values) {
        errors.push(`Structured Snippet ${index + 1}: Values are required`);
      }
    });
  }
  
  // Validate call extensions
  if (campaign.callExtensions) {
    campaign.callExtensions.forEach((callExt, index) => {
      if (!callExt.phoneNumber) {
        errors.push(`Call Extension ${index + 1}: Phone number is required`);
      }
      // Basic phone number validation
      if (callExt.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(callExt.phoneNumber)) {
        errors.push(`Call Extension ${index + 1}: Invalid phone number format`);
      }
    });
  }
  
  // Validate app extensions
  if (campaign.appExtensions) {
    campaign.appExtensions.forEach((appExt, index) => {
      if (!appExt.appId) {
        errors.push(`App Extension ${index + 1}: App ID is required`);
      }
      if (!appExt.linkText || appExt.linkText.length > 25) {
        errors.push(`App Extension ${index + 1}: Link text must be 1-25 characters`);
      }
      if (!appExt.finalUrl) {
        errors.push(`App Extension ${index + 1}: Final URL is required`);
      }
    });
  }
  
  // Validate message extensions
  if (campaign.messageExtensions) {
    campaign.messageExtensions.forEach((msgExt, index) => {
      if (!msgExt.text || msgExt.text.length > 35) {
        errors.push(`Message Extension ${index + 1}: Text must be 1-35 characters`);
      }
      if (!msgExt.businessName) {
        errors.push(`Message Extension ${index + 1}: Business name is required`);
      }
      if (!msgExt.phoneNumber) {
        errors.push(`Message Extension ${index + 1}: Phone number is required`);
      }
    });
  }
  
  // Validate lead form extensions
  if (campaign.leadFormExtensions) {
    campaign.leadFormExtensions.forEach((leadForm, index) => {
      if (!leadForm.name) {
        errors.push(`Lead Form Extension ${index + 1}: Name is required`);
      }
      if (!leadForm.headline || leadForm.headline.length > 30) {
        errors.push(`Lead Form Extension ${index + 1}: Headline must be 1-30 characters`);
      }
      if (!leadForm.description || leadForm.description.length > 90) {
        errors.push(`Lead Form Extension ${index + 1}: Description must be 1-90 characters`);
      }
    });
  }
  
  // Validate price extensions
  if (campaign.priceExtensions) {
    campaign.priceExtensions.forEach((priceExt, index) => {
      if (!priceExt.type) {
        errors.push(`Price Extension ${index + 1}: Type is required`);
      }
      if (!priceExt.items || priceExt.items.length === 0) {
        errors.push(`Price Extension ${index + 1}: At least one price item is required`);
      }
      if (priceExt.items && priceExt.items.length > 8) {
        warnings.push(`Price Extension ${index + 1}: Too many items (${priceExt.items.length}). Maximum is 8.`);
      }
    });
  }
  
  // Validate promotions
  if (campaign.promotions) {
    campaign.promotions.forEach((promotion, index) => {
      if (!promotion.target) {
        errors.push(`Promotion ${index + 1}: Target is required`);
      }
      if (!promotion.percentOff && !promotion.moneyAmountOff) {
        errors.push(`Promotion ${index + 1}: Either percent off or money amount off is required`);
      }
    });
  }
  
  // Validate image assets
  if (campaign.imageAssets) {
    campaign.imageAssets.forEach((img, index) => {
      if (!img.name) {
        errors.push(`Image Asset ${index + 1}: Name is required`);
      }
      if (!img.url) {
        errors.push(`Image Asset ${index + 1}: URL is required`);
      }
    });
  }
  
  // Validate video assets
  if (campaign.videoAssets) {
    campaign.videoAssets.forEach((video, index) => {
      if (!video.name) {
        errors.push(`Video Asset ${index + 1}: Name is required`);
      }
      if (!video.url) {
        errors.push(`Video Asset ${index + 1}: URL is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate CSV format compliance (must be exactly 183 columns)
 */
export function validateCSVFormat(csvContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    errors.push('CSV is empty');
    return { isValid: false, errors, warnings };
  }
  
  // Function to properly parse CSV line considering quoted fields
  function parseCSVLine(line: string): string[] {
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Handle escaped quotes
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current); // Add the last column
    return columns;
  }
  
  // Check header row
  const headerColumns = parseCSVLine(lines[0]);
  
  if (headerColumns.length !== 183) {
    errors.push(`CSV must have exactly 183 columns, found ${headerColumns.length}`);
  }
  
  // Check that all data rows have the same number of columns
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    if (columns.length !== 183) {
      errors.push(`Row ${i + 1} has ${columns.length} columns, expected 183`);
    }
  }
  
  // Check for required headers
  const requiredHeaders = [
    'Campaign', 'Campaign Daily Budget', 'Campaign Type', 'Bid Strategy Type',
    'Ad Group', 'Keyword', 'Ad Type', 'Final URL'
  ];
  
  const headerRow = lines[0];
  requiredHeaders.forEach(header => {
    if (!headerRow.includes(header)) {
      errors.push(`Missing required header: ${header}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
