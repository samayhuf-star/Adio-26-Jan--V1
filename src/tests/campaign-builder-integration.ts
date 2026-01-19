/**
 * Campaign Builder 3.0 Integration Test
 * Tests the Google Ads compliance integration in the campaign builder
 */

import {
  generateUniversalRSA,
  generateUniversalDKI,
  generateUniversalCallAd,
  type UniversalAdInput
} from '../utils/universalAdGenerator.js';

import {
  validateRSA,
  validateDKISyntax,
  validateCallOnlyAd
} from '../utils/googleAdsRules.js';

console.log('🏗️ Campaign Builder 3.0 Integration Test\n');

// Simulate campaign data from the builder
const campaignData = {
  campaignName: 'Emergency Plumbing Services Seattle',
  url: 'https://smithplumbing.com',
  vertical: 'plumbing',
  selectedKeywords: [
    { text: 'emergency plumber seattle' },
    { text: 'plumbing repair' },
    { text: 'drain cleaning service' },
    { text: '24 hour plumber' },
    { text: 'water heater repair' }
  ],
  locations: {
    cities: ['Seattle'],
    states: ['Washington']
  },
  cta: 'Fast, reliable plumbing services'
};

// Extract business name (simulating the campaign builder logic)
let businessName = campaignData.campaignName || 'Your Business';
if (businessName.length > 25) {
  businessName = businessName.split(' ')[0] || businessName.substring(0, 25);
}

if (campaignData.url) {
  try {
    const urlObj = new URL(campaignData.url.startsWith('http') ? campaignData.url : `https://${campaignData.url}`);
    const hostname = urlObj.hostname.replace('www.', '');
    const domainName = hostname.split('.')[0];
    if (domainName && domainName.length > 2 && domainName.length <= 25) {
      businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    }
  } catch (e) {
    console.log('URL parsing failed, using campaign name');
  }
}

console.log('📊 Campaign Data:');
console.log('Business Name:', businessName);
console.log('Keywords:', campaignData.selectedKeywords.map(k => k.text));
console.log('Location:', campaignData.locations.cities[0]);

// Build Universal Ad Input (simulating campaign builder)
const keywordTexts = campaignData.selectedKeywords.map(k => k.text).slice(0, 10);
let industry = campaignData.vertical || 'general';

if (industry === 'general' && keywordTexts.length > 0) {
  const firstKeyword = keywordTexts[0].toLowerCase();
  if (firstKeyword.includes('plumb')) industry = 'plumbing';
  else if (firstKeyword.includes('electric')) industry = 'electrical';
  else if (firstKeyword.includes('hvac')) industry = 'hvac';
}

const universalInput: UniversalAdInput = {
  industry: industry,
  keywords: keywordTexts,
  uniqueValueProposition: campaignData.cta || 'quality service and expert solutions',
  audiencePainPoint: 'finding reliable service',
  businessName: businessName,
  location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
  baseUrl: campaignData.url || undefined,
  phoneNumber: '(206) 555-0123',
};

console.log('\n🎯 Universal Ad Input:');
console.log('Industry:', universalInput.industry);
console.log('Business Name:', universalInput.businessName);
console.log('Location:', universalInput.location);

const ads: any[] = [];
const adTypesToGenerate = ['rsa', 'dki', 'call'];

console.log('\n🚀 Generating Ads with Compliance Validation...\n');

