/**
 * Intent Classifier Tests
 * 
 * Unit-style test cases for intent mapping
 */

import { mapGoalToIntent, IntentId } from '../intentClassifier';
import type { LandingExtraction } from '../schemas';

describe('Intent Classifier', () => {
  // Test 1: CALL intent with phone
  test('mapGoalToIntent("I want more phone calls", null, "+919876543210") -> CALL, mobile-first, confidence > 0.6', () => {
    const result = mapGoalToIntent("I want more phone calls", null, "+919876543210");
    
    expect(result.intentId).toBe(IntentId.CALL);
    expect(result.recommendedDevice).toBe("mobile-first");
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.primaryKPIs).toContain("calls");
  });

  // Test 2: LEAD intent
  test('mapGoalToIntent("Get leads and form submissions", null, undefined) -> LEAD', () => {
    const result = mapGoalToIntent("Get leads and form submissions", null, undefined);
    
    expect(result.intentId).toBe(IntentId.LEAD);
    expect(result.recommendedDevice).toBe("desktop-first");
    expect(result.primaryKPIs).toContain("leads");
  });

  // Test 3: TRAFFIC intent
  test('mapGoalToIntent("increase website traffic", null) -> TRAFFIC', () => {
    const result = mapGoalToIntent("increase website traffic", null);
    
    expect(result.intentId).toBe(IntentId.TRAFFIC);
    expect(result.recommendedDevice).toBe("any");
    expect(result.primaryKPIs).toContain("clicks");
  });

  // Test 4: PURCHASE intent (e-commerce signals)
  test('mapGoalToIntent with cart/price signals -> PURCHASE', () => {
    const landing: LandingExtraction = {
      domain: "example.com",
      url: "https://example.com",
      title: "Buy Now - Add to Cart",
      tokens: ["cart", "checkout", "price"],
      services: [],
      phones: [],
      emails: [],
      addresses: [],
    };
    
    const result = mapGoalToIntent("sell products", landing);
    
    expect(result.intentId).toBe(IntentId.PURCHASE);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.primaryKPIs).toContain("purchases");
  });
});

