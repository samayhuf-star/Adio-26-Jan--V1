/**
 * Comprehensive Keyword Expansion Engine
 * Expands 2-5 seed keywords into 300-500+ targeted keyword variations
 * 
 * 10 Expansion Techniques:
 * 1. Modifier expansion (best, affordable, local, etc.)
 * 2. Location expansion (near me, [city], etc.)
 * 3. Question formats (how, what, where, when, why)
 * 4. Long-tail combinations
 * 5. Bracket modifiers ([city], [location])
 * 6. Action verbs (hire, call, book, schedule)
 * 7. Related keywords
 * 8. Adjective combinations
 * 9. Preposition variations
 * 10. Pluralization & singularization
 */

// ============================================================================
// MODIFIERS - 40+ quality/intent modifiers
// ============================================================================
const MODIFIERS = {
  quality: [
    'best', 'top', 'top rated', 'highest rated', 'quality', 
    'professional', 'expert', 'certified', 'licensed', 'trusted',
    'reliable', 'reputable', 'recommended', 'leading', 'premier'
  ],
  price: [
    'affordable', 'cheap', 'budget', 'low cost', 'inexpensive',
    'discount', 'economical', 'reasonable', 'value', 'cost effective',
    'premium', 'luxury', 'high end', 'exclusive'
  ],
  urgency: [
    'emergency', 'urgent', 'same day', '24 hour', '24/7',
    'immediate', 'fast', 'quick', 'rapid', 'express', 'instant'
  ],
  location: [
    'local', 'nearby', 'close', 'closest', 'nearest'
  ],
  time: [
    'today', 'now', 'this week', 'weekend', 'night', 'morning'
  ],
  business: [
    'family owned', 'small business', 'independent', 'veteran owned',
    'woman owned', 'black owned', 'local business'
  ]
};

// ============================================================================
// LOCATION VARIATIONS
// ============================================================================
const LOCATION_SUFFIXES = [
  'near me', 'in my area', 'nearby', 'close to me', 'around me',
  'in [city]', 'in [location]', '[city] area', 'local',
  'in town', 'downtown', 'suburban', 'residential'
];

// ============================================================================
// QUESTION FORMATS - 25+ question variations
// ============================================================================
const QUESTION_TEMPLATES = [
  'how to find {keyword}',
  'how to choose {keyword}',
  'how to hire {keyword}',
  'how much does {keyword} cost',
  'how much is {keyword}',
  'what is {keyword}',
  'what does {keyword} do',
  'what is the best {keyword}',
  'where to find {keyword}',
  'where can I find {keyword}',
  'where to get {keyword}',
  'when to call {keyword}',
  'when to hire {keyword}',
  'why hire {keyword}',
  'why choose {keyword}',
  'why use {keyword}',
  'who is the best {keyword}',
  'which {keyword} is best',
  'should I hire {keyword}',
  'do I need {keyword}',
  'can {keyword} help',
  'is {keyword} worth it',
  '{keyword} vs',
  '{keyword} or',
  '{keyword} reviews'
];

// ============================================================================
// ACTION VERBS - 20+ action-oriented keywords
// ============================================================================
const ACTION_VERBS = [
  'hire', 'call', 'contact', 'book', 'schedule',
  'find', 'get', 'need', 'looking for', 'searching for',
  'request', 'order', 'buy', 'purchase', 'compare',
  'check', 'review', 'choose', 'select', 'recommend'
];

// ============================================================================
// ADJECTIVES - 30+ descriptive adjectives
// ============================================================================
const ADJECTIVES = [
  'professional', 'experienced', 'qualified', 'skilled', 'trained',
  'certified', 'licensed', 'insured', 'bonded', 'accredited',
  'reliable', 'dependable', 'trustworthy', 'honest', 'reputable',
  'fast', 'quick', 'efficient', 'thorough', 'detailed',
  'friendly', 'courteous', 'responsive', 'available', 'flexible',
  'affordable', 'competitive', 'fair', 'transparent', 'upfront'
];

// ============================================================================
// PREPOSITIONS - Location and context prepositions
// ============================================================================
const PREPOSITIONS = [
  'near', 'for', 'with', 'in', 'around',
  'at', 'by', 'from', 'to', 'within'
];

