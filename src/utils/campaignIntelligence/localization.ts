/**
 * Localization Support
 * 
 * Geo & language-specific phrasing and currency
 */

import type { LocalizationConfig, LocalizedContent } from './schemas';

// Locale configurations
const LOCALE_CONFIGS: Record<string, {
  language: string;
  currency: string;
  dateFormat: string;
  phoneFormat: string;
  timezone: string;
  phrases: Record<string, string>;
}> = {
  'en-US': {
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: '(XXX) XXX-XXXX',
    timezone: 'America/New_York',
    phrases: {
      call_now: 'Call Now',
      free_estimate: 'Free Estimate',
      get_quote: 'Get Quote',
      book_appointment: 'Book Appointment',
      learn_more: 'Learn More',
    },
  },
  'hi-IN': {
    language: 'hi',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+91 XXXXXXXXXX',
    timezone: 'Asia/Kolkata',
    phrases: {
      call_now: 'कॉल करें',
      free_estimate: 'नि:शुल्क अनुमान',
      get_quote: 'कीमत जानें',
      book_appointment: 'अपॉइंटमेंट बुक करें',
      learn_more: 'और जानें',
    },
  },
  'es-ES': {
    language: 'es',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+34 XXX XXX XXX',
    timezone: 'Europe/Madrid',
    phrases: {
      call_now: 'Llamar Ahora',
      free_estimate: 'Estimación Gratuita',
      get_quote: 'Obtener Cotización',
      book_appointment: 'Reservar Cita',
      learn_more: 'Saber Más',
    },
  },
  'fr-FR': {
    language: 'fr',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    phoneFormat: '+33 X XX XX XX XX',
    timezone: 'Europe/Paris',
    phrases: {
      call_now: 'Appeler Maintenant',
      free_estimate: 'Devis Gratuit',
      get_quote: 'Obtenir un Devis',
      book_appointment: 'Prendre Rendez-vous',
      learn_more: 'En Savoir Plus',
    },
  },
};

/**
 * Detect language from text or URL
 */
export function detectLanguage(text: string): string {
  // Simple heuristic: check for non-ASCII characters
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasCyrillic = /[\u0400-\u04FF]/.test(text);
  const hasChinese = /[\u4E00-\u9FFF]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  if (hasDevanagari) return 'hi';
  if (hasCyrillic) return 'ru';
  if (hasChinese) return 'zh';
  if (hasArabic) return 'ar';

  // Default to English
  return 'en';
}

/**
 * Get localization config for geo
 */
export function getLocalizationConfig(geo: string, language?: string): LocalizationConfig {
  // Map geo to locale
  let locale = 'en-US'; // Default

  if (geo.includes('India') || geo.includes('IN')) {
    locale = language === 'hi' ? 'hi-IN' : 'en-US';
  } else if (geo.includes('Spain') || geo.includes('ES')) {
    locale = 'es-ES';
  } else if (geo.includes('France') || geo.includes('FR')) {
    locale = 'fr-FR';
  } else if (geo.includes('United States') || geo.includes('US')) {
    locale = 'en-US';
  }

  const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];

  return {
    geo,
    language: config.language,
    currency: config.currency,
    dateFormat: config.dateFormat,
    phoneFormat: config.phoneFormat,
    timezone: config.timezone,
  };
}

/**
 * Localize phrase
 */
export function localizePhrase(
  phraseKey: string,
  locale: string,
  fallback?: string
): string {
  const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
  return config.phrases[phraseKey] || fallback || phraseKey;
}

/**
 * Localize content with confidence score
 */
export function localizeContent(
  original: string,
  locale: string,
  targetLanguage?: string
): LocalizedContent {
  const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
  
  // For now, return original with confidence based on locale match
  // In production, this would use a translation API
  const confidence = locale === 'en-US' ? 1.0 : 0.7; // Lower confidence for non-English

  return {
    original,
    localized: original, // TODO: Implement actual translation
    locale,
    confidence,
  };
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  locale: string = 'en-US'
): string {
  const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
  const currency = config.currency;

  // Simple formatting (can be enhanced with Intl.NumberFormat)
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`;
  } else if (currency === 'EUR') {
    return `€${amount.toFixed(2)}`;
  }

  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Format phone number according to locale
 */
export function formatPhoneNumber(
  phone: string,
  locale: string = 'en-US'
): string {
  const config = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format based on locale
  if (locale === 'en-US' && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (locale === 'hi-IN' && digits.length >= 10) {
    return `+91 ${digits.slice(-10)}`;
  } else if (locale === 'es-ES' && digits.length >= 9) {
    return `+34 ${digits.slice(-9).match(/.{1,3}/g)?.join(' ') || digits}`;
  } else if (locale === 'fr-FR' && digits.length >= 10) {
    return `+33 ${digits.slice(-10).match(/.{1,2}/g)?.join(' ') || digits}`;
  }

  // Default: return as-is
  return phone;
}

/**
 * Insert geo tokens into template
 */
export function insertGeoTokens(
  template: string,
  tokens: {
    city?: string;
    state?: string;
    region?: string;
    country?: string;
  }
): string {
  let result = template;
  
  result = result.replace(/\{\{city\}\}/g, tokens.city || '');
  result = result.replace(/\{\{state\}\}/g, tokens.state || '');
  result = result.replace(/\{\{region\}\}/g, tokens.region || '');
  result = result.replace(/\{\{country\}\}/g, tokens.country || '');

  return result;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  return Object.keys(LOCALE_CONFIGS);
}

/**
 * Get locale config
 */
export function getLocaleConfig(locale: string) {
  return LOCALE_CONFIGS[locale] || LOCALE_CONFIGS['en-US'];
}

