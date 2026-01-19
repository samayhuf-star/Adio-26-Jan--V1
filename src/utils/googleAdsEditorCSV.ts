import Papa from 'papaparse';

export const GOOGLE_ADS_EDITOR_HEADERS = [
  'Campaign', 'Campaign Daily Budget', 'Campaign Type', 'Bid Strategy Type',
  'Networks', 'EU political ads', 'Desktop Bid adj.', 'Mobile Bid adj.', 'Tablet Bid adj.',
  'Start Date', 'End Date',
  'Ad Group', 'Max CPC', 
  'Keyword', 'Criterion Type',
  'Ad Type', 
  'Final URL',
  'Headline 1', 'Headline 2', 'Headline 3', 
  'Description 1', 'Description 2', 
  'Path 1', 'Path 2', 
  'PhoneNumber', 'VerificationURL',
  'Dynamic Search Ad Description 1', 'Dynamic Search Ad Description 2',
  'Sitelink Text', 'Sitelink Description 1', 'Sitelink Description 2', 'Sitelink Final URL',
  'Callout Text', 
  'Structured Snippet Header', 'Structured Snippet Values',
  'Price Extension Type', 'Price Extension Price Qualifier', 'Price Extension Item Header', 'Price Extension Item Price', 'Price Extension Item Final URL',
  'Promotion Target', 'Promotion Discount Modifier', 'Promotion Percent Off',
  'App ID', 'App Store', 'App Link Text', 'App Final URL',
  'Image Asset Name', 'Image Asset URL',
  'Location'
];

export interface CampaignRow {
  campaignName: string;
  dailyBudget?: string;
  campaignType?: string;
  bidStrategyType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdGroupRow {
  campaignName: string;
  adGroupName: string;
  maxCpc?: string;
  startDate?: string;
}

export interface KeywordRow {
  campaignName: string;
  adGroupName: string;
  keyword: string;
  criterionType: 'Broad' | 'Phrase' | 'Exact';
  maxCpc?: string;
  finalUrl?: string;
}

export interface NegativeKeywordRow {
  campaignName: string;
  adGroupName?: string;
  keyword: string;
  matchType?: 'broad' | 'phrase' | 'exact';
  maxCpc?: string;
  finalUrl?: string;
}

export interface RSAAdRow {
  campaignName: string;
  adGroupName: string;
  headlines: string[];
  descriptions: string[];
  path1?: string;
  path2?: string;
  finalUrl?: string;
}

export interface CallOnlyAdRow {
  campaignName: string;
  adGroupName: string;
  headlines: string[];
  descriptions: string[];
  phoneNumber: string;
  verificationUrl: string;
}

export interface SitelinkRow {
  campaignName: string;
  adGroupName?: string;
  text: string;
  description1?: string;
  description2?: string;
  finalUrl: string;
}

export interface CalloutRow {
  campaignName: string;
  adGroupName?: string;
  text: string;
}

export interface SnippetRow {
  campaignName: string;
  adGroupName?: string;
  header: string;
  values: string;
}

export interface PromotionRow {
  campaignName: string;
  adGroupName?: string;
  target: string;
  discountModifier?: string;
  percentOff?: string;
  startDate?: string;
  endDate?: string;
  finalUrl?: string;
}

export interface ImageAssetRow {
  campaignName: string;
  adGroupName?: string;
  name: string;
  url?: string;
}

export interface PriceExtensionRow {
  campaignName: string;
  type: string;
  priceQualifier?: string;
  itemHeader: string;
  itemPrice: string;
  itemFinalUrl: string;
}

export interface LocationRow {
  campaignName: string;
  location: string;
}

export interface GoogleAdsEditorData {
  campaign: CampaignRow;
  adGroups: AdGroupRow[];
  keywords: KeywordRow[];
  negativeKeywords?: NegativeKeywordRow[];
  rsaAds: RSAAdRow[];
  callOnlyAds: CallOnlyAdRow[];
  sitelinks?: SitelinkRow[];
  callouts?: CalloutRow[];
  snippets?: SnippetRow[];
  promotions?: PromotionRow[];
  priceExtensions?: PriceExtensionRow[];
  imageAssets?: ImageAssetRow[];
  locations?: LocationRow[];
}

function createEmptyRow(): Record<string, string> {
  const row: Record<string, string> = {};
  GOOGLE_ADS_EDITOR_HEADERS.forEach(header => {
    row[header] = '';
  });
  return row;
}

function buildCampaignRow(data: CampaignRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Campaign Daily Budget'] = data.dailyBudget || '100';
  row['Campaign Type'] = data.campaignType || 'Search';
  row['Bid Strategy Type'] = data.bidStrategyType || 'Maximize Conversions';
  row['Networks'] = 'Google search';
  row['EU political ads'] = 'No';
  row['Desktop Bid adj.'] = '-100%';
  row['Mobile Bid adj.'] = '0%';
  row['Tablet Bid adj.'] = '-100%';
  return row;
}

function buildAdGroupRow(data: AdGroupRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.startDate) {
    row['Start Date'] = formatDateForGoogleAds(data.startDate);
  }
  row['Ad Group'] = data.adGroupName;
  row['Max CPC'] = data.maxCpc || '2.00';
  return row;
}