// ============================================================================
// CONTEXT PHRASES - Additional context for long-tail
// ============================================================================
const CONTEXT_PHRASES = [
  'for home', 'for business', 'for office', 'for residential',
  'for commercial', 'for small business', 'for apartment',
  'with free estimate', 'with warranty', 'with guarantee',
  'with insurance', 'with experience', 'with good reviews',
  'open now', 'open today', 'open weekends', 'open 24 hours',
  'accepting new clients', 'free consultation', 'no obligation'
];

// ============================================================================
// SERVICE INDUSTRY RELATED TERMS
// ============================================================================
const INDUSTRY_RELATED: Record<string, string[]> = {
  electrician: [
    'electrical contractor', 'electrical repair', 'wiring service',
    'electrical installation', 'electrical maintenance', 'electrical work',
    'outlet repair', 'circuit breaker', 'electrical panel', 'lighting installation'
  ],
  plumber: [
    'plumbing service', 'plumbing repair', 'drain cleaning',
    'pipe repair', 'water heater', 'leak repair', 'toilet repair',
    'faucet installation', 'sewer service', 'plumbing contractor'
  ],
  hvac: [
    'ac repair', 'heating repair', 'furnace service', 'air conditioning',
    'hvac installation', 'hvac maintenance', 'duct cleaning', 'thermostat',
    'heat pump', 'cooling system'
  ],
  lawyer: [
    'attorney', 'legal services', 'law firm', 'legal counsel',
    'legal representation', 'legal advice', 'legal consultation'
  ],
  dentist: [
    'dental clinic', 'dental office', 'dental care', 'dental services',
    'teeth cleaning', 'dental checkup', 'oral health'
  ],
  contractor: [
    'general contractor', 'home improvement', 'renovation', 'remodeling',
    'construction', 'building contractor', 'home repair'
  ],
  roofing: [
    'roof repair', 'roofing contractor', 'roof replacement', 'roof installation',
    'shingle repair', 'roof inspection', 'roof maintenance'
  ],
  cleaning: [
    'cleaning service', 'house cleaning', 'maid service', 'janitorial',
    'office cleaning', 'deep cleaning', 'move out cleaning'
  ],
  landscaping: [
    'lawn care', 'garden service', 'yard maintenance', 'tree service',
    'lawn mowing', 'landscape design', 'outdoor maintenance'
  ],
  default: []
};

// ============================================================================
// MAIN EXPANSION FUNCTION
// ============================================================================
export interface ExpandedKeyword {
  keyword: string;
  avgMonthlySearches: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  competitionIndex: number;
  lowTopOfPageBid: number;
  highTopOfPageBid: number;
  avgCpc: number;
}

export interface ExpansionOptions {
  targetCountry?: string;
  expansionMode?: 'conservative' | 'moderate' | 'aggressive';
  includeQuestions?: boolean;
  includeLongTail?: boolean;
  maxKeywords?: number;
}

/**
 * Expand seed keywords into 300-500+ keyword variations
 */
export function expandKeywords(
  seedKeywords: string[],
  options: ExpansionOptions = {}
): ExpandedKeyword[] {
  const {
    expansionMode = 'moderate',
    includeQuestions = true,
    includeLongTail = true,
    maxKeywords = 500
  } = options;

  const expandedSet = new Set<string>();
  
  // Get expansion limits based on mode
  const limits = getExpansionLimits(expansionMode);

  for (const seed of seedKeywords) {
    const cleanSeed = seed.trim().toLowerCase();
    if (!cleanSeed || cleanSeed.length < 2) continue;

    // 1. Add original seed
    expandedSet.add(cleanSeed);
    
    // 2. Add modifier variations
    addModifierVariations(cleanSeed, expandedSet, limits.modifiers);
    
    // 3. Add location variations
    addLocationVariations(cleanSeed, expandedSet, limits.locations);
    
    // 4. Add question formats
    if (includeQuestions) {
      addQuestionFormats(cleanSeed, expandedSet, limits.questions);
    }
    
    // 5. Add action verb variations
    addActionVerbVariations(cleanSeed, expandedSet, limits.verbs);
    
    // 6. Add adjective variations
    addAdjectiveVariations(cleanSeed, expandedSet, limits.adjectives);
    
    // 7. Add preposition + context variations
    addPrepositionVariations(cleanSeed, expandedSet, limits.prepositions);
    
    // 8. Add related industry terms
    addRelatedTerms(cleanSeed, expandedSet);
    
    // 9. Add long-tail combinations
    if (includeLongTail) {
      addLongTailCombinations(cleanSeed, expandedSet, limits.longTails);
    }
    
    // 10. Add pluralization/singularization
    addPluralVariations(cleanSeed, expandedSet);
  }

  // Convert to array, deduplicate, and limit
  const keywordsArray = Array.from(expandedSet)
    .filter(kw => isValidKeyword(kw))
    .slice(0, maxKeywords);

  // Generate metrics for each keyword
  return keywordsArray.map(keyword => generateKeywordMetrics(keyword));
}

