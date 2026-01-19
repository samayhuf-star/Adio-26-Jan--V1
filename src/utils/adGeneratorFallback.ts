/**
 * Ad Generator Fallback - Python API Integration
 * Falls back to Python script when main ad generation fails
 */

import { AdGenerationInput, ResponsiveSearchAd, ExpandedTextAd, CallOnlyAd } from './googleAdGenerator';

export interface FallbackAdResponse {
  success: boolean;
  business_type: string;
  ads: Array<{
    id: string;
    type: 'rsa' | 'dki' | 'callonly';
    adType: 'RSA' | 'DKI' | 'CallOnly';
    headline1?: string;
    headline2?: string;
    headline3?: string;
    headline4?: string;
    headline5?: string;
    description1?: string;
    description2?: string;
    path1?: string;
    path2?: string;
    finalUrl?: string;
    phoneNumber?: string;
    businessName?: string;
    selected: boolean;
  }>;
  count: number;
  message?: string;
}

/**
 * Call Python fallback API to generate ads
 */
export async function generateAdsFallback(
  input: AdGenerationInput
): Promise<ResponsiveSearchAd[] | ExpandedTextAd[] | CallOnlyAd[]> {
  try {
    // Try to call Python API (if deployed)
    const pythonApiUrl = import.meta.env.VITE_PYTHON_AD_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${pythonApiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: input.keywords,
        business_type: detectBusinessTypeFromInput(input),
        business_name: input.businessName || '',
        location: input.location || '',
        industry: input.industry || '',
        base_url: input.baseUrl || '',
        ad_type: input.adType === 'RSA' ? 'RSA' : input.adType === 'ETA' ? 'DKI' : 'CALL_ONLY',
        num_ads: 3
      }),
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data: FallbackAdResponse = await response.json();
    
    if (!data.success || !data.ads || data.ads.length === 0) {
      throw new Error('Python API returned no ads');
    }

    // Convert Python API response to our ad format
    return convertFallbackAdsToFormat(data.ads, input.adType);
    
  } catch (error) {
    console.warn('Python fallback API unavailable, using local fallback:', error);
    // Fall back to local generation
    return generateAdsLocalFallback(input);
  }
}

/**
 * Detect business type from input
 */
function detectBusinessTypeFromInput(input: AdGenerationInput): string | null {
  const keywordText = input.keywords.join(' ').toLowerCase();
  const industryLower = input.industry.toLowerCase();
  
  // Emergency
  if (keywordText.includes('emergency') || keywordText.includes('24/7') || keywordText.includes('urgent')) {
    return 'emergency';
  }
  
  // Local
  if (keywordText.includes('near me') || keywordText.includes('nearby') || keywordText.includes('local')) {
    return 'local';
  }
  
  // Product
  const productKeywords = ['buy', 'shop', 'purchase', 'product', 'order', 'cart', 'price', 'sale'];
  if (productKeywords.some(kw => keywordText.includes(kw))) {
    return 'product';
  }
  
  // Service (default)
  const serviceKeywords = ['service', 'repair', 'install', 'fix', 'hire', 'book', 'schedule'];
  if (serviceKeywords.some(kw => keywordText.includes(kw))) {
    return 'service';
  }
  
  // Industry-based
  const serviceIndustries = ['plumbing', 'electrical', 'hvac', 'legal', 'medical', 'cleaning'];
  if (serviceIndustries.some(ind => industryLower.includes(ind))) {
    return 'service';
  }
  
  return null; // Let Python auto-detect
}

/**
 * Convert fallback API ads to our internal format
 */
function convertFallbackAdsToFormat(
  ads: FallbackAdResponse['ads'],
  adType: string
): ResponsiveSearchAd[] | ExpandedTextAd[] | CallOnlyAd[] {
  if (adType === 'CALL_ONLY') {
    return ads.map(ad => ({
      businessName: ad.businessName || 'Business',
      headline1: ad.headline1 || '',
      headline2: ad.headline2 || '',
      description1: ad.description1 || '',
      description2: ad.description2 || '',
      phoneNumber: ad.phoneNumber || '',
      verificationUrl: ad.finalUrl || '',
      displayPath: [ad.path1 || '', ad.path2 || '']
    })) as CallOnlyAd[];
  }
  
  if (adType === 'ETA' || ads[0]?.type === 'dki') {
    return ads.map(ad => ({
      headline1: ad.headline1 || '',
      headline2: ad.headline2 || '',
      headline3: ad.headline3,
      description1: ad.description1 || '',
      description2: ad.description2,
      finalUrl: ad.finalUrl || '',
      displayPath: [ad.path1 || '', ad.path2 || '']
    })) as ExpandedTextAd[];
  }
  
  // RSA
  return ads.map(ad => ({
    headlines: [
      ad.headline1,
      ad.headline2,
      ad.headline3,
      ad.headline4,
      ad.headline5
    ].filter(Boolean) as string[],
    descriptions: [
      ad.description1,
      ad.description2
    ].filter(Boolean) as string[],
    finalUrl: ad.finalUrl || '',
    displayPath: [ad.path1 || '', ad.path2 || '']
  })) as ResponsiveSearchAd[];
}

/**
 * Local fallback when Python API is unavailable
 * Uses the same logic as Python but in TypeScript
 */
