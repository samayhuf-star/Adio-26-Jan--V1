/**
 * Vertical-Aware Keyword Generation Utility
 * 
 * Generates keywords using VERTICAL-SPECIFIC patterns based on the actual business type.
 * Now enhanced with comprehensive expansion engine (300-500+ keywords).
 * 
 * Travel → booking, deals, packages, flights
 * E-commerce → buy, shop, order, checkout  
 * Healthcare → doctor, clinic, treatment, appointment
 * Legal → attorney, lawyer, consultation
 * Services → local, contractor, professional, quote
 */

import { getPatternsForVertical, generateKeywordVariations, normalizeVertical } from './keywordPatternsByVertical';
import { expandKeywords, type ExpandedKeyword } from '../../shared/keywordExpansion';

export interface KeywordGenerationOptions {
  seedKeywords: string;
  negativeKeywords?: string;
  vertical?: string;
  intentResult?: any;
  landingPageData?: any;
  maxKeywords?: number; // Default 600
  minKeywords?: number; // Default 300
}

export interface GeneratedKeyword {
  id: string;
  text: string;
  volume: string;
  cpc: string;
  type: string;
  suggestedBidCents?: number;
  suggestedBid?: string;
  bidReason?: string;
  matchType?: string;
}

/**
 * Get vertical config for keyword modifiers (import from campaignIntelligence)
 */
function getVerticalConfig(vertical: string = 'default'): any {
  // Import dynamically to avoid circular dependencies
  try {
    const { getVerticalConfig: getConfig } = require('./campaignIntelligence/verticalTemplates');
    return getConfig(vertical);
  } catch {
    return {
      serviceTokens: [],
      keywordModifiers: [],
      emergencyModifiers: []
    };
  }
}

/**
 * Get keyword modifiers for a vertical
 */
function getKeywordModifiers(vertical: string = 'default'): string[] {
  const config = getVerticalConfig(vertical);
  return config.keywordModifiers || [];
}

/**
 * Get emergency modifiers for a vertical
 */
function getEmergencyModifiers(vertical: string = 'default'): string[] {
  const config = getVerticalConfig(vertical);
  return config.emergencyModifiers || [];
}

/**
 * Get word count helper
 */
function getWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Validate keyword quality - reject nonsensical or garbage keywords
 * @param keyword The keyword to validate
 * @param serviceTerms Core service terms that must be present
 * @returns true if keyword is valid
 */
function isValidKeyword(keyword: string, serviceTerms: string[]): boolean {
  const lower = keyword.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length < 2 || words.length > 6) return false;
  
  // Rule 2: No duplicate consecutive words (e.g., "24/7 24/7 plumber")
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1]) return false;
  }
  
  // Rule 3: No duplicate words at all in keyword
  const uniqueWords = new Set(words);
  if (words.length !== uniqueWords.size) return false;
  
  // Rule 4: RELAXED - Contains at least one core service term OR is a valid modifier phrase
  const hasServiceTerm = serviceTerms.some(term => 
    lower.includes(term.toLowerCase())
  );
  // Allow modifiers like "near me", "24/7", "free", "cheap", etc. even without service term
  const validModifiers = ['near me', '24/7', 'same day', 'open now', 'available', 'emergency', 'cost', 'price', 'cheap', 'affordable', 'free', 'best', 'top', 'local', 'online'];
  const hasValidModifier = validModifiers.some(mod => lower.includes(mod));
  if (!hasServiceTerm && !hasValidModifier) return false;
  
  // Rule 5: No nonsense question patterns
  const invalidPatterns = [
    /^what is\s+\w+$/,           // "what is plumber" (incomplete)
    /^where to\s+\w+$/,          // "where to plumber" (incomplete)
    /^when to\s+\w+$/,           // "when to plumber" (incomplete) 
    /^why is\s+\w+$/,            // "why is plumber" (incomplete)
    /^does\s+\w+$/,              // "does plumber" (incomplete)
    /^can\s+\w+$/,               // "can plumber" (incomplete)
    /^how to\s+\w+$/,            // "how to plumber" (incomplete)
    /^(near|price|cost|cheap|discount|free|job|apply|brand|information)$/,  // standalone spam words
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(lower))) {
    return false;
  }
  
  // Rule 5b: "number" without "phone" context is spam (e.g., "number near me")
  // But allow phrases like "phone number", "delta phone number", etc.
  if (lower.includes('number') && !lower.includes('phone')) {
    return false;
  }
  
  // Rule 6: No standalone generic spam words as the entire keyword
  const spamWords = ['cheap', 'discount', 'free', 'job', 'apply', 'brand', 'information', 'near', 'price'];
  if (spamWords.includes(lower)) return false;
  
  // Rule 7: Keywords starting with question words must have proper verb structure
  const questionStarters = ['how to', 'what is', 'where to', 'when to', 'why is', 'does', 'can'];
  for (const starter of questionStarters) {
    if (lower.startsWith(starter)) {
      // Must have at least 4 words total to form a meaningful question
      if (words.length < 4) return false;
    }
  }
  
  return true;
}

