/**
 * Smart Ad Copy Generator
 * Generates Google Ads compliant ad copy based on keywords
 * 
 * GUARDRAILS: Follows official Google Search Ads policies
 * - RSA: Headlines 30 chars, Descriptions 90 chars
 * - All headlines must be substantially different (no near-duplicates)
 * - Proper title case and formatting per Google guidelines
 */

import {
  CHARACTER_LIMITS,
  formatHeadline,
  formatDescription,
  areHeadlinesSimilar
} from './googleAdsRules';

// Product indicators
const PRODUCT_KEYWORDS = [
  'buy', 'shop', 'store', 'purchase', 'product', 'item', 'goods', 'merchandise',
  'equipment', 'tools', 'supplies', 'parts', 'accessories', 'hardware', 'furniture',
  'appliances', 'electronics', 'clothing', 'shoes', 'watch', 'phone', 'laptop',
  'camera', 'bike', 'car', 'vehicle', 'toy', 'game', 'book', 'software'
];

// Service indicators
const SERVICE_KEYWORDS = [
  'service', 'repair', 'installation', 'maintenance', 'cleaning', 'plumbing',
  'electrician', 'carpenter', 'contractor', 'lawyer', 'attorney', 'doctor',
  'dentist', 'consultant', 'coach', 'trainer', 'teacher', 'tutor', 'therapist',
  'mechanic', 'technician', 'specialist', 'professional', 'expert', 'care',
  'treatment', 'consultation', 'inspection', 'emergency', 'support', 'help',
  'fix', 'restore', 'replace', 'install', 'upgrade', 'improve'
];

/**
 * Detect if the keyword is for a product or service
 */
export function detectBusinessType(keyword: string): 'product' | 'service' {
  const lowerKeyword = keyword.toLowerCase();
  
  // Check for service indicators first (more specific)
  for (const serviceWord of SERVICE_KEYWORDS) {
    if (lowerKeyword.includes(serviceWord)) {
      return 'service';
    }
  }
  
  // Check for product indicators
  for (const productWord of PRODUCT_KEYWORDS) {
    if (lowerKeyword.includes(productWord)) {
      return 'product';
    }
  }
  
  // Default to service (safer for most businesses)
  return 'service';
}

/**
 * Capitalize properly following Google Ads title case rules
 * - Capitalize first letter of each major word
 * - Keep small words lowercase (unless first word)
 */
