/**
 * Landing Page Content Extractor
 * 
 * Robust parsing to extract: title, H1, services, phone, hours, address, structured data
 */

import { PHONE_E164_LOOSE, normalizePhoneToE164, EMAIL_REGEX, extractEmailsFromText } from './regexPatterns';

export interface LandingPageExtractionResult {
  domain: string;
  title: string | null;
  h1: string | null;
  metaDescription: string | null;
  services: string[];
  phones: string[];
  emails: string[];
  hours: Record<string, string> | null;
  addresses: string[];
  schemas: {
    org?: any;
    localBusiness?: any;
  };
  page_text_tokens: string[];
  extractionMethod: 'crawl' | 'api' | 'manual' | 'fallback';
  extractedAt: string;
}

/**
 * Extract content from landing page URL
 * Supports both client-side and server-side extraction
 */
export async function extractLandingPageContent(
  url: string,
  options?: {
    useHeadless?: boolean;
    timeout?: number;
  }
): Promise<LandingPageExtractionResult> {
  // Validate input
  if (!url || typeof url !== 'string') {
    return {
      domain: 'example.com',
      title: null,
      h1: null,
      metaDescription: null,
      services: [],
      phones: [],
      emails: [],
      hours: null,
      addresses: [],
      schemas: {},
      page_text_tokens: [],
      extractionMethod: 'fallback',
      extractedAt: new Date().toISOString(),
    };
  }

  const domain = extractDomain(url);
  const result: LandingPageExtractionResult = {
    domain,
    title: null,
    h1: null,
    metaDescription: null,
    services: [],
    phones: [],
    emails: [],
    hours: null,
    addresses: [],
    schemas: {},
    page_text_tokens: [],
    extractionMethod: 'crawl',
    extractedAt: new Date().toISOString(),
  };

  try {
    // Try server-side extraction first (if available)
    if (options?.useHeadless) {
      const serverResult = await extractViaHeadless(url, options.timeout);
      if (serverResult) {
        return { ...result, ...serverResult, extractionMethod: 'crawl' };
      }
    }

    // Fallback to client-side extraction
    // This may fail due to CSP - that's expected and handled gracefully
    const clientResult = await extractViaClient(url);
    return { ...result, ...clientResult, extractionMethod: 'crawl' };
  } catch (error: any) {
    // Silently handle network/CORS/CSP errors - they're expected
    const isExpectedError = 
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('CORS') ||
      error?.message?.includes('CSP') || 
      error?.message?.includes('Content Security Policy') ||
      error?.message?.includes('violates') ||
      (error?.name === 'TypeError' && error?.message?.includes('fetch'));
    
    // Only log unexpected errors
    if (!isExpectedError) {
      console.warn('Landing page extraction failed:', error);
    }
    return { ...result, extractionMethod: 'fallback' };
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  if (!url || typeof url !== 'string') {
    return 'example.com';
  }
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: try to extract domain manually
    const cleaned = url.trim();
    if (cleaned.includes('/')) {
      return cleaned.split('/')[0].replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
    return cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
}

/**
 * Extract via headless browser (server-side)
 */
async function extractViaHeadless(url: string, timeout = 10000): Promise<Partial<LandingPageExtractionResult> | null> {
  // TODO: Implement headless browser extraction (Puppeteer/Playwright)
  // For now, return null to use client-side fallback
  return null;
}

/**
 * Extract via client-side fetch (limited but works for most pages)
 */
async function extractViaClient(url: string): Promise<Partial<LandingPageExtractionResult>> {
  try {
    // Validate URL first
    if (!url || typeof url !== 'string') {
      return {};
    }

    // Check if URL is valid
    try {
      new URL(url);
    } catch {
      return {};
    }

    // Use CORS proxy or direct fetch if same-origin
    // Note: This may fail due to CSP/CORS restrictions - that's expected
    // Network errors are expected and should be handled silently
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdiologyBot/1.0)',
      },
    }).catch((fetchError: any) => {
      // Convert fetch errors to a specific error type that we can identify
      const networkError = new Error('NETWORK_ERROR');
      (networkError as any).originalError = fetchError;
      throw networkError;
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseHTML(html);
  } catch (error: any) {
    // If CORS fails, network error, or CSP blocks, return empty result (user can manually enter)
    // Don't log network/CORS errors as errors - they're expected
    const isNetworkError = 
      error?.message === 'NETWORK_ERROR' ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('CORS') ||
      error?.message?.includes('CSP') || 
      error?.message?.includes('Content Security Policy') ||
      error?.message?.includes('violates') ||
      (error?.name === 'TypeError' && error?.message?.includes('fetch'));
    
    // Silently handle network/CORS errors - they're expected and don't need logging
    // Only log unexpected errors
    if (!isNetworkError) {
      console.warn('Landing page extraction error:', error);
    }
    
    return {};
  }
}

