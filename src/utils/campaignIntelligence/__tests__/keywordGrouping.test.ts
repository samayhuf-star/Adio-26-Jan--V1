/**
 * Keyword Grouping Tests
 * 
 * Unit-style test cases for keyword grouping
 */

import { groupKeywordsToAdGroups } from '../bidSuggestions';

describe('Keyword Grouping', () => {
  test('groupKeywordsToAdGroups groups similar keywords', () => {
    const keywords = [
      "electrician near me",
      "emergency electrician",
      "fan repair electrician",
      "wiring electrician"
    ];
    
    const groups = groupKeywordsToAdGroups(keywords, 20);
    
    // Should have groups
    expect(Object.keys(groups).length).toBeGreaterThan(0);
    
    // All keywords should be in groups
    const allGrouped = Object.values(groups).flat();
    expect(allGrouped.length).toBe(keywords.length);
    
    // No group should exceed maxPerGroup
    Object.values(groups).forEach(group => {
      expect(group.length).toBeLessThanOrEqual(20);
    });
  });

  test('groupKeywordsToAdGroups respects maxPerGroup limit', () => {
    const keywords = Array.from({ length: 50 }, (_, i) => `keyword ${i}`);
    const groups = groupKeywordsToAdGroups(keywords, 10);
    
    Object.values(groups).forEach(group => {
      expect(group.length).toBeLessThanOrEqual(10);
    });
  });
});

