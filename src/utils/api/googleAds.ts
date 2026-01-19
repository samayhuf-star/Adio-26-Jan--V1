import { captureError } from '../errorTracking';

// Google Ads API Configuration
const GOOGLE_ADS_API_TOKEN = 'UzifgEs9SwOBo5bP_vmi2A';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v16/customers';
const AI_API_KEY = 'AIzaSyBYyBnc99JTLGvUY3qdGFksUlf7roGUdao';
// Use gemini-1.5-flash (gemini-pro is deprecated)
const AI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface KeywordGenerationRequest {
  seedKeywords: string[];
  location?: string;
  language?: string;
  maxResults?: number;
  negativeKeywords?: string[];
}

interface KeywordResult {
  keyword: string;
  matchType?: 'broad' | 'phrase' | 'exact';
  competition?: 'low' | 'medium' | 'high';
  avgMonthlySearches?: number;
  competitionIndex?: number;
}

interface GoogleAdsKeywordResponse {
  results: Array<{
    text: string;
    keywordIdeaMetrics?: {
      avgMonthlySearches?: string;
      competition?: string;
      competitionIndex?: string;
    };
  }>;
}

/**
 * Generate keywords using Google Ads API
 * Falls back to AI if Google Ads API is unavailable
 * Returns format compatible with existing components: { keywords: [{ text, id, ... }] }
 */
export async function generateKeywords(
  request: KeywordGenerationRequest
): Promise<{ keywords: Array<{ text: string; id: string; [key: string]: any }> }> {
  const {
    seedKeywords,
    location = '2840', // United States location code
    language = '1000', // English language code
    maxResults = 300,
    negativeKeywords = []
  } = request;

  // Try Google Ads API first (will immediately throw due to CORS)
  try {
    const keywords = await generateKeywordsFromGoogleAds({
      seedKeywords,
      location,
      language,
      maxResults,
      negativeKeywords
    });
    
    if (keywords && keywords.length > 0) {
      // Transform to component-compatible format
      return {
        keywords: keywords.map((kw, index) => ({
          text: kw.keyword,
          id: `kw-${Date.now()}-${index}`,
          keyword: kw.keyword,
          matchType: kw.matchType || 'broad',
          competition: kw.competition,
          avgMonthlySearches: kw.avgMonthlySearches,
          competitionIndex: kw.competitionIndex
        }))
      };
    }
  } catch (error) {
    // Silently fall back to AI (expected due to CORS restrictions)
    // Don't log or capture expected CORS errors
  }

  // Fallback to AI
  try {
    const keywords = await generateKeywordsFromAI({
      seedKeywords,
      maxResults,
      negativeKeywords
    });
    
    // Transform to component-compatible format
    return {
      keywords: keywords.map((kw, index) => ({
        text: kw.keyword,
        id: `kw-${Date.now()}-${index}`,
        keyword: kw.keyword,
        matchType: kw.matchType || 'broad'
      }))
    };
  } catch (error) {
    captureError(error instanceof Error ? error : new Error('AI fallback error'), {
      module: 'googleAds',
      action: 'generateKeywords',
      metadata: { seedKeywords }
    });
    
    // Final fallback: use autocomplete-based keyword generator
    const { generateKeywords: generateAutocompleteKeywords } = require('../keywordGenerator');
    const autocompleteKeywords = generateAutocompleteKeywords({
      seedKeywords: seedKeywords.join('\n'),
      negativeKeywords: negativeKeywords.join('\n'),
      maxKeywords: maxResults,
      minKeywords: Math.min(300, maxResults)
    });
    
    return {
      keywords: autocompleteKeywords.map((kw, index) => ({
        text: kw.text,
        id: kw.id || `kw-${Date.now()}-${index}`,
        keyword: kw.text,
        matchType: (kw.matchType || 'broad').toLowerCase(),
        volume: kw.volume,
        cpc: kw.cpc,
        type: kw.type
      }))
    };
  }
}

/**
 * Generate keywords using Google Ads Keyword Planner API
 * Note: Direct browser calls to Google Ads API are blocked by CORS
 * This function immediately throws to trigger AI fallback
 * In production, Google Ads API calls should be made from a backend server
 */
async function generateKeywordsFromGoogleAds(
  request: KeywordGenerationRequest & { location: string; language: string }
): Promise<KeywordResult[]> {
  // Google Ads API cannot be called directly from browser due to CORS restrictions
  // Always throw to use AI fallback instead
  // TODO: Implement backend endpoint for Google Ads API if needed
  throw new Error('Google Ads API requires backend proxy - using AI fallback');
}

/**
 * Generate keywords using Google Gemini AI as fallback
 */
