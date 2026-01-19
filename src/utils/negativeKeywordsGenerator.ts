/**
 * Negative Keywords Generator - Production-Ready Implementation
 * 
 * Features:
 * - AI-powered generation (500-2500 keywords)
 * - Comprehensive categorization schema
 * - Quality controls (dedupe, profanity, brand handling)
 * - Multiple export formats (Exact/Phrase/Broad)
 * - Google Ads Editor-ready CSV export
 */

// ============================================================================
// CATEGORIZATION SCHEMA
// ============================================================================

export const NEGATIVE_KEYWORD_CATEGORIES = {
  'Intent-Mismatch': {
    label: 'Intent Mismatch',
    description: 'Searcher intent differs from purchase intent',
    subcategories: ['Tutorial', 'HowTo', 'Research', 'Information', 'Definition', 'Explanation'],
    color: 'red'
  },
  'Low-Value': {
    label: 'Low Value',
    description: 'Free, cheap, bargain searches when unwanted',
    subcategories: ['Free', 'Discount', 'Coupon', 'Bargain', 'Cheap', 'Sale'],
    color: 'orange'
  },
  'Irrelevant-Product': {
    label: 'Irrelevant Product',
    description: 'Similar terms but different product/service',
    subcategories: ['Similar-Term', 'Wrong-Product', 'Different-Service'],
    color: 'yellow'
  },
  'Competitor': {
    label: 'Competitor',
    description: 'Competitor brand searches (optional)',
    subcategories: ['Brand', 'Model', 'Alternative'],
    color: 'purple'
  },
  'Location-Irrelevant': {
    label: 'Location Irrelevant',
    description: 'Wrong location searches',
    subcategories: ['Wrong-Country', 'Wrong-City', 'Wrong-Region'],
    color: 'blue'
  },
  'Service-Mismatch': {
    label: 'Service Mismatch',
    description: 'User seeks service you don\'t provide',
    subcategories: ['Repair', 'Rental', 'Used', 'Second-Hand', 'Refurbished'],
    color: 'indigo'
  },
  'Job/DIY': {
    label: 'Job/DIY',
    description: 'Employment or DIY-related searches',
    subcategories: ['Jobs', 'Career', 'Hiring', 'DIY', 'How-To-Make', 'Tutorial'],
    color: 'pink'
  },
  'Support/Help': {
    label: 'Support/Help',
    description: 'Customer support or help requests',
    subcategories: ['Support', 'Customer-Service', 'Manual', 'Help', 'FAQ'],
    color: 'teal'
  },
  'Educational': {
    label: 'Educational',
    description: 'Educational or training-related searches',
    subcategories: ['Course', 'Certificate', 'Training', 'Learn', 'Study'],
    color: 'cyan'
  },
  'Price-Comparison': {
    label: 'Price Comparison',
    description: 'Comparison or vs searches',
    subcategories: ['VS', 'Compare', 'Comparison', 'Alternative', 'Best'],
    color: 'amber'
  },
  'Other': {
    label: 'Other',
    description: 'Other negative keywords',
    subcategories: [],
    color: 'gray'
  }
} as const;

export type NegativeKeywordCategory = keyof typeof NEGATIVE_KEYWORD_CATEGORIES;

export interface NegativeKeyword {
  keyword: string;
  category: NegativeKeywordCategory;
  subcategory?: string;
  reason: string;
  matchType: 'exact' | 'phrase' | 'broad';
}

// ============================================================================
// PRODUCTION-READY AI PROMPTS
// ============================================================================

export const SYSTEM_PROMPT = `You are an expert Google Ads negative keyword generator. Your task is to generate comprehensive, high-quality negative keywords that help advertisers avoid irrelevant traffic and improve campaign performance.

CRITICAL REQUIREMENTS:
1. Generate 500-2500 unique negative keywords per request
2. Categorize each keyword using the provided schema
3. Provide clear exclusion reasons
4. Ensure keywords are relevant to the advertiser's business
5. Avoid profanity and inappropriate content
6. Handle brand names carefully (exclude competitor brands if requested)
7. Consider common misspellings and variations
8. Focus on high-intent mismatches that waste ad spend

OUTPUT FORMAT:
Return a JSON array of objects with this structure:
[
  {
    "keyword": "example keyword",
    "category": "Intent-Mismatch",
    "subcategory": "Tutorial",
    "reason": "Clear explanation of why this should be excluded",
    "matchType": "exact"
  }
]

CATEGORIZATION GUIDELINES:
- Intent-Mismatch: "how to", "tutorial", "what is", "definition"
- Low-Value: "free", "cheap", "discount", "coupon" (when unwanted)
- Irrelevant-Product: Similar terms but different product/service
- Competitor: Competitor brand names (only if explicitly requested)
- Location-Irrelevant: Wrong location searches
- Service-Mismatch: Services not provided (repair, rental, used)
- Job/DIY: Employment or DIY-related searches
- Support/Help: Customer support queries
- Educational: Training, courses, certificates
- Price-Comparison: "vs", "compare", "alternative"
- Other: Everything else

MATCH TYPE GUIDELINES:
- Use "exact" for most keywords (default)
- Use "phrase" for multi-word phrases that should exclude variations
- Use "broad" sparingly, only for very general terms`;

