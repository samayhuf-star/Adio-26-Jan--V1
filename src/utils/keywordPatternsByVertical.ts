/**
 * Vertical-Specific Keyword Patterns
 * Different industries need different keyword generation patterns
 * Avoids generic "near me", "emergency", "top" for all verticals
 */

export const VERTICAL_KEYWORD_PATTERNS: Record<string, {
  local: string[];
  price: string[];
  quality: string[];
  urgency: string[];
  service: string[];
  transactional: string[];
}> = {
  'Travel': {
    local: ['[seed]', '[seed] flights', '[seed] deals', '[seed] packages'],
    price: ['[seed] price', '[seed] cost', 'cheap [seed]', '[seed] discount', '[seed] sale'],
    quality: ['best [seed]', 'top rated [seed]', '[seed] reviews', '[seed] ratings'],
    urgency: ['[seed] last minute', '[seed] deals today', '[seed] flash sale', 'book [seed] now'],
    service: ['[seed] booking', '[seed] reservations', '[seed] search', '[seed] compare'],
    transactional: ['book [seed]', 'reserve [seed]', 'search [seed]', 'find [seed]']
  },
  
  'E-commerce': {
    local: ['[seed] online', '[seed] shop', '[seed] store', 'buy [seed]'],
    price: ['[seed] price', '[seed] cost', '[seed] cheap', '[seed] affordable', '[seed] discount'],
    quality: ['best [seed]', 'top [seed]', '[seed] quality', '[seed] reviews'],
    urgency: ['[seed] sale', '[seed] deal', '[seed] offer', '[seed] limited time'],
    service: ['[seed] shop', '[seed] buy', '[seed] order', '[seed] checkout'],
    transactional: ['buy [seed]', 'order [seed]', '[seed] checkout', '[seed] in stock']
  },
  
  'Healthcare': {
    local: ['[seed] near me', '[seed] local', '[seed] clinic nearby', '[seed] doctor near me'],
    price: ['[seed] cost', '[seed] price', '[seed] insurance', '[seed] affordable'],
    quality: ['best [seed]', 'top [seed] provider', '[seed] specialist', '[seed] experienced'],
    urgency: ['urgent [seed]', '[seed] emergency', '[seed] same day', '[seed] walk in'],
    service: ['[seed] service', '[seed] treatment', '[seed] appointment', '[seed] consultation'],
    transactional: ['book [seed] appointment', 'schedule [seed]', '[seed] consultation', 'make [seed] appointment']
  },
  
  'Legal': {
    local: ['[seed] attorney near me', '[seed] lawyer in', '[seed] law firm local', '[seed] legal services'],
    price: ['[seed] cost', '[seed] fee', '[seed] rates', '[seed] affordable'],
    quality: ['best [seed] attorney', '[seed] experienced', '[seed] specialist', '[seed] expert'],
    urgency: ['urgent [seed]', '[seed] emergency', '[seed] help', '[seed] representation'],
    service: ['[seed] services', '[seed] consultation', '[seed] legal advice', '[seed] representation'],
    transactional: ['hire [seed]', 'consult [seed]', '[seed] advice', '[seed] help']
  },
  
  'Real Estate': {
    local: ['[seed] in [city]', '[seed] local', '[seed] homes', '[seed] properties near me'],
    price: ['[seed] price', '[seed] cost', '[seed] listing', '[seed] rent', '[seed] lease'],
    quality: ['best [seed]', '[seed] luxury', '[seed] featured', '[seed] top rated'],
    urgency: ['[seed] available now', '[seed] new listing', '[seed] open house', '[seed] urgent'],
    service: ['[seed] agent', '[seed] broker', '[seed] listing', '[seed] search'],
    transactional: ['buy [seed]', 'rent [seed]', 'view [seed]', '[seed] tour']
  },
  
  'Finance': {
    local: ['[seed] online', '[seed] bank', '[seed] financial services', '[seed] options'],
    price: ['[seed] interest rate', '[seed] APR', '[seed] rates', '[seed] cost'],
    quality: ['best [seed]', '[seed] top rated', '[seed] trusted', '[seed] secure'],
    urgency: ['[seed] fast', '[seed] quick', '[seed] immediate', '[seed] instant'],
    service: ['[seed] account', '[seed] service', '[seed] help', '[seed] support'],
    transactional: ['open [seed] account', 'apply for [seed]', '[seed] application', '[seed] sign up']
  },
  
  'Education': {
    local: ['[seed] near me', '[seed] online', '[seed] classes', '[seed] programs'],
    price: ['[seed] cost', '[seed] tuition', '[seed] free', '[seed] affordable'],
    quality: ['best [seed]', '[seed] accredited', '[seed] certified', '[seed] top rated'],
    urgency: ['[seed] now', '[seed] enrollment', '[seed] registration', '[seed] start'],
    service: ['[seed] course', '[seed] program', '[seed] training', '[seed] class'],
    transactional: ['enroll in [seed]', 'register for [seed]', 'buy [seed] course', '[seed] signup']
  },
  
  'Services': {
    local: ['[seed] near me', '[seed] local', '[seed] company', '[seed] contractor'],
    price: ['[seed] cost', '[seed] price', '[seed] rates', '[seed] quote'],
    quality: ['best [seed]', '[seed] professional', '[seed] licensed', '[seed] experienced'],
    urgency: ['[seed] same day', '[seed] available', '[seed] now', '[seed] urgent'],
    service: ['[seed] service', '[seed] company', '[seed] professional', '[seed] contractor'],
    transactional: ['hire [seed]', 'get [seed] quote', 'book [seed]', '[seed] contact']
  },
  
  'default': {
    local: ['[seed]', '[seed] local', '[seed] near me', '[seed] online'],
    price: ['[seed] cost', '[seed] price', '[seed] cheap', '[seed] free'],
    quality: ['best [seed]', '[seed] reviews', '[seed] top', '[seed] quality'],
    urgency: ['[seed] now', '[seed] today', '[seed] fast', '[seed] quick'],
    service: ['[seed] service', '[seed] company', '[seed] help', '[seed] support'],
    transactional: ['buy [seed]', '[seed] get', '[seed] try', '[seed] start']
  }
};