async function generateKeywordsFromAI(
  request: Pick<KeywordGenerationRequest, 'seedKeywords' | 'maxResults' | 'negativeKeywords'>
): Promise<KeywordResult[]> {
  const { seedKeywords, maxResults = 300, negativeKeywords = [] } = request;
  
  const prompt = `Generate ${maxResults} highly relevant Google Ads keywords based on these seed keywords: ${seedKeywords.join(', ')}.

Requirements:
- Focus on commercial and conversion-intent keywords
- Include long-tail variations
- Include location-based variations (if applicable)
- Include question-based queries (how, what, where, when)
- Include comparison keywords (best, top, vs, compare)
- Include action keywords (buy, get, find, hire, book, order)
- Exclude these negative keywords: ${negativeKeywords.join(', ') || 'none'}
- Return only the keywords, one per line
- Do not include explanations or formatting`;

  try {
    const response = await fetch(`${AI_API_BASE}?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract keywords from AI response
    const keywordText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const keywords = keywordText
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Remove numbering, bullets, and empty lines
        const cleaned = line.replace(/^[\d\-\•\*\.]\s*/, '').trim();
        return cleaned.length > 0 && 
               !cleaned.toLowerCase().includes('keyword') &&
               !cleaned.toLowerCase().includes('example') &&
               !containsNegativeKeyword(cleaned, negativeKeywords);
      })
      .slice(0, maxResults)
      .map(keyword => ({
        keyword: keyword.replace(/^[\d\-\•\*\.]\s*/, '').trim(),
        matchType: 'broad' as const
      }));

    return keywords;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate basic keyword variations as final fallback
 * Uses template-based approach to ensure quality keywords
 */
function generateBasicKeywordVariations(
  seedKeywords: string[],
  maxResults: number,
  negativeKeywords: string[]
): KeywordResult[] {
  const keywords: KeywordResult[] = [];
  
  // Pre-modifiers (placed before seed)
  const preModifiers = [
    'best', 'top', 'affordable', 'professional', 'expert',
    'local', 'trusted', 'reliable', 'certified', 'licensed',
    '24/7', 'emergency', 'same day'
  ];
  
  // Post-modifiers (placed after seed)
  const postModifiers = [
    'near me', 'services', 'company', 'companies', 'contractor',
    'specialist', 'expert', 'repair', 'cost', 'prices', 'quote', 'estimate'
  ];
  
  // Question templates that work with both single and multi-word seeds
  const questionTemplates = [
    'how much does {seed} cost',
    '{seed} pricing guide',
    'where to get {seed}',
    'compare {seed} prices'
  ];

  for (const seed of seedKeywords) {
    if (containsNegativeKeyword(seed, negativeKeywords)) continue;
    
    // Add seed as-is if 2+ words
    if (seed.split(' ').length >= 2) {
      keywords.push({ keyword: seed, matchType: 'exact' });
    }
    
    // Add pre-modifier variations (e.g., "best plumber")
    for (const modifier of preModifiers) {
      if (keywords.length >= maxResults) break;
      const variation = `${modifier} ${seed}`;
      if (!containsNegativeKeyword(variation, negativeKeywords)) {
        keywords.push({ keyword: variation, matchType: 'broad' });
      }
    }
    
    // Add post-modifier variations (e.g., "plumber near me")
    for (const modifier of postModifiers) {
      if (keywords.length >= maxResults) break;
      const variation = `${seed} ${modifier}`;
      if (!containsNegativeKeyword(variation, negativeKeywords)) {
        keywords.push({ keyword: variation, matchType: 'broad' });
      }
    }
    
    // Add question variations using templates
    for (const template of questionTemplates) {
      if (keywords.length >= maxResults) break;
      const variation = template.replace('{seed}', seed);
      if (!containsNegativeKeyword(variation, negativeKeywords)) {
        keywords.push({ keyword: variation, matchType: 'phrase' });
      }
    }
    
    if (keywords.length >= maxResults) break;
  }

  return keywords.slice(0, maxResults);
}

/**
 * Check if a keyword contains any negative keywords
 */
function containsNegativeKeyword(keyword: string, negativeKeywords: string[]): boolean {
  const keywordLower = keyword.toLowerCase();
  return negativeKeywords.some(neg => 
    keywordLower.includes(neg.toLowerCase().trim())
  );
}

/**
 * Map Google Ads competition string to our format
 */
function mapCompetition(competition?: string): 'low' | 'medium' | 'high' | undefined {
  if (!competition) return undefined;
  
  const comp = competition.toLowerCase();
  if (comp.includes('low')) return 'low';
  if (comp.includes('medium')) return 'medium';
  if (comp.includes('high')) return 'high';
  
  return undefined;
}

/**
 * Simplified Google Ads API call using Keyword Planner API
 * Note: Direct browser calls to Google Ads API are blocked by CORS
 * This function immediately throws to trigger AI fallback
 * In production, Google Ads API calls should be made from a backend server
 */
export async function generateKeywordsFromGoogleAdsSimplified(
  seedKeywords: string[],
  locationId: string = '2840', // US
  languageId: string = '1000', // English
  maxResults: number = 300,
  negativeKeywords: string[] = []
): Promise<KeywordResult[]> {
  // Google Ads API cannot be called directly from browser due to CORS restrictions
  // Always throw to use AI fallback instead
  // TODO: Implement backend endpoint for Google Ads API if needed
  throw new Error('Google Ads API requires backend proxy - using AI fallback');
}

