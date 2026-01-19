/**
 * Bid Suggestions Tests
 * 
 * Unit-style test cases for bid calculation
 */

import { suggestBidCents, IntentId } from '../bidSuggestions';

describe('Bid Suggestions', () => {
  // Test 1: CALL + EXACT
  test('suggestBidCents(2000, IntentId.CALL, "EXACT") -> bid around 2400', () => {
    const result = suggestBidCents(2000, IntentId.CALL, "EXACT");
    const expected = Math.round(2000 * 1.2 * 1.0); // 2400
    
    expect(result.bid).toBe(expected);
    expect(result.reason).toContain('intent(CALL_INTENT)=1.2');
    expect(result.reason).toContain('match(EXACT)=1');
  });

  // Test 2: LEAD + PHRASE with fallback
  test('suggestBidCents(null, IntentId.LEAD, "PHRASE") -> base fallback 1000 * 1.0 * 0.8 = 800', () => {
    const result = suggestBidCents(null, IntentId.LEAD, "PHRASE");
    const expected = Math.round(1000 * 1.0 * 0.8); // 800
    
    expect(result.bid).toBe(expected);
  });

  // Test 3: CALL + BROAD + emergency modifier
  test('suggestBidCents(1500, IntentId.CALL, "BROAD", ["24/7"]) -> bump for emergency', () => {
    const result = suggestBidCents(1500, IntentId.CALL, "BROAD", ["24/7"]);
    const baseBid = Math.round(1500 * 1.2 * 0.5); // 900
    const emergencyBid = Math.round(baseBid * 1.2); // 1080
    
    expect(result.bid).toBeGreaterThanOrEqual(emergencyBid);
    expect(result.bid).toBeGreaterThan(baseBid);
  });

  // Test 4: Minimum bid (at least 1 cent)
  test('suggestBidCents with very low base -> at least 1 cent', () => {
    const result = suggestBidCents(1, IntentId.TRAFFIC, "BROAD");
    
    expect(result.bid).toBeGreaterThanOrEqual(1);
  });
});

