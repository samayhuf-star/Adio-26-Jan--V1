/**
 * Ad Validation Utilities
 * Ensures ads meet Google Ads requirements before CSV export
 * 
 * GUARDRAILS: Follows official Google Search Ads policies (RSA, DKI, Call-Only)
 * - RSA: 3-15 headlines (30 chars), 2-4 descriptions (90 chars)
 * - Call-Only: 2 headlines, 2 descriptions, 25 char business name
 * - DKI: Proper {KeyWord:Default} syntax validation
 */

import {
  CHARACTER_LIMITS,
  validateRSA,
  validateCallOnlyAd,
  validateDKISyntax,
  formatHeadline,
  formatDescription,
  ensureUniqueHeadlines,
  ensureUniqueDescriptions,
  areHeadlinesSimilar
} from './googleAdsRules';

export interface Ad {
  type?: 'rsa' | 'dki' | 'callonly';
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
  headlines?: string[];
  descriptions?: string[];
  [key: string]: any;
}

export interface ValidationReport {
  fixed: number;
  warnings: string[];
  errors: string[];
  details: Array<{
    adIndex: number;
    adType: string;
    fixes: string[];
    warnings: string[];
  }>;
}

/**
 * Strip quotation marks from ad text with enhanced DKI handling
 * Google Ads does not allow quotes in ad copy, especially around DKI syntax
 * Wrong: "{KeyWord:Adiology Service}" or 'Best {KeyWord:Service}'
 * Right: {KeyWord:Adiology Service} or Best {KeyWord:Service}
 */
