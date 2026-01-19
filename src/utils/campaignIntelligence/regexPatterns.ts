/**
 * Regex Patterns & Validation Snippets
 * 
 * Practical regexes for validation and extraction
 */

// ============================================================================
// Phone Number Patterns
// ============================================================================

// E.164-ish phone (loose, then normalize)
export const PHONE_E164_LOOSE = /(\+?\d{1,3}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?[\d\s-]{6,12}/g;

// Strict E.164 validator
export const PHONE_E164_STRICT = /^\+?[1-9]\d{1,14}$/;

// ============================================================================
// URL Patterns
// ============================================================================

// URL validation (basic)
export const URL_REGEX = /^(https?:\/\/)([^\s/$.?#].[^\s]*)$/i;

// ============================================================================
// Email Patterns
// ============================================================================

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// Time/Hours Patterns
// ============================================================================

// Time range (hours) e.g. "09:00-18:00"
export const HOURS_RANGE = /^([01]?\d|2[0-3]):[0-5]\d-([01]?\d|2[0-3]):[0-5]\d$/;

// ============================================================================
// Date Patterns
// ============================================================================

// ISO Date (simple)
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================================
// Path/URL Token Patterns
// ============================================================================

// Simple slug/path piece (path tokens)
export const PATH_TOKEN = /^[a-z0-9\-]{1,15}$/i;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate phone number (E.164 strict)
 */
export function isValidE164Phone(phone: string): boolean {
  return PHONE_E164_STRICT.test(phone);
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return URL_REGEX.test(url);
  } catch {
    return false;
  }
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate hours range
 */
export function isValidHoursRange(hours: string): boolean {
  return HOURS_RANGE.test(hours);
}

/**
 * Validate ISO date
 */
export function isValidISODate(date: string): boolean {
  return ISO_DATE.test(date);
}

/**
 * Validate path token
 */
export function isValidPathToken(token: string): boolean {
  return PATH_TOKEN.test(token);
}

/**
 * Normalize phone to E.164
 */
export function normalizePhoneToE164(raw: string, defaultCountryCode = "+91"): string | null {
  const digits = raw.replace(/\D+/g, "");
  
  if (digits.length >= 10 && digits.length <= 15) {
    if (digits.startsWith("0")) {
      return defaultCountryCode + digits.replace(/^0+/, "");
    }
    
    if (digits.length === 10) {
      return defaultCountryCode + digits;
    }
    
    if (digits.startsWith("91") && digits.length === 12) {
      return "+" + digits;
    }
    
    return "+" + digits;
  }
  
  return null;
}

/**
 * Extract all phone numbers from text (loose matching)
 */
export function extractPhonesFromText(text: string): string[] {
  const matches = text.match(PHONE_E164_LOOSE) || [];
  return matches.map(m => normalizePhoneToE164(m) || m).filter(Boolean) as string[];
}

/**
 * Extract all emails from text
 */
export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) || [];
  return matches;
}

