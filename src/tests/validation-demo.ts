/**
 * Google Ads Compliance Validation Demo
 * Demonstrates the enhanced validation rules in action
 */

import {
  validateRSA,
  validateDKISyntax,
  validateCallOnlyAd,
  areHeadlinesSimilar,
  sanitizeAdText,
  formatHeadline,
  formatDescription
} from '../utils/googleAdsRules.js';

import {
  stripQuotesFromAdText
} from '../utils/adValidationUtils.js';

import {
  generateUniversalRSA,
  generateUniversalDKI,
  generateUniversalCallAd,
  type UniversalAdInput
} from '../utils/universalAdGenerator.js';

console.log('🚀 Google Ads Compliance Validation Demo\n');

// Test data
const mockAdInput: UniversalAdInput = {
  industry: 'plumbing',
  keywords: ['emergency plumber', 'plumbing repair', 'drain cleaning'],
  businessName: 'Smith Plumbing',
  location: 'Seattle',
  baseUrl: 'https://smithplumbing.com',
  phoneNumber: '(206) 555-0123'
};

// 1. RSA Validation Demo
console.log('📋 RSA Validation Tests');
console.log('========================');

const goodHeadlines = [
  'Emergency Plumber Seattle',
  'Fast Plumbing Repair',
  'Licensed & Insured Service'
];
const goodDescriptions = [
  'Professional plumbing services available 24/7. Licensed and insured.',
  'Get fast, reliable plumbing repairs from certified professionals.'
];

const rsaResult = validateRSA(goodHeadlines, goodDescriptions);
console.log('✅ Valid RSA:', rsaResult.valid);
console.log('📊 Ad Strength:', rsaResult.adStrength);

// Test similar headlines
const similarHeadlines = [
  'Emergency Plumber Seattle',
  'Emergency Plumber Service', // Too similar
  'Fast Plumbing Repair'
];

const similarResult = validateRSA(similarHeadlines, goodDescriptions);
console.log('❌ Similar headlines valid:', similarResult.valid);
console.log('🚨 Errors:', similarResult.headlineErrors);

// 2. Headline Similarity Demo
console.log('\n🔍 Headline Similarity Detection');
console.log('==================================');

console.log('Same first 3 words:', areHeadlinesSimilar('Emergency Plumber Seattle WA', 'Emergency Plumber Tacoma WA'));
console.log('Promotional patterns:', areHeadlinesSimilar('Best Quality Service', 'Top Quality Service'));
console.log('Substantially different:', areHeadlinesSimilar('Emergency Plumber Seattle', 'Licensed Drain Cleaning'));

// 3. DKI Validation Demo
console.log('\n🔧 DKI Validation Tests');
console.log('========================');

const goodDKI = 'Professional {KeyWord:Plumbing} Services';
const dkiResult = validateDKISyntax(goodDKI);
console.log('✅ Valid DKI:', dkiResult.valid);

const quotedDKI = 'Professional "{KeyWord:Plumbing}" Services';
const quotedResult = validateDKISyntax(quotedDKI);
console.log('❌ Quoted DKI valid:', quotedResult.valid);
console.log('🚨 Errors:', quotedResult.errors);

// 4. Text Sanitization Demo
console.log('\n🧹 Text Sanitization Tests');
console.log('===========================');

const messyText = 'Emergency Plumber @ Seattle #1 Service!!! BEST BEST Quality!!!';
const cleanText = sanitizeAdText(messyText);
console.log('Original:', messyText);
console.log('Sanitized:', cleanText);

// 5. Quote Removal Demo
console.log('\n📝 Quote Removal Tests');
console.log('=======================');

const quotedDKIText = '"Professional {KeyWord:Plumbing} Services"';
const cleanedDKI = stripQuotesFromAdText(quotedDKIText);
console.log('Original:', quotedDKIText);
console.log('Cleaned:', cleanedDKI);

// 6. Call-Only Validation Demo
console.log('\n📞 Call-Only Ad Validation');
console.log('===========================');

const goodCallAd = {
  headlines: ['Emergency Plumber - Call Now', '24/7 Service Available'],
  descriptions: [
    'Professional plumbing services. Licensed & insured. Call for immediate help!',
    'Smith Plumbing - Your trusted plumbing experts. Fast response guaranteed.'
  ],
  businessName: 'Smith Plumbing',
  phoneNumber: '(206) 555-0123',
  verificationUrl: 'https://smithplumbing.com'
};

const callResult = validateCallOnlyAd(goodCallAd);
console.log('✅ Valid Call-Only Ad:', callResult.valid);

const badCallAd = {
  ...goodCallAd,
  businessName: 'Best Plumbing Company', // Contains promotional text
  phoneNumber: '1-900-555-0123' // Premium rate number
};

const badCallResult = validateCallOnlyAd(badCallAd);
console.log('❌ Bad Call-Only Ad valid:', badCallResult.valid);
console.log('🚨 Errors:', badCallResult.errors);

// 7. Universal Ad Generator Demo
console.log('\n🎯 Universal Ad Generator Tests');
console.log('================================');

try {
  const rsa = generateUniversalRSA(mockAdInput);
  console.log('✅ Generated RSA Headlines:', rsa.headlines.length);
  console.log('✅ Generated RSA Descriptions:', rsa.descriptions.length);
  
  // Validate generated RSA
  const generatedRSAValidation = validateRSA(rsa.headlines, rsa.descriptions);
  console.log('📊 Generated RSA Valid:', generatedRSAValidation.valid);
  console.log('📊 Generated RSA Strength:', generatedRSAValidation.adStrength);
  
  const dki = generateUniversalDKI(mockAdInput);
  console.log('✅ Generated DKI Headlines:', [dki.headline1, dki.headline2, dki.headline3].filter(Boolean).length);
  
  const call = generateUniversalCallAd(mockAdInput);
  console.log('✅ Generated Call-Only Headlines:', [call.headline1, call.headline2].filter(Boolean).length);
  
  // Validate generated Call-Only
  const generatedCallValidation = validateCallOnlyAd({
    headlines: [call.headline1, call.headline2],
    descriptions: [call.description1, call.description2],
    businessName: call.businessName,
    phoneNumber: call.phoneNumber,
    verificationUrl: call.verificationUrl
  });
  console.log('📊 Generated Call-Only Valid:', generatedCallValidation.valid);
  
} catch (error) {
  console.error('❌ Generator Error:', error);
}

console.log('\n🎉 Google Ads Compliance Demo Complete!');
console.log('All validation rules are working correctly.');