/**
 * Extract service terms from seed keywords for validation
 */
function extractServiceTerms(seedKeywords: string[]): string[] {
  const terms: string[] = [];
  for (const seed of seedKeywords) {
    // Add the full seed
    terms.push(seed.toLowerCase().trim());
    // Add individual words that are 3+ characters
    const words = seed.split(/\s+/).filter(w => w.length >= 3);
    terms.push(...words.map(w => w.toLowerCase()));
  }
  return [...new Set(terms)];
}

/**
 * Autocomplete Modifiers - Real patterns from Google Suggest, Bing, YouTube, Amazon
 * These are the ONLY modifiers used - no invented combinations
 */
const AUTOCOMPLETE_MODIFIERS = {
  // Location-based autocomplete (most common)
  location: [
    'near me',
    'in [city]', // Placeholder for city insertion
    'local',
    'nearby'
  ],
  
  // Urgency/Time-based autocomplete
  urgency: [
    '24/7',
    'same day',
    'next day',
    'open now',
    'available today',
    'emergency'
  ],
  
  // Price/Cost autocomplete
  price: [
    'cost',
    'price',
    'cheap',
    'affordable',
    'free estimate',
    'free quote'
  ],
  
  // Quality/Comparison autocomplete
  quality: [
    'best',
    'top rated',
    'top',
    'reviews'
  ],
  
  // Service type autocomplete
  service: [
    'services',
    'repair',
    'replacement',
    'company',
    'companies'
  ],
  
  // Question-based autocomplete (FAQ patterns)
  question: [
    'how to',
    'what is',
    'where to',
    'when to',
    'why is',
    'does',
    'can'
  ]
};

/**
 * Intent Classification for Keywords
 */
type KeywordIntent = 'Commercial' | 'Transactional' | 'Informational' | 'Local';

/**
 * Classify keyword intent based on autocomplete patterns
 */
function classifyIntent(keyword: string): KeywordIntent {
  const lower = keyword.toLowerCase();
  
  // Local intent - contains location modifiers
  if (lower.includes('near me') || lower.includes('local') || lower.includes('nearby')) {
    return 'Local';
  }
  
  // Commercial intent - contains buying/comparison terms
  if (lower.includes('best') || lower.includes('top') || lower.includes('reviews') || 
      lower.includes('cost') || lower.includes('price') || lower.includes('cheap')) {
    return 'Commercial';
  }
  
  // Transactional intent - contains action terms
  if (lower.includes('call') || lower.includes('contact') || lower.includes('hire') || 
      lower.includes('book') || lower.includes('buy') || lower.includes('get quote')) {
    return 'Transactional';
  }
  
  // Informational intent - contains question words
  if (lower.includes('how') || lower.includes('what') || lower.includes('where') || 
      lower.includes('when') || lower.includes('why') || lower.includes('does')) {
    return 'Informational';
  }
  
  // Default to Commercial for seed keywords
  return 'Commercial';
}

/**
 * Main keyword generation function - Alphabet Soup Method
 * Calls backend endpoint that scrapes Google Autocomplete for real user searches.
 * Falls back to basic expansion if backend is unavailable.
 */
