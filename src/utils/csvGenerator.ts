/**
 * Google Ads Editor CSV Generator
 * 
 * Generates CSV files compatible with Google Ads Editor import functionality.
 * Follows the strict column header specifications from google_ads_rules.md Section 11.
 * 
 * This generator creates separate CSV files for:
 * - campaigns_structure.csv (Campaigns & Ad Groups)
 * - keywords.csv (Keywords & Negatives)
 * - ads.csv (RSAs)
 * - targeting.csv (Locations)
 */

import Papa from 'papaparse';

/**
 * Campaign Data Interface
 * Matches the CampaignData structure from CampaignBuilder3
 */
export interface CampaignData {
  url: string;
  campaignName: string;
  adGroups: AdGroup[];
  ads: Ad[];
  negativeKeywords: string[];
  locations: {
    countries: string[];
    states: string[];
    cities: string[];
    zipCodes: string[];
  };
  // Optional fields
  budget?: number | string;
  bidStrategyType?: string;
  campaignType?: string;
  campaignStatus?: 'Enabled' | 'Paused';
  startDate?: string;
}

export interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  maxCPC?: number | string;
  adGroupStatus?: 'Enabled' | 'Paused';
  adGroupType?: string;
}

export interface Ad {
  id?: string | number;
  type: 'rsa' | 'dki' | 'callonly';
  adGroup?: string;
  headline1?: string;
  headline2?: string;
  headline3?: string;
  headline4?: string;
  headline5?: string;
  headline6?: string;
  headline7?: string;
  headline8?: string;
  headline9?: string;
  headline10?: string;
  headline11?: string;
  headline12?: string;
  headline13?: string;
  headline14?: string;
  headline15?: string;
  description1?: string;
  description2?: string;
  description3?: string;
  description4?: string;
  finalUrl?: string;
  path1?: string;
  path2?: string;
  adStatus?: 'Enabled' | 'Paused';
}

/**
 * CSV Row Types
 */
export interface CampaignCSVRow {
  Campaign: string;
  Budget?: string;
  'Bid Strategy Type'?: string;
  'Campaign Type'?: string;
  'Campaign Status'?: string;
  'Start Date'?: string;
}

export interface AdGroupCSVRow {
  Campaign: string;
  'Ad Group': string;
  'Max. CPC'?: string;
  'Ad Group Status'?: string;
  'Ad Group Type'?: string;
}

export interface KeywordCSVRow {
  Campaign: string;
  'Ad Group': string;
  Keyword: string;
  'Criterion Type': string;
  'Final URL'?: string;
}

export interface AdCSVRow {
  Campaign: string;
  'Ad Group': string;
  'Headline 1'?: string;
  'Headline 2'?: string;
  'Headline 3'?: string;
  'Headline 4'?: string;
  'Headline 5'?: string;
  'Headline 6'?: string;
  'Headline 7'?: string;
  'Headline 8'?: string;
  'Headline 9'?: string;
  'Headline 10'?: string;
  'Headline 11'?: string;
  'Headline 12'?: string;
  'Headline 13'?: string;
  'Headline 14'?: string;
  'Headline 15'?: string;
  'Description 1'?: string;
  'Description 2'?: string;
  'Description 3'?: string;
  'Description 4'?: string;
  'Final URL': string;
  'Path 1'?: string;
  'Path 2'?: string;
  'Ad Status'?: string;
}

export interface LocationCSVRow {
  Campaign: string;
  Location: string;
  'Bid Adjustment'?: string;
}

export interface NegativeKeywordCSVRow {
  Campaign: string;
  Keyword: string;
  'Criterion Type': string;
  'Ad Group'?: string;
}

/**
 * Convert internal match type format to Google Ads Editor format
 * Internal: 'exact', 'broad', 'phrase', 'negative-exact', etc.
 * Editor: 'Exact', 'Broad', 'Phrase', 'Negative Exact', etc.
 */
function convertMatchTypeToEditorFormat(matchType: string): string {
  const normalized = matchType.toLowerCase().trim();
  
  // Handle negative keywords
  if (normalized.includes('negative')) {
    if (normalized.includes('exact')) {
      return 'Negative Exact';
    } else if (normalized.includes('phrase')) {
      return 'Negative Phrase';
    } else {
      return 'Negative Broad';
    }
  }
  
  // Handle positive keywords
  if (normalized === 'exact' || normalized === '[exact]') {
    return 'Exact';
  } else if (normalized === 'phrase' || normalized === '"phrase"') {
    return 'Phrase';
  } else {
    return 'Broad';
  }
}

