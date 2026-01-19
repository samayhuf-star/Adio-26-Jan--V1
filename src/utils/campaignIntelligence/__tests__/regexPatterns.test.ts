/**
 * Regex Patterns Tests
 * 
 * Unit-style test cases for validation
 */

import {
  normalizePhoneToE164,
  isValidE164Phone,
  isValidURL,
  isValidEmail,
  isValidHoursRange,
  isValidPathToken,
  PHONE_E164_STRICT,
} from '../regexPatterns';

describe('Phone Normalization', () => {
  test('normalizePhoneToE164("09876543210", "+91") -> "+919876543210"', () => {
    const result = normalizePhoneToE164("09876543210", "+91");
    expect(result).toBe("+919876543210");
  });

  test('normalizePhoneToE164("+1 (555) 555-5555") -> "+15555555555"', () => {
    const result = normalizePhoneToE164("+1 (555) 555-5555");
    expect(result).toBe("+15555555555");
  });

  test('PHONE_E164_STRICT.test("+919876543210") -> true', () => {
    expect(PHONE_E164_STRICT.test("+919876543210")).toBe(true);
  });

  test('PHONE_E164_STRICT.test("9876543210") -> false', () => {
    expect(PHONE_E164_STRICT.test("9876543210")).toBe(false);
  });
});

describe('URL Validation', () => {
  test('isValidURL("https://example.com") -> true', () => {
    expect(isValidURL("https://example.com")).toBe(true);
  });

  test('isValidURL("not-a-url") -> false', () => {
    expect(isValidURL("not-a-url")).toBe(false);
  });
});

describe('Email Validation', () => {
  test('isValidEmail("test@example.com") -> true', () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  test('isValidEmail("invalid-email") -> false', () => {
    expect(isValidEmail("invalid-email")).toBe(false);
  });
});

describe('Hours Range Validation', () => {
  test('isValidHoursRange("09:00-18:00") -> true', () => {
    expect(isValidHoursRange("09:00-18:00")).toBe(true);
  });

  test('isValidHoursRange("25:00-26:00") -> false', () => {
    expect(isValidHoursRange("25:00-26:00")).toBe(false);
  });
});

describe('Path Token Validation', () => {
  test('isValidPathToken("service-area") -> true', () => {
    expect(isValidPathToken("service-area")).toBe(true);
  });

  test('isValidPathToken("too-long-path-token") -> false (if > 15 chars)', () => {
    expect(isValidPathToken("too-long-path-token")).toBe(false);
  });
});

