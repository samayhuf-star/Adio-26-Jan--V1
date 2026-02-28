/**
 * Google Ads Editor CSV Exporter V5 - Master Format (183 Columns)
 * 
 * This exporter uses the complete Google Ads Editor format with all 183 columns
 * including all asset extensions, location targeting, and complete ad structure.
 * 
 * Based on the master CSV template: Campaign_Enhanced_Full_Assets.csv
 */

function sanitizeAdText(text: string): string {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/"(\{KeyWord:[^}]+\})"/g, '$1');
  cleaned = cleaned.replace(/'(\{KeyWord:[^}]+\})'/g, '$1');
  const dkiPlaceholders: string[] = [];
  cleaned = cleaned.replace(/\{KeyWord:[^}]*\}/gi, (match) => {
    dkiPlaceholders.push(match);
    return `__DKI_${dkiPlaceholders.length - 1}__`;
  });
  cleaned = cleaned.replace(/[{}\[\]]/g, '');
  dkiPlaceholders.forEach((dki, i) => {
    cleaned = cleaned.replace(`__DKI_${i}__`, dki);
  });
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function truncateHeadline(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const dkiMatch = text.match(/\{KeyWord:[^}]*\}/i);
  if (dkiMatch) {
    const dkiTag = dkiMatch[0];
    const dkiStart = text.indexOf(dkiTag);
    const dkiEnd = dkiStart + dkiTag.length;
    if (dkiEnd <= maxLen) {
      return text.substring(0, maxLen);
    }
    const defaultText = dkiTag.match(/\{KeyWord:([^}]*)\}/i)?.[1] || '';
    if (defaultText.length > maxLen - 11) {
      const trimmedDefault = defaultText.substring(0, maxLen - 11);
      return `{KeyWord:${trimmedDefault}}`;
    }
    return `{KeyWord:${defaultText}}`;
  }
  return text.substring(0, maxLen);
}

function truncateDescription(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const dkiMatch = text.match(/\{KeyWord:[^}]*\}/i);
  if (dkiMatch) {
    const dkiTag = dkiMatch[0];
    const dkiStart = text.indexOf(dkiTag);
    const dkiEnd = dkiStart + dkiTag.length;
    if (dkiEnd <= maxLen) {
      return text.substring(0, maxLen);
    }
    const defaultText = dkiTag.match(/\{KeyWord:([^}]*)\}/i)?.[1] || '';
    const prefix = text.substring(0, dkiStart);
    const available = maxLen - prefix.length - 11;
    if (available > 0) {
      const trimmedDefault = defaultText.length > available ? defaultText.substring(0, available) : defaultText;
      return `${prefix}{KeyWord:${trimmedDefault}}`;
    }
    return prefix.trimEnd().substring(0, maxLen);
  }
  return text.substring(0, maxLen);
}

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
  'Country of Phone',
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
  'Business Name',
  'Business Address',
  'Business Phone',
  'Business Website',
  'Link Text',
  'Description Line 1',
  'Description Line 2',
  'Callout Text',
  'Snippet Header',
  'Snippet Values',
  'Price qualifier',
  'Price type',
  'Price item 1 header',
  'Price item 1 description',
  'Price item 1 price',
  'Price item 1 unit',
  'Price item 1 Final URL',
  'Price item 2 header',
  'Price item 2 description',
  'Price item 2 price',
  'Price item 2 unit',
  'Price item 2 Final URL',
  'Price item 3 header',
  'Price item 3 description',
  'Price item 3 price',
  'Price item 3 unit',
  'Price item 3 Final URL',
  'Promotion occasion',
  'Promotion language',
  'Promotion target country',
  'Promotion discount modifier',
  'Promotion percent off',
  'Promotion money amount off',
  'Promotion item description',
  'Promotion Final URL'
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
  priceExtension?: PriceExtensionV5;
  promotionExtension?: PromotionExtensionV5;
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

