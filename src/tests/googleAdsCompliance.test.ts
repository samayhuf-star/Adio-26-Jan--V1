/**
 * Google Ads Compliance Test Suite
 * Tests all the enhanced validation rules and compliance fixes
 */

import {
  validateRSA,
  validateDKISyntax,
  validateCallOnlyAd,
  validatePhoneNumber,
  areHeadlinesSimilar,
  sanitizeAdText,
  formatHeadline,
  formatDescription,
  CHARACTER_LIMITS
} from '../utils/googleAdsRules';

import {
  stripQuotesFromAdText,
  validateAndFixAd
} from '../utils/adValidationUtils';

import {
  generateUniversalRSA,
  generateUniversalDKI,
  generateUniversalCallAd,
  type UniversalAdInput
} from '../utils/universalAdGenerator';

describe('Google Ads Compliance Tests', () => {
  
  // Test data
  const mockAdInput: UniversalAdInput = {
    industry: 'plumbing',
    keywords: ['emergency plumber', 'plumbing repair', 'drain cleaning'],
    businessName: 'Smith Plumbing',
    location: 'Seattle',
    baseUrl: 'https://smithplumbing.com',
    phoneNumber: '(206) 555-0123'
  };

  describe('RSA Validation Tests', () => {
    
    test('should validate proper RSA with minimum requirements', () => {
      const headlines = [
        'Emergency Plumber Seattle',
        'Fast Plumbing Repair',
        'Licensed & Insured Service'
      ];
      const descriptions = [
        'Professional plumbing services available 24/7. Licensed and insured.',
        'Get fast, reliable plumbing repairs from certified professionals.'
      ];
      
      const result = validateRSA(headlines, descriptions);
      expect(result.valid).toBe(true);
      expect(result.headlineErrors).toHaveLength(0);
      expect(result.descriptionErrors).toHaveLength(0);
    });

    test('should reject RSA with insufficient headlines', () => {
      const headlines = ['Emergency Plumber', 'Fast Service']; // Only 2 headlines
      const descriptions = ['Professional service', 'Licensed and insured'];
      
      const result = validateRSA(headlines, descriptions);
      expect(result.valid).toBe(false);
      expect(result.headlineErrors).toContain('RSA requires minimum 3 headlines (found 2)');
    });

    test('should reject RSA with similar headlines', () => {
      const headlines = [
        'Emergency Plumber Seattle',
        'Emergency Plumber Service', // Too similar to first
        'Fast Plumbing Repair'
      ];
      const descriptions = ['Professional service', 'Licensed and insured'];
      
      const result = validateRSA(headlines, descriptions);
      expect(result.valid).toBe(false);
      expect(result.headlineErrors.some(e => e.includes('too similar'))).toBe(true);
    });

    test('should reject headlines exceeding character limit', () => {
      const headlines = [
        'This is a very long headline that exceeds thirty characters', // 61 chars
        'Emergency Plumber',
        'Fast Service'
      ];
      const descriptions = ['Professional service', 'Licensed and insured'];
      
      const result = validateRSA(headlines, descriptions);
      expect(result.valid).toBe(false);
      expect(result.headlineErrors.some(e => e.includes('exceeds 30 characters'))).toBe(true);
    });
  });

  describe('Headline Similarity Tests', () => {
    
    test('should detect identical headlines', () => {
      expect(areHeadlinesSimilar('Emergency Plumber', 'Emergency Plumber')).toBe(true);
    });

    test('should detect headlines with same first 3 words', () => {
      expect(areHeadlinesSimilar('Emergency Plumber Seattle WA', 'Emergency Plumber Tacoma WA')).toBe(true);
    });

    test('should detect similar promotional patterns', () => {
      expect(areHeadlinesSimilar('Best Quality Service', 'Top Quality Service')).toBe(true);
    });

    test('should allow substantially different headlines', () => {
      expect(areHeadlinesSimilar('Emergency Plumber Seattle', 'Licensed Drain Cleaning')).toBe(false);
    });

    test('should detect plural/singular variations', () => {
      expect(areHeadlinesSimilar('Plumber Service', 'Plumbers Service')).toBe(true);
    });
  });

  describe('DKI Validation Tests', () => {
    
    test('should validate proper DKI syntax', () => {
      const text = 'Professional {KeyWord:Plumbing} Services';
      const result = validateDKISyntax(text);
      expect(result.valid).toBe(true);
      expect(result.syntaxValid).toBe(true);
      expect(result.defaultTextValid).toBe(true);
    });

    test('should reject DKI with quotes', () => {
      const text = 'Professional "{KeyWord:Plumbing}" Services';
      const result = validateDKISyntax(text);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must not be enclosed in quotes'))).toBe(true);
    });

    test('should reject multiple DKI in same field', () => {
      const text = '{KeyWord:Plumbing} and {KeyWord:Repair} Services';
      const result = validateDKISyntax(text);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Only one DKI insertion allowed per text field');
    });

    test('should reject empty default text', () => {
      const text = 'Professional {KeyWord:} Services';
      const result = validateDKISyntax(text);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('DKI default text cannot be empty');
    });

    test('should validate character limits with default text', () => {
      const text = '{KeyWord:Very Long Default Text That Exceeds Limits}'; // Would exceed 30 chars
      const result = validateDKISyntax(text);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds 30 character limit'))).toBe(true);
    });

    test('should warn about grammar issues', () => {
      const text = 'Looking for a {KeyWord:electrician}?'; // "a electrician" is wrong
      const result = validateDKISyntax(text);
      expect(result.warnings.some(w => w.includes('Grammar issue'))).toBe(true);
    });
  });

  describe('Call-Only Ad Validation Tests', () => {
    
    test('should validate proper call-only ad', () => {
      const ad = {
        headlines: ['Emergency Plumber - Call Now', '24/7 Service Available'],
        descriptions: [
          'Professional plumbing services. Licensed & insured. Call for immediate help!',
          'Smith Plumbing - Your trusted plumbing experts. Fast response guaranteed.'
        ],
        businessName: 'Smith Plumbing',
        phoneNumber: '(206) 555-0123',
        verificationUrl: 'https://smithplumbing.com'
      };
      
      const result = validateCallOnlyAd(ad);
      expect(result.valid).toBe(true);
      expect(result.phoneValid).toBe(true);
      expect(result.businessNameValid).toBe(true);
    });

    test('should reject promotional text in business name', () => {
      const ad = {
        headlines: ['Call Now', 'Fast Service'],
        descriptions: ['Professional service', 'Licensed and insured'],
        businessName: 'Best Plumbing Company', // Contains "Best"
        phoneNumber: '(206) 555-0123',
        verificationUrl: 'https://example.com'
      };
      
      const result = validateCallOnlyAd(ad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('promotional text'))).toBe(true);
    });

    test('should reject premium-rate phone numbers', () => {
      const ad = {
        headlines: ['Call Now', 'Fast Service'],
        descriptions: ['Professional service', 'Licensed and insured'],
        businessName: 'Smith Plumbing',
        phoneNumber: '1-900-555-0123', // Premium rate
        verificationUrl: 'https://example.com'
      };
      
      const result = validateCallOnlyAd(ad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Premium-rate phone numbers'))).toBe(true);
    });

    test('should require call-to-action words', () => {
      const ad = {
        headlines: ['Emergency Plumber', 'Fast Service'], // No "Call" or "Tap"
        descriptions: ['Professional service', 'Licensed and insured'],
        businessName: 'Smith Plumbing',
        phoneNumber: '(206) 555-0123',
        verificationUrl: 'https://example.com'
      };
      
      const result = validateCallOnlyAd(ad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('call-to-action word'))).toBe(true);
    });

    test('should reject generic business names', () => {
      const ad = {
        headlines: ['Call Now', 'Fast Service'],
        descriptions: ['Professional service', 'Licensed and insured'],
        businessName: 'Plumber', // Generic term
        phoneNumber: '(206) 555-0123',
        verificationUrl: 'https://example.com'
      };
      
      const result = validateCallOnlyAd(ad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('generic service terms'))).toBe(true);
    });
  });

  describe('Phone Number Validation Tests', () => {
    
    test('should validate US phone numbers', () => {
      expect(validatePhoneNumber('(206) 555-0123').valid).toBe(true);
      expect(validatePhoneNumber('206-555-0123').valid).toBe(true);
      expect(validatePhoneNumber('2065550123').valid).toBe(true);
      expect(validatePhoneNumber('1-206-555-0123').valid).toBe(true);
    });

    test('should validate toll-free numbers', () => {
      expect(validatePhoneNumber('1-800-555-0123').valid).toBe(true);
      expect(validatePhoneNumber('888-555-0123').valid).toBe(true);
    });

    test('should reject premium-rate numbers', () => {
      expect(validatePhoneNumber('1-900-555-0123').valid).toBe(false);
      expect(validatePhoneNumber('976-555-0123').valid).toBe(false);
      expect(validatePhoneNumber('550-555-0123').valid).toBe(false);
    });

    test('should reject fake/test numbers', () => {
      expect(validatePhoneNumber('555-123-4567').valid).toBe(false);
      expect(validatePhoneNumber('123-456-7890').valid).toBe(false);
      expect(validatePhoneNumber('000-000-0000').valid).toBe(false);
    });
  });

  describe('Text Sanitization Tests', () => {
    
    test('should remove prohibited special characters', () => {
      const input = 'Emergency Plumber @ Seattle #1 Service!';
      const result = sanitizeAdText(input);
      expect(result).toBe('Emergency Plumber Seattle 1 Service!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });

    test('should limit exclamation marks to one', () => {
      const input = 'Emergency Service!!! Call Now!!';
      const result = sanitizeAdText(input);
      expect((result.match(/!/g) || []).length).toBe(1);
    });

    test('should fix all caps text', () => {
      const input = 'EMERGENCY PLUMBER SERVICE';
      const result = sanitizeAdText(input);
      expect(result).toBe('Emergency Plumber Service');
    });

    test('should preserve acronyms', () => {
      const input = 'Licensed by EPA and OSHA';
      const result = sanitizeAdText(input);
      expect(result).toContain('EPA');
      expect(result).toContain('OSHA');
    });

    test('should remove repetitive words', () => {
      const input = 'Best Best Plumbing Service';
      const result = sanitizeAdText(input);
      expect(result).toBe('Best Plumbing Service');
    });

    test('should replace 24/7 with 24-7', () => {
      const input = 'Available 24/7 Service';
      const result = sanitizeAdText(input);
      expect(result).toBe('Available 24-7 Service');
    });
  });

  describe('Quote Removal Tests', () => {
    
    test('should remove quotes around DKI syntax', () => {
      expect(stripQuotesFromAdText('"{KeyWord:Plumbing}" Service')).toBe('{KeyWord:Plumbing} Service');
      expect(stripQuotesFromAdText("'{KeyWord:Plumbing}' Service")).toBe('{KeyWord:Plumbing} Service');
    });

    test('should remove quotes from entire phrases with DKI', () => {
      expect(stripQuotesFromAdText('"Professional {KeyWord:Plumbing} Services"')).toBe('Professional {KeyWord:Plumbing} Services');
    });

    test('should preserve apostrophes in contractions', () => {
      expect(stripQuotesFromAdText("We're the best don't wait")).toBe("We're the best don't wait");
    });

    test('should handle all DKI capitalization variants', () => {
      expect(stripQuotesFromAdText('"{keyword:plumbing}"')).toBe('{keyword:plumbing}');
      expect(stripQuotesFromAdText('"{Keyword:plumbing}"')).toBe('{Keyword:plumbing}');
      expect(stripQuotesFromAdText('"{KeyWord:plumbing}"')).toBe('{KeyWord:plumbing}');
      expect(stripQuotesFromAdText('"{KEYWord:plumbing}"')).toBe('{KEYWord:plumbing}');
    });
  });

  describe('Universal Ad Generator Tests', () => {
    
    test('should generate compliant RSA', () => {
      const rsa = generateUniversalRSA(mockAdInput);
      
      expect(rsa.headlines.length).toBeGreaterThanOrEqual(3);
      expect(rsa.headlines.length).toBeLessThanOrEqual(15);
      expect(rsa.descriptions.length).toBeGreaterThanOrEqual(2);
      expect(rsa.descriptions.length).toBeLessThanOrEqual(4);
      
      // Check character limits
      rsa.headlines.forEach(h => {
        expect(h.length).toBeLessThanOrEqual(30);
      });
      rsa.descriptions.forEach(d => {
        expect(d.length).toBeLessThanOrEqual(90);
      });
      
      // Validate with Google rules
      const validation = validateRSA(rsa.headlines, rsa.descriptions);
      expect(validation.valid).toBe(true);
    });

    test('should generate compliant DKI ad', () => {
      const dki = generateUniversalDKI(mockAdInput);
      
      expect(dki.headline1).toBeTruthy();
      expect(dki.headline2).toBeTruthy();
      expect(dki.description1).toBeTruthy();
      expect(dki.description2).toBeTruthy();
      
      // Check character limits
      expect(dki.headline1.length).toBeLessThanOrEqual(30);
      expect(dki.headline2.length).toBeLessThanOrEqual(30);
      expect(dki.description1.length).toBeLessThanOrEqual(90);
      expect(dki.description2.length).toBeLessThanOrEqual(90);
      
      // Should contain DKI syntax
      const hasDKI = [dki.headline1, dki.headline2, dki.description1, dki.description2]
        .some(text => text.includes('{KeyWord:') || text.includes('{keyword:'));
      expect(hasDKI).toBe(true);
    });

    test('should generate compliant Call-Only ad', () => {
      const call = generateUniversalCallAd(mockAdInput);
      
      expect(call.headline1).toBeTruthy();
      expect(call.headline2).toBeTruthy();
      expect(call.description1).toBeTruthy();
      expect(call.description2).toBeTruthy();
      expect(call.businessName).toBeTruthy();
      expect(call.phoneNumber).toBeTruthy();
      
      // Check character limits
      expect(call.headline1.length).toBeLessThanOrEqual(30);
      expect(call.headline2.length).toBeLessThanOrEqual(30);
      expect(call.description1.length).toBeLessThanOrEqual(90);
      expect(call.description2.length).toBeLessThanOrEqual(90);
      expect(call.businessName.length).toBeLessThanOrEqual(25);
      
      // Validate with Google rules
      const validation = validateCallOnlyAd({
        headlines: [call.headline1, call.headline2],
        descriptions: [call.description1, call.description2],
        businessName: call.businessName,
        phoneNumber: call.phoneNumber,
        verificationUrl: call.verificationUrl
      });
      expect(validation.valid).toBe(true);
    });
  });

  describe('Character Limit Tests', () => {
    
    test('should enforce RSA character limits', () => {
      expect(CHARACTER_LIMITS.RSA.HEADLINE).toBe(30);
      expect(CHARACTER_LIMITS.RSA.DESCRIPTION).toBe(90);
      expect(CHARACTER_LIMITS.RSA.DISPLAY_PATH).toBe(15);
      expect(CHARACTER_LIMITS.RSA.HEADLINE_MIN_COUNT).toBe(3);
      expect(CHARACTER_LIMITS.RSA.HEADLINE_MAX_COUNT).toBe(15);
      expect(CHARACTER_LIMITS.RSA.DESCRIPTION_MIN_COUNT).toBe(2);
      expect(CHARACTER_LIMITS.RSA.DESCRIPTION_MAX_COUNT).toBe(4);
    });

    test('should enforce Call-Only character limits', () => {
      expect(CHARACTER_LIMITS.CALL_ONLY.HEADLINE).toBe(30);
      expect(CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION).toBe(90);
      expect(CHARACTER_LIMITS.CALL_ONLY.BUSINESS_NAME).toBe(25);
      expect(CHARACTER_LIMITS.CALL_ONLY.HEADLINE_COUNT).toBe(2);
      expect(CHARACTER_LIMITS.CALL_ONLY.DESCRIPTION_COUNT).toBe(2);
    });

    test('should format headlines to character limit', () => {
      const longHeadline = 'This is a very long headline that definitely exceeds the thirty character limit';
      const formatted = formatHeadline(longHeadline);
      expect(formatted.length).toBeLessThanOrEqual(30);
    });

    test('should format descriptions to character limit', () => {
      const longDescription = 'This is a very long description that definitely exceeds the ninety character limit for Google Ads descriptions and should be truncated properly';
      const formatted = formatDescription(longDescription);
      expect(formatted.length).toBeLessThanOrEqual(90);
    });
  });

  describe('Integration Tests', () => {
    
    test('should fix common ad validation issues', () => {
      const problematicAd = {
        type: 'rsa',
        headline1: '"Emergency Plumber!!!"', // Has quotes and multiple exclamations
        headline2: 'BEST PLUMBING SERVICE @#$', // All caps with special chars
        headline3: 'Emergency Plumber Service', // Similar to headline1
        description1: 'Professional {KeyWord:plumbing} services available 24/7. Licensed and insured professionals.',
        description2: 'Get fast fast reliable plumbing repairs', // Repetitive word
        finalUrl: 'smithplumbing.com' // Missing https://
      };
      
      const { ad: fixedAd, report } = validateAndFixAd(problematicAd);
      
      expect(report.fixes.length).toBeGreaterThan(0);
      expect(fixedAd.headline1).not.toContain('"');
      expect(fixedAd.headline1).not.toContain('!!!');
      expect(fixedAd.headline2).not.toContain('@');
      expect(fixedAd.headline2).not.toContain('#');
      expect(fixedAd.finalUrl).toStartWith('https://');
    });
  });
});