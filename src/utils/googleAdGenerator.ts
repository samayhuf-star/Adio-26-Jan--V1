/**
 * Google Search Ads Generation Logic
 * 
 * Comprehensive ad generator that creates Google Search Ads based on:
 * 1. Ad Type (Responsive Search Ads, Expanded Text Ads, Call-Only Ads)
 * 2. User Intent (Service, Product, Information, Local, Emergency)
 * 3. Filters Selected (Industry, Location, Match Type, Campaign Structure)
 * 
 * GUARDRAILS: All ads follow official Google Search Ads policies (RSA, DKI, Call-Only)
 * See googleAdsRules.ts for complete validation rules
 */

import {
  CHARACTER_LIMITS,
  ensureUniqueHeadlines,
  ensureUniqueDescriptions,
  formatHeadline,
  formatDescription,
  validateRSA,
  validateCallOnlyAd,
  validateDKISyntax,
  BEST_PRACTICES,
  areHeadlinesSimilar,
  buildDKIDefault
} from './googleAdsRules';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum UserIntent {
  SERVICE = 'service',
  PRODUCT = 'product',
  INFORMATIONAL = 'informational',
  LOCAL = 'local',
  EMERGENCY = 'emergency',
  COMPARISON = 'comparison',
  TRANSACTIONAL = 'transactional'
}

export type AdType = 'RSA' | 'ETA' | 'CALL_ONLY';
export type MatchType = 'broad' | 'phrase' | 'exact';
export type CampaignStructure = 'SKAG' | 'STAG' | 'IBAG' | 'Alpha-Beta';

export interface AdGenerationInput {
  keywords: string[];
  industry: string;
  businessName: string;
  location?: string;
  baseUrl?: string;  // Optional base URL for final URL generation
  adType: AdType;
  filters: {
    matchType: MatchType;
    campaignStructure: CampaignStructure;
    targetAudience?: string;
    uniqueSellingPoints?: string[];
    callToAction?: string;
    promotions?: string[];
  };
}

export interface ResponsiveSearchAd {
  headlines: string[];      // 3-15 headlines, max 30 chars each
  descriptions: string[];   // 2-4 descriptions, max 90 chars each
  finalUrl: string;
  displayPath: string[];    // 2 paths, max 15 chars each
}

export interface ExpandedTextAd {
  headline1: string;     // max 30 chars
  headline2: string;     // max 30 chars
  headline3?: string;   // max 30 chars (optional)
  description1: string;  // max 90 chars
  description2?: string; // max 90 chars (optional)
  finalUrl: string;
  displayPath: string[]; // 2 paths, max 15 chars each
}

export interface CallOnlyAd {
  businessName: string;    // max 25 chars
  headline1: string;       // max 30 chars
  headline2: string;       // max 30 chars
  description1: string;    // max 90 chars
  description2: string;    // max 90 chars
  phoneNumber: string;
  verificationUrl: string;
  displayPath: string[];   // 2 paths, max 15 chars each
}