export interface PriceItemV5 {
  header: string;
  description: string;
  price: string;
  unit?: string;
  finalUrl: string;
}

export interface PriceExtensionV5 {
  qualifier?: string;
  priceType?: string;
  items: PriceItemV5[];
}

export interface PromotionExtensionV5 {
  occasion?: string;
  language?: string;
  targetCountry?: string;
  discountModifier?: string;
  percentOff?: string;
  moneyAmountOff?: string;
  itemDescription: string;
  finalUrl: string;
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

  // Call Extension - stays on the campaign row (campaign-level phone number)
  if (campaign.callExtensions && campaign.callExtensions.length > 0) {
    const callExt = campaign.callExtensions[0];
    campaignRow[COLUMN_INDEX['PhoneNumber']] = callExt.phoneNumber || '';
    campaignRow[COLUMN_INDEX['Country of Phone']] = callExt.countryCode || campaign.locations?.countryCode || 'US';
    campaignRow[COLUMN_INDEX['VerificationURL']] = callExt.verificationUrl || '';
    campaignRow[COLUMN_INDEX['Call Extension Status']] = callExt.status || 'Enabled';
    campaignRow[COLUMN_INDEX['Call Extension Scheduling']] = callExt.scheduling || '';
  }

  rows.push(campaignRow);

  // === SITELINK ROWS — one row per sitelink (Google Ads Editor format) ===
  // Google Ads Editor rule: Description Line 1 and Description Line 2 must BOTH be filled
  // or BOTH be left blank. A row with only one description line causes a validation error.
  if (campaign.sitelinks && campaign.sitelinks.length > 0) {
    campaign.sitelinks.forEach((sl) => {
      if (!sl.text?.trim()) return;
      const slRow = createEmptyRow();
      slRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      slRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      slRow[COLUMN_INDEX['Link Text']] = sl.text.trim();
      const d1 = sl.description1?.trim() || '';
      const d2 = sl.description2?.trim() || '';
      if (d1 && d2) {
        slRow[COLUMN_INDEX['Description Line 1']] = d1;
        slRow[COLUMN_INDEX['Description Line 2']] = d2;
      } else {
        slRow[COLUMN_INDEX['Description Line 1']] = '';
        slRow[COLUMN_INDEX['Description Line 2']] = '';
      }
      slRow[COLUMN_INDEX['Final URL']] = sl.finalUrl || campaign.url || '';
      rows.push(slRow);
    });
  }

  // === CALLOUT ROWS — one row per callout (Google Ads Editor format) ===
  if (campaign.callouts && campaign.callouts.length > 0) {
    campaign.callouts.forEach((co) => {
      if (!co.text?.trim()) return;
      const coRow = createEmptyRow();
      coRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      coRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      coRow[COLUMN_INDEX['Callout Text']] = co.text.trim();
      rows.push(coRow);
    });
  }

  // Valid Google Ads Structured Snippet headers (exact accepted values)
  const VALID_SNIPPET_HEADERS = new Set([
    'Amenities', 'Brands', 'Courses', 'Degree programs', 'Destinations',
    'Featured hotels', 'Insurance coverage', 'Models', 'Neighborhoods',
    'Service catalog', 'Shows', 'Styles', 'Types',
  ]);

  function normalizeSnippetHeader(header: string): string {
    if (!header) return 'Types';
    const trimmed = header.trim();
    if (VALID_SNIPPET_HEADERS.has(trimmed)) return trimmed;
    const lower = trimmed.toLowerCase();
    if (lower.includes('service') || lower.includes('catalog')) return 'Service catalog';
    if (lower.includes('brand')) return 'Brands';
    if (lower.includes('amenity') || lower.includes('amenitie') || lower.includes('feature')) return 'Amenities';
    if (lower.includes('model')) return 'Models';
    if (lower.includes('style')) return 'Styles';
    if (lower.includes('course')) return 'Courses';
    if (lower.includes('degree') || lower.includes('program')) return 'Degree programs';
    if (lower.includes('destination')) return 'Destinations';
    if (lower.includes('hotel')) return 'Featured hotels';
    if (lower.includes('insurance')) return 'Insurance coverage';
    if (lower.includes('neighborhood')) return 'Neighborhoods';
    if (lower.includes('show')) return 'Shows';
    return 'Types';
  }