function buildKeywordRow(data: KeywordRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Ad Group'] = data.adGroupName;
  row['Max CPC'] = data.maxCpc || '2.00';
  row['Keyword'] = data.keyword;
  row['Criterion Type'] = data.criterionType;
  if (data.finalUrl) {
    row['Final URL'] = ensureHttpsProtocol(data.finalUrl);
  }
  return row;
}

function buildNegativeKeywordRow(data: NegativeKeywordRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  row['Max CPC'] = data.maxCpc || '2.00';
  row['Keyword'] = data.keyword;
  const matchType = data.matchType || 'broad';
  row['Criterion Type'] = matchType === 'exact' ? 'Negative exact' : 
                          matchType === 'phrase' ? 'Negative phrase' : 'Negative broad';
  if (data.finalUrl) {
    row['Final URL'] = ensureHttpsProtocol(data.finalUrl);
  }
  return row;
}

// Helper to ensure URL has proper protocol
function ensureHttpsProtocol(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

// Helper to format date as MM/DD/YYYY for Google Ads Editor
function formatDateForGoogleAds(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try to parse the date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Return original if invalid
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

function buildRSAAdRow(data: RSAAdRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Ad Group'] = data.adGroupName;
  row['Ad Type'] = 'Responsive search ad';
  // Fix DKI format: remove square brackets entirely (they shouldn't be in ads)
  // Square brackets are for keyword match types, NOT for ad copy
  const fixDKIFormat = (text: string): string => {
    if (!text) return '';
    // CRITICAL: Remove all square brackets from ad text
    // Brackets are only for keyword match types, they should NEVER appear in ad copy
    return text
      .replace(/\[([^\]]*)\]/g, '$1')  // Remove complete [text] and keep text inside
      .replace(/\[([^\]]*)/g, '$1')     // Remove orphan opening brackets [text
      .replace(/([^\[]*)\]/g, '$1')     // Remove orphan closing brackets text]
      .trim();
  };
  // Add Final URL - required for RSA ads, ensure https:// protocol
  row['Final URL'] = ensureHttpsProtocol(data.finalUrl || '');
  row['Headline 1'] = fixDKIFormat(data.headlines[0] || '').substring(0, 30);
  row['Headline 2'] = fixDKIFormat(data.headlines[1] || '').substring(0, 30);
  row['Headline 3'] = fixDKIFormat(data.headlines[2] || '').substring(0, 30);
  row['Description 1'] = fixDKIFormat(data.descriptions[0] || '').substring(0, 90);
  row['Description 2'] = fixDKIFormat(data.descriptions[1] || '').substring(0, 90);
  row['Path 1'] = (data.path1 || '').substring(0, 15);
  row['Path 2'] = (data.path2 || '').substring(0, 15);
  return row;
}

function buildCallOnlyAdRow(data: CallOnlyAdRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Ad Group'] = data.adGroupName;
  row['Ad Type'] = 'Call only ad';
  row['Final URL'] = ensureHttpsProtocol(data.verificationUrl || '');
  row['Headline 1'] = (data.headlines[0] || '').substring(0, 30);
  row['Headline 2'] = (data.headlines[1] || '').substring(0, 30);
  row['Description 1'] = (data.descriptions[0] || '').substring(0, 90);
  row['Description 2'] = (data.descriptions[1] || '').substring(0, 90);
  row['PhoneNumber'] = data.phoneNumber || '';
  row['VerificationURL'] = ensureHttpsProtocol(data.verificationUrl || '');
  return row;
}

function buildSitelinkRow(data: SitelinkRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  row['Sitelink Text'] = (data.text || 'Learn More').substring(0, 25);
  row['Sitelink Description 1'] = (data.description1 || '').substring(0, 35);
  row['Sitelink Description 2'] = (data.description2 || '').substring(0, 35);
  row['Sitelink Final URL'] = ensureHttpsProtocol(data.finalUrl || '');
  return row;
}

function buildCalloutRow(data: CalloutRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  row['Callout Text'] = (data.text || '').substring(0, 25);
  return row;
}

function buildSnippetRow(data: SnippetRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  row['Structured Snippet Header'] = data.header;
  row['Structured Snippet Values'] = data.values;
  return row;
}

function buildPromotionRow(data: PromotionRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.startDate) {
    row['Start Date'] = formatDateForGoogleAds(data.startDate);
  }
  if (data.endDate) {
    row['End Date'] = formatDateForGoogleAds(data.endDate);
  }
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  if (data.finalUrl) {
    row['Final URL'] = ensureHttpsProtocol(data.finalUrl);
  }
  row['Promotion Target'] = data.target;
  row['Promotion Discount Modifier'] = data.discountModifier || '';
  row['Promotion Percent Off'] = data.percentOff || '';
  return row;
}

