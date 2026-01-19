/**
 * Google Ads Editor CSV Exporter
 * 
 * Exports campaigns in Google Ads Editor format with Type and Operation columns
 * Format: Type, Operation, Campaign, AdGroup, Keyword, Match Type, Ad Type, etc.
 * 
 * This format is compatible with Google Ads Editor import functionality
 * Follows Google Ads Editor MASTER CSV Header format
 */

import Papa from 'papaparse';
import { CampaignStructure, Campaign, AdGroup, Ad } from './campaignStructureGenerator';
import { validateAndFixAd, validateAndFixAds, formatValidationReport, type ValidationReport } from './adValidationUtils';

// Google Ads Editor CSV Headers - EXACT FORMAT PER GOOGLE DOCUMENTATION
// https://support.google.com/google-ads/editor/answer/57747?hl=en
// IMPORTANT: "Type" column is used for match types (Broad/Phrase/Exact), NOT for row identification
// Google Ads Editor determines row type based on which columns are populated
export const GOOGLE_ADS_EDITOR_HEADERS = [
  'Row Type',
  'Action',
  'Campaign',
  'Campaign ID',
  'Campaign status',
  'Campaign type',
  'Budget',
  'Budget ID',
  'Budget type',
  'Bid Strategy Type',
  'Start date',
  'End date',
  'Networks',
  'EU political ads',
  'Desktop Bid adj.',
  'Mobile Bid adj.',
  'Tablet Bid adj.',
  'Location',
  'Location ID',
  'Language',
  'Ad group',
  'Ad group ID',
  'Ad group status',
  'Ad Type',
  'Max CPC',
  'Max CPM',
  'Max CPV',
  'Bid Strategy',
  'Keyword',
  'Criterion Type',
  'Final URL',
  'Final mobile URL',
  'Tracking template',
  'Custom parameter',
  'Final URL suffix',
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
  'Business name',
  'Path 1',
  'Path 2',
  'Display URL',
  'Phone',
  'Phone country code',
  'Call tracked',
  'Call conversion action',
  'Image asset ID',
  'Image URL',
  'Image asset name',
  'Video asset ID',
  'Video URL',
  'Video asset name',
  'Callout 1',
  'Callout 2',
  'Callout 3',
  'Callout 4',
  'Structured snippet header',
  'Structured snippet value 1',
  'Structured snippet value 2',
  'Structured snippet value 3',
  'Structured snippet value 4',
  'Structured snippet value 5',
  'Structured snippet value 6',
  'Price asset name',
  'Price table header 1',
  'Price table header 2',
  'Price table header 3',
  'Price table row1 col1',
  'Price table row1 col2',
  'Price table row1 col3',
  'Promotion ID',
  'Promotion final URL',
  'Promotion percent off',
  'Promotion money amount off',
  'Promotion currency code',
  'Promotion start date',
  'Promotion end date',
  'Lead form asset ID',
  'Lead form name',
  'Lead form final URL',
  'Sitelink text 1',
  'Sitelink final URL 1',
  'Sitelink description 1',
  'Sitelink description 2',
  'Sitelink text 2',
  'Sitelink final URL 2',
  'Sitelink text 3',
  'Sitelink final URL 3',
  'Sitelink text 4',
  'Sitelink final URL 4',
  'Sitelink tracking template',
  'Sitelink final mobile URL',
  'Audience list',
  'Audience list action',
  'Label',
  'Tracking ID',
  'Customer ID',
  'Device preference',
];

export interface CSVRow {
  [key: string]: string | number | null | undefined;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rows: CSVRow[];
}

/**
 * Get match type from keyword format
 * Returns internal format (e.g., 'NEGATIVE_BROAD')
 */
function getMatchType(keyword: string): string {
  if (!keyword) return 'BROAD';
  const trimmed = keyword.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return 'EXACT';
  } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return 'PHRASE';
  } else if (trimmed.startsWith('-[') && trimmed.endsWith(']')) {
    return 'NEGATIVE_EXACT';
  } else if (trimmed.startsWith('-"') && trimmed.endsWith('"')) {
    return 'NEGATIVE_PHRASE';
  } else if (trimmed.startsWith('-')) {
    return 'NEGATIVE_BROAD';
  }
  return 'BROAD';
}

/**
 * Convert match type to Google Ads Editor CSV format
 * According to google_ads_rules.md Section 11, negative match types should be:
 * "Negative Broad", "Negative Phrase", "Negative Exact" (with spaces)
 */
function formatMatchTypeForCSV(matchType: string, isNegative: boolean = false): string {
  const upper = matchType.toUpperCase().trim();
  
  if (isNegative) {
    // Convert negative match types to Google Ads Editor format
    if (upper === 'NEGATIVE_BROAD' || upper === 'NEGATIVE BROAD') {
      return 'Negative Broad';
    } else if (upper === 'NEGATIVE_PHRASE' || upper === 'NEGATIVE PHRASE') {
      return 'Negative Phrase';
    } else if (upper === 'NEGATIVE_EXACT' || upper === 'NEGATIVE EXACT') {
      return 'Negative Exact';
    }
    // Fallback: if it's already in the correct format, return as is
    if (matchType.includes('Negative')) {
      return matchType;
    }
    // Default to Negative Broad if it's a negative keyword but format is unclear
    return 'Negative Broad';
  } else {
    // Positive match types: "Broad", "Phrase", "Exact" (capitalized per master sheet)
    if (upper === 'BROAD') {
      return 'Broad';
    } else if (upper === 'PHRASE') {
      return 'Phrase';
    } else if (upper === 'EXACT') {
      return 'Exact';
    }
    // Fallback: capitalize first letter
    return matchType.charAt(0).toUpperCase() + matchType.slice(1).toLowerCase();
  }
}

/**
 * Clean ad text (remove quotes from headlines/descriptions)
 * Google Ads does not allow quotation marks in ad copy, especially around DKI syntax
 * Wrong: "{KeyWord:Adiology Service}"
 * Right: {KeyWord:Adiology Service}
 */