  // === SNIPPET ROWS — one row per structured snippet (Google Ads Editor format) ===
  // Skip rows with empty header or empty values to avoid "Header can't be empty" errors.
  if (campaign.snippets && campaign.snippets.length > 0) {
    campaign.snippets.forEach((sn) => {
      const rawHeader = sn.header?.trim() || '';
      const rawValues = sn.values?.trim() || '';
      if (!rawHeader || !rawValues) return;
      const snRow = createEmptyRow();
      snRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      snRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      snRow[COLUMN_INDEX['Snippet Header']] = normalizeSnippetHeader(rawHeader);
      snRow[COLUMN_INDEX['Snippet Values']] = rawValues;
      rows.push(snRow);
    });
  }

  // === PRICE EXTENSION ROW — one row with up to 3 price items (Google Ads Editor format) ===
  if (campaign.priceExtension && campaign.priceExtension.items.length > 0) {
    const prRow = createEmptyRow();
    prRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
    prRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
    prRow[COLUMN_INDEX['Price qualifier']] = campaign.priceExtension.qualifier || 'From';
    prRow[COLUMN_INDEX['Price type']] = campaign.priceExtension.priceType || 'services';
    campaign.priceExtension.items.slice(0, 3).forEach((item, idx) => {
      const num = idx + 1;
      prRow[COLUMN_INDEX[`Price item ${num} header`]] = item.header || '';
      prRow[COLUMN_INDEX[`Price item ${num} description`]] = item.description || '';
      prRow[COLUMN_INDEX[`Price item ${num} price`]] = item.price || '';
      prRow[COLUMN_INDEX[`Price item ${num} unit`]] = item.unit || '';
      prRow[COLUMN_INDEX[`Price item ${num} Final URL`]] = item.finalUrl || campaign.url || '';
    });
    rows.push(prRow);
  }

  // === PROMOTION EXTENSION ROW — one row per promotion (Google Ads Editor format) ===
  if (campaign.promotionExtension) {
    const pmRow = createEmptyRow();
    pmRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
    pmRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
    pmRow[COLUMN_INDEX['Promotion occasion']] = campaign.promotionExtension.occasion || '';
    pmRow[COLUMN_INDEX['Promotion language']] = campaign.promotionExtension.language || 'English';
    pmRow[COLUMN_INDEX['Promotion target country']] = campaign.promotionExtension.targetCountry || 'US';
    pmRow[COLUMN_INDEX['Promotion discount modifier']] = campaign.promotionExtension.discountModifier || '';
    pmRow[COLUMN_INDEX['Promotion percent off']] = campaign.promotionExtension.percentOff || '';
    pmRow[COLUMN_INDEX['Promotion money amount off']] = campaign.promotionExtension.moneyAmountOff || '';
    pmRow[COLUMN_INDEX['Promotion item description']] = campaign.promotionExtension.itemDescription || '';
    pmRow[COLUMN_INDEX['Promotion Final URL']] = campaign.promotionExtension.finalUrl || campaign.url || '';
    rows.push(pmRow);
  }

  
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
  