/**
 * Parse HTML content
 */
function parseHTML(html: string): Partial<LandingPageExtractionResult> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  const title = doc.querySelector('title')?.textContent?.trim() || null;

  // Extract H1
  const h1 = doc.querySelector('h1')?.textContent?.trim() || null;

  // Extract meta description
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || null;

  // Extract phones
  const phones = extractPhones(html, doc);

  // Extract emails
  const emails = extractEmails(html);

  // Extract addresses
  const addresses = extractAddresses(html, doc);

  // Extract hours
  const hours = extractHours(html, doc);

  // Extract services
  const services = extractServices(html, doc);

  // Extract structured data (JSON-LD)
  const schemas = extractStructuredData(doc);

  // Extract page text tokens
  const pageText = doc.body?.textContent || '';
  const page_text_tokens = extractTokens(pageText);

  return {
    title,
    h1,
    metaDescription,
    services,
    phones,
    emails,
    hours,
    addresses,
    schemas,
    page_text_tokens,
  };
}

/**
 * Extract phone numbers using regex
 * E.164 normalization
 */
function extractPhones(html: string, doc: Document): string[] {
  const phones: Set<string> = new Set();
  
  // Use loose regex pattern
  const matches = html.matchAll(PHONE_E164_LOOSE);
  
  for (const match of matches) {
    const normalized = normalizePhoneToE164(match[0]);
    if (normalized) {
      phones.add(normalized);
    }
  }
  
  // Also check structured data
  const structuredPhones = doc.querySelectorAll('[itemprop="telephone"], [itemprop="phone"]');
  structuredPhones.forEach(el => {
    const phone = el.textContent?.trim() || el.getAttribute('content') || '';
    if (phone) {
      const normalized = normalizePhoneToE164(phone);
      if (normalized) phones.add(normalized);
    }
  });
  
  // Check schema.org LocalBusiness
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  schemaScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data.telephone) {
        const normalized = normalizePhoneToE164(data.telephone);
        if (normalized) phones.add(normalized);
      }
      if (data['@graph']) {
        data['@graph'].forEach((item: any) => {
          if (item.telephone) {
            const normalized = normalizePhoneToE164(item.telephone);
            if (normalized) phones.add(normalized);
          }
        });
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  });
  
  return Array.from(phones).slice(0, 5); // Limit to 5 phones
}

// normalizePhone function removed - using regexPatterns.normalizePhoneToE164 instead

/**
 * Extract email addresses
 */
function extractEmails(html: string): string[] {
  return extractEmailsFromText(html).slice(0, 5);
}

/**
 * Extract addresses
 */
function extractAddresses(html: string, doc: Document): string[] {
  const addresses: string[] = [];
  
  // Check structured data
  const addressElements = doc.querySelectorAll('[itemprop="address"], [itemprop="streetAddress"]');
  addressElements.forEach(el => {
    const address = el.textContent?.trim();
    if (address && address.length > 10) {
      addresses.push(address);
    }
  });
  
  // Check schema.org
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  schemaScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data.address) {
        const addr = typeof data.address === 'string' 
          ? data.address 
          : [data.address.streetAddress, data.address.addressLocality, data.address.addressRegion]
              .filter(Boolean).join(', ');
        if (addr) addresses.push(addr);
      }
    } catch (e) {
      // Ignore
    }
  });
  
  return Array.from(new Set(addresses));
}

/**
 * Extract business hours
 */