// ============================================================================
// EXPANSION HELPER FUNCTIONS
// ============================================================================

function getExpansionLimits(mode: string) {
  switch (mode) {
    case 'conservative':
      return { modifiers: 15, locations: 5, questions: 10, verbs: 8, adjectives: 10, prepositions: 5, longTails: 20 };
    case 'aggressive':
      return { modifiers: 50, locations: 15, questions: 25, verbs: 20, adjectives: 30, prepositions: 10, longTails: 80 };
    case 'moderate':
    default:
      return { modifiers: 35, locations: 10, questions: 20, verbs: 15, adjectives: 25, prepositions: 8, longTails: 50 };
  }
}

function addModifierVariations(seed: string, set: Set<string>, limit: number) {
  const allModifiers = [
    ...MODIFIERS.quality,
    ...MODIFIERS.price,
    ...MODIFIERS.urgency,
    ...MODIFIERS.location,
    ...MODIFIERS.time,
    ...MODIFIERS.business
  ];
  
  // Shuffle and take up to limit
  const shuffled = allModifiers.sort(() => Math.random() - 0.5).slice(0, limit);
  
  for (const mod of shuffled) {
    set.add(`${mod} ${seed}`);
    set.add(`${seed} ${mod}`);
  }
}

function addLocationVariations(seed: string, set: Set<string>, limit: number) {
  const locations = LOCATION_SUFFIXES.slice(0, limit);
  
  for (const loc of locations) {
    // Replace placeholders with generic terms
    const cleanLoc = loc.replace('[city]', 'city').replace('[location]', 'area');
    set.add(`${seed} ${cleanLoc}`);
  }
}

function addQuestionFormats(seed: string, set: Set<string>, limit: number) {
  const questions = QUESTION_TEMPLATES.slice(0, limit);
  
  for (const template of questions) {
    const question = template.replace('{keyword}', seed);
    set.add(question);
  }
}

function addActionVerbVariations(seed: string, set: Set<string>, limit: number) {
  const verbs = ACTION_VERBS.slice(0, limit);
  
  for (const verb of verbs) {
    set.add(`${verb} ${seed}`);
    set.add(`${verb} a ${seed}`);
  }
}

function addAdjectiveVariations(seed: string, set: Set<string>, limit: number) {
  const adjectives = ADJECTIVES.slice(0, limit);
  
  for (const adj of adjectives) {
    set.add(`${adj} ${seed}`);
  }
}

function addPrepositionVariations(seed: string, set: Set<string>, limit: number) {
  const preps = PREPOSITIONS.slice(0, limit);
  const contexts = CONTEXT_PHRASES.slice(0, limit);
  
  for (const context of contexts) {
    set.add(`${seed} ${context}`);
  }
  
  for (const prep of preps) {
    set.add(`${seed} ${prep} me`);
  }
}

function addRelatedTerms(seed: string, set: Set<string>) {
  // Find matching industry
  const seedLower = seed.toLowerCase();
  
  for (const [industry, terms] of Object.entries(INDUSTRY_RELATED)) {
    if (seedLower.includes(industry) || terms.some(t => seedLower.includes(t.split(' ')[0]))) {
      for (const term of terms) {
        set.add(term);
        set.add(`${term} near me`);
        set.add(`best ${term}`);
      }
      break;
    }
  }
}

