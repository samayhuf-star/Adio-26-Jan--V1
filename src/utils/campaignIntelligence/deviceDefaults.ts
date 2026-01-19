/**
 * Device-Aware Defaults
 * 
 * Ensure mobile-first for CALL intent and set bid modifiers
 */

import type { CampaignIntent, DeviceConfig, MobileOptimizations, DesktopOptimizations } from './schemas';

/**
 * Get device configuration based on intent
 */
export function getDeviceConfig(intent: CampaignIntent): DeviceConfig {
  const isCallIntent = intent === 'CALL_INTENT';
  
  return {
    primaryDevice: isCallIntent ? 'mobile' : 'all',
    mobileOptimizations: {
      shorterHeadlines: isCallIntent,
      callExtensions: isCallIntent,
      clickToCall: isCallIntent,
      simplifiedCTAs: isCallIntent,
      maxHeadlineLength: isCallIntent ? 25 : 30,
    },
    desktopOptimizations: {
      longerDescriptions: !isCallIntent,
      multipleCTAs: !isCallIntent,
      detailedBenefits: !isCallIntent,
      maxDescriptionLength: 90,
    },
  };
}

/**
 * Get mobile bid modifier for intent
 */
export function getMobileBidModifier(intent: CampaignIntent): number {
  // +20% for CALL campaigns on mobile
  if (intent === 'CALL_INTENT') {
    return 1.2; // +20%
  }
  
  // Default: no modifier
  return 1.0;
}

/**
 * Get desktop bid modifier for intent
 */
export function getDesktopBidModifier(intent: CampaignIntent): number {
  // Desktop is less important for CALL intent
  if (intent === 'CALL_INTENT') {
    return 0.9; // -10%
  }
  
  // Desktop is more important for TRAFFIC/LEAD
  if (intent === 'TRAFFIC_INTENT' || intent === 'LEAD_INTENT') {
    return 1.1; // +10%
  }
  
  // Default: no modifier
  return 1.0;
}

/**
 * Get tablet bid modifier
 */
export function getTabletBidModifier(intent: CampaignIntent): number {
  // Tablets are neutral
  return 1.0;
}

/**
 * Format bid modifier for Google Ads
 */
export function formatBidModifier(modifier: number): string {
  // Google Ads uses percentage: +20% = 1.20, -10% = 0.90
  const percentage = (modifier - 1.0) * 100;
  if (percentage > 0) {
    return `+${percentage.toFixed(0)}%`;
  } else if (percentage < 0) {
    return `${percentage.toFixed(0)}%`;
  }
  return '0%';
}

/**
 * Get device preference for ad group
 */
export function getDevicePreference(intent: CampaignIntent): 'mobile' | 'desktop' | 'all' {
  if (intent === 'CALL_INTENT') {
    return 'mobile';
  }
  if (intent === 'TRAFFIC_INTENT') {
    return 'desktop';
  }
  return 'all';
}

/**
 * Optimize headline for device
 */
export function optimizeHeadlineForDevice(
  headline: string,
  device: 'mobile' | 'desktop' | 'tablet',
  intent: CampaignIntent
): string {
  const maxLength = device === 'mobile' && intent === 'CALL_INTENT' ? 25 : 30;
  
  if (headline.length <= maxLength) {
    return headline;
  }
  
  // Truncate and add ellipsis if needed
  return headline.substring(0, maxLength - 3) + '...';
}

/**
 * Optimize description for device
 */
export function optimizeDescriptionForDevice(
  description: string,
  device: 'mobile' | 'desktop' | 'tablet',
  intent: CampaignIntent
): string {
  const maxLength = device === 'mobile' ? 80 : 90;
  
  if (description.length <= maxLength) {
    return description;
  }
  
  // Truncate and add ellipsis if needed
  return description.substring(0, maxLength - 3) + '...';
}

/**
 * Get recommended ad types for device
 */
export function getRecommendedAdTypesForDevice(
  device: 'mobile' | 'desktop' | 'tablet',
  intent: CampaignIntent
): ('CallOnly' | 'RSA' | 'ETA' | 'Display')[] {
  if (device === 'mobile' && intent === 'CALL_INTENT') {
    return ['CallOnly', 'RSA'];
  }
  
  if (device === 'desktop' && intent === 'TRAFFIC_INTENT') {
    return ['RSA', 'Display'];
  }
  
  return ['RSA'];
}

/**
 * Get device bid modifiers object for Google Ads
 */
export function getDeviceBidModifiers(intent: CampaignIntent): {
  mobile: number;
  desktop: number;
  tablet: number;
} {
  return {
    mobile: getMobileBidModifier(intent),
    desktop: getDesktopBidModifier(intent),
    tablet: getTabletBidModifier(intent),
  };
}

/**
 * Format device bid modifiers for CSV export
 */
export function formatDeviceBidModifiersForCSV(intent: CampaignIntent): {
  'Mobile Bid Adjustment': string;
  'Desktop Bid Adjustment': string;
  'Tablet Bid Adjustment': string;
} {
  const modifiers = getDeviceBidModifiers(intent);
  
  return {
    'Mobile Bid Adjustment': formatBidModifier(modifiers.mobile),
    'Desktop Bid Adjustment': formatBidModifier(modifiers.desktop),
    'Tablet Bid Adjustment': formatBidModifier(modifiers.tablet),
  };
}

