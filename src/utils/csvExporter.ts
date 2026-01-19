/**
 * CSV Exporter for Google Ads Editor
 * Converts campaign structure to Google Ads Editor CSV format
 * 
 * Google Ads Editor CSV Format Requirements:
 * - Explicit Campaign rows (Row Type: "Campaign")
 * - Explicit Ad Group rows (Row Type: "Ad group")
 * - Keyword rows (Row Type: "Keyword")
 * - Ad rows (Row Type: "Ad")
 * - Location targeting rows (Row Type: "Location")
 * - Extension rows (Row Type: "Sitelink", "Call", etc.)
 * - Negative keyword rows (Row Type: "Keyword" with Negative Keyword = "Yes")
 * - Match types must be capitalized: "Broad", "Phrase", "Exact", "Negative"
 * - Location targeting uses location names or IDs
 * - Proper row ordering: Campaigns → Ad Groups → Keywords → Ads → Extensions → Locations → Negative Keywords
 */

import { CampaignStructure, Campaign, AdGroup, Ad } from './campaignStructureGenerator';

export interface CSVRow {
  Campaign: string;
  'Ad group': string; // Google Ads Editor uses singular "Ad group"
  'Keyword': string; // Google Ads Editor uses singular "Keyword"
  'Criterion Type': string; // Match type in Google Ads Editor
  Status: string;
  'Max CPC': string;
  'Final URL': string;
  'Headline 1': string;
  'Headline 2': string;
  'Headline 3': string;
  'Headline 4': string;
  'Headline 5': string;
  'Headline 6': string;
  'Headline 7': string;
  'Headline 8': string;
  'Headline 9': string;
  'Headline 10': string;
  'Headline 11': string;
  'Headline 12': string;
  'Headline 13': string;
  'Headline 14': string;
  'Headline 15': string;
  'Description 1': string;
  'Description 2': string;
  'Description 3': string;
  'Description 4': string;
  'Path 1': string;
  'Path 2': string;
  'Sitelink': string;
  'Sitelink description 1': string;
  'Sitelink description 2': string;
  'Sitelink final URL': string;
  'Callout text': string;
  'Structured snippet header': string;
  'Structured snippet values': string;
  'Call phone number': string;
  'Call country code': string;
  Location: string;
  'Location bid adjustment': string;
  'Is negative': string;
}

/**
 * Convert campaign structure to CSV rows
 * Google Ads Editor format: Campaign, Ad group, Keywords, Ads
 */
export function structureToCSV(structure: CampaignStructure): CSVRow[] {
  const rows: CSVRow[] = [];

  structure.campaigns.forEach((campaign) => {
    // Get default URL from first ad group's first ad, or use a fallback
    let defaultUrl = 'https://www.example.com';
    if (campaign.adgroups && campaign.adgroups.length > 0) {
      const firstAdGroup = campaign.adgroups[0];
      if (firstAdGroup.ads && firstAdGroup.ads.length > 0 && firstAdGroup.ads[0].final_url) {
        defaultUrl = firstAdGroup.ads[0].final_url;
      }
    }
    
    campaign.adgroups.forEach((adGroup) => {
      // Ensure ad group has at least one ad with valid final_url
      let ads = adGroup.ads && adGroup.ads.length > 0 ? adGroup.ads : [];
      
      // If no ads, create a default ad
      if (ads.length === 0) {
        ads = [getDefaultAd(campaign, defaultUrl)];
      } else {
        // Ensure all ads have final_url
        ads = ads.map(ad => ({
          ...ad,
          final_url: ad.final_url || defaultUrl
        }));
      }
      
      // Create keyword rows with the first ad's info
      adGroup.keywords.forEach((keyword) => {
        const matchType = getMatchType(keyword);
        const cleanKeyword = cleanKeywordText(keyword);
        const firstAd = ads[0];
        rows.push(createKeywordRow(campaign, adGroup, cleanKeyword, matchType, firstAd));
      });

      // Create ad rows
      ads.forEach((ad) => {
        rows.push(createAdRow(campaign, adGroup, ad));
        
        // Create Extension rows for each ad
        if (ad.extensions && Array.isArray(ad.extensions)) {
          ad.extensions.forEach((ext: any) => {
            const extensionRows = createExtensionRows(campaign, adGroup, ext, ad);
            rows.push(...extensionRows);
          });
        }
      });

      // Create Location targeting rows
      if (adGroup.location_target) {
        const locationRows = createLocationRows(campaign, adGroup, adGroup.location_target);
        rows.push(...locationRows);
      }

      // Create Negative Keyword rows
      if (adGroup.negative_keywords && adGroup.negative_keywords.length > 0) {
        adGroup.negative_keywords.forEach((negativeKw) => {
          rows.push(createNegativeKeywordRow(campaign, adGroup, negativeKw));
        });
      }
    });
  });

  return rows;
}

