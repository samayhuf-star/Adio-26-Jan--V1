/**
 * Google Ads Rules & Guidelines
 * 
 * GUARDRAILS for all ad generation in Adiology
 * Based on official Google Search Ads policies for RSA, DKI, and Call-Only ads
 */

// ============================================================================
// CHARACTER LIMITS
// ============================================================================

export const CHARACTER_LIMITS = {
  RSA: {
    HEADLINE: 30,
    HEADLINE_MIN_COUNT: 3,
    HEADLINE_MAX_COUNT: 15,
    DESCRIPTION: 90,
    DESCRIPTION_MIN_COUNT: 2,
    DESCRIPTION_MAX_COUNT: 4,
    DISPLAY_PATH: 15,
  },
  CALL_ONLY: {
    HEADLINE: 30,
    HEADLINE_COUNT: 2,
    DESCRIPTION: 90,
    DESCRIPTION_COUNT: 2,
    BUSINESS_NAME: 25,
  },
  DKI: {
    SYNTAX_PATTERN: /\{(keyword|Keyword|KeyWord|KEYWord):([^}]+)\}/g,
  }
} as const;

// ============================================================================
// DKI CAPITALIZATION OPTIONS
// ============================================================================

export type DKICapitalization = 'keyword' | 'Keyword' | 'KeyWord' | 'KEYWord';

export const DKI_CAPITALIZATION = {
  'keyword': 'All lowercase (emergency plumber)',
  'Keyword': 'First word capital (Emergency plumber)',
  'KeyWord': 'Each word capital (Emergency Plumber)',
  'KEYWord': 'First letters caps (EMERGENCY Plumber)',
} as const;

// ============================================================================
// DKI DEFAULT TEXT BUILDER
// ============================================================================

/**
 * Build a properly-sized DKI default text that fits within character limits
 * 
 * @param keyword - The keyword to use as default text
 * @param maxLength - Maximum allowed characters (typically 30 for headlines, 90 for descriptions)
 * @param capitalization - DKI capitalization style to apply
 * @returns Truncated and properly capitalized default text
 */
export function buildDKIDefault(
  keyword: string,
  maxLength: number = CHARACTER_LIMITS.RSA.HEADLINE,
  capitalization: DKICapitalization = 'KeyWord'
): string {
  if (!keyword || keyword.trim().length === 0) {
    return 'Service';
  }

  let text = keyword.trim();
  
  // If already fits, just apply capitalization
  if (text.length <= maxLength) {
    return applyDKICapitalization(text, capitalization);
  }

  // Strategy 1: Try using first N words that fit
  const words = text.split(/\s+/);
  let truncated = '';
  
  for (const word of words) {
    const candidate = truncated ? `${truncated} ${word}` : word;
    if (candidate.length <= maxLength) {
      truncated = candidate;
    } else {
      break;
    }
  }

  // Strategy 2: If first word is still too long, use a short generic fallback
  // Never truncate a word in the middle as it looks unprofessional
  if (!truncated && words[0]) {
    // If first word fits, use it; otherwise use a short generic term
    if (words[0].length <= maxLength) {
      truncated = words[0];
    } else {
      // Use progressively shorter fallbacks that always fit
      const fallbacks = ['Services', 'Service', 'Help', 'Pro'];
      truncated = fallbacks.find(f => f.length <= maxLength) || 'Pro';
    }
  }

  // Strategy 3: If still empty, use a safe default
  if (!truncated) {
    truncated = 'Service';
  }

  return applyDKICapitalization(truncated, capitalization);
}

/**
 * Apply DKI capitalization style to text
 */