/**
 * Extract keyword text and match type from keyword string
 * Handles formats like: "keyword", [keyword], keyword, -keyword, -"keyword", -[keyword]
 */
function parseKeyword(keyword: string): { text: string; matchType: string } {
  if (!keyword || typeof keyword !== 'string') {
    return { text: '', matchType: 'Broad' };
  }
  
  const trimmed = keyword.trim();
  
  // Negative keywords
  if (trimmed.startsWith('-')) {
    const withoutPrefix = trimmed.substring(1).trim();
    if (withoutPrefix.startsWith('[') && withoutPrefix.endsWith(']')) {
      return {
        text: withoutPrefix.slice(1, -1),
        matchType: 'Negative Exact'
      };
    } else if (withoutPrefix.startsWith('"') && withoutPrefix.endsWith('"')) {
      return {
        text: withoutPrefix.slice(1, -1),
        matchType: 'Negative Phrase'
      };
    } else {
      return {
        text: withoutPrefix,
        matchType: 'Negative Broad'
      };
    }
  }
  
  // Positive keywords
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return {
      text: trimmed.slice(1, -1),
      matchType: 'Exact'
    };
  } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return {
      text: trimmed.slice(1, -1),
      matchType: 'Phrase'
    };
  } else {
    return {
      text: trimmed,
      matchType: 'Broad'
    };
  }
}

/**
 * Generate campaigns_structure.csv (Campaigns & Ad Groups)
 */
function generateCampaignsStructureCSV(data: CampaignData): string {
  const rows: (CampaignCSVRow | AdGroupCSVRow)[] = [];
  
  // Campaign row
  const campaignRow: CampaignCSVRow = {
    Campaign: data.campaignName || 'Campaign',
    Budget: data.budget?.toString() || '',
    'Bid Strategy Type': data.bidStrategyType || '',
    'Campaign Type': data.campaignType || 'Search',
    'Campaign Status': data.campaignStatus || 'Enabled',
    'Start Date': data.startDate || ''
  };
  rows.push(campaignRow);
  
  // Ad Group rows
  data.adGroups.forEach(adGroup => {
    const adGroupRow: AdGroupCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      'Ad Group': adGroup.name,
      'Max. CPC': adGroup.maxCPC?.toString() || '',
      'Ad Group Status': adGroup.adGroupStatus || 'Enabled',
      'Ad Group Type': adGroup.adGroupType || 'Standard'
    };
    rows.push(adGroupRow);
  });
  
  // Generate CSV
  return Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true
    });

}

/**
 * Generate keywords.csv (Keywords & Negatives)
 */
function generateKeywordsCSV(data: CampaignData): string {
  const rows: (KeywordCSVRow | NegativeKeywordCSVRow)[] = [];
  
  // Process keywords from ad groups
  data.adGroups.forEach(adGroup => {
    adGroup.keywords.forEach(keyword => {
      const parsed = parseKeyword(keyword);
      
      // Skip if it's a negative keyword (those go in negative section)
      if (parsed.matchType.startsWith('Negative')) {
        return;
      }
      
      const keywordRow: KeywordCSVRow = {
        Campaign: data.campaignName || 'Campaign',
        'Ad Group': adGroup.name,
        Keyword: parsed.text,
        'Criterion Type': parsed.matchType,
        'Final URL': data.url || ''
      };
      rows.push(keywordRow);
    });
  });
  
  // Process negative keywords (campaign level)
  data.negativeKeywords.forEach(negativeKeyword => {
    const parsed = parseKeyword(negativeKeyword);
    
    // Only process if it's actually a negative keyword
    if (!parsed.matchType.startsWith('Negative')) {
      // If it doesn't have negative prefix, assume it's a negative broad
      parsed.matchType = 'Negative Broad';
    }
    
    const negativeRow: NegativeKeywordCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      Keyword: parsed.text,
      'Criterion Type': parsed.matchType
      // Ad Group is optional for campaign-level negatives
    };
    rows.push(negativeRow);
  });
  
  // Generate CSV
  return Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true
    });

}

/**
 * Generate ads.csv (RSAs)
 */