for (const adType of adTypesToGenerate) {
  try {
    console.log(`📝 Generating ${adType.toUpperCase()} ad...`);
    
    if (adType === 'rsa') {
      // Generate RSA using 4-Pillar System with Google Ads compliance
      const rsa = generateUniversalRSA(universalInput);
      
      // Validate the generated RSA
      const validation = validateRSA(rsa.headlines, rsa.descriptions, rsa.displayPath);
      
      console.log('✅ RSA Generated:');
      console.log('  Headlines:', rsa.headlines.length);
      console.log('  Descriptions:', rsa.descriptions.length);
      console.log('  Valid:', validation.valid);
      console.log('  Ad Strength:', validation.adStrength);
      
      if (validation.warnings.length > 0) {
        console.log('  Warnings:', validation.warnings);
      }
      
      if (!validation.valid) {
        console.log('  Errors:', [...validation.headlineErrors, ...validation.descriptionErrors]);
      }
      
      // Show sample headlines
      console.log('  Sample Headlines:');
      rsa.headlines.slice(0, 3).forEach((h, i) => {
        console.log(`    ${i + 1}. ${h} (${h.length} chars)`);
      });
      
      ads.push({
        id: `ad-${Date.now()}-${Math.random()}`,
        type: 'rsa',
        adType: 'RSA',
        headlines: rsa.headlines || [],
        descriptions: rsa.descriptions || [],
        displayPath: rsa.displayPath || [],
        finalUrl: rsa.finalUrl || campaignData.url || '',
        selected: false,
        extensions: [],
        pillarBreakdown: rsa.pillarBreakdown,
        adStrength: validation.adStrength,
        validationWarnings: validation.warnings,
      });
      
    } else if (adType === 'dki') {
      // Generate DKI ad with enhanced validation
      const dki = generateUniversalDKI(universalInput);
      
      // Validate DKI syntax in generated headlines and descriptions
      const dkiValidation = {
        headline1: validateDKISyntax(dki.headline1 || ''),
        headline2: validateDKISyntax(dki.headline2 || ''),
        headline3: validateDKISyntax(dki.headline3 || ''),
        description1: validateDKISyntax(dki.description1 || ''),
        description2: validateDKISyntax(dki.description2 || ''),
      };
      
      const hasValidationErrors = Object.values(dkiValidation).some(v => !v.valid);
      
      console.log('✅ DKI Generated:');
      console.log('  Headlines:', [dki.headline1, dki.headline2, dki.headline3].filter(Boolean).length);
      console.log('  Descriptions:', [dki.description1, dki.description2].filter(Boolean).length);
      console.log('  Valid:', !hasValidationErrors);
      
      if (hasValidationErrors) {
        console.log('  DKI Validation Issues:');
        Object.entries(dkiValidation).forEach(([field, result]) => {
          if (!result.valid) {
            console.log(`    ${field}:`, result.errors);
          }
        });
      }
      
      // Show sample DKI
      console.log('  Sample DKI Headlines:');
      console.log(`    1. ${dki.headline1} (${dki.headline1?.length || 0} chars)`);
      console.log(`    2. ${dki.headline2} (${dki.headline2?.length || 0} chars)`);
      
      ads.push({
        id: `ad-${Date.now()}-${Math.random()}`,
        type: 'dki',
        adType: 'DKI',
        headline1: dki.headline1 || '',
        headline2: dki.headline2 || '',
        headline3: dki.headline3 || '',
        description1: dki.description1 || '',
        description2: dki.description2 || '',
        displayPath: dki.displayPath || [],
        finalUrl: dki.finalUrl || campaignData.url || '',
        selected: false,
        extensions: [],
        dkiValidation: dkiValidation,
      });
      
    } else if (adType === 'call') {
      // Generate Call-Only ad with enhanced validation
      const call = generateUniversalCallAd(universalInput);
      
      // Validate Call-Only ad
      const callValidation = validateCallOnlyAd({
        headlines: [call.headline1 || '', call.headline2 || ''],
        descriptions: [call.description1 || '', call.description2 || ''],
        businessName: call.businessName || businessName,
        phoneNumber: call.phoneNumber || '',
        verificationUrl: call.verificationUrl || campaignData.url || '',
      });
      
      console.log('✅ Call-Only Generated:');
      console.log('  Headlines:', [call.headline1, call.headline2].filter(Boolean).length);
      console.log('  Descriptions:', [call.description1, call.description2].filter(Boolean).length);
      console.log('  Business Name:', call.businessName);
      console.log('  Phone:', call.phoneNumber);
      console.log('  Valid:', callValidation.valid);
      
      if (!callValidation.valid) {
        console.log('  Validation Errors:', callValidation.errors);
      }
      
      if (callValidation.warnings.length > 0) {
        console.log('  Warnings:', callValidation.warnings);
      }
      
      // Show sample call ad
      console.log('  Sample Call Headlines:');
      console.log(`    1. ${call.headline1} (${call.headline1?.length || 0} chars)`);
      console.log(`    2. ${call.headline2} (${call.headline2?.length || 0} chars)`);
      
      ads.push({
        id: `ad-${Date.now()}-${Math.random()}`,
        type: 'call',
        adType: 'CallOnly',
        headline1: call.headline1 || '',
        headline2: call.headline2 || '',
        description1: call.description1 || '',
        description2: call.description2 || '',
        phoneNumber: call.phoneNumber || '',
        businessName: call.businessName || businessName,
        finalUrl: call.verificationUrl || campaignData.url || '',
        selected: false,
        extensions: [],
        callValidation: callValidation,
      });
    }
    
    console.log(''); // Add spacing
    
  } catch (adError) {
    console.error(`❌ Error generating ${adType} ad:`, adError);
  }
}

console.log('📊 Campaign Builder Integration Summary:');
console.log('=========================================');
console.log(`✅ Total ads generated: ${ads.length}`);
console.log(`📋 RSA ads: ${ads.filter(a => a.type === 'rsa').length}`);
console.log(`🔧 DKI ads: ${ads.filter(a => a.type === 'dki').length}`);
console.log(`📞 Call-Only ads: ${ads.filter(a => a.type === 'call').length}`);

// Check overall compliance
const rsaAds = ads.filter(a => a.type === 'rsa');
const dkiAds = ads.filter(a => a.type === 'dki');
const callAds = ads.filter(a => a.type === 'call');

let allCompliant = true;

rsaAds.forEach(ad => {
  const validation = validateRSA(ad.headlines, ad.descriptions);
  if (!validation.valid) {
    console.log(`❌ RSA ad ${ad.id} is not compliant`);
    allCompliant = false;
  }
});

dkiAds.forEach(ad => {
  const hasErrors = ad.dkiValidation && Object.values(ad.dkiValidation).some((v: any) => !v.valid);
  if (hasErrors) {
    console.log(`❌ DKI ad ${ad.id} has validation errors`);
    allCompliant = false;
  }
});

callAds.forEach(ad => {
  if (ad.callValidation && !ad.callValidation.valid) {
    console.log(`❌ Call-Only ad ${ad.id} is not compliant`);
    allCompliant = false;
  }
});

if (allCompliant) {
  console.log('\n🎉 All generated ads are Google Ads compliant!');
  console.log('✅ Ready for CSV export and Google Ads upload');
} else {
  console.log('\n⚠️ Some ads have compliance issues that need fixing');
}

console.log('\n🏁 Campaign Builder Integration Test Complete!');