export function applyDKICapitalization(text: string, style: DKICapitalization): string {
  if (!text) return text;
  
  switch (style) {
    case 'keyword':
      return text.toLowerCase();
    case 'Keyword':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case 'KeyWord':
      return text
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'KEYWord':
      const words = text.split(/\s+/);
      return words
        .map((word, idx) => idx === 0 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    default:
      return text;
  }
}

/**
 * Format a complete DKI insertion syntax with properly-sized default text
 * 
 * @param keyword - The keyword to use as default
 * @param fieldType - 'headline' or 'description' to determine character limit
 * @param capitalization - DKI capitalization style
 * @param prefixText - Any text before the DKI (to account for total length)
 * @param suffixText - Any text after the DKI (to account for total length)
 * @returns Complete DKI syntax like {KeyWord:Default Text}
 */
export function formatDKIWithLimit(
  keyword: string,
  fieldType: 'headline' | 'description' = 'headline',
  capitalization: DKICapitalization = 'KeyWord',
  prefixText: string = '',
  suffixText: string = ''
): string {
  const maxLength = fieldType === 'headline' 
    ? CHARACTER_LIMITS.RSA.HEADLINE 
    : CHARACTER_LIMITS.RSA.DESCRIPTION;
  
  // Calculate available space for the default text
  // DKI syntax is {KeyWord:default} - we need to account for the wrapper
  const wrapperLength = `{${capitalization}:}`.length;
  const contextLength = prefixText.length + suffixText.length;
  const availableForDefault = maxLength - wrapperLength - contextLength;
  
  // Build the properly-sized default text
  const defaultText = buildDKIDefault(keyword, Math.max(5, availableForDefault), capitalization);
  
  return `{${capitalization}:${defaultText}}`;
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

export interface RSAValidationResult {
  valid: boolean;
  headlineErrors: string[];
  descriptionErrors: string[];
  uniquenessErrors: string[];
  warnings: string[];
  adStrength: 'Incomplete' | 'Poor' | 'Average' | 'Good' | 'Excellent';
}

export interface DKIValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  defaultTextValid: boolean;
  syntaxValid: boolean;
}

export interface CallOnlyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  phoneValid: boolean;
  businessNameValid: boolean;
}

// ============================================================================
// RSA VALIDATION RULES
// ============================================================================

/**
 * Check if two strings are too similar (near-duplicate)
 * Enhanced to meet Google's "substantially different" requirement
 */