/**
 * Normalize vertical name to title case for pattern lookup
 * Handles all variations: lowercase, title case, slugs, etc.
 */
export function normalizeVertical(vertical: string): string {
  const verticalMap: Record<string, string> = {
    // Travel variations
    'travel': 'Travel',
    'Travel': 'Travel',
    'tourism': 'Travel',
    'booking': 'Travel',
    
    // E-commerce variations
    'ecommerce': 'E-commerce',
    'e-commerce': 'E-commerce',
    'E-commerce': 'E-commerce',
    'shopping': 'E-commerce',
    'retail': 'E-commerce',
    
    // Healthcare variations
    'healthcare': 'Healthcare',
    'Healthcare': 'Healthcare',
    'health': 'Healthcare',
    'medical': 'Healthcare',
    
    // Legal variations
    'legal': 'Legal',
    'Legal': 'Legal',
    'law': 'Legal',
    'attorney': 'Legal',
    
    // Real Estate variations
    'real estate': 'Real Estate',
    'Real Estate': 'Real Estate',
    'realestate': 'Real Estate',
    'real-estate': 'Real Estate',
    'property': 'Real Estate',
    
    // Finance variations
    'finance': 'Finance',
    'Finance': 'Finance',
    'financial': 'Finance',
    'banking': 'Finance',
    'insurance': 'Finance',
    
    // Education variations
    'education': 'Education',
    'Education': 'Education',
    'training': 'Education',
    'courses': 'Education',
    
    // Services variations
    'services': 'Services',
    'Services': 'Services',
    'service': 'Services',
    'home services': 'Services',
    'professional': 'Services',
    
    // General/Default
    'general': 'default',
    'General': 'default',
    'default': 'default'
  };
  
  const input = (vertical || 'default').trim();
  // Try exact match first, then lowercase match
  return verticalMap[input] || verticalMap[input.toLowerCase()] || 'default';
}

/**
 * Get patterns for a specific vertical
 */
export function getPatternsForVertical(vertical: string = 'default') {
  const normalizedVertical = normalizeVertical(vertical);
  const patterns = VERTICAL_KEYWORD_PATTERNS[normalizedVertical];
  console.log(`📊 Keyword patterns: ${vertical} → ${normalizedVertical}`);
  return patterns || VERTICAL_KEYWORD_PATTERNS['default'];
}

/**
 * Generate keyword variations using vertical-specific patterns
 */
export function generateKeywordVariations(seed: string, vertical: string = 'default'): string[] {
  const patterns = getPatternsForVertical(vertical);
  const variations: string[] = [];
  
  // Combine all patterns and replace [seed] placeholder
  const allPatterns = [
    ...patterns.local,
    ...patterns.price,
    ...patterns.quality,
    ...patterns.urgency,
    ...patterns.service,
    ...patterns.transactional
  ];
  
  allPatterns.forEach(pattern => {
    const keyword = pattern.replace('[seed]', seed).replace('[city]', 'your area');
    if (keyword.trim().length > 0 && !keyword.includes('[')) {
      variations.push(keyword);
    }
  });
  
  // Add seed itself if it's 2-3 words
  const seedWords = seed.trim().split(/\s+/).length;
  if (seedWords >= 2 && seedWords <= 3) {
    variations.unshift(seed);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}