function extractHours(html: string, doc: Document): Record<string, string> | null {
  const hours: Record<string, string> = {};
  
  // Look for "Open", "Hours", "Opening" patterns
  const hoursText = html.match(/(?:open|hours|opening)[\s\S]{0,200}/i)?.[0] || '';
  
  // Pattern: Mon-Fri: 9:00 AM - 6:00 PM
  const timePattern = /(\w{3}(?:-\w{3})?)[\s:]+(\d{1,2}[:.]?\d{0,2}\s*(?:AM|PM)?)[\s-]+(\d{1,2}[:.]?\d{0,2}\s*(?:AM|PM)?)/gi;
  const matches = hoursText.matchAll(timePattern);
  
  for (const match of matches) {
    const dayRange = match[1].toLowerCase();
    const openTime = match[2].trim();
    const closeTime = match[3].trim();
    hours[dayRange] = `${openTime}-${closeTime}`;
  }
  
  // Also check structured data
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  schemaScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data.openingHoursSpecification) {
        data.openingHoursSpecification.forEach((spec: any) => {
          const day = spec.dayOfWeek?.toLowerCase() || '';
          const open = spec.opens || '';
          const close = spec.closes || '';
          if (day && open && close) {
            hours[day] = `${open}-${close}`;
          }
        });
      }
    } catch (e) {
      // Ignore
    }
  });
  
  return Object.keys(hours).length > 0 ? hours : null;
}

/**
 * Extract services from page content
 */
function extractServices(html: string, doc: Document): string[] {
  const services = new Set<string>();
  
  // Look for service lists (common patterns)
  const serviceKeywords = ['services', 'we do', 'we offer', 'our services', 'what we do'];
  const serviceSections = Array.from(doc.querySelectorAll('section, div, ul, ol')).filter(el => {
    const text = el.textContent?.toLowerCase() || '';
    return serviceKeywords.some(keyword => text.includes(keyword));
  });
  
  serviceSections.forEach(section => {
    // Extract list items
    const listItems = section.querySelectorAll('li, dt, .service-item, [class*="service"]');
    listItems.forEach(item => {
      const text = item.textContent?.trim() || '';
      if (text.length > 3 && text.length < 50) {
        // Simple heuristic: if it's a short phrase, likely a service
        services.add(text);
      }
    });
  });
  
  // Also extract from structured data
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  schemaScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data.hasOfferCatalog) {
        data.hasOfferCatalog.itemListElement?.forEach((item: any) => {
          if (item.name) services.add(item.name);
        });
      }
      if (data.serviceType) {
        services.add(data.serviceType);
      }
    } catch (e) {
      // Ignore
    }
  });
  
  return Array.from(services).slice(0, 20); // Limit to 20 services
}

/**
 * Extract structured data (JSON-LD)
 */
function extractStructuredData(doc: Document): { org?: any; localBusiness?: any } {
  const schemas: { org?: any; localBusiness?: any } = {};
  
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  schemaScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
        if (data['@type'] === 'LocalBusiness') {
          schemas.localBusiness = data;
        } else {
          schemas.org = data;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  });
  
  return schemas;
}

/**
 * Extract meaningful tokens from page text
 */
function extractTokens(text: string): string[] {
  // Extract words that might be relevant (emergency, licensed, 24/7, etc.)
  const relevantPatterns = [
    /\b(emergency|24\/7|licensed|insured|certified|guaranteed|free|same.?day|fast|quick)\b/gi,
    /\b(service|services|repair|installation|maintenance)\b/gi,
  ];
  
  const tokens = new Set<string>();
  relevantPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => tokens.add(match.toLowerCase()));
    }
  });
  
  return Array.from(tokens).slice(0, 30);
}

/**
 * Manual extraction form data (fallback when automatic extraction fails)
 */
export interface ManualExtractionData {
  title?: string;
  h1?: string;
  services?: string[];
  phones?: string[];
  hours?: Record<string, string>;
  address?: string;
}

export function mergeManualExtraction(
  automatic: LandingPageExtractionResult,
  manual: ManualExtractionData
): LandingPageExtractionResult {
  return {
    ...automatic,
    title: manual.title || automatic.title,
    h1: manual.h1 || automatic.h1,
    services: manual.services || automatic.services,
    phones: manual.phones || automatic.phones,
    hours: manual.hours || automatic.hours,
    addresses: manual.address ? [manual.address, ...automatic.addresses] : automatic.addresses,
    extractionMethod: 'manual',
  };
}