function buildImageAssetRow(data: ImageAssetRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  if (data.adGroupName) {
    row['Ad Group'] = data.adGroupName;
  }
  row['Image Asset Name'] = data.name;
  if (data.url) {
    row['Image Asset URL'] = data.url;
  }
  return row;
}

function buildPriceExtensionRow(data: PriceExtensionRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Price Extension Type'] = data.type || 'Services';
  row['Price Extension Price Qualifier'] = data.priceQualifier || 'From';
  row['Price Extension Item Header'] = data.itemHeader || '';
  row['Price Extension Item Price'] = data.itemPrice || '';
  row['Price Extension Item Final URL'] = data.itemFinalUrl || '';
  return row;
}

function buildLocationRow(data: LocationRow): Record<string, string> {
  const row = createEmptyRow();
  row['Campaign'] = data.campaignName;
  row['Location'] = data.location;
  return row;
}

export function generateGoogleAdsEditorCSV(data: GoogleAdsEditorData): string {
  const rows: Record<string, string>[] = [];
  
  rows.push(buildCampaignRow(data.campaign));
  
  data.adGroups.forEach(ag => rows.push(buildAdGroupRow(ag)));
  
  data.keywords.forEach(kw => rows.push(buildKeywordRow(kw)));
  
  data.negativeKeywords?.forEach(nk => rows.push(buildNegativeKeywordRow(nk)));
  
  data.rsaAds.forEach(ad => rows.push(buildRSAAdRow(ad)));
  
  data.callOnlyAds.forEach(ad => rows.push(buildCallOnlyAdRow(ad)));
  
  data.sitelinks?.forEach(sl => rows.push(buildSitelinkRow(sl)));
  
  data.callouts?.forEach(co => rows.push(buildCalloutRow(co)));
  
  data.snippets?.forEach(sn => rows.push(buildSnippetRow(sn)));
  
  data.promotions?.forEach(pr => rows.push(buildPromotionRow(pr)));
  
  data.priceExtensions?.forEach(pe => rows.push(buildPriceExtensionRow(pe)));
  
  data.imageAssets?.forEach(ia => rows.push(buildImageAssetRow(ia)));
  
  data.locations?.forEach(loc => rows.push(buildLocationRow(loc)));
  
  return Papa.unparse(rows, {
    columns: GOOGLE_ADS_EDITOR_HEADERS,
    header: true
  });
}