function generateAdsCSV(data: CampaignData): string {
  const rows: AdCSVRow[] = [];
  
  // Process ads
  data.ads.forEach(ad => {
    // Determine which ad group this ad belongs to
    let adGroupName = ad.adGroup || '';
    
    // If ad doesn't have an adGroup specified, try to find it from the adGroups
    if (!adGroupName && data.adGroups.length > 0) {
      // For "ALL_AD_GROUPS" mode, we might need to duplicate the ad for each group
      // For now, use the first ad group
      adGroupName = data.adGroups[0]?.name || '';
    }
    
    // Only process RSA and DKI ads (call-only ads have different structure)
    if (ad.type === 'rsa' || ad.type === 'dki') {
      const adRow: AdCSVRow = {
        Campaign: data.campaignName || 'Campaign',
        'Ad Group': adGroupName,
        'Headline 1': ad.headline1 || '',
        'Headline 2': ad.headline2 || '',
        'Headline 3': ad.headline3 || '',
        'Headline 4': ad.headline4 || '',
        'Headline 5': ad.headline5 || '',
        'Headline 6': ad.headline6 || '',
        'Headline 7': ad.headline7 || '',
        'Headline 8': ad.headline8 || '',
        'Headline 9': ad.headline9 || '',
        'Headline 10': ad.headline10 || '',
        'Headline 11': ad.headline11 || '',
        'Headline 12': ad.headline12 || '',
        'Headline 13': ad.headline13 || '',
        'Headline 14': ad.headline14 || '',
        'Headline 15': ad.headline15 || '',
        'Description 1': ad.description1 || '',
        'Description 2': ad.description2 || '',
        'Description 3': ad.description3 || '',
        'Description 4': ad.description4 || '',
        'Final URL': ad.finalUrl || data.url || '',
        'Path 1': ad.path1 || '',
        'Path 2': ad.path2 || '',
        'Ad Status': ad.adStatus || 'Enabled'
      };
      rows.push(adRow);
    }
  });
  
  // Generate CSV
  return Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true
    });

}

/**
 * Generate targeting.csv (Locations)
 * Uses canonical names from Google GeoTargets dataset
 */
function generateTargetingCSV(data: CampaignData): string {
  const rows: LocationCSVRow[] = [];
  
  // Process countries
  data.locations.countries.forEach(country => {
    const locationRow: LocationCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      Location: country
    };
    rows.push(locationRow);
  });
  
  // Process states
  data.locations.states.forEach(state => {
    const locationRow: LocationCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      Location: state
    };
    rows.push(locationRow);
  });
  
  // Process cities
  data.locations.cities.forEach(city => {
    const locationRow: LocationCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      Location: city
    };
    rows.push(locationRow);
  });
  
  // Process zip codes (format: "12345: City, State, Country")
  data.locations.zipCodes.forEach(zipCode => {
    const locationRow: LocationCSVRow = {
      Campaign: data.campaignName || 'Campaign',
      Location: zipCode
    };
    rows.push(locationRow);
  });
  
  // If no locations specified, return empty CSV with headers
  if (rows.length === 0) {
    return Papa.unparse([], {
      header: true,
      columns: ['Campaign', 'Location', 'Bid Adjustment']
    });
  }
  
  // Generate CSV
  return Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true
    });

}

/**
 * Main function to generate Google Ads Editor CSV files
 * Returns an object with separate CSV strings for each file type
 */
export function generateGoogleAdsEditorCSV(data: CampaignData): {
  campaignsStructure: string;
  keywords: string;
  ads: string;
  targeting: string;
} {
  return {
    campaignsStructure: generateCampaignsStructureCSV(data),
    keywords: generateKeywordsCSV(data),
    ads: generateAdsCSV(data),
    targeting: generateTargetingCSV(data)
  };
}

/**
 * Download CSV files to user's computer
 */
export function downloadCSVFiles(
  csvData: {
    campaignsStructure: string;
    keywords: string;
    ads: string;
    targeting: string;
  },
  baseFilename: string = 'google_ads_export'
): void {
  const files = [
    { content: csvData.campaignsStructure, filename: `${baseFilename}_campaigns_structure.csv` },
    { content: csvData.keywords, filename: `${baseFilename}_keywords.csv` },
    { content: csvData.ads, filename: `${baseFilename}_ads.csv` },
    { content: csvData.targeting, filename: `${baseFilename}_targeting.csv` }
  ];
  
  files.forEach(file => {
    if (!file.content || file.content.trim() === '') {
      console.warn(`Skipping empty file: ${file.filename}`);
      return;
    }
    
    const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/**
 * Generate and download all CSV files in one call
 */
export function generateAndDownloadGoogleAdsEditorCSV(
  data: CampaignData,
  baseFilename?: string
): void {
  const csvData = generateGoogleAdsEditorCSV(data);
  downloadCSVFiles(csvData, baseFilename);
}