export function areHeadlinesSimilar(h1: string, h2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n1 = normalize(h1);
  const n2 = normalize(h2);
  
  if (n1 === n2) return true;
  
  // Google requires headlines to be "substantially different"
  // More strict similarity check - if less than 40% different, too similar
  const distance = levenshteinDistance(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen > 0 && distance / maxLen < 0.4) return true;
  
  // Check if one is just plural/singular of other
  if (n1 + 's' === n2 || n2 + 's' === n1) return true;
  if (n1.replace(/s$/, '') === n2 || n2.replace(/s$/, '') === n1) return true;
  
  // Check if headlines start with same 3+ words (Google considers this too similar)
  const words1 = h1.toLowerCase().split(/\s+/);
  const words2 = h2.toLowerCase().split(/\s+/);
  if (words1.length >= 3 && words2.length >= 3) {
    const first3Words1 = words1.slice(0, 3).join(' ');
    const first3Words2 = words2.slice(0, 3).join(' ');
    if (first3Words1 === first3Words2) return true;
  }
  
  // Check for common patterns that Google considers too similar
  const pattern1 = h1.toLowerCase().replace(/\b(get|call|free|best|top|quality)\b/g, 'X');
  const pattern2 = h2.toLowerCase().replace(/\b(get|call|free|best|top|quality)\b/g, 'X');
  if (pattern1 === pattern2 && pattern1.includes('X')) return true;
  
  return false;
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Validate RSA headlines against Google rules
 */
export function validateRSAHeadlines(headlines: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check minimum count
  if (headlines.length < CHARACTER_LIMITS.RSA.HEADLINE_MIN_COUNT) {
    errors.push(`RSA requires minimum ${CHARACTER_LIMITS.RSA.HEADLINE_MIN_COUNT} headlines (found ${headlines.length})`);
  }
  
  // Check maximum count
  if (headlines.length > CHARACTER_LIMITS.RSA.HEADLINE_MAX_COUNT) {
    errors.push(`RSA allows maximum ${CHARACTER_LIMITS.RSA.HEADLINE_MAX_COUNT} headlines (found ${headlines.length})`);
  }
  
  // Check character limits
  headlines.forEach((h, i) => {
    if (h.length > CHARACTER_LIMITS.RSA.HEADLINE) {
      errors.push(`Headline ${i + 1} exceeds ${CHARACTER_LIMITS.RSA.HEADLINE} characters (${h.length} chars)`);
    }
    if (h.trim().length === 0) {
      errors.push(`Headline ${i + 1} is empty`);
    }
  });
  
  // Check uniqueness - headlines must be substantially different
  for (let i = 0; i < headlines.length; i++) {
    for (let j = i + 1; j < headlines.length; j++) {
      if (areHeadlinesSimilar(headlines[i], headlines[j])) {
        errors.push(`Headlines ${i + 1} and ${j + 1} are too similar - each headline must be substantially different`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate RSA descriptions against Google rules
 */
export function validateRSADescriptions(descriptions: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check minimum count
  if (descriptions.length < CHARACTER_LIMITS.RSA.DESCRIPTION_MIN_COUNT) {
    errors.push(`RSA requires minimum ${CHARACTER_LIMITS.RSA.DESCRIPTION_MIN_COUNT} descriptions (found ${descriptions.length})`);
  }
  
  // Check maximum count
  if (descriptions.length > CHARACTER_LIMITS.RSA.DESCRIPTION_MAX_COUNT) {
    errors.push(`RSA allows maximum ${CHARACTER_LIMITS.RSA.DESCRIPTION_MAX_COUNT} descriptions (found ${descriptions.length})`);
  }
  
  // Check character limits
  descriptions.forEach((d, i) => {
    if (d.length > CHARACTER_LIMITS.RSA.DESCRIPTION) {
      errors.push(`Description ${i + 1} exceeds ${CHARACTER_LIMITS.RSA.DESCRIPTION} characters (${d.length} chars)`);
    }
    if (d.trim().length === 0) {
      errors.push(`Description ${i + 1} is empty`);
    }
  });
  
  // Check uniqueness - descriptions must be substantially different
  for (let i = 0; i < descriptions.length; i++) {
    for (let j = i + 1; j < descriptions.length; j++) {
      if (areHeadlinesSimilar(descriptions[i], descriptions[j])) {
        errors.push(`Descriptions ${i + 1} and ${j + 1} are too similar - each description must be substantially different`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate RSA Ad Strength based on Google's criteria
 */
export function calculateAdStrength(
  headlines: string[],
  descriptions: string[],
  hasKeywordsInHeadlines: boolean = true
): RSAValidationResult['adStrength'] {
  let score = 0;
  
  // Headlines score (0-40 points)
  if (headlines.length >= 15) score += 40;
  else if (headlines.length >= 10) score += 30;
  else if (headlines.length >= 5) score += 20;
  else if (headlines.length >= 3) score += 10;
  
  // Descriptions score (0-30 points)
  if (descriptions.length >= 4) score += 30;
  else if (descriptions.length >= 3) score += 20;
  else if (descriptions.length >= 2) score += 10;
  
  // Keywords in headlines (0-15 points)
  if (hasKeywordsInHeadlines) score += 15;
  
  // Uniqueness and variety (0-15 points)
  const headlineValidation = validateRSAHeadlines(headlines);
  const descValidation = validateRSADescriptions(descriptions);
  if (headlineValidation.valid && descValidation.valid) score += 15;
  
  // Determine strength
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Average';
  if (score >= 25) return 'Poor';
  return 'Incomplete';
}

/**
 * Full RSA validation
 */
export function validateRSA(
  headlines: string[],
  descriptions: string[],
  displayPaths: string[] = []
): RSAValidationResult {
  const headlineResult = validateRSAHeadlines(headlines);
  const descResult = validateRSADescriptions(descriptions);
  const warnings: string[] = [];
  
  // Check display paths
  displayPaths.forEach((p, i) => {
    if (p.length > CHARACTER_LIMITS.RSA.DISPLAY_PATH) {
      warnings.push(`Display path ${i + 1} exceeds 15 characters`);
    }
  });
  
  // Check for keywords in headlines
  const hasKeywordsInHeadlines = true; // Assume true for now
  
  // Warnings for best practices
  if (headlines.length < 10) {
    warnings.push('For best performance, add 10-15 unique headlines');
  }
  if (descriptions.length < 4) {
    warnings.push('For best performance, add 4 unique descriptions');
  }
  
  return {
    valid: headlineResult.valid && descResult.valid,
    headlineErrors: headlineResult.errors,
    descriptionErrors: descResult.errors,
    uniquenessErrors: [],
    warnings,
    adStrength: calculateAdStrength(headlines, descriptions, hasKeywordsInHeadlines)
  };
}

// ============================================================================
// DKI VALIDATION RULES
// ============================================================================

/**
 * Validate DKI syntax with enhanced Google Ads compliance
 */
export function validateDKISyntax(text: string): DKIValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Find all DKI patterns
  const dkiPattern = /\{(keyword|Keyword|KeyWord|KEYWord):([^}]*)\}/g;
  const matches = [...text.matchAll(dkiPattern)];
  
  // Check for multiple DKI in same field (not allowed)
  if (matches.length > 1) {
    errors.push('Only one DKI insertion allowed per text field');
  }
  
  // Check for quotes around DKI (prohibited)
  if (text.includes('"{') && text.includes('}"') || text.includes("'{") && text.includes("'}")) {
    errors.push('DKI syntax must not be enclosed in quotes. Use {KeyWord:Default} not "{KeyWord:Default}"');
  }
  
  // Check for invalid syntax
  const invalidPattern = /\{([^}:]+):([^}]*)\}/g;
  const allMatches = [...text.matchAll(invalidPattern)];
  for (const match of allMatches) {
    const keyword = match[1];
    if (!['keyword', 'Keyword', 'KeyWord', 'KEYWord'].includes(keyword)) {
      errors.push(`Invalid DKI syntax: ${match[0]}. Use {keyword:}, {Keyword:}, {KeyWord:}, or {KEYWord:}`);
    }
  }
  
  // Validate default text
  let defaultTextValid = true;
  for (const match of matches) {
    const defaultText = match[2];
    
    // Check if default text is empty
    if (!defaultText || defaultText.trim().length === 0) {
      errors.push('DKI default text cannot be empty');
      defaultTextValid = false;
    }
    
    // Check character limits for headlines (30) and descriptions (90)
    const isLikelyHeadline = text.length <= 50;
    const maxLen = isLikelyHeadline ? 30 : 90;
    
    // Calculate total length with default
    const withDefault = text.replace(match[0], defaultText);
    if (withDefault.length > maxLen) {
      errors.push(`With default text, exceeds ${maxLen} character limit (${withDefault.length} chars)`);
      defaultTextValid = false;
    }
    
    // Enhanced grammar validation
    const textBefore = text.substring(0, text.indexOf(match[0]));
    const textAfter = text.substring(text.indexOf(match[0]) + match[0].length);
    
    // Check for common grammar issues
    if (textBefore.endsWith('a ') && !defaultText.match(/^[aeiou]/i)) {
      warnings.push('Grammar issue: "a [keyword]" may not work with consonant-starting keywords. Consider "a/an" or rephrase.');
    }
    if (textBefore.endsWith('an ') && !defaultText.match(/^[aeiou]/i)) {
      warnings.push('Grammar issue: "an [keyword]" may not work with consonant-starting keywords');
    }
    if (textBefore.match(/\b(is|are)\s*$/i) && defaultText.includes(' ')) {
      warnings.push('Grammar issue: Plural keywords with singular verb form may create grammar errors');
    }
    
    // Check for promotional text in default (not recommended)
    const promotionalWords = ['best', 'top', '#1', 'leading', 'premier'];
    if (promotionalWords.some(word => defaultText.toLowerCase().includes(word))) {
      warnings.push('Avoid promotional words in DKI default text - use neutral service/product names');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    defaultTextValid,
    syntaxValid: matches.length > 0 || !text.includes('{')
  };
}

/**
 * Format text with DKI
 */
export function formatDKI(
  template: string,
  keyword: string,
  capitalization: DKICapitalization = 'KeyWord'
): string {
  let formattedKeyword = keyword;
  
  switch (capitalization) {
    case 'keyword':
      formattedKeyword = keyword.toLowerCase();
      break;
    case 'Keyword':
      formattedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
      break;
    case 'KeyWord':
      formattedKeyword = keyword.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      break;
    case 'KEYWord':
      formattedKeyword = keyword.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.charAt(1).toUpperCase() + w.slice(2).toLowerCase())
        .join(' ');
      break;
  }
  
  return template.replace(
    /\{(keyword|Keyword|KeyWord|KEYWord):([^}]+)\}/g,
    formattedKeyword
  );
}

// ============================================================================
// CALL-ONLY AD VALIDATION RULES
// ============================================================================

/**
 * Validate phone number format with enhanced Google Ads compliance
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // Remove formatting
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check for premium rate numbers (prohibited by Google)
  if (/^1?(900|976|550|540)/.test(cleaned)) {
    return { valid: false, error: 'Premium-rate phone numbers (900, 976, 550, 540) are prohibited' };
  }
  
  // Check for international premium numbers
  if (/^(\+1900|\+1976)/.test(cleaned)) {
    return { valid: false, error: 'International premium-rate numbers are prohibited' };
  }
  
  // Check for fake/test numbers
  const fakePatterns = ['5551234567', '1234567890', '0000000000', '1111111111'];
  if (fakePatterns.includes(cleaned)) {
    return { valid: false, error: 'Test/fake phone numbers are not allowed' };
  }
  
  // US format check
  const usPattern = /^1?\d{10}$/;
  const intlPattern = /^\+\d{10,15}$/;
  const tollFreePattern = /^1?8(00|33|44|55|66|77|88)\d{7}$/;
  
  if (usPattern.test(cleaned) || intlPattern.test(cleaned) || tollFreePattern.test(cleaned)) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Invalid phone number format. Use US format (10 digits) or international format (+country code)' };
}

/**
 * Validate Call-Only ad with enhanced Google Ads compliance
 */
export function validateCallOnlyAd(ad: {
  headlines: string[];
  descriptions: string[];
  businessName: string;
  phoneNumber: string;
  verificationUrl?: string;
}): CallOnlyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate headlines (exactly 2)
  if (ad.headlines.length !== CHARACTER_LIMITS.CALL_ONLY.HEADLINE_COUNT) {
    errors.push(`Call-Only ads require exactly ${CHARACTER_LIMITS.CALL_ONLY.HEADLINE_COUNT} headlines`);
  }
  ad.headlines.forEach((h, i) => {
    if (h.length > CHARACTER_LIMITS.CALL_ONLY.HEADLINE) {
      errors.push(`Headline ${i + 1} exceeds ${CHARACTER_LIMITS.CALL_ONLY.HEADLINE} characters`);
    }
  });
  
  // Validate descriptions (exactly 2)
  if (ad.descriptions.length !== CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION_COUNT) {
    errors.push(`Call-Only ads require exactly ${CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION_COUNT} descriptions`);
  }
  ad.descriptions.forEach((d, i) => {
    if (d.length > CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION) {
      errors.push(`Description ${i + 1} exceeds ${CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION} characters`);
    }
  });
  
  // Validate business name with enhanced checks
  if (!ad.businessName || ad.businessName.trim().length === 0) {
    errors.push('Business name is required');
  } else if (ad.businessName.length > CHARACTER_LIMITS.CALL_ONLY.BUSINESS_NAME) {
    errors.push(`Business name exceeds ${CHARACTER_LIMITS.CALL_ONLY.BUSINESS_NAME} characters`);
  }
  
  // Enhanced promotional text detection in business name
  const promotionalPatterns = [
    'best', 'top', 'call now', '#1', 'number one', '24/7', 'leading', 'premier', 
    'award winning', 'trusted', 'professional', 'expert', 'quality', 'affordable',
    'cheap', 'discount', 'sale', 'offer', 'deal', 'free', 'guaranteed'
  ];
  const businessNameLower = ad.businessName.toLowerCase();
  const foundPromotional = promotionalPatterns.filter(p => businessNameLower.includes(p));
  if (foundPromotional.length > 0) {
    errors.push(`Business name cannot contain promotional text: ${foundPromotional.join(', ')}. Use your actual business name only.`);
  }
  
  // Check for generic business names (not allowed)
  const genericNames = ['plumber', 'electrician', 'lawyer', 'dentist', 'contractor', 'service', 'company', 'business'];
  if (genericNames.some(name => businessNameLower === name || businessNameLower === name + 's')) {
    errors.push('Business name cannot be generic service terms. Use your actual business name.');
  }
  
  // Validate phone number
  const phoneResult = validatePhoneNumber(ad.phoneNumber);
  if (!phoneResult.valid) {
    errors.push(phoneResult.error!);
  }
  
  // Validate verification URL
  if (ad.verificationUrl) {
    if (!ad.verificationUrl.startsWith('http://') && !ad.verificationUrl.startsWith('https://')) {
      errors.push('Verification URL must start with http:// or https://');
    }
  } else {
    errors.push('Verification URL is required for Call-Only ads');
  }
  
  // Call-Only specific requirements - must include call-to-action
  const allText = [...ad.headlines, ...ad.descriptions].join(' ').toLowerCase();
  const callActions = ['call', 'tap', 'phone', 'dial', 'contact'];
  if (!callActions.some(action => allText.includes(action))) {
    errors.push('Call-Only ads must include a call-to-action word like "Call", "Tap", "Phone", or "Contact"');
  }
  
  // Check for misleading availability claims
  const availabilityClaims = ['24/7', '24 hours', 'always open', 'never closed'];
  const hasAvailabilityClaim = availabilityClaims.some(claim => allText.includes(claim.toLowerCase()));
  if (hasAvailabilityClaim) {
    warnings.push('Ensure availability claims are accurate. Google may verify 24/7 claims.');
  }
  
  // Check for location specificity
  const locationWords = ['local', 'nearby', 'area', 'city', 'town'];
  if (!locationWords.some(word => allText.includes(word))) {
    warnings.push('Consider adding location-specific terms to improve local relevance');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    phoneValid: phoneResult.valid,
    businessNameValid: !errors.some(e => e.includes('Business name'))
  };
}

// ============================================================================
// PROHIBITED PRACTICES
// ============================================================================

export const PROHIBITED_PRACTICES = {
  RSA: [
    'Repeating same keywords across all headlines',
    'Using similar headlines with minor variations only',
    'Keyword stuffing in descriptions',
    'Headlines that only work in specific orders',
    'Headlines that rely on other headlines for context',
    'Incomplete sentences expecting continuation',
    'Excessive punctuation (!!!, ???)',
    'All caps text (SHOUTING)',
    'Misleading claims without substantiation',
  ],
  DKI: [
    'Multiple DKI in same text field',
    'Nested DKI within DKI',
    'Using in business name field',
    'Empty default text',
    'Grammar that breaks with different keywords',
    'Default text exceeding character limits',
  ],
  CALL_ONLY: [
    'Fake or disconnected phone numbers',
    'Premium-rate phone numbers (900, 976)',
    'Phone numbers that dont route to business',
    'Automatic pre-recorded messages without human option',
    'Phone numbers requiring payment to call',
    'Misleading availability claims',
    'Using promotional text as business name',
  ]
} as const;

// ============================================================================
// BEST PRACTICES
// ============================================================================

export const BEST_PRACTICES = {
  RSA: {
    HEADLINE_STRATEGY: {
      'Position 1-3': 'Primary keywords + USP',
      'Position 4-6': 'Benefits & Offers',
      'Position 7-9': 'Location & Urgency',
      'Position 10-12': 'Social Proof',
      'Position 13-15': 'Specific Services/Products'
    },
    DESCRIPTION_STRATEGY: {
      'Description 1': 'Primary value proposition',
      'Description 2': 'Benefits + CTA',
      'Description 3': 'Credentials + Trust',
      'Description 4': 'Specific offer'
    },
    URGENCY_WORDS: ['Now', 'Today', 'Immediate', 'Fast', 'Quick', 'Same-Day', 'Limited Time'],
    TRUST_INDICATORS: ['Licensed', 'Insured', 'Certified', 'Trusted', 'Award-Winning', '5-Star', 'Since \\d{4}'],
    CTA_PHRASES: ['Call Now', 'Get Started', 'Book Now', 'Free Estimate', 'Learn More', 'Contact Us']
  },
  DKI: {
    GOOD_PLACEMENTS: [
      'Beginning of headline with service/product name',
      'Descriptions with product/service variations',
      'Location-based ads with city names'
    ],
    BAD_PLACEMENTS: [
      'Business name field',
      'Display path (unreliable)',
      'Middle of sentences requiring grammar match'
    ]
  },
  CALL_ONLY: {
    URGENCY_WORDS: ['Call Now', 'Tap to Call', 'Immediate Service', 'Available Today', 'Same-Day'],
    TRUST_INDICATORS: ['Licensed & Insured', 'BBB A+ Rated', '5-Star Reviews', 'Family-Owned'],
    OFFER_PHRASES: ['Free Estimate', 'Mention Ad for 20% Off', 'First-Time Customer Discount']
  }
} as const;

// ============================================================================
// AD TEXT SANITIZATION - Google Ads Policy Compliance
// ============================================================================

/**
 * Sanitize ad text to comply with Google Ads policies
 * Enhanced version with comprehensive character and formatting validation
 * 
 * Google Ads Policy prohibits:
 * - Excessive punctuation (multiple !, ?, etc.)
 * - Special characters at beginning of headlines
 * - Most special symbols (@ # $ % ^ * < > { } [ ] | \ ~ `)
 * - Misleading symbols or formatting
 * - All caps text (except acronyms)
 * - Repetitive characters or words
 */
export function sanitizeAdText(text: string): string {
  if (!text) return '';
  
  let sanitized = text.trim();
  
  // 1. Replace "24/7" patterns with "24-7" (slashes not allowed in certain contexts)
  sanitized = sanitized.replace(/(\d+)\/(\d+)/g, '$1-$2');
  
  // 2. Remove DKI syntax {KeyWord:...} - should not appear in final ad text shown to users
  sanitized = sanitized.replace(/\{(keyword|Keyword|KeyWord|KEYWord):[^}]*\}/gi, '');
  
  // 3. Remove prohibited special characters (keep allowed: . , - ' : ; & $ % ! ?)
  // Prohibited: @ # ^ * < > { } [ ] | \ ~ ` = + _ " /
  sanitized = sanitized.replace(/[@#^*<>{}\[\]|\\~`=+_"\/]/g, '');
  
  // 4. Fix all caps text (except for acronyms 2-4 letters)
  sanitized = sanitized.replace(/\b[A-Z]{5,}\b/g, (match) => {
    return match.charAt(0) + match.slice(1).toLowerCase();
  });
  
  // 5. Remove excessive exclamation marks (only 1 allowed per ad field)
  const exclamationCount = (sanitized.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    // Keep only the last exclamation mark
    let found = false;
    sanitized = sanitized.split('').reverse().map(char => {
      if (char === '!') {
        if (found) return '';
        found = true;
      }
      return char;
    }).reverse().join('');
  }
  
  // 6. Remove excessive question marks (only 1 allowed)
  const questionCount = (sanitized.match(/\?/g) || []).length;
  if (questionCount > 1) {
    let found = false;
    sanitized = sanitized.split('').reverse().map(char => {
      if (char === '?') {
        if (found) return '';
        found = true;
      }
      return char;
    }).reverse().join('');
  }
  
  // 7. Remove punctuation at the beginning of text
  sanitized = sanitized.replace(/^[!?.,;:]+\s*/, '');
  
  // 8. Remove multiple consecutive punctuation (e.g., "!!" or "??")
  sanitized = sanitized.replace(/([!?.,;:])\1+/g, '$1');
  
  // 9. Remove punctuation followed by different punctuation (e.g., "!?" or ".!")
  sanitized = sanitized.replace(/([!?])([!?.,;:])/g, '$1');
  
  // 10. Remove repetitive words (e.g., "Best Best Service" -> "Best Service")
  sanitized = sanitized.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
  
  // 11. Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // 12. Remove trailing punctuation that's not period, exclamation, or question
  sanitized = sanitized.replace(/[,;:]+$/, '');
  
  // 13. Ensure text doesn't start with a symbol
  sanitized = sanitized.replace(/^[-&]+\s*/, '');
  
  // 14. Remove leading/trailing hyphens that might be formatting artifacts
  sanitized = sanitized.replace(/^-+\s*|\s*-+$/g, '');
  
  return sanitized;
}

// ============================================================================
// HELPER FUNCTIONS FOR AD GENERATION
// ============================================================================

/**
 * Truncate text to fit character limit without breaking words
 */
export function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  
  const truncated = text.substring(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we can find a word boundary, use it
  if (lastSpace > limit * 0.7) {
    return truncated.substring(0, lastSpace).trim();
  }
  
  // Otherwise just truncate
  return truncated.trim();
}

/**
 * Ensure headline fits 30 character limit and complies with Google Ads policies
 */
export function formatHeadline(text: string): string {
  // First sanitize to remove prohibited characters
  const sanitized = sanitizeAdText(text);
  // Then truncate to fit character limit
  return truncateToLimit(sanitized, CHARACTER_LIMITS.RSA.HEADLINE);
}

/**
 * Ensure description fits 90 character limit and complies with Google Ads policies
 */
export function formatDescription(text: string): string {
  // First sanitize to remove prohibited characters
  const sanitized = sanitizeAdText(text);
  // Then truncate to fit character limit
  return truncateToLimit(sanitized, CHARACTER_LIMITS.RSA.DESCRIPTION);
}

/**
 * Generate unique headlines from a base set (removes duplicates and similar)
 */
export function ensureUniqueHeadlines(headlines: string[]): string[] {
  const unique: string[] = [];
  
  for (const headline of headlines) {
    const formatted = formatHeadline(headline);
    if (formatted.length === 0) continue;
    
    // Check if similar headline already exists
    const isDuplicate = unique.some(h => areHeadlinesSimilar(h, formatted));
    if (!isDuplicate) {
      unique.push(formatted);
    }
  }
  
  return unique;
}

/**
 * Generate unique descriptions from a base set
 */
export function ensureUniqueDescriptions(descriptions: string[]): string[] {
  const unique: string[] = [];
  
  for (const desc of descriptions) {
    const formatted = formatDescription(desc);
    if (formatted.length === 0) continue;
    
    // Check if similar description already exists
    const isDuplicate = unique.some(d => areHeadlinesSimilar(d, formatted));
    if (!isDuplicate) {
      unique.push(formatted);
    }
  }
  
  return unique;
}