export function buildUserPrompt(params: {
  url: string;
  coreKeywords: string;
  userGoal: string;
  count: number;
  excludeCompetitors?: boolean;
  competitorBrands?: string[];
  targetLocation?: string;
  excludeCategories?: NegativeKeywordCategory[];
}): string {
  const {
    url,
    coreKeywords,
    userGoal,
    count,
    excludeCompetitors = false,
    competitorBrands = [],
    targetLocation,
    excludeCategories = []
  } = params;

  let prompt = `Generate ${count} negative keywords for a Google Ads campaign.

ADVERTISER CONTEXT:
- Website URL: ${url}
- Core Keywords: ${coreKeywords}
- Campaign Goal: ${userGoal}
${targetLocation ? `- Target Location: ${targetLocation}` : ''}

GENERATION REQUIREMENTS:
1. Generate ${count} unique negative keywords
2. Focus on keywords that indicate:
   - Non-purchase intent (how-to, tutorials, information)
   - Low-value searches (free, cheap, discount when unwanted)
   - Wrong product/service type
   - Wrong location (if target location specified)
   - Job seekers and employment-related searches
   - DIY and educational content seekers
   - Customer support queries
   - Price comparison shoppers

${excludeCompetitors && competitorBrands.length > 0 ? `
COMPETITOR EXCLUSION:
- Exclude these competitor brands: ${competitorBrands.join(', ')}
- Add variations and common misspellings of competitor names
` : ''}

${excludeCategories.length > 0 ? `
EXCLUDE THESE CATEGORIES:
- ${excludeCategories.join(', ')}
` : ''}

EXPANSION STRATEGIES:
1. Synonyms and variations of core exclusion terms
2. Common misspellings and typos
3. Related terms that indicate wrong intent
4. Location-specific variations (if applicable)
5. Industry-specific irrelevant terms
6. Common question formats ("how to", "what is", "where to")
7. Free/cheap variations when unwanted
8. Job/career related terms
9. DIY and tutorial terms
10. Support and help queries

QUALITY CONTROLS:
- Ensure all keywords are unique
- Avoid profanity and inappropriate content
- Use proper categorization
- Provide clear exclusion reasons
- Consider match type appropriateness

Return the results as a JSON array matching the specified format.`;

  return prompt;
}

// ============================================================================
// QUALITY CONTROLS
// ============================================================================

const PROFANITY_FILTER = [
  // Add common profanity terms here (filtered for this example)
  'damn', 'hell' // Example - expand as needed
];

const COMMON_MISSPELLINGS: Record<string, string[]> = {
  'free': ['fre', 'freee', 'f ree'],
  'cheap': ['cheep', 'cheapy', 'cheep'],
  'discount': ['discout', 'discoun', 'discoutn'],
  'job': ['jobb', 'jobbs', 'j ob'],
  'career': ['carreer', 'careeer', 'career'],
};

export function deduplicateKeywords(keywords: NegativeKeyword[]): NegativeKeyword[] {
  const seen = new Set<string>();
  const deduplicated: NegativeKeyword[] = [];

  for (const kw of keywords) {
    const normalized = kw.keyword.toLowerCase().trim();
    if (!seen.has(normalized) && normalized.length > 0) {
      seen.add(normalized);
      deduplicated.push(kw);
    }
  }

  return deduplicated;
}

export function filterProfanity(keywords: NegativeKeyword[]): NegativeKeyword[] {
  return keywords.filter(kw => {
    const lower = kw.keyword.toLowerCase();
    return !PROFANITY_FILTER.some(profanity => lower.includes(profanity));
  });
}

export function addMisspellings(keywords: NegativeKeyword[]): NegativeKeyword[] {
  const expanded: NegativeKeyword[] = [...keywords];

  keywords.forEach(kw => {
    const lower = kw.keyword.toLowerCase();
    Object.entries(COMMON_MISSPELLINGS).forEach(([correct, misspellings]) => {
      if (lower.includes(correct)) {
        misspellings.forEach(misspelling => {
          const newKeyword = kw.keyword.replace(
            new RegExp(correct, 'gi'),
            misspelling
          );
          if (newKeyword !== kw.keyword) {
            expanded.push({
              ...kw,
              keyword: newKeyword,
              reason: `${kw.reason} (common misspelling)`
            });
          }
        });
      }
    });
  });

  return deduplicateKeywords(expanded);
}