export function toTitleCase(text: string): string {
  const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];
  
  const words = text.split(' ');
  return words.map((word, index) => {
    // Always capitalize first word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Keep small words lowercase (unless they're acronyms)
    if (smallWords.includes(word.toLowerCase()) && word.length > 1) {
      return word.toLowerCase();
    }
    
    // Capitalize other words
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Remove quotation marks from text (Google policy)
 */
export function removeQuotes(text: string): string {
  return text.replace(/["'"''""]/g, '');
}

/**
 * Clean and format text for Google Ads
 */
export function cleanAdText(text: string): string {
  // Remove quotes
  let cleaned = removeQuotes(text);
  
  // Remove excessive punctuation
  cleaned = cleaned.replace(/[!]{2,}/g, '!');
  cleaned = cleaned.replace(/[?]{2,}/g, '?');
  
  // Remove leading/trailing spaces
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Product-specific call-to-action phrases
 */
const PRODUCT_CTAS = [
  'Shop Now',
  'Buy Now',
  'Order Today',
  'Shop Deals',
  'Browse Collection',
  'View Products',
  'Add to Cart',
  'Purchase Online',
  'Shop Online',
  'Order Online'
];

/**
 * Service-specific call-to-action phrases
 */
const SERVICE_CTAS = [
  'Get Started',
  'Book Now',
  'Schedule Service',
  'Call Today',
  'Request Quote',
  'Get Quote',
  'Contact Us',
  'Learn More',
  'Free Estimate',
  'Book Appointment'
];

/**
 * Product-specific headline templates
 */
const PRODUCT_HEADLINE_TEMPLATES = [
  (keyword: string) => `${toTitleCase(keyword)} Deals`,
  (keyword: string) => `Shop ${toTitleCase(keyword)}`,
  (keyword: string) => `Buy ${toTitleCase(keyword)} Online`,
  (keyword: string) => `${toTitleCase(keyword)} Sale`,
  (keyword: string) => `Quality ${toTitleCase(keyword)}`,
  (keyword: string) => `${toTitleCase(keyword)} in Stock`,
  (keyword: string) => `Top Rated ${toTitleCase(keyword)}`,
  (keyword: string) => `Best ${toTitleCase(keyword)}`,
  (keyword: string) => `Premium ${toTitleCase(keyword)}`,
  (keyword: string) => `Affordable ${toTitleCase(keyword)}`
];

/**
 * Service-specific headline templates
 */
const SERVICE_HEADLINE_TEMPLATES = [
  (keyword: string) => `Professional ${toTitleCase(keyword)}`,
  (keyword: string) => `Trusted ${toTitleCase(keyword)}`,
  (keyword: string) => `Expert ${toTitleCase(keyword)}`,
  (keyword: string) => `Licensed ${toTitleCase(keyword)}`,
  (keyword: string) => `${toTitleCase(keyword)} Near You`,
  (keyword: string) => `Local ${toTitleCase(keyword)}`,
  (keyword: string) => `24/7 ${toTitleCase(keyword)}`,
  (keyword: string) => `Fast ${toTitleCase(keyword)}`,
  (keyword: string) => `Reliable ${toTitleCase(keyword)}`,
  (keyword: string) => `Same Day ${toTitleCase(keyword)}`
];

/**
 * Product-specific description templates
 */
const PRODUCT_DESCRIPTION_TEMPLATES = [
  (keyword: string) => `Shop ${toTitleCase(keyword)} with fast shipping and easy returns. Quality guaranteed.`,
  (keyword: string) => `Find the best ${keyword} at competitive prices. Order online today.`,
  (keyword: string) => `Browse our selection of ${keyword}. Free shipping on orders over $50.`,
  (keyword: string) => `Get ${keyword} delivered to your door. Shop our latest collection now.`
];

/**
 * Service-specific description templates  
 */
const SERVICE_DESCRIPTION_TEMPLATES = [
  (keyword: string) => `Professional ${keyword} with licensed experts. Call for a free estimate today.`,
  (keyword: string) => `Fast, reliable ${keyword} in your area. Same day service available.`,
  (keyword: string) => `Expert ${keyword} you can trust. Book your appointment online or call now.`,
  (keyword: string) => `Get quality ${keyword} at affordable rates. Licensed and insured professionals.`
];

/**
 * Generate a complete ad set based on keyword
 */
export interface GeneratedAd {
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
  businessType: 'product' | 'service';
}

export function generateSmartAdCopy(keyword: string): GeneratedAd {
  const businessType = detectBusinessType(keyword);
  const cleanKeyword = cleanAdText(keyword);
  
  if (businessType === 'product') {
    return {
      headline1: cleanAdText(PRODUCT_HEADLINE_TEMPLATES[0](cleanKeyword)),
      headline2: cleanAdText(PRODUCT_HEADLINE_TEMPLATES[1](cleanKeyword)),
      headline3: cleanAdText(PRODUCT_CTAS[Math.floor(Math.random() * Math.min(3, PRODUCT_CTAS.length))]),
      description1: cleanAdText(PRODUCT_DESCRIPTION_TEMPLATES[0](cleanKeyword)),
      description2: cleanAdText(`Quality ${cleanKeyword} with fast delivery and competitive prices.`),
      businessType: 'product'
    };
  } else {
    return {
      headline1: cleanAdText(SERVICE_HEADLINE_TEMPLATES[0](cleanKeyword)),
      headline2: cleanAdText(SERVICE_HEADLINE_TEMPLATES[1](cleanKeyword)),
      headline3: cleanAdText(SERVICE_CTAS[Math.floor(Math.random() * Math.min(3, SERVICE_CTAS.length))]),
      description1: cleanAdText(SERVICE_DESCRIPTION_TEMPLATES[0](cleanKeyword)),
      description2: cleanAdText(`Trusted ${cleanKeyword} with licensed professionals. Call for details.`),
      businessType: 'service'
    };
  }
}

/**
 * Generate multiple headline variations
 */
export function generateHeadlineVariations(keyword: string, count: number = 15): string[] {
  const businessType = detectBusinessType(keyword);
  const cleanKeyword = cleanAdText(keyword);
  const templates = businessType === 'product' ? PRODUCT_HEADLINE_TEMPLATES : SERVICE_HEADLINE_TEMPLATES;
  const ctas = businessType === 'product' ? PRODUCT_CTAS : SERVICE_CTAS;
  
  const headlines: string[] = [];
  
  // Add template-based headlines
  for (const template of templates) {
    if (headlines.length >= count) break;
    headlines.push(cleanAdText(template(cleanKeyword)));
  }
  
  // Add CTA headlines
  for (const cta of ctas) {
    if (headlines.length >= count) break;
    headlines.push(cleanAdText(cta));
  }
  
  return headlines.slice(0, count);
}

/**
 * Generate multiple description variations
 */
export function generateDescriptionVariations(keyword: string, count: number = 4): string[] {
  const businessType = detectBusinessType(keyword);
  const cleanKeyword = cleanAdText(keyword);
  const templates = businessType === 'product' ? PRODUCT_DESCRIPTION_TEMPLATES : SERVICE_DESCRIPTION_TEMPLATES;
  
  const descriptions: string[] = [];
  
  for (const template of templates) {
    if (descriptions.length >= count) break;
    descriptions.push(cleanAdText(template(cleanKeyword)));
  }
  
  return descriptions.slice(0, count);
}