function generateAdsLocalFallback(input: AdGenerationInput): ResponsiveSearchAd[] | ExpandedTextAd[] | CallOnlyAd[] {
  const businessType = detectBusinessTypeFromInput(input) || 'service';
  const mainKeyword = input.keywords[0] || input.industry;
  const businessName = input.businessName || 'Business';
  const location = input.location || '';
  const baseUrl = input.baseUrl || '';
  
  // Generate headlines and descriptions based on type
  let headlines: string[] = [];
  let descriptions: string[] = [];
  
  if (businessType === 'product') {
    headlines = [
      `Shop ${mainKeyword} Deals`,
      `Buy ${mainKeyword} Online`,
      `${mainKeyword} - Best Prices`,
      `Quality ${mainKeyword} Products`,
      `Top Rated ${mainKeyword}`,
      `Free Shipping on ${mainKeyword}`,
      `${mainKeyword} - Next Day Delivery`,
      `Official ${mainKeyword} Store`,
    ];
    
    descriptions = [
      `Shop ${mainKeyword} at unbeatable prices. Best prices guaranteed. Free shipping on orders over $50. Easy returns.`,
      `Looking for ${mainKeyword}? Browse our huge selection at competitive prices. Customer reviews, fast delivery.`,
      `Get the best ${mainKeyword} deals online. Quality products, verified sellers, secure checkout. Order now!`,
      `Quality ${mainKeyword} with fast shipping and easy returns. Shop our latest collection. Secure checkout.`,
    ];
  } else if (businessType === 'emergency') {
    headlines = [
      `24/7 Emergency ${mainKeyword}`,
      `${mainKeyword} - Open Now`,
      `Urgent ${mainKeyword} Help`,
      `Fast ${mainKeyword} Response`,
      `${mainKeyword} in 30 Minutes`,
      `Emergency ${mainKeyword} Fix`,
      `Immediate ${mainKeyword} Help`,
    ];
    
    descriptions = [
      `${mainKeyword} emergency? We're here 24/7! Rapid response for all urgent issues. Call now - we're on our way!`,
      `Don't panic! Our emergency ${mainKeyword} team is available around the clock. Fast arrival, expert repairs.`,
      `24/7 emergency ${mainKeyword} services${location ? ` in ${location}` : ''}. We respond in 30 minutes or less.`,
      `${mainKeyword} emergency? Licensed professionals ready to solve your crisis day or night. No extra fees!`,
    ];
  } else {
    // Service (default)
    headlines = [
      `Professional ${mainKeyword}`,
      `Expert ${mainKeyword} Services`,
      `Licensed ${mainKeyword}`,
      `Trusted ${mainKeyword} Experts`,
      `Quality ${mainKeyword} Service`,
      `Affordable ${mainKeyword}`,
      `Fast ${mainKeyword} Service`,
      `Same Day ${mainKeyword}`,
      ...(location ? [`${mainKeyword} in ${location}`, `Local ${mainKeyword} Near You`] : []),
    ];
    
    descriptions = [
      `Professional ${mainKeyword} services you can trust. Licensed, insured & satisfaction guaranteed. Free estimates available.`,
      `Looking for reliable ${mainKeyword}? We provide fast, affordable services${location ? ` in ${location}` : ''}. Call now or book online!`,
      `Expert ${mainKeyword} at fair prices. Our certified technicians deliver quality workmanship. Same-day service available.`,
      `Trusted ${mainKeyword} professionals${location ? ` in ${location}` : ''}. From repairs to installations, we handle it all. 5-star rated.`,
    ];
  }
  
  // Truncate to character limits
  headlines = headlines.map(h => h.length > 30 ? h.slice(0, 27) + '...' : h).slice(0, 15);
  descriptions = descriptions.map(d => d.length > 90 ? d.slice(0, 87) + '...' : d).slice(0, 4);
  
  // Generate URLs
  const finalUrl = baseUrl || `https://www.example.com/${mainKeyword.toLowerCase().replace(/\s+/g, '-')}`;
  const path1 = businessType === 'product' ? 'shop' : 'services';
  const path2 = businessType === 'product' ? 'now' : 'contact';
  
  // Return based on ad type
  if (input.adType === 'CALL_ONLY') {
    return [{
      businessName: businessName,
      headline1: headlines[0] || '',
      headline2: headlines[1] || headlines[0] || '',
      description1: descriptions[0] || '',
      description2: descriptions[1] || descriptions[0] || '',
      phoneNumber: '',
      verificationUrl: finalUrl,
      displayPath: [path1, path2]
    }] as CallOnlyAd[];
  }
  
  if (input.adType === 'ETA') {
    return [{
      headline1: headlines[0] || '',
      headline2: headlines[1] || headlines[0] || '',
      headline3: headlines[2],
      description1: descriptions[0] || '',
      description2: descriptions[1],
      finalUrl: finalUrl,
      displayPath: [path1, path2]
    }] as ExpandedTextAd[];
  }
  
  // RSA (default)
  return [{
    headlines: headlines.slice(0, 15),
    descriptions: descriptions.slice(0, 4),
    finalUrl: finalUrl,
    displayPath: [path1, path2]
  }] as ResponsiveSearchAd[];
}