/**
 * Create a Keyword row
 */
function createKeywordRow(
  campaign: Campaign,
  adGroup: AdGroup,
  keyword: string,
  matchType: string,
  ad: Ad
): CSVRow {
  const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
  row.Keyword = keyword;
  row['Criterion Type'] = matchType;
  row.Status = 'Active';
  
  // Add final URL from ad (required field)
  row['Final URL'] = (ad && ad.final_url) ? ad.final_url : 'https://www.example.com';
  
  return row;
}

/**
 * Create an Ad row (Responsive Search Ad)
 */
function createAdRow(campaign: Campaign, adGroup: AdGroup, ad: Ad): CSVRow {
  const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
  row.Status = 'Active';
  
  // Ensure final_url is always set (required field)
  row['Final URL'] = ad.final_url || 'https://www.example.com';
  
  // Ensure at least headline1 and description1 are set (required fields)
  row['Headline 1'] = ad.headline1 || 'Your Service Here';
  row['Headline 2'] = ad.headline2 || '';
  row['Headline 3'] = ad.headline3 || '';
  row['Headline 4'] = ad.headline4 || '';
  row['Headline 5'] = ad.headline5 || '';
  row['Headline 6'] = ad.headline6 || '';
  row['Headline 7'] = ad.headline7 || '';
  row['Headline 8'] = ad.headline8 || '';
  row['Headline 9'] = ad.headline9 || '';
  row['Headline 10'] = ad.headline10 || '';
  row['Headline 11'] = ad.headline11 || '';
  row['Headline 12'] = ad.headline12 || '';
  row['Headline 13'] = ad.headline13 || '';
  row['Headline 14'] = ad.headline14 || '';
  row['Headline 15'] = ad.headline15 || '';
  row['Description 1'] = ad.description1 || 'Get the best service today.';
  row['Description 2'] = ad.description2 || '';
  row['Description 3'] = ad.description3 || '';
  row['Description 4'] = ad.description4 || '';
  row['Path 1'] = ad.path1 || '';
  row['Path 2'] = ad.path2 || '';
  
  return row;
}

/**
 * Create extension rows based on extension type
 */
function createExtensionRows(campaign: Campaign, adGroup: AdGroup, ext: any, ad: Ad): CSVRow[] {
  const rows: CSVRow[] = [];
  
  switch (ext.extensionType || ext.type) {
    case 'sitelink':
      if (ext.links && Array.isArray(ext.links)) {
        ext.links.forEach((link: any) => {
          const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
          row.Status = 'Active';
          row.Sitelink = link.text || link.linkText || '';
          row['Sitelink description 1'] = link.description || link.descriptionLine1 || '';
          row['Sitelink description 2'] = link.descriptionLine2 || '';
          row['Sitelink final URL'] = link.url || link.finalUrl || ext.finalUrl || '';
          rows.push(row);
        });
      } else if (ext.text || ext.linkText) {
        const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
        row.Status = 'Active';
        row.Sitelink = ext.text || ext.linkText || '';
        row['Sitelink description 1'] = ext.description || ext.descriptionLine1 || '';
        row['Sitelink description 2'] = ext.descriptionLine2 || '';
        row['Sitelink final URL'] = ext.url || ext.finalUrl || '';
        rows.push(row);
      }
      break;
      
    case 'call':
      const callRow = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
      callRow.Status = 'Active';
      callRow['Call phone number'] = ext.phone || ext.phoneNumber || '';
      callRow['Call country code'] = ext.countryCode || ext.country || 'US';
      rows.push(callRow);
      break;
      
    case 'callout':
      if (ext.values && Array.isArray(ext.values)) {
        ext.values.forEach((value: string) => {
          const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
          row.Status = 'Active';
          row['Callout text'] = value;
          rows.push(row);
        });
      } else if (ext.text || ext.value) {
        const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
        row.Status = 'Active';
        row['Callout text'] = ext.text || ext.value || '';
        rows.push(row);
      }
      break;
      
    case 'snippet':
      if (ext.values && Array.isArray(ext.values)) {
        ext.values.forEach((value: string) => {
          const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
          row.Status = 'Active';
          row['Structured snippet header'] = ext.header || ext.title || '';
          row['Structured snippet values'] = value;
          rows.push(row);
        });
      } else if (ext.text || ext.value) {
        const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
        row.Status = 'Active';
        row['Structured snippet header'] = ext.header || ext.title || '';
        row['Structured snippet values'] = ext.text || ext.value || '';
        rows.push(row);
      }
      break;
  }
  
  return rows;
}

/**
 * Create Location targeting rows
 */