export function stripQuotesFromAdText(text: string): string {
  if (!text) return '';
  
  // Remove double quotes from start and end
  let cleaned = text.replace(/^["]+|["]+$/g, '');
  
  // Remove single quotes from start and end
  cleaned = cleaned.replace(/^[']+|[']+$/g, '');
  
  // Remove quotes around DKI syntax specifically: "{KeyWord:...}" -> {KeyWord:...}
  cleaned = cleaned.replace(/"(\{(?:keyword|Keyword|KeyWord|KEYWord):[^}]+\})"/g, '$1');
  cleaned = cleaned.replace(/'(\{(?:keyword|Keyword|KeyWord|KEYWord):[^}]+\})'/g, '$1');
  
  // Remove quotes around entire phrases containing DKI
  cleaned = cleaned.replace(/"([^"]*\{(?:keyword|Keyword|KeyWord|KEYWord):[^}]+\}[^"]*)"/g, '$1');
  cleaned = cleaned.replace(/'([^']*\{(?:keyword|Keyword|KeyWord|KEYWord):[^}]+\}[^']*)'/g, '$1');
  
  // Remove any stray quotes that shouldn't be in ad text
  // But be careful to preserve apostrophes in words like "don't" or "we're"
  // Only remove quotes at word boundaries or that are clearly formatting
  cleaned = cleaned.replace(/^"+|"+$/g, ''); // Quotes at start/end
  cleaned = cleaned.replace(/\s"+|"+\s/g, ' '); // Quotes with spaces around them
  cleaned = cleaned.replace(/^'+|'+$/g, ''); // Single quotes at start/end
  
  // Remove quotes that are clearly not apostrophes (not between letters)
  cleaned = cleaned.replace(/(?<![a-zA-Z])['"](?![a-zA-Z])/g, '');
  
  return cleaned.trim();
}

/**
 * Default headlines for RSA ads (Google Ads requires minimum 3)
 */
const DEFAULT_HEADLINES = [
  'Professional Service',
  'Expert Solutions',
  'Quality Guaranteed'
];

/**
 * Default descriptions for RSA ads (Google Ads requires minimum 2)
 */
const DEFAULT_DESCRIPTIONS = [
  'Get professional service you can trust.',
  'Contact us today for expert assistance.'
];

/**
 * Ensures a Responsive Search Ad has at least 3 headlines
 * Adds default headlines if missing, respecting character limits (30 chars)
 */
export function ensureThreeHeadlines(ad: Ad): { ad: Ad; fixed: boolean; fixes: string[] } {
  const fixes: string[] = [];
  let fixed = false;

  // Extract headlines from array or individual fields
  const headlines: string[] = [];
  
  if (ad.headlines && Array.isArray(ad.headlines)) {
    // Use headlines array
    ad.headlines.forEach((h, idx) => {
      if (h && h.trim()) {
        headlines.push(h.trim().substring(0, 30));
      }
    });
  } else {
    // Use individual headline fields
    for (let i = 1; i <= 15; i++) {
      const headline = ad[`headline${i}`];
      if (headline && headline.trim()) {
        headlines.push(headline.trim().substring(0, 30));
      }
    }
  }

  // Ensure at least 3 headlines
  while (headlines.length < 3) {
    const defaultHeadline = DEFAULT_HEADLINES[headlines.length] || DEFAULT_HEADLINES[0];
    headlines.push(defaultHeadline);
    fixes.push(`Added default headline ${headlines.length}: "${defaultHeadline}"`);
    fixed = true;
  }

  // Update ad with normalized headlines
  if (ad.headlines && Array.isArray(ad.headlines)) {
    ad.headlines = headlines;
  } else {
    // Update individual headline fields
    headlines.forEach((headline, idx) => {
      if (idx < 15) {
        ad[`headline${idx + 1}`] = headline;
      }
    });
  }

  return { ad, fixed, fixes };
}

/**
 * Ensures a Responsive Search Ad has at least 2 descriptions
 * Adds default descriptions if missing, respecting character limits (90 chars)
 */
export function ensureTwoDescriptions(ad: Ad): { ad: Ad; fixed: boolean; fixes: string[] } {
  const fixes: string[] = [];
  let fixed = false;

  // Extract descriptions from array or individual fields
  const descriptions: string[] = [];
  
  if (ad.descriptions && Array.isArray(ad.descriptions)) {
    // Use descriptions array
    ad.descriptions.forEach((d, idx) => {
      if (d && d.trim()) {
        descriptions.push(d.trim().substring(0, 90));
      }
    });
  } else {
    // Use individual description fields
    for (let i = 1; i <= 4; i++) {
      const description = ad[`description${i}`];
      if (description && description.trim()) {
        descriptions.push(description.trim().substring(0, 90));
      }
    }
  }

  // Ensure at least 2 descriptions
  while (descriptions.length < 2) {
    const defaultDescription = DEFAULT_DESCRIPTIONS[descriptions.length] || DEFAULT_DESCRIPTIONS[0];
    descriptions.push(defaultDescription);
    fixes.push(`Added default description ${descriptions.length}: "${defaultDescription}"`);
    fixed = true;
  }

  // Update ad with normalized descriptions
  if (ad.descriptions && Array.isArray(ad.descriptions)) {
    ad.descriptions = descriptions;
  } else {
    // Update individual description fields
    descriptions.forEach((description, idx) => {
      if (idx < 4) {
        ad[`description${idx + 1}`] = description;
      }
    });
  }

  return { ad, fixed, fixes };
}

/**
 * Remove square brackets from ad text - they should NOT appear in Google Ads
 * Square brackets are only for keyword match types, not ad copy
 */
function removeSquareBrackets(text: string): string {
  if (!text) return '';
  // Remove square brackets and their content that looks like match type formatting
  // Also remove orphan brackets like "[keyword" or "keyword]"
  return text
    .replace(/\[([^\]]*)\]/g, '$1')  // Remove complete [text] and keep text inside
    .replace(/\[([^\]]*)/g, '$1')     // Remove orphan opening brackets [text
    .replace(/([^\[]*)\]/g, '$1')     // Remove orphan closing brackets text]
    .trim();
}

/**
 * Validates and fixes an ad to meet Google Ads requirements
 * Returns the fixed ad and a report of what was changed
 */