function cleanAdText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove quotes around DKI syntax: "{KeyWord:...}" -> {KeyWord:...}
  cleaned = cleaned.replace(/"(\{KeyWord:[^}]+\})"/g, '$1');
  cleaned = cleaned.replace(/'(\{KeyWord:[^}]+\})'/g, '$1');
  
  // Remove double quotes from start and end
  cleaned = cleaned.replace(/^["]+|["]+$/g, '');
  
  // Remove single quotes from start and end (but preserve apostrophes in words)
  cleaned = cleaned.replace(/^[']+|[']+$/g, '');
  
  // Remove stray quotes with spaces
  cleaned = cleaned.replace(/\s"+|"+\s/g, ' ');
  
  // Remove square brackets (match type formatting)
  cleaned = cleaned.replace(/\[|\]/g, '');
  
  return cleaned.trim();
}

/**
 * Clean keyword text (remove brackets/quotes)
 * Also removes any leading/trailing whitespace and normalizes spaces
 * Removes ALL quotes (single, double, triple) and brackets from the keyword text
 * The keyword text should NEVER contain brackets or quotes - match type is separate
 */
function cleanKeywordText(keyword: string): string {
  if (!keyword) return '';
  let cleaned = keyword
    .replace(/^\[|\]$/g, '') // Remove exact match brackets from start/end
    .replace(/\[|\]/g, '') // Remove ALL brackets anywhere in the string
    .replace(/^"|"$/g, '') // Remove phrase quotes from start/end (first pass)
    .replace(/^-\[|-\]$/g, '') // Remove negative exact brackets
    .replace(/^-"|-"$/g, '') // Remove negative phrase quotes
    .replace(/^-/g, '') // Remove negative prefix
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
  
  // Remove any remaining quotes (single, double, or triple quotes) from anywhere in the string
  // This handles cases where quotes weren't properly removed
  cleaned = cleaned.replace(/^["']+|["']+$/g, ''); // Remove quotes from start/end
  cleaned = cleaned.replace(/^["']+|["']+$/g, ''); // Second pass for triple quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, ''); // Third pass to be thorough
  cleaned = cleaned.replace(/["']/g, ''); // Remove any remaining quotes anywhere in the string
  
  return cleaned.trim();
}

/**
 * Check if keyword is low quality and should be filtered out
 */
function isLowQualityKeyword(keyword: string): boolean {
  if (!keyword || keyword.length < 3) return true; // Too short
  
  const lower = keyword.toLowerCase();
  
  // Check for repeated phrases (e.g., "near me near me", "services services")
  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) {
      return true; // Repeated word/phrase
    }
  }
  
  // Check for common low-quality patterns
  const lowQualityPatterns = [
    /\b(near me)\s+\1/i, // "near me near me"
    /\b(services?)\s+\1/i, // "services services" or "service service"
    /\b(price)\s+near\s+me/i, // "price near me"
    /\b(me)\s+price/i, // "me price"
    /\b(24\/7)\s+me\b/i, // "24/7 me"
    /\b(near)\s+(repair|price|services?)\b/i, // "near repair", "near price"
    /\b(services?)\s+(repair|price)\b/i, // "services repair"
    /\b(top|best)\s+(services?|roofing|plumbing)\b$/i, // "top services", "best roofing" (too vague)
    /\b(24\/7)\s+(services?|roofing|plumbing)\b$/i, // "24/7 services" (too vague)
    /\b(emergency)\s+(near\s+me)?\s*$/i, // "emergency" or "emergency near me" (too vague)
  ];
  
  for (const pattern of lowQualityPatterns) {
    if (pattern.test(keyword)) {
      return true;
    }
  }
  
  // Check for grammatically incorrect patterns (question words without proper structure)
  const questionWords = ['what', 'where', 'when', 'why', 'how', 'does', 'can', 'is'];
  const firstWord = words[0];
  if (questionWords.includes(firstWord) && words.length < 4) {
    // Question words with very few words are likely incomplete
    return true;
  }
  
  return false;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(date: string | null | undefined): boolean {
  if (!date || date.trim() === '') return true; // Empty dates are allowed
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Validate URL format
 */
function isValidURL(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Create an empty CSV row with all master sheet headers initialized to empty strings
 * This ensures every row has all 112 columns in the exact order from the master sheet
 */
function createEmptyCSVRow(): CSVRow {
  const row: CSVRow = {};
  GOOGLE_ADS_EDITOR_HEADERS.forEach(header => {
    row[header] = '';
  });
  return row;
}

/**
 * Convert campaign structure to Google Ads Editor CSV rows
 * 
 * CRITICAL: Uses EXACT master sheet headers from Google Sheets:
 * https://docs.google.com/spreadsheets/d/1wy1PFV1CKT1FQYcowH-iQytq9UrMFufdJeZVv7ekbPg/edit?gid=95358763#gid=95358763
 * 
 * - Every row has ALL 112 columns from master sheet (via createEmptyCSVRow())
 * - Headers are NEVER modified - only data is populated
 * - Headers are in EXACT order from master sheet
 * - This ensures CSV matches master sheet format exactly
 */
export function campaignStructureToCSVRows(structure: CampaignStructure): CSVRow[] {
  const rows: CSVRow[] = [];

  if (!structure || !structure.campaigns || structure.campaigns.length === 0) {
    return rows;
  }

  // Track all keywords across all campaigns/ad groups for global deduplication
  const globalSeenKeywords = new Map<string, Set<string>>(); // campaign -> Set of "adgroup::keyword::matchtype"

  structure.campaigns.forEach((campaign) => {
    // Extract default URL from any ad that has one (for fallback when ads are missing final_url)
    let defaultFinalUrl = '';
    if (campaign.adgroups) {
      for (const adGroup of campaign.adgroups) {
        if (adGroup.ads) {
          for (const ad of adGroup.ads) {
            if (ad.final_url && ad.final_url.trim()) {
              defaultFinalUrl = ad.final_url.trim();
              break;
            }
          }
        }
        if (defaultFinalUrl) break;
      }
    }
    
    // Campaign row - MUST appear before ad groups, keywords, or ads
    // Format location targeting data according to master sheet
    const targetCountry = (campaign as any).targetCountry || '';
    const zipCodes = campaign.zip_codes || [];
    const cities = campaign.cities || [];
    const states = campaign.states || [];
    const regions = (campaign as any).regions || [];
    
    // Format location data as per master sheet (comma-separated, quoted if multiple)
    // Note: PapaParse will handle quoting automatically, so we pass arrays/strings directly
    const postalCodeTargeting = zipCodes.length > 0 
      ? (zipCodes.length === 1 ? zipCodes[0] : zipCodes.join(','))
      : '';
    const cityTargeting = cities.length > 0
      ? (cities.length === 1 ? cities[0] : cities.join(', '))
      : '';
    const stateTargeting = states.length > 0 ? states[0] : ''; // Single value per master sheet
    const regionTargeting = regions.length > 0 ? regions[0] : ''; // Single value per master sheet
    
    // Create campaign row with all columns, populate only relevant fields
    const campaignRow: CSVRow = createEmptyCSVRow();
    campaignRow['Row Type'] = 'Campaign';
    campaignRow['Action'] = 'Add';
    campaignRow['Campaign'] = campaign.campaign_name || '';
    campaignRow['Campaign status'] = 'Enabled';
    campaignRow['Campaign type'] = 'Search';
    campaignRow['Budget'] = (campaign as any).budget?.toString() || '100';
    campaignRow['Budget type'] = (campaign as any).budget_type || 'Daily';
    campaignRow['Bid Strategy Type'] = (campaign as any).bidding_strategy || 'Manual CPC';
    campaignRow['Start date'] = (campaign as any).start_date || '';
    campaignRow['End date'] = (campaign as any).end_date || '';
    campaignRow['Networks'] = 'Google search';
    campaignRow['EU political ads'] = 'No';
    campaignRow['Desktop Bid adj.'] = '-100%';
    campaignRow['Mobile Bid adj.'] = '0%';
    campaignRow['Tablet Bid adj.'] = '-100%';
    campaignRow['Language'] = 'en';
    rows.push(campaignRow);
    
    // Add Location rows - each location needs its own row per Google Ads Editor format
    // https://support.google.com/google-ads/editor/answer/33114
    const allLocations: Array<{type: string, value: string}> = [];
    
    // Add country
    if (targetCountry) {
      allLocations.push({ type: 'country', value: targetCountry });
    }
    
    // Add states
    states.forEach((state: string) => {
      if (state && state.trim()) {
        allLocations.push({ type: 'state', value: state.trim() });
      }
    });
    
    // Add cities
    cities.forEach((city: string) => {
      if (city && city.trim()) {
        allLocations.push({ type: 'city', value: city.trim() });
      }
    });
    
    // Add zip codes
    zipCodes.forEach((zip: string) => {
      if (zip && zip.trim()) {
        allLocations.push({ type: 'zip', value: zip.trim() });
      }
    });
    
    // Create a Location row for each location
    allLocations.forEach((loc) => {
      const locationRow: CSVRow = createEmptyCSVRow();
      locationRow['Row Type'] = 'Location';
      locationRow['Action'] = 'Add';
      locationRow['Campaign'] = campaign.campaign_name || '';
      locationRow['Location'] = loc.value;
      rows.push(locationRow);
    });

    // Process ad groups
    if (campaign.adgroups && campaign.adgroups.length > 0) {
      campaign.adgroups.forEach((adGroup) => {
        // Clean ad group name - remove any quotes, brackets, or formatting
        let cleanedAdGroupName = (adGroup.adgroup_name || '').trim();
        // Remove all types of quotes (single, double, triple) and brackets from start and end
        cleanedAdGroupName = cleanedAdGroupName
          .replace(/^["']+|["']+$/g, '') // Remove quotes from start/end (first pass)
          .replace(/^["']+|["']+$/g, '') // Second pass for triple quotes
          .replace(/^["']+|["']+$/g, '') // Third pass to be thorough
          .replace(/^\[|\]$/g, '') // Remove brackets from start/end
          .replace(/\[|\]/g, '') // Remove ALL brackets anywhere in the string
          .trim();
        // Also remove any quotes that might be in the middle (but keep the text)
        if (!cleanedAdGroupName) {
          console.warn('Skipping ad group with empty name');
          return;
        }
        
        // Ad Group row - create with all columns, populate only relevant fields
        const adGroupRow: CSVRow = createEmptyCSVRow();
        adGroupRow['Row Type'] = 'Ad group';
        adGroupRow['Action'] = 'Add';
        adGroupRow['Campaign'] = campaign.campaign_name || '';
        adGroupRow['Ad group'] = cleanedAdGroupName;
        adGroupRow['Ad group status'] = 'Enabled';
        adGroupRow['Max CPC'] = (adGroup as any).default_max_cpc?.toString() || '1.00';
        rows.push(adGroupRow);

        // Keywords - with validation and deduplication
        if (adGroup.keywords && adGroup.keywords.length > 0) {
          const MAX_KEYWORD_LENGTH = 80; // Google Ads limit
          const MIN_KEYWORD_LENGTH = 3; // Minimum meaningful keyword length
          
          // Initialize global tracking for this campaign if not exists
          if (!globalSeenKeywords.has(campaign.campaign_name || '')) {
            globalSeenKeywords.set(campaign.campaign_name || '', new Set());
          }
          const campaignSeenKeywords = globalSeenKeywords.get(campaign.campaign_name || '')!;
          
          adGroup.keywords.forEach((keyword) => {
            const keywordText = typeof keyword === 'string' ? keyword : (keyword as any).keyword || keyword;
            if (!keywordText || typeof keywordText !== 'string') return; // Skip invalid keywords
            
            // IMPORTANT: Get match type BEFORE cleaning, as cleaning removes brackets/quotes
            const matchType = typeof keyword === 'string' ? getMatchType(keywordText) : ((keyword as any).matchType || getMatchType(keywordText));
            
            // Clean keyword text - remove ALL brackets and quotes (match type is in separate column)
            let cleanedKeyword = cleanKeywordText(keywordText);
            
            // Double-check: remove any remaining brackets or quotes that might have been missed
            cleanedKeyword = cleanedKeyword.replace(/[\[\]"]/g, '').trim();
            
            // Skip if keyword is empty after cleaning
            if (!cleanedKeyword || cleanedKeyword.trim().length === 0) return;
            
            // Skip if too short
            if (cleanedKeyword.length < MIN_KEYWORD_LENGTH) return;
            
            // Filter out low-quality keywords
            if (isLowQualityKeyword(cleanedKeyword)) {
              console.warn(`Skipping low-quality keyword: "${cleanedKeyword}"`);
              return;
            }
            
            // Enforce 80 character limit (Google Ads rule)
            if (cleanedKeyword.length > MAX_KEYWORD_LENGTH) {
              cleanedKeyword = cleanedKeyword.substring(0, MAX_KEYWORD_LENGTH).trim();
            }
            
            // Skip if still empty after truncation
            if (!cleanedKeyword || cleanedKeyword.trim().length === 0) return;
            
            // Validate match type is valid
            let csvMatchType = formatMatchTypeForCSV(matchType, false);
            if (!['Broad', 'Phrase', 'Exact'].includes(csvMatchType)) {
              console.warn(`Invalid match type for keyword "${cleanedKeyword}": ${csvMatchType}, defaulting to Broad`);
              csvMatchType = 'Broad';
            }
            
            // Create unique key for duplicate detection (case-insensitive, across all ad groups in campaign)
            const uniqueKey = `${cleanedKeyword.toLowerCase()}::${csvMatchType}`;
            
            // Skip duplicates across all ad groups in the campaign
            if (campaignSeenKeywords.has(uniqueKey)) {
              console.warn(`Skipping duplicate keyword: "${cleanedKeyword}" (${csvMatchType})`);
              return;
            }
            campaignSeenKeywords.add(uniqueKey);
            
            // Ensure campaign and ad group names are not empty
            if (!campaign.campaign_name || !cleanedAdGroupName) {
              console.warn(`Skipping keyword "${cleanedKeyword}" - missing campaign or ad group name`);
              return;
            }

            // Validate match type before creating row
            if (!csvMatchType || !['Broad', 'Phrase', 'Exact'].includes(csvMatchType)) {
              console.warn(`Invalid match type "${csvMatchType}" for keyword "${cleanedKeyword}", defaulting to Broad`);
              csvMatchType = 'Broad';
            }
            
// Keyword row - create with all columns, populate only relevant fields
            const keywordRow: CSVRow = createEmptyCSVRow();
            keywordRow['Row Type'] = 'Keyword';
            keywordRow['Action'] = 'Add';
            keywordRow['Campaign'] = campaign.campaign_name;
            keywordRow['Ad group'] = cleanedAdGroupName;
            keywordRow['Keyword'] = cleanedKeyword;
            keywordRow['Criterion Type'] = csvMatchType; // Must be 'Broad', 'Phrase', or 'Exact'
            keywordRow['Max CPC'] = typeof keyword === 'object' && (keyword as any).maxCPC ? (keyword as any).maxCPC.toString() : '';
            keywordRow['Final URL'] = typeof keyword === 'object' && (keyword as any).finalURL ? (keyword as any).finalURL : '';
            rows.push(keywordRow);
          });
        }

        // Ads - Google Ads allows max 3 RSA ads per ad group
        if (adGroup.ads && adGroup.ads.length > 0) {
          const MAX_ADS_PER_ADGROUP = 3; // Google Ads limit for RSA
          const seenAdContent = new Set<string>(); // Track duplicate ad content
          
          // Validate and fix all ads before processing
          const { ads: validatedAds, report: validationReport } = validateAndFixAds(adGroup.ads);
          
          // Log validation report if there were fixes
          if (validationReport.fixed > 0) {
            console.log(`✅ Auto-fixed ${validationReport.fixed} ad(s) in ad group "${cleanedAdGroupName}":`);
            validationReport.details.forEach((detail, idx) => {
              if (detail.fixes.length > 0) {
                console.log(`  Ad ${idx + 1}: ${detail.fixes.join(', ')}`);
              }
            });
          }
          
          // Limit to max 3 ads per ad group, and filter duplicates
          validatedAds.slice(0, MAX_ADS_PER_ADGROUP * 2).forEach((ad) => {
            // Process all ad types (RSA, DKI, Call) - they should all be converted to RSA format for CSV
            // Headlines and descriptions are already validated and fixed by validateAndFixAds above
            // Just ensure they're trimmed and within limits for duplicate detection
            // Support both array format (headlines/descriptions) and individual fields (headline1, headline2, etc.)
            let headline1 = '';
            let headline2 = '';
            let headline3 = '';
            
            if (ad.headlines && Array.isArray(ad.headlines) && ad.headlines.length > 0) {
              headline1 = cleanAdText(ad.headlines[0] || 'Professional Service').substring(0, 30);
              headline2 = cleanAdText(ad.headlines[1] || 'Expert Solutions').substring(0, 30);
              headline3 = cleanAdText(ad.headlines[2] || 'Quality Guaranteed').substring(0, 30);
            } else {
              headline1 = cleanAdText(ad.headline1 || 'Professional Service').substring(0, 30);
              headline2 = cleanAdText(ad.headline2 || 'Expert Solutions').substring(0, 30);
              headline3 = cleanAdText(ad.headline3 || 'Quality Guaranteed').substring(0, 30);
            }
            
            let desc1 = '';
            let desc2 = '';
            
            if (ad.descriptions && Array.isArray(ad.descriptions) && ad.descriptions.length > 0) {
              desc1 = cleanAdText(ad.descriptions[0] || 'Get professional service you can trust.').substring(0, 90);
              desc2 = cleanAdText(ad.descriptions[1] || 'Contact us today for expert assistance.').substring(0, 90);
            } else {
              desc1 = cleanAdText(ad.description1 || 'Get professional service you can trust.').substring(0, 90);
              desc2 = cleanAdText(ad.description2 || 'Contact us today for expert assistance.').substring(0, 90);
            }
            const finalUrl = (ad.final_url || '').trim();
            
            // Create unique key for duplicate detection (using normalized values)
            const adContentKey = `${headline1}::${headline2}::${headline3}::${desc1}::${desc2}::${finalUrl}`.toLowerCase();
            
            // Skip if we've already added this exact ad content
            if (seenAdContent.has(adContentKey)) {
              console.warn(`Skipping duplicate ad content in ad group "${cleanedAdGroupName}"`);
              return;
            }
            
            // Stop if we've reached the limit
            if (seenAdContent.size >= MAX_ADS_PER_ADGROUP) {
              return;
            }
            
            seenAdContent.add(adContentKey);
            
            // Extract callouts and other assets from ad extensions
            const callouts: string[] = [];
            if (ad.extensions && Array.isArray(ad.extensions)) {
              ad.extensions.forEach((ext: any) => {
                if (ext.extensionType === 'callout' && ext.text) {
                  callouts.push(ext.text);
                }
              });
            }
            
            // Ad row - create with all columns, populate only relevant fields
            const adRow: CSVRow = createEmptyCSVRow();
            adRow['Row Type'] = 'Responsive search ad';
            adRow['Action'] = 'Add';
            adRow['Campaign'] = campaign.campaign_name || '';
            adRow['Ad group'] = cleanedAdGroupName;
            adRow['Ad Type'] = 'Responsive search ad'; // Required by validator
            adRow['Final URL'] = ad.final_url || defaultFinalUrl || '';
            adRow['Final mobile URL'] = (ad as any).final_mobile_url || '';
            adRow['Tracking template'] = (ad as any).tracking_template || '';
            adRow['Custom parameter'] = (ad as any).custom_parameters || '';
            
            // Handle headlines - support both array format and individual fields
            if (ad.headlines && Array.isArray(ad.headlines)) {
              ad.headlines.forEach((headline: string, idx: number) => {
                if (idx < 15 && headline && headline.trim()) {
                  adRow[`Headline ${idx + 1}`] = cleanAdText(headline).substring(0, 30);
                }
              });
            } else {
              // Use individual headline fields
              adRow['Headline 1'] = headline1;
              adRow['Headline 2'] = headline2;
              adRow['Headline 3'] = headline3;
              if (ad.headline4) adRow['Headline 4'] = cleanAdText(ad.headline4 || '').substring(0, 30);
              if (ad.headline5) adRow['Headline 5'] = cleanAdText(ad.headline5 || '').substring(0, 30);
              if (ad.headline6) adRow['Headline 6'] = cleanAdText(ad.headline6 || '').substring(0, 30);
              if (ad.headline7) adRow['Headline 7'] = cleanAdText(ad.headline7 || '').substring(0, 30);
              if (ad.headline8) adRow['Headline 8'] = cleanAdText(ad.headline8 || '').substring(0, 30);
              if (ad.headline9) adRow['Headline 9'] = cleanAdText(ad.headline9 || '').substring(0, 30);
              if (ad.headline10) adRow['Headline 10'] = cleanAdText(ad.headline10 || '').substring(0, 30);
              if (ad.headline11) adRow['Headline 11'] = cleanAdText(ad.headline11 || '').substring(0, 30);
              if (ad.headline12) adRow['Headline 12'] = cleanAdText(ad.headline12 || '').substring(0, 30);
              if (ad.headline13) adRow['Headline 13'] = cleanAdText(ad.headline13 || '').substring(0, 30);
              if (ad.headline14) adRow['Headline 14'] = cleanAdText(ad.headline14 || '').substring(0, 30);
              if (ad.headline15) adRow['Headline 15'] = cleanAdText(ad.headline15 || '').substring(0, 30);
            }
            
            // Handle descriptions - support both array format and individual fields
            if (ad.descriptions && Array.isArray(ad.descriptions)) {
              ad.descriptions.forEach((description: string, idx: number) => {
                if (idx < 4 && description && description.trim()) {
                  adRow[`Description ${idx + 1}`] = cleanAdText(description).substring(0, 90);
                }
              });
            } else {
              // Use individual description fields
              adRow['Description 1'] = desc1;
              adRow['Description 2'] = desc2;
              if (ad.description3) adRow['Description 3'] = cleanAdText(ad.description3 || '').substring(0, 90);
              if (ad.description4) adRow['Description 4'] = cleanAdText(ad.description4 || '').substring(0, 90);
            }
            adRow['Business name'] = (ad as any).businessName || '';
            adRow['Path 1'] = (ad.path1 || '').trim().substring(0, 15);
            adRow['Path 2'] = (ad.path2 || '').trim().substring(0, 15);
            adRow['Phone'] = (ad as any).phoneNumber || '';
            adRow['Callout 1'] = callouts[0] || '';
            adRow['Callout 2'] = callouts[1] || '';
            adRow['Callout 3'] = callouts[2] || '';
            adRow['Callout 4'] = callouts[3] || '';
            rows.push(adRow);
          });
        }

        // Negative Keywords - with validation and deduplication
        if (adGroup.negative_keywords && adGroup.negative_keywords.length > 0) {
          const MAX_KEYWORD_LENGTH = 80; // Google Ads limit
          const MIN_KEYWORD_LENGTH = 2; // Minimum for negative keywords (can be shorter)
          
          // Initialize global tracking for negative keywords in this campaign
          if (!globalSeenKeywords.has(campaign.campaign_name || '')) {
            globalSeenKeywords.set(campaign.campaign_name || '', new Set());
          }
          const campaignSeenKeywords = globalSeenKeywords.get(campaign.campaign_name || '')!;
          
          adGroup.negative_keywords.forEach((negativeKeyword) => {
            const keywordText = typeof negativeKeyword === 'string' ? negativeKeyword : (negativeKeyword as any).keyword || negativeKeyword;
            if (!keywordText || typeof keywordText !== 'string') return; // Skip invalid keywords
            
            const matchType = typeof negativeKeyword === 'string' ? getMatchType(keywordText) : ((negativeKeyword as any).matchType || getMatchType(keywordText));
            let cleanedKeyword = cleanKeywordText(keywordText);
            
            // Skip if keyword is empty after cleaning
            if (!cleanedKeyword || cleanedKeyword.trim().length === 0) return;
            
            // Skip if too short
            if (cleanedKeyword.length < MIN_KEYWORD_LENGTH) return;
            
            // Enforce 80 character limit (Google Ads rule)
            if (cleanedKeyword.length > MAX_KEYWORD_LENGTH) {
              cleanedKeyword = cleanedKeyword.substring(0, MAX_KEYWORD_LENGTH).trim();
            }
            
            // Skip if still empty after truncation
            if (!cleanedKeyword || cleanedKeyword.trim().length === 0) return;
            
            // Convert to Google Ads Editor format: "Negative Broad", "Negative Phrase", "Negative Exact"
            let csvMatchType = formatMatchTypeForCSV(matchType, true);
            
            // Validate match type is valid for negative keywords
            if (!['Negative Broad', 'Negative Phrase', 'Negative Exact'].includes(csvMatchType)) {
              console.warn(`Invalid negative match type for keyword "${cleanedKeyword}": ${csvMatchType}, defaulting to Negative Broad`);
              csvMatchType = 'Negative Broad';
            }
            
            // Create unique key for duplicate detection (case-insensitive, across all ad groups)
            const uniqueKey = `NEG::${cleanedKeyword.toLowerCase()}::${csvMatchType}`;
            
            // Skip duplicates across all ad groups in the campaign
            if (campaignSeenKeywords.has(uniqueKey)) {
              console.warn(`Skipping duplicate negative keyword: "${cleanedKeyword}" (${csvMatchType})`);
              return;
            }
            campaignSeenKeywords.add(uniqueKey);
            
            // Ensure campaign and ad group names are not empty
            if (!campaign.campaign_name || !cleanedAdGroupName) {
              console.warn(`Skipping negative keyword "${cleanedKeyword}" - missing campaign or ad group name`);
              return;
            }

// Negative keyword row - create with all columns, populate only relevant fields
            const negativeRow: CSVRow = createEmptyCSVRow();
            negativeRow['Row Type'] = 'Negative keyword';
            negativeRow['Action'] = 'Add';
            negativeRow['Campaign'] = campaign.campaign_name;
            negativeRow['Ad group'] = cleanedAdGroupName;
            negativeRow['Keyword'] = cleanedKeyword;
            negativeRow['Criterion Type'] = csvMatchType; // Must be 'Negative Broad', 'Negative Phrase', or 'Negative Exact'
            rows.push(negativeRow);
          });
        }
      });
    }

    // Add Sitelink rows - each sitelink gets its own row
    if (campaign.adgroups && campaign.adgroups.length > 0) {
      campaign.adgroups.forEach((adGroup) => {
        // Clean ad group name for extensions
        let cleanedAdGroupNameForExt = (adGroup.adgroup_name || '').trim();
        cleanedAdGroupNameForExt = cleanedAdGroupNameForExt
          .replace(/^["']+|["']+$/g, '')
          .replace(/^["']+|["']+$/g, '')
          .replace(/^["']+|["']+$/g, '')
          .trim();
        
        if (adGroup.ads && adGroup.ads.length > 0) {
          adGroup.ads.forEach((ad) => {
            // Process sitelinks from ad extensions
            if (ad.extensions && Array.isArray(ad.extensions)) {
              ad.extensions.forEach((ext: any) => {
                // Sitelinks - per master sheet, each sitelink gets its own row with Type='Sitelink'
                if (ext.extensionType === 'sitelink' && ext.sitelinks && Array.isArray(ext.sitelinks)) {
                  ext.sitelinks.forEach((sitelink: any, index: number) => {
                    if (sitelink.text) {
                      const sitelinkNum = Math.min(index + 1, 4); // Max 4 sitelinks per master sheet
// Sitelink row - create with all master sheet columns, populate only relevant fields
                      const sitelinkRow: CSVRow = createEmptyCSVRow();
                      sitelinkRow['Row Type'] = 'Sitelink';
                      sitelinkRow['Action'] = 'Add';
                      sitelinkRow['Campaign'] = campaign.campaign_name || '';
                      sitelinkRow['Ad group'] = cleanedAdGroupNameForExt;
                      sitelinkRow[`Sitelink text ${sitelinkNum}`] = sitelink.text || '';
                      sitelinkRow[`Sitelink final URL ${sitelinkNum}`] = sitelink.url || ad.final_url || defaultFinalUrl || '';
                      // Add descriptions only for first sitelink
                      if (sitelinkNum === 1) {
                        sitelinkRow['Sitelink description 1'] = sitelink.description || '';
                        sitelinkRow['Sitelink description 2'] = sitelink.description2 || '';
                      }
                      rows.push(sitelinkRow);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return rows;
}

/**
 * Validate CSV rows before export
 */
export function validateCSVRows(rows: CSVRow[]): CSVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rows.length === 0) {
    errors.push('No rows to export');
    return { isValid: false, errors, warnings, rows: [] };
  }

  const campaignNames = new Set<string>();
  const adGroupMap = new Map<string, Set<string>>(); // campaign -> ad groups

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    // Use 'Row Type' column - matches the header and row creation
    const rowType = (row['Row Type'] || '').toString().trim();

    // Validate Type
    if (!rowType) {
      errors.push(`Row ${rowNum}: Missing Row Type`);
      return;
    }

    // Valid types match what we create in campaignStructureToCSVRows
    const validRowTypes = ['Campaign', 'Location', 'Ad group', 'Keyword', 'Responsive search ad', 'Negative keyword', 'Sitelink', 'Callout', 'Structured snippet', 'Call'];
    const rowTypeUpper = rowType.toUpperCase();
    const validRowTypesUpper = validRowTypes.map(t => t.toUpperCase());
    
    if (!validRowTypesUpper.includes(rowTypeUpper)) {
      errors.push(`Row ${rowNum}: Invalid Row Type "${rowType}"`);
    }

    // Campaign validation
    if (rowTypeUpper === 'CAMPAIGN') {
      const campaignName = (row['Campaign'] || '').toString().trim();
      if (!campaignName) {
        errors.push(`Row ${rowNum}: Campaign name is required`);
      } else {
        campaignNames.add(campaignName);
      }

      const startDate = (row['Start date'] || '').toString();
      if (startDate && !isValidDate(startDate)) {
        errors.push(`Row ${rowNum}: Start date must be in YYYY-MM-DD format`);
      }

      const endDate = (row['End date'] || '').toString();
      if (endDate && !isValidDate(endDate)) {
        errors.push(`Row ${rowNum}: End date must be in YYYY-MM-DD format`);
      }

      const budget = (row['Budget'] || '').toString();
      if (budget && isNaN(parseFloat(budget))) {
        errors.push(`Row ${rowNum}: Budget must be a number`);
      }
    }

    // Ad Group validation
    if (rowTypeUpper === 'AD GROUP' || rowTypeUpper === 'ADGROUP') {
      const campaignName = (row['Campaign'] || '').toString().trim();
      const adGroupName = (row['Ad group'] || '').toString().trim();

      if (!campaignName) {
        errors.push(`Row ${rowNum}: Campaign name is required for Ad Group`);
      }
      if (!adGroupName) {
        errors.push(`Row ${rowNum}: Ad Group name is required`);
      } else {
        if (!adGroupMap.has(campaignName)) {
          adGroupMap.set(campaignName, new Set());
        }
        adGroupMap.get(campaignName)!.add(adGroupName);
      }

      const maxCPC = (row['Max CPC'] || '').toString();
      if (maxCPC && isNaN(parseFloat(maxCPC))) {
        errors.push(`Row ${rowNum}: Max CPC must be a number`);
      }
    }

    // Keyword validation
    if (rowTypeUpper === 'KEYWORD') {
      const campaignName = (row['Campaign'] || '').toString().trim();
      const adGroupName = (row['Ad group'] || '').toString().trim();
      const keyword = (row['Keyword'] || '').toString().trim();
      const matchType = (row['Criterion Type'] || '').toString();

      if (!campaignName) {
        errors.push(`Row ${rowNum}: Campaign name is required for Keyword`);
      }
      if (!adGroupName) {
        errors.push(`Row ${rowNum}: Ad Group name is required for Keyword`);
      }
      if (!keyword) {
        errors.push(`Row ${rowNum}: Keyword text is required`);
      }

      const validMatchTypes = ['Broad', 'Phrase', 'Exact'];
      const normalizedMatchType = matchType.charAt(0).toUpperCase() + matchType.slice(1).toLowerCase();
      if (matchType && !validMatchTypes.includes(normalizedMatchType)) {
        errors.push(`Row ${rowNum}: Invalid Criterion Type "${matchType}". Expected: "Broad", "Phrase", or "Exact"`);
      }

      const maxCPC = (row['Max CPC'] || '').toString();
      if (maxCPC && isNaN(parseFloat(maxCPC))) {
        errors.push(`Row ${rowNum}: Max CPC must be a number`);
      }

      const finalURL = (row['Final URL'] || '').toString();
      if (finalURL && !isValidURL(finalURL)) {
        errors.push(`Row ${rowNum}: Keyword Final URL must be a valid URL`);
      }
    }

    // Ad validation - check for 'Responsive search ad' type
    if (rowTypeUpper === 'RESPONSIVE SEARCH AD' || rowTypeUpper === 'AD') {
      const campaignName = (row['Campaign'] || '').toString().trim();
      const adGroupName = (row['Ad group'] || '').toString().trim();
      const adType = (row['Ad Type'] || '').toString().toUpperCase();
      const finalURL = (row['Final URL'] || '').toString();

      if (!campaignName) {
        errors.push(`Row ${rowNum}: Campaign name is required for Ad`);
      }
      if (!adGroupName) {
        errors.push(`Row ${rowNum}: Ad Group name is required for Ad`);
      }

      if (!finalURL) {
        errors.push(`Row ${rowNum}: Final URL is required for Responsive search ad`);
      } else if (!isValidURL(finalURL)) {
        errors.push(`Row ${rowNum}: Final URL must be a valid URL (https://)`);
      } else if (!finalURL.startsWith('https://')) {
        errors.push(`Row ${rowNum}: Final URL must start with https://`);
      }

      // Validate headlines for RSA (Responsive search ad)
      if (rowTypeUpper === 'RESPONSIVE SEARCH AD') {
        // Check for non-empty headlines (at least 3 required)
        const headlines = [
          row['Headline 1'], row['Headline 2'], row['Headline 3'],
          row['Headline 4'], row['Headline 5'], row['Headline 6'],
          row['Headline 7'], row['Headline 8'], row['Headline 9'],
          row['Headline 10'], row['Headline 11'], row['Headline 12'],
          row['Headline 13'], row['Headline 14'], row['Headline 15'],
        ].filter(h => h && h.toString().trim().length > 0);

        if (headlines.length < 3) {
          // This should not happen if defaults are set, but log for debugging
          console.warn(`Row ${rowNum}: RSA ad has only ${headlines.length} headlines. Headlines:`, {
            h1: row['Headline 1'],
            h2: row['Headline 2'],
            h3: row['Headline 3']
          });
          errors.push(`Row ${rowNum}: Responsive Search Ads require at least 3 headlines (found ${headlines.length})`);
        }

        // Check headline length
        for (let i = 1; i <= 15; i++) {
          const headline = (row[`Headline ${i}`] || '').toString();
          if (headline && headline.length > 30) {
            errors.push(`Row ${rowNum}: Headline ${i} exceeds 30 characters (${headline.length} chars)`);
          }
        }

        // Validate descriptions
        const descriptions = [
          row['Description 1'], row['Description 2'], row['Description 3'], row['Description 4'],
        ].filter(d => d && d.toString().trim());

        if (descriptions.length < 2) {
          errors.push(`Row ${rowNum}: Responsive Search Ads require at least 2 descriptions`);
        }

        // Check description length
        for (let i = 1; i <= 4; i++) {
          const description = (row[`Description ${i}`] || '').toString();
          if (description && description.length > 90) {
            errors.push(`Row ${rowNum}: Description ${i} exceeds 90 characters (${description.length} chars)`);
          }
        }
      }
    }

    // Negative Keyword validation
    if (rowTypeUpper === 'NEGATIVE KEYWORD') {
      const campaignName = (row['Campaign'] || '').toString().trim();
      const negativeKeyword = (row['Keyword'] || '').toString().trim();
      const matchType = (row['Criterion Type'] || '').toString().trim();

      if (!campaignName) {
        errors.push(`Row ${rowNum}: Campaign name is required for Negative Keyword`);
      }
      if (!negativeKeyword) {
        errors.push(`Row ${rowNum}: Negative Keyword text is required`);
      }

      // Accept both formats: "Negative Broad" (with spaces) and "NEGATIVE_BROAD" (with underscores)
      const validMatchTypes = [
        'Negative Broad', 'Negative Phrase', 'Negative Exact',  // Google Ads Editor format (with spaces)
        'NEGATIVE_BROAD', 'NEGATIVE_PHRASE', 'NEGATIVE_EXACT', // Internal format (with underscores)
        'NEGATIVE BROAD', 'NEGATIVE PHRASE', 'NEGATIVE EXACT'  // Alternative format
      ];
      const normalizedMatchType = matchType.replace(/_/g, ' '); // Normalize underscores to spaces for comparison
      if (matchType && !validMatchTypes.some(valid => valid.replace(/_/g, ' ') === normalizedMatchType)) {
        errors.push(`Row ${rowNum}: Invalid Criterion Type for Negative Keyword "${matchType}". Expected: "Negative Broad", "Negative Phrase", or "Negative Exact"`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rows,
  };
}

/**
 * Export campaign structure to CSV file with validation
 */
export async function exportCampaignToGoogleAdsEditorCSV(
  structure: CampaignStructure,
  filename: string = 'google_ads_export.csv'
): Promise<CSVValidationResult> {
  // Convert structure to CSV rows
  const rows = campaignStructureToCSVRows(structure);

  // Validate rows
  const validation = validateCSVRows(rows);

  if (!validation.isValid) {
    throw new Error(`CSV validation failed:\n${validation.errors.join('\n')}`);
  }

  // Generate CSV content using PapaParse
  const csv = Papa.unparse(rows, {
    columns: GOOGLE_ADS_EDITOR_HEADERS,
    header: true,
    newline: '\r\n', // CRLF line endings for Google Ads Editor compatibility
  });

  // Add UTF-8 BOM for Google Ads Editor compatibility
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return validation;
}

/**
 * Export keywords to CSV (for Keyword Mixer, Keyword Planner)
 */
export function exportKeywordsToCSV(
  keywords: Array<string | { keyword: string; matchType?: string; maxCPC?: number }>,
  campaignName: string = 'Keyword Campaign',
  adGroupName: string = 'All Keywords',
  filename: string = 'keywords_export.csv'
): CSVValidationResult {
  const rows: CSVRow[] = [];

  // Campaign row
  const campaignRow = createEmptyCSVRow();
  campaignRow['Row Type'] = 'Campaign';
  campaignRow['Action'] = 'Add';
  campaignRow['Campaign'] = campaignName;
  campaignRow['Campaign status'] = 'Enabled';
  campaignRow['Campaign type'] = 'Search';
  campaignRow['Budget'] = '100';
  campaignRow['Networks'] = 'Google search';
  campaignRow['EU political ads'] = 'No';
  campaignRow['Desktop Bid adj.'] = '-100%';
  campaignRow['Mobile Bid adj.'] = '0%';
  campaignRow['Tablet Bid adj.'] = '-100%';
  rows.push(campaignRow);

  // Ad Group row
  const adGroupRow = createEmptyCSVRow();
  adGroupRow['Row Type'] = 'Ad group';
  adGroupRow['Action'] = 'Add';
  adGroupRow['Campaign'] = campaignName;
  adGroupRow['Ad group'] = adGroupName;
  adGroupRow['Ad group status'] = 'Enabled';
  adGroupRow['Max CPC'] = '1.00';
  rows.push(adGroupRow);

  // Keyword rows
  keywords.forEach((keyword) => {
    const keywordText = typeof keyword === 'string' ? keyword : keyword.keyword || '';
    const matchType = typeof keyword === 'string' ? getMatchType(keywordText) : (keyword.matchType || getMatchType(keywordText));
    const cleanedKeyword = cleanKeywordText(keywordText);
    const csvMatchType = formatMatchTypeForCSV(matchType, false);

    const keywordRow = createEmptyCSVRow();
    keywordRow['Row Type'] = 'Keyword';
    keywordRow['Action'] = 'Add';
    keywordRow['Campaign'] = campaignName;
    keywordRow['Ad group'] = adGroupName;
    keywordRow['Keyword'] = cleanedKeyword;
    keywordRow['Criterion Type'] = csvMatchType;
    keywordRow['Max CPC'] = typeof keyword === 'object' && keyword.maxCPC ? keyword.maxCPC.toString() : '';
    rows.push(keywordRow);
  });

  // Validate
  const validation = validateCSVRows(rows);

  if (!validation.isValid) {
    throw new Error(`CSV validation failed:\n${validation.errors.join('\n')}`);
  }

  // Generate CSV with UTF-8 BOM and CRLF line endings
  const csv = Papa.unparse(rows, {
    columns: GOOGLE_ADS_EDITOR_HEADERS,
    header: true,
    newline: '\r\n', // CRLF line endings
  });
  
  // Add UTF-8 BOM for Google Ads Editor compatibility
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;

  // Download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return validation;
}

/**
 * Export negative keywords to CSV
 */
export function exportNegativeKeywordsToCSV(
  negativeKeywords: Array<string | { keyword: string; matchType?: string }>,
  campaignName: string = 'Negative Keywords Campaign',
  adGroupName: string = 'All Ad Groups',
  filename: string = 'negative_keywords_export.csv'
): CSVValidationResult {
  const rows: CSVRow[] = [];

  // Campaign row
  const campaignRow = createEmptyCSVRow();
  campaignRow['Row Type'] = 'Campaign';
  campaignRow['Action'] = 'Add';
  campaignRow['Campaign'] = campaignName;
  campaignRow['Campaign status'] = 'Enabled';
  campaignRow['Campaign type'] = 'Search';
  campaignRow['Budget'] = '100';
  campaignRow['Networks'] = 'Google search';
  campaignRow['EU political ads'] = 'No';
  campaignRow['Desktop Bid adj.'] = '-100%';
  campaignRow['Mobile Bid adj.'] = '0%';
  campaignRow['Tablet Bid adj.'] = '-100%';
  rows.push(campaignRow);

  // Ad Group row
  const adGroupRow = createEmptyCSVRow();
  adGroupRow['Row Type'] = 'Ad group';
  adGroupRow['Action'] = 'Add';
  adGroupRow['Campaign'] = campaignName;
  adGroupRow['Ad group'] = adGroupName;
  adGroupRow['Ad group status'] = 'Enabled';
  adGroupRow['Max CPC'] = '1.00';
  rows.push(adGroupRow);

  // Negative Keyword rows
  negativeKeywords.forEach((keyword) => {
    const keywordText = typeof keyword === 'string' ? keyword : keyword.keyword || '';
    const matchType = typeof keyword === 'string' ? getMatchType(keywordText) : (keyword.matchType || getMatchType(keywordText));
    const cleanedKeyword = cleanKeywordText(keywordText);

    const negativeRow = createEmptyCSVRow();
    negativeRow['Row Type'] = 'Negative keyword';
    negativeRow['Action'] = 'Add';
    negativeRow['Campaign'] = campaignName;
    negativeRow['Ad group'] = adGroupName;
    negativeRow['Keyword'] = cleanedKeyword;
    negativeRow['Criterion Type'] = formatMatchTypeForCSV(matchType, true);
    rows.push(negativeRow);
  });

  // Validate
  const validation = validateCSVRows(rows);

  if (!validation.isValid) {
    throw new Error(`CSV validation failed:\n${validation.errors.join('\n')}`);
  }

  // Generate CSV with UTF-8 BOM and CRLF line endings
  const csv = Papa.unparse(rows, {
    columns: GOOGLE_ADS_EDITOR_HEADERS,
    header: true,
    newline: '\r\n', // CRLF line endings
  });
  
  // Add UTF-8 BOM for Google Ads Editor compatibility
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csv;

  // Download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return validation;
}

