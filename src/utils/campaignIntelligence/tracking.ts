/**
 * UTM + DNI Tracking Integration
 * 
 * Automatically inject UTM templates and generate DNI numbers per source/adgroup
 */

import type { TrackingConfig, TrackingParams } from './schemas';

/**
 * Generate UTM parameters
 */
export function generateUTMParams(config: {
  campaignId: string;
  adGroupId?: string;
  keyword?: string;
  adId?: string;
  source?: string;
  medium?: string;
}): Record<string, string> {
  return {
    utm_source: config.source || 'google',
    utm_medium: config.medium || 'cpc',
    utm_campaign: config.campaignId,
    ...(config.adGroupId && { utm_adgroup: config.adGroupId }),
    ...(config.keyword && { utm_term: encodeURIComponent(config.keyword) }),
    ...(config.adId && { utm_content: config.adId }),
  };
}

/**
 * Build tracking URL with UTM parameters
 */
export function buildTrackingURL(
  finalUrl: string,
  utmParams: Record<string, string>
): string {
  try {
    const url = new URL(finalUrl);
    
    // Add UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  } catch (e) {
    // If URL is invalid, append as query string
    const separator = finalUrl.includes('?') ? '&' : '?';
    const queryString = Object.entries(utmParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return `${finalUrl}${separator}${queryString}`;
  }
}

/**
 * Generate tracking configuration
 */
export function generateTrackingConfig(
  campaignId: string,
  options?: {
    source?: string;
    medium?: string;
    dniEnabled?: boolean;
    dniProvider?: 'callrail' | 'calltracking' | 'invoca' | 'custom';
  }
): TrackingConfig {
  return {
    utmSource: options?.source || 'google',
    utmMedium: options?.medium || 'cpc',
    utmCampaign: campaignId,
    dniEnabled: options?.dniEnabled || false,
    dniProvider: options?.dniProvider,
    clickTrackingEnabled: true,
  };
}

/**
 * DNI Phone Number Mapping
 * 
 * In production, this would interface with a DNI provider API
 * For now, this is a placeholder structure
 */

export interface DNIMapping {
  keyHash: string;
  phoneNumber: string;
  expiresAt: string;
  providerId: string;
  campaignId: string;
  adGroupId?: string;
}

/**
 * Generate DNI key hash
 */
export function generateDNIKey(
  domain: string,
  campaignId: string,
  adGroupId?: string
): string {
  const key = `${domain}:${campaignId}${adGroupId ? `:${adGroupId}` : ''}`;
  // Simple hash (in production, use crypto)
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

/**
 * Lookup DNI phone number
 * 
 * In production, this would call: GET /dni/lookup?campaign=abc&adgroup=def
 */
export async function lookupDNIPhone(
  domain: string,
  campaignId: string,
  adGroupId?: string
): Promise<{ phone: string; expiresAt: string } | null> {
  // TODO: Implement actual DNI provider API call
  // For now, return null (DNI not available)
  
  // Example structure:
  // const response = await fetch(`/api/dni/lookup?campaign=${campaignId}&adgroup=${adGroupId || ''}`);
  // return await response.json();
  
  return null;
}

/**
 * Replace phone number in URL with DNI
 */
export function replacePhoneWithDNI(
  url: string,
  dniPhone: string
): string {
  // If URL supports number replacement via redirect or client-side script
  // This would typically be handled by the landing page or tracking script
  
  // For call-only ads, use tel: link
  if (url.startsWith('tel:')) {
    return `tel:${dniPhone}`;
  }
  
  // For regular URLs, append DNI parameter
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('dni_phone', dniPhone);
    return urlObj.toString();
  } catch (e) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}dni_phone=${encodeURIComponent(dniPhone)}`;
  }
}

/**
 * Build complete tracking parameters
 */
export function buildTrackingParams(
  finalUrl: string,
  config: TrackingConfig,
  options?: {
    campaignId: string;
    adGroupId?: string;
    keyword?: string;
    adId?: string;
    dniPhone?: string;
  }
): TrackingParams {
  // Generate UTM params
  const utmParams = generateUTMParams({
    campaignId: options?.campaignId || config.utmCampaign,
    adGroupId: options?.adGroupId,
    keyword: options?.keyword,
    adId: options?.adId,
    source: config.utmSource,
    medium: config.utmMedium,
  });

  // Build tracking URL
  let trackingUrl = buildTrackingURL(finalUrl, utmParams);

  // Add DNI if enabled
  const dniParams: Record<string, string> = {};
  if (config.dniEnabled && options?.dniPhone) {
    dniParams.dni_phone = options.dniPhone;
    trackingUrl = replacePhoneWithDNI(trackingUrl, options.dniPhone);
  }

  return {
    finalUrl,
    trackingUrl,
    utmParams,
    dniParams: Object.keys(dniParams).length > 0 ? dniParams : undefined,
  };
}

/**
 * Validate tracking URL
 */
export function validateTrackingURL(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'URL must use http:// or https://',
      };
    }
    
    // Check for required UTM params (optional validation)
    // const hasUTM = urlObj.searchParams.has('utm_source') || urlObj.searchParams.has('utm_campaign');
    
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Extract tracking parameters from URL
 */
export function extractTrackingParams(url: string): {
  utmParams: Record<string, string>;
  dniPhone?: string;
} {
  try {
    const urlObj = new URL(url);
    const utmParams: Record<string, string> = {};
    
    // Extract UTM parameters
    urlObj.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        utmParams[key] = value;
      }
    });
    
    // Extract DNI phone
    const dniPhone = urlObj.searchParams.get('dni_phone') || undefined;
    
    return { utmParams, dniPhone };
  } catch (e) {
    return { utmParams: {} };
  }
}

