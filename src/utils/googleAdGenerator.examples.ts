/**
 * Google Ad Generator - Usage Examples (for CampaignBuilder3)
 * 
 * This file demonstrates how to use the comprehensive ad generation logic
 * integrated into CampaignBuilder3.
 */

import {
  generateAds,
  detectUserIntent,
  validateAd,
  UserIntent,
  type AdGenerationInput,
  type ResponsiveSearchAd,
  type ExpandedTextAd,
  type CallOnlyAd
} from './googleAdGenerator';

// ============================================================================
// EXAMPLE 1: Emergency Plumber (Service + Emergency Intent)
// ============================================================================

export function example1_EmergencyPlumber() {
  const input: AdGenerationInput = {
    keywords: ['emergency plumber', '24/7 plumbing', 'urgent pipe repair'],
    industry: 'Plumbing',
    businessName: 'QuickFix Plumbing',
    location: 'Austin, TX',
    adType: 'RSA',
    filters: {
      matchType: 'phrase',
      campaignStructure: 'IBAG',
      uniqueSellingPoints: ['30-Min Response', 'No Extra Night Fees'],
      callToAction: 'Call Now - We Answer 24/7'
    }
  };

  const ad = generateAds(input) as ResponsiveSearchAd;
  
  console.log('Example 1 - Emergency Plumber RSA:');
  console.log('Headlines:', ad.headlines);
  console.log('Descriptions:', ad.descriptions);
  console.log('Final URL:', ad.finalUrl);
  
  // Validate the ad
  const validation = validateAd(ad, 'RSA');
  console.log('Validation:', validation);
  
  return ad;
}

// ============================================================================
// EXAMPLE 2: Buy Laptop (Product Intent)
// ============================================================================

export function example2_BuyLaptop() {
  const input: AdGenerationInput = {
    keywords: ['buy gaming laptop', 'best gaming laptops 2025', 'gaming laptop deals'],
    industry: 'Electronics',
    businessName: 'TechZone',
    adType: 'RSA',
    filters: {
      matchType: 'broad',
      campaignStructure: 'STAG',
      promotions: ['Up to $300 Off', 'Free Next-Day Shipping'],
      callToAction: 'Shop Now'
    }
  };

  const ad = generateAds(input) as ResponsiveSearchAd;
  
  console.log('Example 2 - Buy Laptop RSA:');
  console.log('Headlines:', ad.headlines);
  console.log('Descriptions:', ad.descriptions);
  
  return ad;
}

// ============================================================================
// EXAMPLE 3: Local Dentist (Local Intent)
// ============================================================================

export function example3_LocalDentist() {
  const input: AdGenerationInput = {
    keywords: ['dentist in Brooklyn', 'Brooklyn dental services', 'local dentist near me'],
    industry: 'Dental',
    businessName: 'Brooklyn Smiles',
    location: 'Brooklyn, NY',
    adType: 'RSA',
    filters: {
      matchType: 'exact',
      campaignStructure: 'SKAG',
      uniqueSellingPoints: ['Same-Day Appointments', 'Accepts Insurance'],
      callToAction: 'Book Appointment'
    }
  };

  const ad = generateAds(input) as ResponsiveSearchAd;
  
  console.log('Example 3 - Local Dentist RSA:');
  console.log('Headlines:', ad.headlines);
  console.log('Descriptions:', ad.descriptions);
  
  return ad;
}

// ============================================================================
// EXAMPLE 4: Expanded Text Ad (ETA)
// ============================================================================

export function example4_ExpandedTextAd() {
  const input: AdGenerationInput = {
    keywords: ['legal services', 'attorney consultation'],
    industry: 'Legal',
    businessName: 'Law & Associates',
    location: 'Chicago, IL',
    adType: 'ETA',
    filters: {
      matchType: 'phrase',
      campaignStructure: 'STAG',
      uniqueSellingPoints: ['Free Consultation', 'No Win No Fee'],
      callToAction: 'Schedule Consultation'
    }
  };

  const ad = generateAds(input) as ExpandedTextAd;
  
  console.log('Example 4 - Expanded Text Ad:');
  console.log('Headline 1:', ad.headline1);
  console.log('Headline 2:', ad.headline2);
  console.log('Headline 3:', ad.headline3);
  console.log('Description 1:', ad.description1);
  console.log('Description 2:', ad.description2);
  
  return ad;
}

// ============================================================================
// EXAMPLE 5: Call-Only Ad
// ============================================================================