export async function generateKeywords(options: KeywordGenerationOptions): Promise<GeneratedKeyword[]> {
  const {
    seedKeywords,
    negativeKeywords = '',
    vertical = 'default',
    intentResult,
    landingPageData,
    maxKeywords = 600,
    minKeywords = 300
  } = options;

  const negativeList = negativeKeywords
    .split(/[,\n]/)
    .map(n => n.trim().toLowerCase())
    .filter(Boolean);

  const seedList = seedKeywords
    .split(/[,\n]/)
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length >= 2 && k.length <= 50)
    .slice(0, 5);

  if (seedList.length === 0) {
    return [];
  }

  let generatedKeywords: GeneratedKeyword[] = [];
  let keywordIdCounter = 0;

  try {
    console.log(`[Alphabet Soup] Fetching real autocomplete keywords for ${seedList.length} seeds...`);

    const response = await fetch('/api/keywords/alphabet-soup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seedKeywords: seedList,
        maxKeywordsPerSeed: Math.ceil(maxKeywords / seedList.length),
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.keywords && data.keywords.length > 0) {
      console.log(`[Alphabet Soup] Received ${data.keywords.length} keywords from Google Autocomplete`);

      const serviceTerms = extractServiceTerms(seedList);
      const seenTexts = new Set<string>();

      for (const kw of data.keywords) {
        const keyword = (kw.keyword || '').toLowerCase().trim();
        if (!keyword || keyword.length < 3) continue;

        if (keyword.split(/\s+/).filter(Boolean).length < 2) continue;

        if (negativeList.some(neg => keyword.includes(neg))) continue;

        if (seenTexts.has(keyword)) continue;

        if (!isValidKeyword(keyword, serviceTerms)) continue;

        seenTexts.add(keyword);
        generatedKeywords.push({
          id: `kw-${keywordIdCounter++}`,
          text: keyword,
          volume: 'Medium',
          cpc: '$2.50',
          type: classifyIntent(keyword),
          matchType: keyword.includes('near me') || keyword.includes('local') ? 'EXACT' : 'BROAD',
        });

        if (generatedKeywords.length >= maxKeywords) break;
      }

      console.log(`[Alphabet Soup] After filtering: ${generatedKeywords.length} valid keywords`);
    } else {
      throw new Error('No keywords returned from Alphabet Soup API');
    }
  } catch (error) {
    console.warn('[Alphabet Soup] Backend unavailable, using local fallback:', error);
    generatedKeywords = generateKeywordsFallback(seedList, negativeList, maxKeywords, minKeywords);
  }

  if (generatedKeywords.length < minKeywords) {
    console.log(`[Alphabet Soup] Only ${generatedKeywords.length} keywords, supplementing with local fallback...`);
    const existingTexts = new Set(generatedKeywords.map(k => k.text.toLowerCase()));
    const fallback = generateKeywordsFallback(seedList, negativeList, minKeywords - generatedKeywords.length, 0);
    for (const kw of fallback) {
      if (!existingTexts.has(kw.text.toLowerCase())) {
        kw.id = `kw-${keywordIdCounter++}`;
        generatedKeywords.push(kw);
        existingTexts.add(kw.text.toLowerCase());
      }
      if (generatedKeywords.length >= maxKeywords) break;
    }
  }

  if (generatedKeywords.length > maxKeywords) {
    generatedKeywords.splice(maxKeywords);
  }

  if (intentResult) {
    try {
      const { suggestBidCents } = require('./campaignIntelligence/bidSuggestions');
      const baseCPCCents = 2000;
      const emergencyMods = getEmergencyModifiers(vertical);

      generatedKeywords = generatedKeywords.map((kw) => {
        const keywordText = (kw.text || '').trim();
        const matchType: any = kw.matchType || 'BROAD';
        const hasEmergency = emergencyMods.some((m: string) =>
          keywordText.toLowerCase().includes(m.toLowerCase())
        );

        const bidResult = suggestBidCents(
          baseCPCCents,
          intentResult.intentId,
          matchType,
          hasEmergency ? ['emergency'] : []
        );

        return {
          ...kw,
          suggestedBidCents: bidResult.bid,
          suggestedBid: `$${(bidResult.bid / 100).toFixed(2)}`,
          bidReason: bidResult.reason,
          matchType: matchType,
        };
      });
    } catch (e) {
      console.log('Could not apply bid suggestions:', e);
    }
  }

  return generatedKeywords;
}

function generateKeywordsFallback(seedList: string[], negativeList: string[], maxKeywords: number, minKeywords: number): GeneratedKeyword[] {
  const results: GeneratedKeyword[] = [];
  let counter = 0;

  const preModifiers = [
    'best', 'top', 'affordable', 'cheap', 'professional', 'local',
    'certified', 'licensed', '24/7', 'emergency', 'same day',
    'quality', 'expert', 'fast', 'reliable', 'trusted', 'online',
  ];
  const postModifiers = [
    'near me', 'services', 'company', 'cost', 'prices', 'quote',
    'reviews', 'in my area', 'nearby', 'for sale', 'online',
    'free estimate', 'free quote', 'deals', 'discount', 'today',
  ];

  for (const seed of seedList) {
    if (results.length >= maxKeywords) break;
    const cleanSeed = seed.trim().toLowerCase();
    if (negativeList.some(neg => cleanSeed.includes(neg))) continue;

    // Master Rule: Minimum 2 words
    if (cleanSeed.split(/\s+/).filter(Boolean).length >= 2) {
      results.push({
        id: `kw-${counter++}`, text: cleanSeed,
        volume: 'High', cpc: '$2.50', type: classifyIntent(cleanSeed), matchType: 'BROAD'
      });
    }

    for (const mod of preModifiers) {
      if (results.length >= maxKeywords) break;
      const kw = `${mod} ${cleanSeed}`;
      if (!negativeList.some(neg => kw.includes(neg)) && !results.some(r => r.text === kw)) {
        results.push({
          id: `kw-${counter++}`, text: kw,
          volume: 'Medium', cpc: '$2.00', type: classifyIntent(kw), matchType: 'BROAD'
        });
      }
    }

    for (const mod of postModifiers) {
      if (results.length >= maxKeywords) break;
      const kw = `${cleanSeed} ${mod}`;
      if (!negativeList.some(neg => kw.includes(neg)) && !results.some(r => r.text === kw)) {
        results.push({
          id: `kw-${counter++}`, text: kw,
          volume: 'Medium', cpc: '$2.00', type: classifyIntent(kw), matchType: 'BROAD'
        });
      }
    }
  }

  return results;
}
