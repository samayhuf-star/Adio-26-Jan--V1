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
  
  // Rule 1: Must be 1-6 words (allow 1-word keywords too)
  if (words.length < 1 || words.length > 6) return false;
  
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
 * Main keyword generation function
 * Now uses comprehensive expansion engine for 300-500+ keywords
 */
export function generateKeywords(options: KeywordGenerationOptions): GeneratedKeyword[] {
  const {
    seedKeywords,
    negativeKeywords = '',
    vertical = 'default',
    intentResult,
    landingPageData,
    maxKeywords = 600,
    minKeywords = 300
  } = options;

  // Parse negative keywords (comma or newline separated)
  const negativeList = negativeKeywords
    .split(/[,\n]/)
    .map(n => n.trim().toLowerCase())
    .filter(Boolean);

  // Parse seed keywords - normalize to root terms
  const seedList = seedKeywords
    .split(/[,\n]/)
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length >= 2 && k.length <= 50)
    .slice(0, 10); // Limit seeds to prevent explosion

  if (seedList.length === 0) {
    return [];
  }

  // Extract service terms for validation
  const serviceTerms = extractServiceTerms(seedList);
  
  const generatedKeywords: GeneratedKeyword[] = [];
  let keywordIdCounter = 0;

  // ============================================================================
  // PHASE 1: Use comprehensive expansion engine (300-500+ keywords)
  // ============================================================================
  console.log(`🚀 Starting comprehensive keyword expansion for ${seedList.length} seeds...`);
  
  try {
    const expansionMode = maxKeywords >= 500 ? 'aggressive' : maxKeywords >= 300 ? 'moderate' : 'conservative';
    const expandedKeywords = expandKeywords(seedList, {
      expansionMode,
      includeQuestions: true,
      includeLongTail: true,
      maxKeywords: Math.min(maxKeywords, 600)
    });

    console.log(`✅ Expansion engine generated ${expandedKeywords.length} keywords`);

    // Convert expanded keywords to GeneratedKeyword format
    for (const expanded of expandedKeywords) {
      // Skip if contains negative keywords
      if (negativeList.some(neg => expanded.keyword.toLowerCase().includes(neg))) {
        continue;
      }
      // Skip duplicates
      if (generatedKeywords.some(k => k.text.toLowerCase() === expanded.keyword.toLowerCase())) {
        continue;
      }
      // Skip if doesn't pass validation
      if (!isValidKeyword(expanded.keyword, serviceTerms)) {
        continue;
      }

      generatedKeywords.push({
        id: `kw-${keywordIdCounter++}`,
        text: expanded.keyword,
        volume: expanded.avgMonthlySearches >= 5000 ? 'High' : expanded.avgMonthlySearches >= 1000 ? 'Medium' : 'Low',
        cpc: `$${expanded.avgCpc.toFixed(2)}`,
        type: classifyIntent(expanded.keyword),
        matchType: expanded.keyword.includes('near me') || expanded.keyword.includes('local') ? 'EXACT' : 'BROAD'
      });
    }
  } catch (error) {
    console.warn('⚠️ Expansion engine failed, falling back to vertical patterns:', error);
  }

  // ============================================================================
  // PHASE 2: Supplement with vertical-specific patterns if needed
  // ============================================================================
  
  // Helper to add valid keyword
  const addValidKeyword = (kw: string, volume: string, cpc: string, type: string, matchType: string) => {
    if (generatedKeywords.length >= maxKeywords) return;
    if (negativeList.some(neg => kw.includes(neg))) return;
    if (generatedKeywords.some(k => k.text.toLowerCase() === kw.toLowerCase())) return;
    if (!isValidKeyword(kw, serviceTerms)) return;
    
    generatedKeywords.push({
      id: `kw-${keywordIdCounter++}`,
      text: kw,
      volume,
      cpc,
      type,
      matchType
    });
  };

  // Get vertical-specific patterns for additional variations
  const verticalPatterns = getPatternsForVertical(vertical);
  console.log(`🎯 Supplementing with ${vertical} vertical patterns...`);

  // Process each seed keyword through VERTICAL-SPECIFIC patterns
  for (const seed of seedList) {
    const cleanSeed = seed.trim().toLowerCase();
    const seedWords = cleanSeed.split(/\s+/).filter(w => w.length > 0);
    
    // Skip if seed contains negative keywords
    if (negativeList.some(neg => cleanSeed.includes(neg))) {
      continue;
    }

    // VERTICAL-AWARE CLUSTER 1: Local/Discovery patterns (specific to vertical)
    verticalPatterns.local.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed).replace('[city]', 'your area');
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'High', '$4.20', 'Local', 'BROAD');
      }
    });

    // VERTICAL-AWARE CLUSTER 2: Price/Cost patterns (specific to vertical)
    verticalPatterns.price.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed);
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'Medium', '$2.50', 'Commercial', 'PHRASE');
      }
    });

    // VERTICAL-AWARE CLUSTER 3: Quality/Comparison patterns (specific to vertical)
    verticalPatterns.quality.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed);
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'High', '$3.00', 'Commercial', 'PHRASE');
      }
    });

    // VERTICAL-AWARE CLUSTER 4: Urgency patterns (specific to vertical)
    verticalPatterns.urgency.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed);
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'High', '$5.00', 'Transactional', 'EXACT');
      }
    });

    // VERTICAL-AWARE CLUSTER 5: Service patterns (specific to vertical)
    verticalPatterns.service.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed);
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'Medium', '$2.80', 'Transactional', 'BROAD');
      }
    });

    // VERTICAL-AWARE CLUSTER 6: Transactional patterns (specific to vertical)
    verticalPatterns.transactional.forEach(pattern => {
      const kw = pattern.replace('[seed]', cleanSeed);
      if (!kw.includes('[')) {
        addValidKeyword(kw, 'High', '$4.50', classifyIntent(kw), 'EXACT');
      }
    });

    // Add the seed keyword itself (if 2-3 words)
    if (seedWords.length >= 2 && seedWords.length <= 3) {
      addValidKeyword(cleanSeed, 'High', '$2.50', 'Commercial', 'BROAD');
    }

    if (generatedKeywords.length >= maxKeywords) break;
  }

  // If we need more keywords, generate additional vertical-aware variations
  if (generatedKeywords.length < minKeywords && seedList.length > 0) {
    const needed = minKeywords - generatedKeywords.length;
    let generated = 0;

    // Get additional vertical-specific patterns (using imported normalizeVertical)
    const verticalExtras: Record<string, string[]> = {
      'Travel': ['[seed] booking', '[seed] reservation', '[seed] tickets', '[seed] comparison', 'compare [seed]', '[seed] deals online', 'best [seed] offers', '[seed] packages', '[seed] flights', '[seed] hotels', '[seed] resorts', '[seed] tours', '[seed] vacation', 'book [seed] now', 'find [seed] deals', '[seed] last minute deals', '[seed] all inclusive', '[seed] adventure'],
      'E-commerce': ['[seed] online', '[seed] delivery', '[seed] fast shipping', '[seed] in stock', '[seed] buy now', '[seed] purchase', '[seed] checkout', '[seed] sale', '[seed] deal', '[seed] offer', '[seed] discount', '[seed] promo', 'shop [seed]', 'order [seed]', '[seed] amazon', '[seed] ebay', '[seed] walmart'],
      'Healthcare': ['[seed] clinic', '[seed] doctor', '[seed] appointment', '[seed] near me', '[seed] consultation', '[seed] specialist', '[seed] treatment', '[seed] care', '[seed] hospital', '[seed] urgent care', '[seed] pharmacy', '[seed] telemedicine', 'find [seed]', '[seed] booking', '[seed] reviews'],
      'Legal': ['[seed] lawyer', '[seed] attorney', '[seed] legal help', '[seed] advice', '[seed] consultation', '[seed] services', '[seed] firm', '[seed] office', '[seed] near me', '[seed] experienced', '[seed] expert', 'hire [seed]', 'contact [seed]'],
      'Real Estate': ['[seed] listings', '[seed] homes', '[seed] properties', '[seed] for sale', '[seed] for rent', '[seed] agents', '[seed] houses', '[seed] apartments', '[seed] condos', '[seed] land', '[seed] commercial', 'buy [seed]', 'rent [seed]', '[seed] prices'],
      'Finance': ['[seed] account', '[seed] application', '[seed] online', '[seed] approval', '[seed] calculator', '[seed] rates', '[seed] interest', '[seed] loan', '[seed] credit', '[seed] investment', '[seed] savings', 'apply for [seed]', 'open [seed]'],
      'Education': ['[seed] course', '[seed] classes', '[seed] training', '[seed] certification', '[seed] online', '[seed] degree', '[seed] program', '[seed] school', '[seed] university', '[seed] college', '[seed] instructor', '[seed] tuition', 'enroll [seed]', 'register [seed]'],
      'Services': ['[seed] service', '[seed] company', '[seed] local', '[seed] near me', '[seed] quote', '[seed] estimate', '[seed] contractor', '[seed] professional', '[seed] licensed', '[seed] experienced', '[seed] rates', '[seed] prices', 'hire [seed]', 'book [seed]', '[seed] available', '[seed] same day'],
      'default': ['[seed] service', '[seed] help', '[seed] support', '[seed] online', 'find [seed]', 'get [seed]', '[seed] near me', '[seed] local', '[seed] cost', '[seed] price', 'best [seed]', 'top [seed]', '[seed] reviews', '[seed] rates']
    };

    const normalizedVertical = normalizeVertical(vertical);
    const extraPatterns = verticalExtras[normalizedVertical] || verticalExtras['default'];

    // Generate more keywords by cycling through seeds multiple times with different patterns
    for (let cycle = 0; cycle < 3 && generated < needed; cycle++) {
      for (const seed of seedList) {
        if (generated >= needed) break;
        
        const patternsToTry = extraPatterns.slice(cycle * Math.ceil(extraPatterns.length / 3), (cycle + 1) * Math.ceil(extraPatterns.length / 3));
        for (const pattern of patternsToTry) {
          if (generated >= needed) break;
          const kw = pattern.replace('[seed]', seed);
          if (!kw.includes('[')) {
            const prevLen = generatedKeywords.length;
            addValidKeyword(kw, 'Medium', '$2.00', classifyIntent(kw), 'BROAD');
            if (generatedKeywords.length > prevLen) generated++;
          }
        }
      }
    }
  }

  // Additional fallback: If still below min, generate simple variations
  if (generatedKeywords.length < minKeywords && seedList.length > 0) {
    const needed = minKeywords - generatedKeywords.length;
    const simpleModifiers = [
      'near me', 'nearby', 'local', 'in my area',
      'best', 'top', 'quality', 'professional',
      'cheap', 'affordable', 'cost', 'price',
      '24/7', 'same day', 'emergency', 'urgent',
      'online', 'digital', 'virtual', 'remote',
      'free', 'free estimate', 'free quote', 'free consultation'
    ];
    
    let added = 0;
    for (const seed of seedList) {
      for (const mod of simpleModifiers) {
        if (added >= needed) break;
        const kw = `${mod} ${seed}`;
        const prevLen = generatedKeywords.length;
        addValidKeyword(kw, 'Low', '$1.50', classifyIntent(kw), 'BROAD');
        if (generatedKeywords.length > prevLen) added++;
      }
    }
  }

  // Limit to maxKeywords
  if (generatedKeywords.length > maxKeywords) {
    generatedKeywords.splice(maxKeywords);
  }

  // Final filter: Remove any keywords containing negative keywords
  const finalKeywords = generatedKeywords.filter((k) => {
    const keywordText = (k.text || '').toLowerCase();
    return !negativeList.some(neg => keywordText.includes(neg));
  });

  // Apply bid suggestions if intent is classified
  let keywordsWithBids = finalKeywords;
  if (intentResult) {
    try {
      const { suggestBidCents } = require('./campaignIntelligence/bidSuggestions');
      const baseCPCCents = 2000;
      const emergencyMods = getEmergencyModifiers(vertical);

      keywordsWithBids = finalKeywords.map((kw) => {
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

  return keywordsWithBids;
}