export function example5_CallOnlyAd() {
  const input: AdGenerationInput = {
    keywords: ['emergency locksmith', '24/7 locksmith'],
    industry: 'Locksmith',
    businessName: 'QuickLock Services',
    location: 'Miami, FL',
    adType: 'CALL_ONLY',
    filters: {
      matchType: 'broad',
      campaignStructure: 'IBAG',
      uniqueSellingPoints: ['15-Min Response', 'Licensed & Bonded'],
      callToAction: 'Call Now'
    }
  };

  const ad = generateAds(input) as CallOnlyAd;
  
  // Note: phoneNumber should be set separately
  ad.phoneNumber = '(555) 123-4567';
  
  console.log('Example 5 - Call-Only Ad:');
  console.log('Business Name:', ad.businessName);
  console.log('Headline 1:', ad.headline1);
  console.log('Headline 2:', ad.headline2);
  console.log('Phone:', ad.phoneNumber);
  
  return ad;
}

// ============================================================================
// EXAMPLE 6: Intent Detection
// ============================================================================

export function example6_IntentDetection() {
  const testCases = [
    { keywords: ['emergency plumber', 'urgent repair'], industry: 'Plumbing' },
    { keywords: ['buy iPhone', 'iPhone deals'], industry: 'Electronics' },
    { keywords: ['dentist near me', 'local dentist'], industry: 'Dental' },
    { keywords: ['how to fix leak', 'plumbing guide'], industry: 'Plumbing' },
    { keywords: ['plumber services', 'hire plumber'], industry: 'Plumbing' }
  ];

  testCases.forEach((test, index) => {
    const intent = detectUserIntent(test.keywords, test.industry);
    console.log(`Test ${index + 1}:`, {
      keywords: test.keywords,
      industry: test.industry,
      detectedIntent: intent
    });
  });
}

// ============================================================================
// EXAMPLE 7: Integration with Existing Components
// ============================================================================

/**
 * Example of how to integrate with AdsBuilder component
 * 
 * This function shows how to convert the generated ad format
 * to the format expected by the AdsBuilder component
 */
export function convertToAdsBuilderFormat(
  ad: ResponsiveSearchAd | ExpandedTextAd | CallOnlyAd,
  adType: 'RSA' | 'ETA' | 'CALL_ONLY',
  groupName: string
) {
  if (adType === 'RSA') {
    const rsa = ad as ResponsiveSearchAd;
    return {
      id: crypto.randomUUID(),
      groupName,
      adType: 'RSA' as const,
      type: 'rsa' as const,
      headline1: rsa.headlines[0],
      headline2: rsa.headlines[1],
      headline3: rsa.headlines[2],
      headline4: rsa.headlines[3],
      headline5: rsa.headlines[4],
      // ... up to headline15
      description1: rsa.descriptions[0],
      description2: rsa.descriptions[1],
      description3: rsa.descriptions[2],
      description4: rsa.descriptions[3],
      path1: rsa.displayPath[0],
      path2: rsa.displayPath[1],
      finalUrl: rsa.finalUrl,
      selected: false,
      extensions: []
    };
  } else if (adType === 'ETA') {
    const eta = ad as ExpandedTextAd;
    return {
      id: crypto.randomUUID(),
      groupName,
      adType: 'ETA' as const,
      type: 'eta' as const,
      headline1: eta.headline1,
      headline2: eta.headline2,
      headline3: eta.headline3,
      description1: eta.description1,
      description2: eta.description2,
      path1: eta.displayPath[0],
      path2: eta.displayPath[1],
      finalUrl: eta.finalUrl,
      selected: false,
      extensions: []
    };
  } else {
    const callAd = ad as CallOnlyAd;
    return {
      id: crypto.randomUUID(),
      groupName,
      adType: 'CallOnly' as const,
      type: 'callonly' as const,
      headline1: callAd.headline1,
      headline2: callAd.headline2,
      description1: callAd.description1,
      description2: callAd.description2,
      phoneNumber: callAd.phoneNumber,
      businessName: callAd.businessName,
      path1: callAd.displayPath[0],
      path2: callAd.displayPath[1],
      finalUrl: callAd.verificationUrl,
      selected: false,
      extensions: []
    };
  }
}

// ============================================================================
// EXAMPLE 8: Batch Generation for Multiple Keywords
// ============================================================================

/**
 * Generate ads for multiple keywords in a campaign
 */
export function generateAdsForKeywords(
  keywords: string[],
  industry: string,
  businessName: string,
  location: string | undefined,
  adType: 'RSA' | 'ETA' | 'CALL_ONLY',
  filters: AdGenerationInput['filters']
) {
  return keywords.map(keyword => {
    const input: AdGenerationInput = {
      keywords: [keyword],
      industry,
      businessName,
      location,
      adType,
      filters
    };
    
    return {
      keyword,
      ad: generateAds(input),
      intent: detectUserIntent([keyword], industry)
    };
  });
}