export function handleBrandNames(
  keywords: NegativeKeyword[],
  excludeBrands: string[],
  includeOwnBrand: boolean = false
): NegativeKeyword[] {
  if (excludeBrands.length === 0) return keywords;

  const brandKeywords: NegativeKeyword[] = [];

  excludeBrands.forEach(brand => {
    // Add brand name variations
    brandKeywords.push({
      keyword: brand.toLowerCase(),
      category: 'Competitor',
      subcategory: 'Brand',
      reason: `Excludes competitor brand: ${brand}`,
      matchType: 'exact'
    });

    // Add common variations
    const variations = [
      `${brand} alternative`,
      `${brand} vs`,
      `compare ${brand}`,
      `${brand} review`,
      `${brand} competitor`
    ];

    variations.forEach(variation => {
      brandKeywords.push({
        keyword: variation.toLowerCase(),
        category: 'Competitor',
        subcategory: 'Brand',
        reason: `Excludes competitor comparison searches`,
        matchType: 'phrase'
      });
    });
  });

  return deduplicateKeywords([...keywords, ...brandKeywords]);
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export function formatKeywordForMatchType(
  keyword: string,
  matchType: 'exact' | 'phrase' | 'broad'
): string {
  const clean = keyword.trim();
  
  switch (matchType) {
    case 'exact':
      return `[${clean}]`;
    case 'phrase':
      return `"${clean}"`;
    case 'broad':
      return clean;
    default:
      return `[${clean}]`;
  }
}

export function exportToCSV(
  keywords: NegativeKeyword[],
  format: 'exact' | 'phrase' | 'broad' | 'all' = 'all'
): string {
  const headers = ['Keyword', 'Match Type', 'Category', 'Subcategory', 'Reason'];
  const rows: string[][] = [headers];

  keywords.forEach(kw => {
    if (format === 'all') {
      // Export all three match types
      ['exact', 'phrase', 'broad'].forEach(mt => {
        const formattedKeyword = formatKeywordForMatchType(kw.keyword, mt as any);
        rows.push([
          formattedKeyword,
          mt.charAt(0).toUpperCase() + mt.slice(1),
          NEGATIVE_KEYWORD_CATEGORIES[kw.category].label,
          kw.subcategory || '',
          kw.reason
        ]);
      });
    } else {
      // Export single match type
      const formattedKeyword = formatKeywordForMatchType(kw.keyword, format);
      rows.push([
        formattedKeyword,
        format.charAt(0).toUpperCase() + format.slice(1),
        NEGATIVE_KEYWORD_CATEGORIES[kw.category].label,
        kw.subcategory || '',
        kw.reason
      ]);
    }
  });

  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => {
      // Escape commas and quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
}

export function exportToGoogleAdsEditorCSV(
  keywords: NegativeKeyword[],
  campaignName: string,
  adGroupName: string = 'All Ad Groups'
): string {
  const headers = [
    'Campaign',
    'Campaign Type',
    'Ad Group',
    'Row Type',
    'Status',
    'Keyword',
    'Match Type',
    'Final URL',
    'Negative Keyword'
  ];

  const rows: string[][] = [headers];

  keywords.forEach(kw => {
    const formattedKeyword = formatKeywordForMatchType(kw.keyword, kw.matchType);
    
    rows.push([
      campaignName,
      'Search',
      adGroupName,
      'Keyword',
      'Active',
      formattedKeyword.replace(/[\[\]"]/g, ''), // Clean keyword for Keyword column
      kw.matchType.charAt(0).toUpperCase() + kw.matchType.slice(1),
      '',
      'Yes'
    ]);
  });

  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\r\n'); // Windows line endings for Google Ads Editor
}

// ============================================================================
// SAMPLE OUTPUT VALIDATOR
// ============================================================================

export function validateKeywordFormat(keyword: string): boolean {
  // Check if keyword is properly formatted
  const trimmed = keyword.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 100) return false; // Google Ads limit
  
  // Check for proper match type formatting
  const exactMatch = /^\[.+\]$/;
  const phraseMatch = /^".+"$/;
  const broadMatch = /^[^\[\]"]+$/;
  
  return exactMatch.test(trimmed) || phraseMatch.test(trimmed) || broadMatch.test(trimmed);
}

export function getCategoryStats(keywords: NegativeKeyword[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  keywords.forEach(kw => {
    const category = NEGATIVE_KEYWORD_CATEGORIES[kw.category].label;
    stats[category] = (stats[category] || 0) + 1;
  });
  
  return stats;
}