export interface AdCopyTemplates {
  headlines: string[];
  descriptions: string[];
  ctaVariations: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// KEYWORD CLEANING UTILITIES
// ============================================================================

/**
 * Remove match type brackets from keywords
 * Converts [keyword] (exact), "keyword" (phrase), +keyword (modified broad) to clean keyword
 */
function cleanKeyword(keyword: string): string {
  if (!keyword) return '';
  return keyword
    .replace(/^\[(.+)\]$/, '$1')  // Remove exact match brackets [keyword]
    .replace(/^"(.+)"$/, '$1')     // Remove phrase match quotes "keyword"
    .replace(/^\+/, '')            // Remove modified broad +keyword
    .trim();
}

/**
 * Clean all keywords in an array - removes match type formatting
 */
export function cleanKeywords(keywords: string[]): string[] {
  return keywords.map(kw => cleanKeyword(kw)).filter(kw => kw.length > 0);
}

/**
 * Export cleanKeyword for use in other modules
 */
export { cleanKeyword };

// ============================================================================
// INTENT DETECTION
// ============================================================================

/**
 * Detect user intent from keywords and industry
 */
export function detectUserIntent(keywords: string[], industry: string): UserIntent {
  // Clean keywords before processing (remove match type brackets)
  const cleanedKeywords = cleanKeywords(keywords);
  const keywordString = cleanedKeywords.join(' ').toLowerCase();
  
  // Emergency signals
  const emergencySignals = ['emergency', '24/7', 'urgent', 'now', 'immediate', 'asap', 'tonight', 'today'];
  if (emergencySignals.some(signal => keywordString.includes(signal))) {
    return UserIntent.EMERGENCY;
  }
  
  // Product signals
  const productSignals = ['buy', 'purchase', 'order', 'shop', 'price', 'cost', 'cheap', 'best', 'top', 'review'];
  if (productSignals.some(signal => keywordString.includes(signal))) {
    return UserIntent.PRODUCT;
  }
  
  // Local signals
  const localSignals = ['near me', 'nearby', 'in my area', 'local', 'closest'];
  const hasLocationKeyword = /\b(in|near|around)\s+\w+/.test(keywordString);
  if (localSignals.some(signal => keywordString.includes(signal)) || hasLocationKeyword) {
    return UserIntent.LOCAL;
  }
  
  // Informational signals
  const infoSignals = ['how to', 'what is', 'why', 'guide', 'tutorial', 'tips', 'learn'];
  if (infoSignals.some(signal => keywordString.includes(signal))) {
    return UserIntent.INFORMATIONAL;
  }
  
  // Service signals (default for service industries)
  const serviceSignals = ['service', 'repair', 'fix', 'install', 'hire', 'need', 'looking for'];
  if (serviceSignals.some(signal => keywordString.includes(signal))) {
    return UserIntent.SERVICE;
  }
  
  // Default based on industry
  const serviceIndustries = ['plumbing', 'electrical', 'hvac', 'legal', 'medical', 'dental', 'cleaning', 'services', 'service'];
  const industryLower = industry.toLowerCase();
  if (serviceIndustries.includes(industryLower) || industryLower.includes('service')) {
    return UserIntent.SERVICE;
  }
  
  // If industry contains product-related terms, return PRODUCT
  const productIndustries = ['product', 'products', 'shop', 'store', 'retail', 'ecommerce'];
  if (productIndustries.some(term => industryLower.includes(term))) {
    return UserIntent.PRODUCT;
  }
  
  // Default to SERVICE if industry is ambiguous (most businesses are service-based)
  return UserIntent.SERVICE;
}

// ============================================================================
// AD COPY GENERATION BY INTENT
// ============================================================================

/**
 * Generate ad copy templates based on user intent
 */
export function generateAdCopyByIntent(intent: UserIntent, input: AdGenerationInput): AdCopyTemplates {
  const { businessName, location, industry, filters } = input;
  // CRITICAL: Clean keywords from match type brackets before using in ad copy
  const keywords = cleanKeywords(input.keywords);
  const mainKeyword = keywords[0] || industry;
  
  switch (intent) {
    case UserIntent.SERVICE:
      return generateServiceAdCopy(input, mainKeyword, businessName, location, industry, filters);
    
    case UserIntent.PRODUCT:
      return generateProductAdCopy(input, mainKeyword, businessName, location, industry, filters);
    
    case UserIntent.EMERGENCY:
      return generateEmergencyAdCopy(input, mainKeyword, businessName, location, industry, filters);
    
    case UserIntent.LOCAL:
      return generateLocalAdCopy(input, mainKeyword, businessName, location, industry, filters);
    
    case UserIntent.INFORMATIONAL:
      return generateInformationalAdCopy(input, mainKeyword, businessName, location, industry, filters);
    
    default:
      return generateServiceAdCopy(input, mainKeyword, businessName, location, industry, filters);
  }
}

function generateServiceAdCopy(
  input: AdGenerationInput,
  mainKeyword: string,
  businessName: string,
  location: string | undefined,
  industry: string,
  filters: AdGenerationInput['filters']
): AdCopyTemplates {
  // CRITICAL: Clean keywords from match type brackets before using in ad copy
  const cleanedKeywords = cleanKeywords(input.keywords);
  // Use multiple keywords for variety
  const keyword1 = cleanedKeywords[0] || mainKeyword;
  const keyword2 = cleanedKeywords[1] || keyword1;
  const keyword3 = cleanedKeywords[2] || keyword1;
  
  // Format keywords for headlines (capitalize, truncate)
  const formatKeyword = (kw: string, maxLen: number = 20) => {
    const formatted = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return formatted.length > maxLen ? formatted.substring(0, maxLen) : formatted;
  };
  
  const kw1 = formatKeyword(keyword1);
  const kw2 = formatKeyword(keyword2);
  
  const headlines: string[] = [
    // Keyword-focused (use actual keywords)
    `${kw1} Services`,
    `Professional ${kw1}`,
    `Expert ${kw1} Help`,
    `${kw1} Near You`,
    `Top Rated ${kw1}`,
    
    // Use second keyword for variety
    ...(keyword2 !== keyword1 ? [`${kw2} Services`, `Best ${kw2}`] : []),
    
    // Trust builders
    `Licensed & Insured ${industry}`,
    `Trusted ${businessName}`,
    `${businessName} Experts`,
    
    // Value propositions
    `Free ${kw1} Estimates`,
    `Affordable ${kw1}`,
    `Quality ${industry} Service`,
    
    // Location-based
    ...(location ? [`${location} ${kw1}`, `Local ${kw1} Experts`] : []),
    
    // Action-oriented
    `Get ${kw1} Help Today`,
    `Book ${kw1} Now`,
    `Call for ${kw1} Service`,
  ];

  // Add USP headlines
  if (filters.uniqueSellingPoints) {
    filters.uniqueSellingPoints.forEach(usp => {
      if (usp.length <= 30) {
        headlines.push(usp);
      }
    });
  }

  const descriptions: string[] = [
    `Professional ${kw1} services you can trust. ${businessName} offers expert solutions for all your ${keyword1} needs. Licensed, insured and satisfaction guaranteed.`,
    `Looking for reliable ${kw1}. We provide fast, affordable ${keyword1} services${location ? ` in ${location}` : ''}. Free estimates. Call now or book online.`,
    `${businessName} - Your local ${kw1} experts. From ${keyword1} to ${keyword2 || keyword1}, we handle it all. 5-star rated. Available 7 days a week.`,
    `Expert ${kw1} at fair prices. Our certified technicians deliver quality ${keyword1} workmanship. Same-day service available. Get your free quote today.`
  ];

  return {
    headlines,
    descriptions,
    ctaVariations: ['Call Now', 'Get Quote', 'Book Online', 'Schedule Service', 'Contact Us']
  };
}

function generateProductAdCopy(
  input: AdGenerationInput,
  mainKeyword: string,
  businessName: string,
  location: string | undefined,
  industry: string,
  filters: AdGenerationInput['filters']
): AdCopyTemplates {
  const headlines: string[] = [
    // Product-focused
    `Buy ${mainKeyword} Online`,
    `Shop ${mainKeyword} Deals`,
    `${mainKeyword} - Best Prices`,
    
    // Value/Price focused
    `${mainKeyword} Sale - Save Now`,
    `Cheap ${mainKeyword} Prices`,
    `${mainKeyword} Starting at $XX`,
    
    // Trust/Quality
    `Official ${mainKeyword} Store`,
    `Genuine ${mainKeyword} Products`,
    `Top-Rated ${mainKeyword}`,
    
    // Urgency
    `${mainKeyword} - Limited Stock`,
    `${mainKeyword} Deals End Soon`,
    
    // Shipping/Delivery
    `Free Shipping on ${mainKeyword}`,
    `${mainKeyword} - Next Day Delivery`,
    
    // Comparison
    `Best ${mainKeyword} of 2025`,
    `Compare ${mainKeyword} Models`
  ];

  const descriptions: string[] = [
    `Shop ${mainKeyword} at ${businessName}. Best prices guaranteed. Free shipping on orders over $50. Easy returns. Buy with confidence today.`,
    `Looking for ${mainKeyword}. Browse our huge selection at unbeatable prices. Customer reviews, fast delivery and hassle-free returns. Shop now.`,
    `${businessName} - Your trusted ${mainKeyword} destination. Compare models, read reviews and find the perfect fit. Price match guarantee available.`,
    `Get the best ${mainKeyword} deals online. Quality products, verified sellers, secure checkout. Order now and save up to 30 percent.`
  ];

  return {
    headlines,
    descriptions,
    ctaVariations: ['Shop Now', 'Buy Today', 'Order Now', 'Add to Cart', 'View Deals']
  };
}

function generateEmergencyAdCopy(
  input: AdGenerationInput,
  mainKeyword: string,
  businessName: string,
  location: string | undefined,
  industry: string,
  filters: AdGenerationInput['filters']
): AdCopyTemplates {
  // CRITICAL: Clean keywords from match type brackets before using in ad copy
  const cleanedKeywords = cleanKeywords(input.keywords);
  const keyword1 = cleanedKeywords[0] || mainKeyword;
  const keyword2 = cleanedKeywords[1] || keyword1;
  const formatKeyword = (kw: string, maxLen: number = 20) => {
    const formatted = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return formatted.length > maxLen ? formatted.substring(0, maxLen) : formatted;
  };
  const kw1 = formatKeyword(keyword1);
  
  const headlines: string[] = [
    // Urgency-focused (use actual keywords)
    `24 Hour Emergency ${kw1}`,
    `${kw1} - Open Now`,
    `Urgent ${kw1} Help`,
    
    // Speed-focused
    `Fast ${kw1} Response`,
    `${kw1} in 30 Minutes`,
    `Same Hour ${kw1} Service`,
    
    // Availability
    `${kw1} Available Now`,
    `Night & Weekend ${kw1}`,
    `Holiday ${kw1} Service`,
    
    // Problem-solution
    `Emergency ${kw1} Fix`,
    `${kw1} Crisis - Call Now`,
    `Immediate ${kw1} Help`,
    
    // Trust in emergency
    `Licensed Emergency ${kw1}`,
    `Trusted 24 Hour ${kw1}`
  ];

  const descriptions: string[] = [
    `${kw1} emergency - We are here around the clock. ${businessName} offers rapid response for all urgent ${keyword1} issues. Call now.`,
    `Our emergency ${kw1} team is available around the clock. Fast arrival, expert repairs, fair pricing. Call us immediately.`,
    `24 hour emergency ${keyword1} services${location ? ` in ${location}` : ''}. We understand urgency - that is why we respond in 30 minutes or less.`,
    `${kw1} emergency - ${businessName} has you covered day or night. Licensed professionals ready to solve your ${keyword1} crisis.`
  ];

  return {
    headlines,
    descriptions,
    ctaVariations: ['Call Now', 'Get Help Now', 'Emergency Line', 'Call 24/7', 'Immediate Help']
  };
}

function generateLocalAdCopy(
  input: AdGenerationInput,
  mainKeyword: string,
  businessName: string,
  location: string | undefined,
  industry: string,
  filters: AdGenerationInput['filters']
): AdCopyTemplates {
  if (!location) {
    // Fallback to service if no location
    return generateServiceAdCopy(input, mainKeyword, businessName, location, industry, filters);
  }

  const headlines: string[] = [
    // Location-prominent
    `${industry} in ${location}`,
    `${location} ${industry} Services`,
    `Local ${industry} Near You`,
    
    // Proximity
    `${industry} Close to You`,
    `Nearby ${industry} Experts`,
    `${location}'s Top ${industry}`,
    
    // Community trust
    `${location}'s Trusted ${industry}`,
    `Serving ${location} Since 20XX`,
    `${location} Family ${industry}`,
    
    // Local benefits
    `Fast Service in ${location}`,
    `${location} Same-Day Service`,
    `We Know ${location}`,
    
    // Reviews/reputation
    `Top ${industry} in ${location}`,
    `5-Star ${location} ${industry}`
  ];

  const descriptions: string[] = [
    `${businessName} - proudly serving ${location} for over X years. Local ${industry} experts who understand your community needs. Call your neighbors favorite.`,
    `Looking for ${industry} in ${location}. We are right around the corner. Fast response times, local expertise, community pricing. Book now.`,
    `${location} most trusted ${industry}. We live here, we work here, we care. ${businessName} offers reliable ${mainKeyword} services with a personal touch.`,
    `Why call an out-of-town ${industry}. ${businessName} is your local ${location} expert. Quick arrival, fair prices, community reputation. Call today.`
  ];

  return {
    headlines,
    descriptions,
    ctaVariations: ['Call Local', 'Visit Us', 'Get Directions', 'Book Local', 'Call Nearby']
  };
}

function generateInformationalAdCopy(
  input: AdGenerationInput,
  mainKeyword: string,
  businessName: string,
  location: string | undefined,
  industry: string,
  filters: AdGenerationInput['filters']
): AdCopyTemplates {
  const headlines: string[] = [
    // Educational
    `${mainKeyword} Guide 2025`,
    `Learn About ${mainKeyword}`,
    `${mainKeyword} Tips & Advice`,
    
    // Problem-solving
    `How to Fix ${mainKeyword}`,
    `${mainKeyword} Problems Solved`,
    `${mainKeyword} DIY vs Pro`,
    
    // Expert content
    `Expert ${mainKeyword} Advice`,
    `${mainKeyword} FAQ Answered`,
    `${industry} Expert Tips`,
    
    // Lead capture
    `Free ${mainKeyword} Guide`,
    `${mainKeyword} Checklist`,
    `When to Call a ${industry}`
  ];

  const descriptions: string[] = [
    `Got ${mainKeyword} questions. ${businessName} has answers. Browse our expert guides, tips and advice. Learn when to DIY and when to call a pro.`,
    `Understanding ${mainKeyword} does not have to be hard. Our free resources help you make informed decisions. Our experts are here to help.`,
    `${businessName} education center - Learn everything about ${mainKeyword}. Free guides, how-tos, and expert advice. Empower yourself with knowledge.`,
    `Not sure what you need. Our ${mainKeyword} resources help you understand your options. And when you are ready, we are here to help.`
  ];

  return {
    headlines,
    descriptions,
    ctaVariations: ['Learn More', 'Read Guide', 'Get Tips', 'Free Resources', 'Ask Expert']
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Truncate headline to character limit
 */
function truncateHeadline(headline: string, maxLength: number = 30): string {
  if (headline.length <= maxLength) return headline;
  return headline.slice(0, maxLength - 3) + '...';
}

/**
 * Insert keyword naturally into headline
 */
function insertKeyword(headline: string, keyword: string): string {
  if (headline.length + keyword.length + 3 <= 30) {
    return `${keyword} - ${headline}`;
  }
  return headline;
}

/**
 * Get theme from keyword cluster
 */
function getTheme(keywords: string[]): string {
  // Extract common theme (e.g., "plumbing" from ["plumber", "plumbing services", "plumbing repair"])
  const words = keywords.flatMap(k => k.toLowerCase().split(' '));
  const wordCounts = new Map<string, number>();
  
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  
  const sorted = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || keywords[0]?.split(' ')[0] || '';
}

/**
 * Generate A/B test variations
 */
function createABVariations(headlines: string[]): string[] {
  const variations: string[] = [];
  headlines.forEach(h => {
    variations.push(h);
    // Create variation with different CTA
    if (h.includes('Call')) {
      variations.push(h.replace('Call', 'Contact'));
    }
    if (h.includes('Buy')) {
      variations.push(h.replace('Buy', 'Shop'));
    }
  });
  return variations;
}

/**
 * Get related terms for broad match
 */
function getRelatedTerms(keyword: string, industry: string): string[] {
  const related: string[] = [];
  const keywordLower = keyword.toLowerCase();
  
  // Extract main term
  const mainTerm = keywordLower.split(' ')[0];
  related.push(mainTerm);
  
  // Add industry-related terms
  if (industry && !keywordLower.includes(industry.toLowerCase())) {
    related.push(industry.toLowerCase());
  }
  
  return related.slice(0, 3);
}

/**
 * Ensure phrase is included in headline
 */
function ensurePhraseInclusion(headline: string, phrase: string): string {
  if (headline.toLowerCase().includes(phrase.toLowerCase())) {
    return headline;
  }
  // Try to add phrase naturally
  const words = phrase.split(' ');
  if (headline.length + phrase.length + 1 <= 30) {
    return `${headline} ${phrase}`;
  }
  return headline;
}

/**
 * Generate USP headlines
 */
function generateUSPHeadlines(usps?: string[]): string[] {
  if (!usps) return [];
  return usps.filter(usp => usp.length <= 30);
}

/**
 * Get intent-based CTA
 */
function getIntentBasedCTA(intent: UserIntent): string {
  switch (intent) {
    case UserIntent.EMERGENCY:
      return 'Call Now - 24/7';
    case UserIntent.PRODUCT:
      return 'Shop Now';
    case UserIntent.LOCAL:
      return 'Visit Local';
    case UserIntent.INFORMATIONAL:
      return 'Learn More';
    default:
      return 'Get Started';
  }
}

/**
 * Generate final URL from business name
 */
function generateFinalUrl(businessName: string, baseUrl?: string): string {
  // Always prefer baseUrl if provided
  if (baseUrl) {
    // Ensure URL has protocol
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      return baseUrl;
    }
    return `https://${baseUrl}`;
  }
  // Fallback: generate from business name only if no baseUrl
  const cleanName = businessName.toLowerCase().replace(/\s+/g, '');
  return `https://${cleanName}.com`;
}

// ============================================================================
// AD BUILDERS
// ============================================================================

/**
 * Build Responsive Search Ad
 */
export function buildRSA(adCopy: AdCopyTemplates, input: AdGenerationInput): ResponsiveSearchAd {
  const { filters, businessName, location } = input;
  // CRITICAL: Clean keywords from match type brackets before using in ads
  const keywords = cleanKeywords(input.keywords);
  let headlines = [...adCopy.headlines];
  let descriptions = [...adCopy.descriptions];
  
  // Apply campaign structure filters
  switch (filters.campaignStructure) {
    case 'SKAG':
      // Single Keyword Ad Groups - Ultra relevant, keyword in every headline
      headlines = headlines.map(h => {
        if (!h.toLowerCase().includes(keywords[0]?.toLowerCase() || '')) {
          return insertKeyword(h, keywords[0] || '');
        }
        return h;
      });
      break;
      
    case 'STAG':
      // Single Theme Ad Groups - Theme-focused, related keywords
      const theme = getTheme(keywords);
      headlines.push(`${theme} Specialists`);
      headlines.push(`All ${theme} Services`);
      break;
      
    case 'IBAG':
      // Intent-Based Ad Groups - Focus on user intent
      const intentCTA = getIntentBasedCTA(detectUserIntent(keywords, input.industry));
      headlines.push(intentCTA);
      break;
      
    case 'Alpha-Beta':
      // Testing structure - Create variations
      headlines = createABVariations(headlines);
      break;
  }
  
  // Apply match type filters
  switch (filters.matchType) {
    case 'exact':
      // For exact match, headlines should be very specific
      headlines = headlines.filter(h => h.length <= 28);
      if (keywords[0]) {
        // Format keyword for headline (capitalize first letters)
        const formattedKw = keywords[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        headlines.unshift(`${formattedKw} Services`);
      }
      break;
      
    case 'phrase':
      // For phrase match, include the phrase naturally
      if (keywords[0]) {
        headlines = headlines.map(h => ensurePhraseInclusion(h, keywords[0]));
      }
      break;
      
    case 'broad':
      // For broad match, include more variations and related terms
      if (keywords[0]) {
        const relatedTerms = getRelatedTerms(keywords[0], input.industry);
        relatedTerms.forEach(term => {
          headlines.push(`${term} Experts`);
          headlines.push(`Professional ${term}`);
        });
      }
      break;
  }
  
  // Apply promotional filters
  if (filters.promotions && filters.promotions.length > 0) {
    filters.promotions.forEach(promo => {
      if (promo.length <= 30) {
        headlines.push(promo);
      }
    });
    descriptions = descriptions.map(d => {
      const promo = filters.promotions?.[0] || '';
      return `${promo}! ${d}`;
    });
  }
  
  // Apply USP filters
  if (filters.uniqueSellingPoints) {
    const uspHeadlines = generateUSPHeadlines(filters.uniqueSellingPoints);
    headlines.push(...uspHeadlines);
  }
  
  // Apply CTA filters
  if (filters.callToAction) {
    if (filters.callToAction.length <= 30) {
      headlines.push(filters.callToAction);
    }
    descriptions = descriptions.map(d => `${d} ${filters.callToAction}!`);
  }
  
  // Finalize & validate using Google Ads Rules guardrails
  // Remove duplicates and ensure uniqueness (per Google RSA requirements)
  headlines = ensureUniqueHeadlines(headlines);
  descriptions = ensureUniqueDescriptions(descriptions);
  
  // Apply character limits (30 for headlines, 90 for descriptions)
  headlines = headlines.slice(0, CHARACTER_LIMITS.RSA.HEADLINE_MAX_COUNT);
  descriptions = descriptions.slice(0, CHARACTER_LIMITS.RSA.DESCRIPTION_MAX_COUNT);
  
  // Ensure minimum requirements (3 headlines, 2 descriptions per Google policy)
  const fallbackHeadlines = [
    `${businessName} - Call Now`,
    `Professional ${input.industry}`,
    `Trusted Local Experts`
  ];
  while (headlines.length < CHARACTER_LIMITS.RSA.HEADLINE_MIN_COUNT) {
    const fallback = fallbackHeadlines[headlines.length] || `${businessName} Services`;
    if (!headlines.some(h => areHeadlinesSimilar(h, fallback))) {
      headlines.push(formatHeadline(fallback));
    } else {
      headlines.push(formatHeadline(`Quality ${input.industry} Service`));
    }
  }
  
  const fallbackDescriptions = [
    `Contact ${businessName} today for professional ${input.industry} services${location ? ` in ${location}` : ''}. Licensed and insured.`,
    `Get expert ${input.industry} help from trusted professionals. Free estimates available. Call now.`
  ];
  while (descriptions.length < CHARACTER_LIMITS.RSA.DESCRIPTION_MIN_COUNT) {
    const fallback = fallbackDescriptions[descriptions.length] || fallbackDescriptions[0];
    descriptions.push(formatDescription(fallback));
  }
  
  // Generate display path
  const industryPath = input.industry.toLowerCase().slice(0, 15);
  const displayPath = [industryPath, 'services'].slice(0, 2);
  
  return {
    headlines: headlines.slice(0, 15),
    descriptions: descriptions.slice(0, 4),
    finalUrl: generateFinalUrl(businessName, input.baseUrl),
    displayPath
  };
}

/**
 * Apply DKI (Dynamic Keyword Insertion) syntax to ad text
 * Properly truncates the default text to fit within character limits
 * 
 * @param text - The original ad text
 * @param mainKeyword - The keyword to use in DKI syntax
 * @param fieldType - 'headline' (30 char limit) or 'description' (90 char limit)
 */
function applyDKISyntax(text: string, mainKeyword: string, fieldType: 'headline' | 'description' = 'headline'): string {
  const maxLength = fieldType === 'headline' 
    ? CHARACTER_LIMITS.RSA.HEADLINE 
    : CHARACTER_LIMITS.RSA.DESCRIPTION;
  
  // Replace keyword mentions with {KeyWord:fallback} syntax
  // This allows Google Ads to dynamically insert the keyword
  const firstWord = mainKeyword.split(' ')[0];
  if (!firstWord) return text;
  
  const keywordRegex = new RegExp(`\\b${firstWord}\\w*\\b`, 'gi');
  if (keywordRegex.test(text)) {
    // Calculate available space for DKI default text
    // Find position of keyword in text to calculate prefix length
    const match = text.match(new RegExp(`\\b${firstWord}\\w*\\b`, 'i'));
    const prefixLength = match?.index || 0;
    const matchLength = match?.[0]?.length || 0;
    const suffixLength = text.length - prefixLength - matchLength;
    
    // DKI wrapper is {KeyWord:} = 10 characters
    const dkiWrapperLength = 10;
    const availableForDefault = maxLength - prefixLength - suffixLength - dkiWrapperLength;
    
    // Build properly-sized DKI default text
    const safeDefault = buildDKIDefault(mainKeyword, Math.max(5, availableForDefault), 'KeyWord');
    
    // Replace first occurrence of keyword with {KeyWord:safeDefault}
    return text.replace(
      new RegExp(`\\b${firstWord}\\w*\\b`, 'i'),
      `{KeyWord:${safeDefault}}`
    );
  }
  return text;
}

/**
 * Build Expanded Text Ad with DKI (Dynamic Keyword Insertion) syntax
 * Ensures all DKI default text fits within character limits
 */
export function buildETA(adCopy: AdCopyTemplates, input: AdGenerationInput): ExpandedTextAd {
  const rsa = buildRSA(adCopy, input);
  // CRITICAL: Clean the main keyword from match type brackets before DKI insertion
  const cleanedKeywords = cleanKeywords(input.keywords);
  const mainKeyword = cleanedKeywords[0] || 'service';
  
  // Apply DKI syntax to headlines (30 char limit)
  const h1 = applyDKISyntax(rsa.headlines[0] || '', mainKeyword, 'headline');
  const h2 = applyDKISyntax(rsa.headlines[1] || '', mainKeyword, 'headline');
  const h3 = rsa.headlines[2] ? applyDKISyntax(rsa.headlines[2], mainKeyword, 'headline') : undefined;
  
  // Apply DKI syntax to descriptions (90 char limit)
  const d1 = applyDKISyntax(rsa.descriptions[0] || '', mainKeyword, 'description');
  const d2 = rsa.descriptions[1] ? applyDKISyntax(rsa.descriptions[1], mainKeyword, 'description') : undefined;
  
  return {
    headline1: truncateHeadline(h1, 30),
    headline2: truncateHeadline(h2, 30),
    headline3: h3 ? truncateHeadline(h3, 30) : undefined,
    description1: truncateHeadline(d1, 90),
    description2: d2 ? truncateHeadline(d2, 90) : undefined,
    finalUrl: rsa.finalUrl,
    displayPath: rsa.displayPath
  };
}

/**
 * Build Call-Only Ad
 */
export function buildCallOnlyAd(adCopy: AdCopyTemplates, input: AdGenerationInput): CallOnlyAd {
  const { businessName, filters } = input;
  const rsa = buildRSA(adCopy, input);
  
  return {
    businessName: truncateHeadline(businessName, 25),
    headline1: truncateHeadline(rsa.headlines[0] || '', 30),
    headline2: truncateHeadline(rsa.headlines[1] || '', 30),
    description1: truncateHeadline(rsa.descriptions[0] || '', 90),
    description2: truncateHeadline(rsa.descriptions[1] || rsa.descriptions[0] || '', 90),
    phoneNumber: '', // Should be provided separately
    verificationUrl: rsa.finalUrl,
    displayPath: rsa.displayPath
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Master ad generation function
 */
export function generateAds(input: AdGenerationInput): ResponsiveSearchAd | ExpandedTextAd | CallOnlyAd {
  const intent = detectUserIntent(input.keywords, input.industry);
  const adCopy = generateAdCopyByIntent(intent, input);
  
  switch (input.adType) {
    case 'RSA':
      return buildRSA(adCopy, input);
    case 'ETA':
      return buildETA(adCopy, input);
    case 'CALL_ONLY':
      return buildCallOnlyAd(adCopy, input);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate ad before submission
 */
export function validateAd(ad: ResponsiveSearchAd | ExpandedTextAd | CallOnlyAd, adType: AdType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (adType === 'RSA') {
    const rsa = ad as ResponsiveSearchAd;
    
    // Check headline count
    if (rsa.headlines.length < 3) errors.push('Minimum 3 headlines required');
    if (rsa.headlines.length > 15) errors.push('Maximum 15 headlines allowed');
    
    // Check description count
    if (rsa.descriptions.length < 2) errors.push('Minimum 2 descriptions required');
    if (rsa.descriptions.length > 4) errors.push('Maximum 4 descriptions allowed');
    
    // Check character limits
    rsa.headlines.forEach((h, i) => {
      if (h.length > 30) errors.push(`Headline ${i + 1} exceeds 30 characters`);
    });
    
    rsa.descriptions.forEach((d, i) => {
      if (d.length > 90) errors.push(`Description ${i + 1} exceeds 90 characters`);
    });
    
    // Check for duplicate content
    const uniqueHeadlines = new Set(rsa.headlines.map(h => h.toLowerCase()));
    if (uniqueHeadlines.size < rsa.headlines.length) {
      warnings.push('Duplicate headlines detected');
    }
  } else if (adType === 'ETA') {
    const eta = ad as ExpandedTextAd;
    
    if (!eta.headline1 || eta.headline1.length > 30) errors.push('Headline 1 invalid');
    if (!eta.headline2 || eta.headline2.length > 30) errors.push('Headline 2 invalid');
    if (eta.headline3 && eta.headline3.length > 30) errors.push('Headline 3 exceeds 30 characters');
    if (!eta.description1 || eta.description1.length > 90) errors.push('Description 1 invalid');
    if (eta.description2 && eta.description2.length > 90) errors.push('Description 2 exceeds 90 characters');
  } else if (adType === 'CALL_ONLY') {
    const callAd = ad as CallOnlyAd;
    
    if (!callAd.businessName || callAd.businessName.length > 25) errors.push('Business name invalid');
    if (!callAd.headline1 || callAd.headline1.length > 30) errors.push('Headline 1 invalid');
    if (!callAd.headline2 || callAd.headline2.length > 30) errors.push('Headline 2 invalid');
    if (!callAd.description1 || callAd.description1.length > 90) errors.push('Description 1 invalid');
    if (!callAd.description2 || callAd.description2.length > 90) errors.push('Description 2 invalid');
    if (!callAd.phoneNumber) errors.push('Phone number required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

