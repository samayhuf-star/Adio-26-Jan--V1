/**
 * Bid Suggestions (Engineer-Ready)
 * 
 * Match type + intent based bid calculation
 */

import { IntentId, type MatchType } from './schemas';

/**
 * Suggest bid in cents
 * baseCPC in cents (e.g. 2000 cents = ₹20.00)
 */
export function suggestBidCents(
  baseCpcCents: number | null,
  intent: IntentId,
  matchType: MatchType,
  modifiers: string[] = []
): { bid: number; reason: string } {
  const base = baseCpcCents ?? 1000; // fallback 10.00 (currency smallest unit)

  const intentMul: Record<IntentId, number> = {
    [IntentId.CALL]: 1.2,
    [IntentId.LEAD]: 1.0,
    [IntentId.TRAFFIC]: 0.75,
    [IntentId.PURCHASE]: 1.1,
    [IntentId.RESEARCH]: 0.6,
  };

  const matchMul: Record<MatchType, number> = {
    EXACT: 1.0,
    PHRASE: 0.8,
    BROAD: 0.5,
    BMM: 0.65
  };

  let multiplier = (intentMul[intent] ?? 1.0) * (matchMul[matchType] ?? 0.8);
  
  // emergency modifier bump
  if (modifiers.some(m => /24\/7|emergency|urgent|same day/i.test(m))) {
    multiplier *= 1.2;
  }

  const bid = Math.max(Math.round(base * multiplier), 1); // at least 1 cent
  const reason = `base=${base} * intent(${intent})=${intentMul[intent]} * match(${matchType})=${matchMul[matchType]} => ${bid}`;
  
  return { bid, reason };
}

/**
 * Group keywords into adgroups by overlapping top N tokens
 */
export function groupKeywordsToAdGroups(keywords: string[], maxPerGroup = 20): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  for (const k of keywords) {
    const tokens = k.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 3);
    const key = tokens.join(" ");
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    if (groups[key].length < maxPerGroup) {
      groups[key].push(k);
    } else {
      // find smaller group
      let placed = false;
      for (const gk of Object.keys(groups)) {
        if (groups[gk].length < maxPerGroup) {
          groups[gk].push(k);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups[key + "#2"] = [k];
      }
    }
  }
  
  return groups; // adgroupName => keywords
}

// Legacy functions for backward compatibility
import type { CampaignIntent, BidSuggestion as LegacyBidSuggestion } from './schemas';

export function calculateBidSuggestion(input: {
  keyword: string;
  matchType: MatchType;
  intent: CampaignIntent;
  baseCPCEstimate?: number;
  hasEmergencyModifier?: boolean;
  hasHighValueModifier?: boolean;
  historicalData?: {
    ctr?: number;
    conversionRate?: number;
    cpa?: number;
    targetCPA?: number;
  };
}): LegacyBidSuggestion {
  const intentId = input.intent.replace('_INTENT', '') as IntentId;
  const matchType = input.matchType;
  const baseCents = (input.baseCPCEstimate || 0) * 100; // Convert to cents
  const modifiers: string[] = [];
  
  if (input.hasEmergencyModifier) modifiers.push('emergency');
  if (input.hasHighValueModifier) modifiers.push('premium');
  
  const result = suggestBidCents(baseCents || null, intentId, matchType, modifiers);
  
  return {
    keyword: input.keyword,
    matchType: input.matchType,
    intent: input.intent,
    suggestedCPC: result.bid / 100, // Convert back to dollars
    suggestedCPCFormatted: `$${(result.bid / 100).toFixed(2)}`,
    confidence: input.historicalData ? 'high' : baseCents > 0 ? 'medium' : 'low',
    reasoning: result.reason,
    baseCPCMultiplier: result.bid / (baseCents || 1000),
  };
}

export function calculateBidSuggestions(
  keywords: Array<{
    keyword: string;
    matchType: MatchType;
    hasEmergencyModifier?: boolean;
    hasHighValueModifier?: boolean;
  }>,
  intent: CampaignIntent,
  baseCPCEstimate?: number,
  historicalData?: Record<string, {
    ctr?: number;
    conversionRate?: number;
    cpa?: number;
  }>
): LegacyBidSuggestion[] {
  return keywords.map(kw => {
    const keywordHistorical = historicalData?.[kw.keyword];
    return calculateBidSuggestion({
      keyword: kw.keyword,
      matchType: kw.matchType,
      intent,
      baseCPCEstimate,
      hasEmergencyModifier: kw.hasEmergencyModifier,
      hasHighValueModifier: kw.hasHighValueModifier,
      historicalData: keywordHistorical,
    });
  });
}