  // Ad rows - RSA and CallOnly ads for Search campaigns (DKI merged into RSA headlines)
  campaign.adGroups.forEach(adGroup => {
    adGroup.ads.forEach(ad => {
      if (ad.type === 'DKI') return;

      const validHeadlines = (ad.headlines || []).filter((h: string) => h && h.trim());
      const validDescriptions = (ad.descriptions || []).filter((d: string) => d && d.trim());
      
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
      adRow[COLUMN_INDEX['Ad Type']] = ad.type === 'CallOnly' ? 'Call-only ad' : 'Responsive search ad';
      adRow[COLUMN_INDEX['Final URL']] = ad.finalUrl;
      adRow[COLUMN_INDEX['Mobile Final URL']] = ad.mobileUrl || '';
      
      // Headlines (up to 15) - sanitize and truncate with DKI-safe logic
      for (let i = 0; i < Math.min(15, finalHeadlines.length); i++) {
        const headlineCol = `Headline ${i + 1}`;
        if (COLUMN_INDEX[headlineCol] !== undefined) {
          adRow[COLUMN_INDEX[headlineCol]] = truncateHeadline(sanitizeAdText(finalHeadlines[i]), 30);
        }
      }
      
      // Descriptions (up to 4) - sanitize and truncate with DKI-safe logic
      for (let i = 0; i < Math.min(4, finalDescriptions.length); i++) {
        const descCol = `Description ${i + 1}`;
        if (COLUMN_INDEX[descCol] !== undefined) {
          adRow[COLUMN_INDEX[descCol]] = truncateDescription(sanitizeAdText(finalDescriptions[i]), 90);
        }
      }
      
      adRow[COLUMN_INDEX['Path 1']] = sanitizeAdText(ad.path1 || '').substring(0, 15);
      adRow[COLUMN_INDEX['Path 2']] = sanitizeAdText(ad.path2 || '').substring(0, 15);
      
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
  
  // Convert rows to CSV string with proper escaping
  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
  
  // Add UTF-8 BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

export function generateCallOnlyCampaignRows(callAd: any, baseCampaign: CampaignDataV5): string {
  const rows: string[][] = [];
  const campaignName = baseCampaign.campaignName;
  const countryCode = baseCampaign.locations?.countryCode || callAd.countryCode || 'US';

  const adGroupName = campaignName + ' - Call Ads';
  const adRow = createEmptyRow();
  adRow[COLUMN_INDEX['Campaign']] = campaignName;
  adRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
  adRow[COLUMN_INDEX['Ad Group']] = adGroupName;
  adRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
  adRow[COLUMN_INDEX['Ad Type']] = 'Call-only ad';
  adRow[COLUMN_INDEX['Final URL']] = callAd.finalUrl || baseCampaign.url || '';
  adRow[COLUMN_INDEX['Country of Phone']] = countryCode;

  const headlines = (callAd.headlines || []).filter((h: string) => h && h.trim());
  const descriptions = (callAd.descriptions || []).filter((d: string) => d && d.trim());
  headlines.slice(0, 2).forEach((h: string, i: number) => {
    const key = `Headline ${i + 1}` as keyof typeof COLUMN_INDEX;
    if (COLUMN_INDEX[key] !== undefined) adRow[COLUMN_INDEX[key]] = truncateHeadline(sanitizeAdText(h), 30);
  });
  descriptions.slice(0, 2).forEach((d: string, i: number) => {
    const key = `Description ${i + 1}` as keyof typeof COLUMN_INDEX;
    if (COLUMN_INDEX[key] !== undefined) adRow[COLUMN_INDEX[key]] = truncateDescription(sanitizeAdText(d), 90);
  });

  if (callAd.phoneNumber) adRow[COLUMN_INDEX['PhoneNumber']] = callAd.phoneNumber;
  if (callAd.businessName) adRow[COLUMN_INDEX['Business Name']] = callAd.businessName;
  adRow[COLUMN_INDEX['Call Only Ads']] = 'Yes';
  rows.push(adRow);

  return rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
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
    snippets: [],
    callExtensions: [],
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
  
  const expectedCols = MASTER_CSV_HEADERS.length;
  if (headerColumns.length !== expectedCols) {
    errors.push(`CSV must have exactly ${expectedCols} columns, found ${headerColumns.length}`);
  }
  
  // Check that all data rows have the same number of columns
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    if (columns.length !== expectedCols) {
      errors.push(`Row ${i + 1} has ${columns.length} columns, expected ${expectedCols}`);
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