export function validateAndFixAd(ad: Ad, adIndex: number = 0): { ad: Ad; report: ValidationReport['details'][0] } {
  const report: ValidationReport['details'][0] = {
    adIndex,
    adType: ad.type || 'unknown',
    fixes: [],
    warnings: []
  };

  // CRITICAL: Remove square brackets and quotation marks from all ad text fields
  // Square brackets are for keyword match types, not ad copy
  // Quotation marks are not allowed in Google Ads, especially around DKI syntax
  for (let i = 1; i <= 15; i++) {
    const headline = ad[`headline${i}`];
    if (headline) {
      let cleaned = headline;
      if (headline.includes('[') || headline.includes(']')) {
        cleaned = removeSquareBrackets(cleaned);
        report.fixes.push(`Removed brackets from headline ${i}`);
      }
      if (headline.includes('"') || headline.includes("'")) {
        cleaned = stripQuotesFromAdText(cleaned);
        report.fixes.push(`Removed quotes from headline ${i}`);
      }
      ad[`headline${i}`] = cleaned;
    }
  }
  for (let i = 1; i <= 4; i++) {
    const description = ad[`description${i}`];
    if (description) {
      let cleaned = description;
      if (description.includes('[') || description.includes(']')) {
        cleaned = removeSquareBrackets(cleaned);
        report.fixes.push(`Removed brackets from description ${i}`);
      }
      if (description.includes('"') || description.includes("'")) {
        cleaned = stripQuotesFromAdText(cleaned);
        report.fixes.push(`Removed quotes from description ${i}`);
      }
      ad[`description${i}`] = cleaned;
    }
  }
  // Also clean headlines/descriptions arrays
  if (ad.headlines && Array.isArray(ad.headlines)) {
    ad.headlines = ad.headlines.map((h: string) => stripQuotesFromAdText(removeSquareBrackets(h)));
  }
  if (ad.descriptions && Array.isArray(ad.descriptions)) {
    ad.descriptions = ad.descriptions.map((d: string) => stripQuotesFromAdText(removeSquareBrackets(d)));
  }

  // Validate headline lengths
  for (let i = 1; i <= 15; i++) {
    const headline = ad[`headline${i}`];
    if (headline && headline.length > 30) {
      const original = headline;
      ad[`headline${i}`] = headline.substring(0, 30).trim();
      report.fixes.push(`Truncated headline ${i} from ${original.length} to 30 characters`);
    }
  }

  // Validate description lengths
  for (let i = 1; i <= 4; i++) {
    const description = ad[`description${i}`];
    if (description && description.length > 90) {
      const original = description;
      ad[`description${i}`] = description.substring(0, 90).trim();
      report.fixes.push(`Truncated description ${i} from ${original.length} to 90 characters`);
    }
  }

  // Validate path lengths
  if (ad.path1 && ad.path1.length > 15) {
    const original = ad.path1;
    ad.path1 = ad.path1.substring(0, 15).trim();
    report.fixes.push(`Truncated path1 from ${original.length} to 15 characters`);
  }
  if (ad.path2 && ad.path2.length > 15) {
    const original = ad.path2;
    ad.path2 = ad.path2.substring(0, 15).trim();
    report.fixes.push(`Truncated path2 from ${original.length} to 15 characters`);
  }

  // For RSA ads, ensure minimum headlines and descriptions
  if (ad.type === 'rsa' || (!ad.type && (ad.headline1 || ad.headlines))) {
    const headlineResult = ensureThreeHeadlines(ad);
    if (headlineResult.fixed) {
      report.fixes.push(...headlineResult.fixes);
    }

    const descriptionResult = ensureTwoDescriptions(ad);
    if (descriptionResult.fixed) {
      report.fixes.push(...descriptionResult.fixes);
    }
  }

  // Validate final URL
  if (ad.final_url || ad.finalUrl) {
    const url = ad.final_url || ad.finalUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      ad.final_url = `https://${url}`;
      ad.finalUrl = `https://${url}`;
      report.fixes.push(`Added https:// prefix to final URL`);
    }
  } else {
    report.warnings.push('Missing final URL - will use default');
  }

  return { ad, report };
}

/**
 * Validates and fixes an array of ads
 * Returns fixed ads and a comprehensive report
 */
export function validateAndFixAds(ads: Ad[]): { ads: Ad[]; report: ValidationReport } {
  const report: ValidationReport = {
    fixed: 0,
    warnings: [],
    errors: [],
    details: []
  };

  const fixedAds = ads.map((ad, index) => {
    const { ad: fixedAd, report: adReport } = validateAndFixAd(ad, index);
    
    if (adReport.fixes.length > 0) {
      report.fixed++;
    }
    
    if (adReport.warnings.length > 0) {
      report.warnings.push(`Ad ${index + 1}: ${adReport.warnings.join(', ')}`);
    }

    report.details.push(adReport);
    
    return fixedAd;
  });

  return { ads: fixedAds, report };
}

/**
 * Formats validation report for display
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  
  if (report.fixed > 0) {
    lines.push(`✅ Auto-fixed ${report.fixed} ad(s)`);
  }
  
  if (report.warnings.length > 0) {
    lines.push(`⚠️ ${report.warnings.length} warning(s):`);
    report.warnings.forEach(w => lines.push(`  - ${w}`));
  }
  
  if (report.errors.length > 0) {
    lines.push(`❌ ${report.errors.length} error(s):`);
    report.errors.forEach(e => lines.push(`  - ${e}`));
  }

  if (report.details.length > 0) {
    lines.push('\nDetails:');
    report.details.forEach((detail, idx) => {
      if (detail.fixes.length > 0 || detail.warnings.length > 0) {
        lines.push(`  Ad ${idx + 1} (${detail.adType}):`);
        detail.fixes.forEach(f => lines.push(`    ✅ ${f}`));
        detail.warnings.forEach(w => lines.push(`    ⚠️ ${w}`));
      }
    });
  }

  return lines.join('\n');
}