export function downloadGoogleAdsEditorCSV(data: GoogleAdsEditorData, filename: string): void {
  const csvContent = generateGoogleAdsEditorCSV(data);
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent.replace(/\n/g, '\r\n');
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function convertBuilderDataToEditorFormat(
  campaignName: string,
  adGroups: Array<{ name: string; keywords: any[]; negativeKeywords?: any[] }>,
  ads: any[],
  locations?: string[],
  extensions?: any[],
  options?: {
    dailyBudget?: string;
    bidStrategyType?: string;
    maxCpc?: string;
    baseUrl?: string;
    negativeKeywords?: string[];
    startDate?: string;
    endDate?: string;
  }
): GoogleAdsEditorData {
  const campaignNameClean = campaignName || 'Campaign 1';
  const baseUrl = options?.baseUrl || 'https://www.example.com';
  const maxCpc = options?.maxCpc || '2.00';
  
  const adGroupRows: AdGroupRow[] = adGroups.map((ag, index) => ({
    campaignName: campaignNameClean,
    adGroupName: ag.name,
    maxCpc: maxCpc,
    startDate: index === 0 ? options?.startDate : undefined
  }));
  
  const keywordRows: KeywordRow[] = [];
  adGroups.forEach(ag => {
    (ag.keywords || []).forEach((kw: any) => {
      let keyword = '';
      let criterionType: 'Broad' | 'Phrase' | 'Exact' = 'Broad';
      
      if (typeof kw === 'string') {
        keyword = kw.replace(/^\[|\]$|^"|"$/g, '');
        if (kw.startsWith('[') && kw.endsWith(']')) {
          criterionType = 'Exact';
        } else if (kw.startsWith('"') && kw.endsWith('"')) {
          criterionType = 'Phrase';
        }
      } else if (kw && typeof kw === 'object') {
        keyword = (kw.text || kw.keyword || '').replace(/^\[|\]$|^"|"$/g, '');
        if (kw.matchType === 'exact') criterionType = 'Exact';
        else if (kw.matchType === 'phrase') criterionType = 'Phrase';
      }
      
      if (keyword) {
        keywordRows.push({
          campaignName: campaignNameClean,
          adGroupName: ag.name,
          keyword,
          criterionType,
          maxCpc: maxCpc,
          finalUrl: baseUrl
        });
      }
    });
  });
  
  const negativeKeywordRows: NegativeKeywordRow[] = [];
  
  (options?.negativeKeywords || []).forEach((nk: any) => {
    let keyword = '';
    let matchType: 'broad' | 'phrase' | 'exact' = 'broad';
    
    if (typeof nk === 'string') {
      const trimmed = nk.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        keyword = trimmed.slice(1, -1);
        matchType = 'exact';
      } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        keyword = trimmed.slice(1, -1);
        matchType = 'phrase';
      } else {
        keyword = trimmed;
      }
    } else if (nk && typeof nk === 'object') {
      keyword = (nk.text || nk.keyword || '').trim().replace(/^\[|\]$|^"|"$/g, '');
      if (nk.matchType === 'exact') matchType = 'exact';
      else if (nk.matchType === 'phrase') matchType = 'phrase';
    }
    
    if (keyword) {
      negativeKeywordRows.push({
        campaignName: campaignNameClean,
        keyword,
        matchType,
        maxCpc: maxCpc,
        finalUrl: baseUrl
      });
    }
  });
  
  adGroups.forEach(ag => {
    (ag.negativeKeywords || []).forEach((nk: any) => {
      let keyword = '';
      let matchType: 'broad' | 'phrase' | 'exact' = 'broad';
      
      if (typeof nk === 'string') {
        const trimmed = nk.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          keyword = trimmed.slice(1, -1);
          matchType = 'exact';
        } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          keyword = trimmed.slice(1, -1);
          matchType = 'phrase';
        } else {
          keyword = trimmed;
        }
      } else if (nk && typeof nk === 'object') {
        keyword = (nk.text || nk.keyword || '').trim().replace(/^\[|\]$|^"|"$/g, '');
        if (nk.matchType === 'exact') matchType = 'exact';
        else if (nk.matchType === 'phrase') matchType = 'phrase';
      }
      
      if (keyword) {
        negativeKeywordRows.push({
          campaignName: campaignNameClean,
          adGroupName: ag.name,
          keyword,
          matchType,
          maxCpc: maxCpc,
          finalUrl: baseUrl
        });
      }
    });
  });
  
  const rsaAds: RSAAdRow[] = [];
  const callOnlyAds: CallOnlyAdRow[] = [];
  
  // Track RSA ads per ad group to prevent duplicates and limit to 3 RSAs per ad group
  const rsaAdsPerAdGroup: Map<string, Set<string>> = new Map();
  // Track call-only ads separately (no limit, just dedup)
  const callOnlyAdsPerAdGroup: Map<string, Set<string>> = new Map();
  const MAX_RSA_ADS_PER_ADGROUP = 3;
  
  ads.forEach(ad => {
    const targetAdGroups = ad.adGroup === 'ALL_AD_GROUPS' || !ad.adGroup 
      ? adGroups.map(ag => ag.name) 
      : [ad.adGroup];
    
    targetAdGroups.forEach(adGroupName => {
      if (ad.type === 'rsa' || ad.type === 'dki') {
        // Initialize RSA tracking for this ad group
        if (!rsaAdsPerAdGroup.has(adGroupName)) {
          rsaAdsPerAdGroup.set(adGroupName, new Set());
        }
        const adGroupRsaAds = rsaAdsPerAdGroup.get(adGroupName)!;
        
        // Skip if already at max RSA ads for this ad group
        if (adGroupRsaAds.size >= MAX_RSA_ADS_PER_ADGROUP) {
          return;
        }
        
        const headlines = ad.headlines || [ad.headline1, ad.headline2, ad.headline3].filter(Boolean);
        const descriptions = ad.descriptions || [ad.description1, ad.description2].filter(Boolean);
        
        // Create unique key for duplicate detection
        const adKey = `${headlines.slice(0, 3).join('|')}::${descriptions.slice(0, 2).join('|')}`;
        
        // Skip duplicate RSA ads
        if (adGroupRsaAds.has(adKey)) {
          return;
        }
        adGroupRsaAds.add(adKey);
        
        rsaAds.push({
          campaignName: campaignNameClean,
          adGroupName,
          headlines: headlines.slice(0, 3),
          descriptions: descriptions.slice(0, 2),
          path1: ad.displayPath?.[0] || ad.path1 || '',
          path2: ad.displayPath?.[1] || ad.path2 || '',
          finalUrl: ad.finalUrl || ad.final_url || baseUrl
        });
      } else if (ad.type === 'call' || ad.type === 'callonly' || ad.type === 'call_only' || ad.adType === 'CallOnly' || ad.adType === 'call_only') {
        // Initialize call-only tracking for this ad group
        if (!callOnlyAdsPerAdGroup.has(adGroupName)) {
          callOnlyAdsPerAdGroup.set(adGroupName, new Set());
        }
        const adGroupCallOnlyAds = callOnlyAdsPerAdGroup.get(adGroupName)!;
        
        const headlines = ad.headlines || [ad.headline1, ad.headline2].filter(Boolean);
        const descriptions = ad.descriptions || [ad.description1, ad.description2].filter(Boolean);
        
        // Create unique key for duplicate detection
        const adKey = `${headlines.slice(0, 2).join('|')}::${ad.phoneNumber || ad.phone}`;
        
        // Skip duplicate call-only ads
        if (adGroupCallOnlyAds.has(adKey)) {
          return;
        }
        adGroupCallOnlyAds.add(adKey);
        
        callOnlyAds.push({
          campaignName: campaignNameClean,
          adGroupName,
          headlines: headlines.slice(0, 2),
          descriptions: descriptions.slice(0, 2),
          phoneNumber: ad.phoneNumber || ad.phone || '',
          verificationUrl: ad.verificationUrl || ad.finalUrl || baseUrl
        });
      }
    });
  });
  
  const sitelinks: SitelinkRow[] = [];
  const callouts: CalloutRow[] = [];
  const snippets: SnippetRow[] = [];
  const promotions: PromotionRow[] = [];
  const priceExtensions: PriceExtensionRow[] = [];
  const imageAssets: ImageAssetRow[] = [];
  
  (extensions || []).forEach(ext => {
    if (ext.type === 'sitelink' || ext.extensionType === 'sitelink') {
      sitelinks.push({
        campaignName: campaignNameClean,
        text: ext.text || ext.linkText || 'Learn More',
        description1: ext.description1 || '',
        description2: ext.description2 || '',
        finalUrl: ext.finalUrl || ext.url || baseUrl
      });
    } else if (ext.type === 'callout' || ext.extensionType === 'callout') {
      callouts.push({
        campaignName: campaignNameClean,
        text: ext.text || ext.calloutText || ''
      });
    } else if (ext.type === 'snippet' || ext.extensionType === 'snippet') {
      snippets.push({
        campaignName: campaignNameClean,
        header: ext.header || 'Types',
        values: Array.isArray(ext.values) ? ext.values.join(';') : (ext.values || '')
      });
    } else if (ext.type === 'promotion' || ext.extensionType === 'promotion') {
      promotions.push({
        campaignName: campaignNameClean,
        target: ext.target || ext.promotionTarget || 'Special Offer',
        discountModifier: ext.discountModifier || 'Up to',
        percentOff: ext.percentOff || '10'
      });
    } else if (ext.type === 'image' || ext.extensionType === 'image') {
      imageAssets.push({
        campaignName: campaignNameClean,
        name: ext.name || 'Image',
        url: ext.url || ext.imageUrl || ''
      });
    } else if (ext.type === 'price' || ext.extensionType === 'price') {
      if (ext.items && Array.isArray(ext.items)) {
        ext.items.forEach((item: any) => {
          priceExtensions.push({
            campaignName: campaignNameClean,
            type: ext.priceType || 'Services',
            priceQualifier: ext.priceQualifier || 'From',
            itemHeader: item.header || '',
            itemPrice: item.price || '',
            itemFinalUrl: item.finalUrl || item.url || baseUrl
          });
        });
      } else {
        priceExtensions.push({
          campaignName: campaignNameClean,
          type: ext.type || ext.priceType || 'Services',
          priceQualifier: ext.priceQualifier || 'From',
          itemHeader: ext.itemHeader || ext.header || '',
          itemPrice: ext.itemPrice || ext.price || '',
          itemFinalUrl: ext.itemFinalUrl || ext.finalUrl || baseUrl
        });
      }
    }
  });
  
  ads.forEach(ad => {
    if (ad.extensions && Array.isArray(ad.extensions)) {
      ad.extensions.forEach((ext: any) => {
        if (ext.type === 'sitelink' || ext.extensionType === 'sitelink') {
          if (ext.sitelinks && Array.isArray(ext.sitelinks)) {
            ext.sitelinks.forEach((sl: any) => {
              sitelinks.push({
                campaignName: campaignNameClean,
                text: sl.text || sl.linkText || 'Learn More',
                description1: sl.description1 || '',
                description2: sl.description2 || '',
                finalUrl: sl.finalUrl || sl.url || baseUrl
              });
            });
          } else {
            sitelinks.push({
              campaignName: campaignNameClean,
              text: ext.text || ext.linkText || 'Learn More',
              description1: ext.description1 || '',
              description2: ext.description2 || '',
              finalUrl: ext.finalUrl || ext.url || baseUrl
            });
          }
        } else if (ext.type === 'callout' || ext.extensionType === 'callout') {
          if (ext.callouts && Array.isArray(ext.callouts)) {
            ext.callouts.forEach((co: any) => {
              callouts.push({
                campaignName: campaignNameClean,
                text: co.text || co
              });
            });
          } else {
            callouts.push({
              campaignName: campaignNameClean,
              text: ext.text || ext.calloutText || ''
            });
          }
        } else if (ext.type === 'snippet' || ext.extensionType === 'snippet') {
          snippets.push({
            campaignName: campaignNameClean,
            header: ext.header || 'Types',
            values: Array.isArray(ext.values) ? ext.values.join(';') : (ext.values || '')
          });
        } else if (ext.type === 'promotion' || ext.extensionType === 'promotion') {
          promotions.push({
            campaignName: campaignNameClean,
            target: ext.target || ext.promotionTarget || 'Special Offer',
            discountModifier: ext.discountModifier || 'Up to',
            percentOff: ext.percentOff || '10'
          });
        } else if (ext.type === 'image' || ext.extensionType === 'image') {
          if (ext.images && Array.isArray(ext.images)) {
            ext.images.forEach((img: any) => {
              imageAssets.push({
                campaignName: campaignNameClean,
                name: img.name || 'Image',
                url: img.url || img.imageUrl || ''
              });
            });
          } else {
            imageAssets.push({
              campaignName: campaignNameClean,
              name: ext.name || 'Image',
              url: ext.url || ext.imageUrl || ''
            });
          }
        } else if (ext.type === 'price' || ext.extensionType === 'price') {
          if (ext.items && Array.isArray(ext.items)) {
            ext.items.forEach((item: any) => {
              priceExtensions.push({
                campaignName: campaignNameClean,
                type: ext.priceType || 'Services',
                priceQualifier: ext.priceQualifier || 'From',
                itemHeader: item.header || '',
                itemPrice: item.price || '',
                itemFinalUrl: item.finalUrl || item.url || baseUrl
              });
            });
          } else {
            priceExtensions.push({
              campaignName: campaignNameClean,
              type: ext.priceType || 'Services',
              priceQualifier: ext.priceQualifier || 'From',
              itemHeader: ext.itemHeader || ext.header || '',
              itemPrice: ext.itemPrice || ext.price || '',
              itemFinalUrl: ext.itemFinalUrl || ext.finalUrl || baseUrl
            });
          }
        }
      });
    }
  });
  
  const locationRows: LocationRow[] = (locations || []).map(loc => ({
    campaignName: campaignNameClean,
    location: loc
  }));
  
  return {
    campaign: {
      campaignName: campaignNameClean,
      dailyBudget: options?.dailyBudget || '100',
      campaignType: 'Search',
      bidStrategyType: options?.bidStrategyType || 'Maximize Conversions',
      startDate: options?.startDate,
      endDate: options?.endDate
    },
    adGroups: adGroupRows,
    keywords: keywordRows,
    negativeKeywords: negativeKeywordRows.length > 0 ? negativeKeywordRows : undefined,
    rsaAds,
    callOnlyAds,
    sitelinks: sitelinks.length > 0 ? sitelinks : undefined,
    callouts: callouts.length > 0 ? callouts : undefined,
    snippets: snippets.length > 0 ? snippets : undefined,
    promotions: promotions.length > 0 ? promotions : undefined,
    priceExtensions: priceExtensions.length > 0 ? priceExtensions : undefined,
    imageAssets: imageAssets.length > 0 ? imageAssets : undefined,
    locations: locationRows.length > 0 ? locationRows : undefined
  };
}