function createLocationRows(campaign: Campaign, adGroup: AdGroup, locationTarget: string): CSVRow[] {
  const rows: CSVRow[] = [];
  
  // Parse location target (could be comma-separated list)
  const locations = locationTarget.split(',').map(loc => loc.trim()).filter(loc => loc.length > 0);
  
  locations.forEach((location) => {
    const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
    row.Status = 'Active';
    row.Location = location;
    row['Location bid adjustment'] = '';
    rows.push(row);
  });
  
  return rows;
}

/**
 * Create a negative keyword row
 */
function createNegativeKeywordRow(
  campaign: Campaign,
  adGroup: AdGroup,
  negativeKw: string
): CSVRow {
  const cleanNegative = cleanKeywordText(negativeKw);
  const row = createEmptyRow(campaign.campaign_name, adGroup.adgroup_name);
  row.Keyword = cleanNegative;
  row['Criterion Type'] = 'Negative ' + getMatchType(negativeKw);
  row.Status = 'Active';
  row['Is negative'] = 'True';
  return row;
}

/**
 * Create an empty row with basic structure
 */
function createEmptyRow(
  campaignName: string,
  adGroupName: string
): CSVRow {
  return {
    Campaign: campaignName,
    'Ad group': adGroupName,
    'Keyword': '',
    'Criterion Type': '',
    Status: '',
    'Max CPC': '',
    'Final URL': '',
    'Headline 1': '',
    'Headline 2': '',
    'Headline 3': '',
    'Headline 4': '',
    'Headline 5': '',
    'Headline 6': '',
    'Headline 7': '',
    'Headline 8': '',
    'Headline 9': '',
    'Headline 10': '',
    'Headline 11': '',
    'Headline 12': '',
    'Headline 13': '',
    'Headline 14': '',
    'Headline 15': '',
    'Description 1': '',
    'Description 2': '',
    'Description 3': '',
    'Description 4': '',
    'Path 1': '',
    'Path 2': '',
    'Sitelink': '',
    'Sitelink description 1': '',
    'Sitelink description 2': '',
    'Sitelink final URL': '',
    'Callout text': '',
    'Structured snippet header': '',
    'Structured snippet values': '',
    'Call phone number': '',
    'Call country code': '',
    'Location': '',
    'Location bid adjustment': '',
    'Is negative': ''
  };
}

/**
 * Get match type from keyword format
 * Google Ads Editor requires capitalized match types
 */
function getMatchType(keyword: string): string {
  const trimmed = keyword.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return 'Exact';
  } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return 'Phrase';
  }
  return 'Broad';
}

/**
 * Clean keyword text (remove brackets/quotes for display)
 */
function cleanKeywordText(keyword: string): string {
  return keyword.replace(/^\[|\]$|^"|"$/g, '').trim();
}

/**
 * Get default ad if none exist
 */
function getDefaultAd(campaign: Campaign, defaultUrl: string = 'https://www.example.com'): Ad {
  return {
    type: 'rsa',
    headline1: 'Default Headline',
    description1: 'Default Description',
    final_url: defaultUrl
  };
}

/**
 * Convert CSV rows to CSV string with proper encoding
 */
export function rowsToCSVString(rows: CSVRow[]): string {
  if (rows.length === 0) return '';

  // Get headers in correct order for Google Ads Editor
  const headers: (keyof CSVRow)[] = [
    'Campaign',
    'Ad group',
    'Keyword',
    'Criterion Type',
    'Status',
    'Max CPC',
    'Final URL',
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
    'Sitelink',
    'Sitelink description 1',
    'Sitelink description 2',
    'Sitelink final URL',
    'Callout text',
    'Structured snippet header',
    'Structured snippet values',
    'Call phone number',
    'Call country code',
    'Location',
    'Location bid adjustment',
    'Is negative'
  ];

  // Create CSV content
  const csvLines: string[] = [];
  
  // Add header row (no BOM as Google Ads Editor doesn't need it)
  csvLines.push(headers.map(h => escapeCSV(h)).join(','));

  // Add data rows
  rows.forEach((row) => {
    csvLines.push(headers.map(header => escapeCSV(row[header] || '')).join(','));
  });

  return csvLines.join('\n'); // Use \n for Google Ads Editor compatibility
}

/**
 * Export campaign structure to CSV file
 */
export function exportCampaignToCSV(structure: CampaignStructure, filename: string = 'campaign_export.csv'): void {
  // Validate structure
  if (!structure || !structure.campaigns || structure.campaigns.length === 0) {
    throw new Error('Invalid campaign structure: No campaigns found');
  }

  // Generate CSV rows
  const rows = structureToCSV(structure);
  
  if (rows.length === 0) {
    throw new Error('No data to export');
  }

  // Convert to CSV string
  const csvContent = rowsToCSVString(rows);
  
  // Create blob with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

/**
 * Escape CSV value
 * Handles commas, quotes, and newlines properly
 */
function escapeCSV(value: string | undefined | null): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If value contains comma, quote, newline, or carriage return, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}