function addLongTailCombinations(seed: string, set: Set<string>, limit: number) {
  const modifiers = ['best', 'affordable', 'professional', 'local', 'emergency', 'certified', 'trusted', 'experienced'];
  const locations = ['near me', 'in my area', 'nearby', 'local'];
  const contexts = ['for home', 'for business', 'with free estimate', 'with warranty'];
  
  let count = 0;
  
  // Modifier + seed + location combinations
  for (const mod of modifiers) {
    for (const loc of locations) {
      if (count >= limit) break;
      set.add(`${mod} ${seed} ${loc}`);
      count++;
    }
  }
  
  // Seed + context + location combinations
  for (const context of contexts) {
    for (const loc of locations) {
      if (count >= limit) break;
      set.add(`${seed} ${context} ${loc}`);
      count++;
    }
  }
  
  // Triple combinations: modifier + seed + context
  for (const mod of modifiers.slice(0, 4)) {
    for (const context of contexts.slice(0, 3)) {
      if (count >= limit) break;
      set.add(`${mod} ${seed} ${context}`);
      count++;
    }
  }
}

function addPluralVariations(seed: string, set: Set<string>) {
  // Simple pluralization rules
  if (seed.endsWith('s')) {
    // Already plural, add singular
    set.add(seed.slice(0, -1));
  } else if (seed.endsWith('y')) {
    // Add -ies plural
    set.add(seed.slice(0, -1) + 'ies');
  } else {
    // Add -s plural
    set.add(seed + 's');
  }
  
  // Add common service suffixes
  if (!seed.includes('service')) {
    set.add(`${seed} service`);
    set.add(`${seed} services`);
  }
  
  if (!seed.includes('company') && !seed.includes('companies')) {
    set.add(`${seed} company`);
    set.add(`${seed} companies`);
  }
}

function isValidKeyword(keyword: string): boolean {
  // Filter out invalid keywords
  if (!keyword || keyword.length < 3) return false;
  if (keyword.length > 80) return false;
  
  // Count words
  const words = keyword.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 8) return false;
  
  // Filter out keywords that are just filler words
  const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were'];
  const nonFillerWords = words.filter(w => !fillerWords.includes(w.toLowerCase()));
  if (nonFillerWords.length < 1) return false;
  
  return true;
}

function generateKeywordMetrics(keyword: string): ExpandedKeyword {
  // Generate realistic estimated metrics based on keyword characteristics
  const wordCount = keyword.split(/\s+/).length;
  const isQuestion = keyword.startsWith('how') || keyword.startsWith('what') || keyword.startsWith('where') || keyword.startsWith('why') || keyword.startsWith('when');
  const hasLocation = keyword.includes('near me') || keyword.includes('local') || keyword.includes('nearby');
  const hasModifier = MODIFIERS.quality.some(m => keyword.includes(m)) || MODIFIERS.price.some(m => keyword.includes(m));
  
  // Base metrics - longer keywords typically have lower volume but higher intent
  let baseVolume = 8000 - (wordCount * 800);
  baseVolume = Math.max(100, baseVolume + (Math.random() - 0.5) * 2000);
  
  // Questions and location keywords often have higher volume
  if (isQuestion) baseVolume *= 1.3;
  if (hasLocation) baseVolume *= 1.5;
  
  // Competition tends to be higher for shorter, high-intent keywords
  let competitionScore = 0.3 + (1 - wordCount / 8) * 0.5;
  if (hasModifier) competitionScore += 0.1;
  competitionScore = Math.min(1, Math.max(0, competitionScore + (Math.random() - 0.5) * 0.2));
  
  const competition: 'LOW' | 'MEDIUM' | 'HIGH' = 
    competitionScore < 0.33 ? 'LOW' : 
    competitionScore < 0.66 ? 'MEDIUM' : 'HIGH';
  
  // CPC correlates with competition and intent
  const baseCpc = 1.5 + competitionScore * 4 + (Math.random() * 2);
  
  return {
    keyword,
    avgMonthlySearches: Math.round(baseVolume),
    competition,
    competitionIndex: Math.round(competitionScore * 100),
    lowTopOfPageBid: Math.round((baseCpc * 0.6) * 100) / 100,
    highTopOfPageBid: Math.round((baseCpc * 1.4) * 100) / 100,
    avgCpc: Math.round(baseCpc * 100) / 100
  };
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default {
  expandKeywords,
  MODIFIERS,
  ACTION_VERBS,
  ADJECTIVES,
  QUESTION_TEMPLATES
};
