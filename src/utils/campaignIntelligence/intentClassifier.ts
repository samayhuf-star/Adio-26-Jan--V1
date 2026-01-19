/**
 * Intent & Persona Classifier (Engineer-Ready)
 * 
 * Deterministic intent mapping with scoring
 */

import { IntentId, type IntentResult, type LandingExtraction } from './schemas';

// Simple keyword lists (expand in config)
const CALL_HINTS = ["call", "phone", "ring", "speak", "talk"];
const LEAD_HINTS = ["lead", "quote", "estimate", "callback", "enquiry", "form"];
const TRAFFIC_HINTS = ["visit", "traffic", "click", "browse"];

/**
 * Score text for hints
 */
function scoreTextForHints(text: string, hints: string[]): number {
  const lc = text.toLowerCase();
  let score = 0;
  
  for (const h of hints) {
    if (lc.includes(h)) score += 1;
  }
  
  // boost for explicit phrases
  return score;
}

/**
 * Map goal to intent (deterministic + scoring)
 */
export function mapGoalToIntent(
  goalText: string,
  landing: LandingExtraction | null,
  providedPhone?: string
): IntentResult {
  let callScore = scoreTextForHints(goalText, CALL_HINTS);
  let leadScore = scoreTextForHints(goalText, LEAD_HINTS);
  let trafficScore = scoreTextForHints(goalText, TRAFFIC_HINTS);

  if (providedPhone || (landing && landing.phones?.length > 0)) {
    callScore += 2;
  }
  
  if (landing) {
    // heuristic: presence of cart/price -> purchase
    const joined = (landing.title || "") + " " + (landing.tokens || []).join(" ");
    if (/cart|checkout|add to cart|price|buy now/i.test(joined)) {
      return {
        intentId: IntentId.PURCHASE,
        intentLabel: "Purchase",
        confidence: 0.98,
        recommendedDevice: "any",
        primaryKPIs: ["purchases"],
        suggestedAdTypes: ["Shopping", "Display"]
      };
    }
  }

  // normalize to percentages
  const sum = callScore + leadScore + trafficScore + 1e-6;
  const scores = {
    call: callScore / sum,
    lead: leadScore / sum,
    traffic: trafficScore / sum
  };

  // pick highest
  let intentId = IntentId.RESEARCH;
  let confidence = 0.5;
  let recommendedDevice: IntentResult["recommendedDevice"] = "any";
  
  if (scores.call >= Math.max(scores.lead, scores.traffic)) {
    intentId = IntentId.CALL;
    confidence = scores.call;
    recommendedDevice = "mobile-first";
  } else if (scores.lead >= scores.traffic) {
    intentId = IntentId.LEAD;
    confidence = scores.lead;
    recommendedDevice = "desktop-first";
  } else {
    intentId = IntentId.TRAFFIC;
    confidence = scores.traffic;
    recommendedDevice = "any";
  }

  return {
    intentId,
    intentLabel: intentId,
    confidence,
    persona: intentId === IntentId.CALL ? "Local Emergency Seeker" : undefined,
    recommendedDevice,
    primaryKPIs: intentId === IntentId.CALL ? ["calls"] : intentId === IntentId.LEAD ? ["leads"] : ["clicks"],
    suggestedAdTypes: intentId === IntentId.CALL ? ["CALL_ONLY", "RSA"] : ["RSA", "ETA"]
  };
}

/**
 * Get persona from vertical and intent (lookup table)
 */
const PERSONA_LOOKUP: Record<string, Record<IntentId, string>> = {
  electrician: {
    [IntentId.CALL]: "Emergency Seeker",
    [IntentId.LEAD]: "Service Shopper",
    [IntentId.TRAFFIC]: "Information Seeker",
    [IntentId.PURCHASE]: "Product Buyer",
    [IntentId.RESEARCH]: "Research Seeker",
  },
  plumber: {
    [IntentId.CALL]: "Emergency Seeker",
    [IntentId.LEAD]: "Service Shopper",
    [IntentId.TRAFFIC]: "Information Seeker",
    [IntentId.PURCHASE]: "Product Buyer",
    [IntentId.RESEARCH]: "Research Seeker",
  },
  general: {
    [IntentId.CALL]: "Local Service Seeker",
    [IntentId.LEAD]: "Quote Seeker",
    [IntentId.TRAFFIC]: "Information Seeker",
    [IntentId.PURCHASE]: "Product Buyer",
    [IntentId.RESEARCH]: "Research Seeker",
  },
};

export function getPersona(vertical: string, intent: IntentId): string {
  const verticalKey = vertical.toLowerCase();
  const personaMap = PERSONA_LOOKUP[verticalKey] || PERSONA_LOOKUP.general;
  return personaMap[intent] || "Service Seeker";
}

// Legacy function for backward compatibility
export interface IntentClassifierInput {
  goal: string;
  goalType?: 'calls' | 'leads' | 'purchases' | 'traffic';
  landingPageUrl?: string;
  landingPageData?: {
    hasPhone?: boolean;
    hasForm?: boolean;
    hasEcommerce?: boolean;
    hasCart?: boolean;
    hasPriceTags?: boolean;
  };
  trackingPhone?: string;
  vertical?: string;
}

export interface IntentClassificationResult extends IntentResult {
  intent_id: IntentId;
  intent_label: string;
  confidence: number;
  persona: string;
  recommended_device_profile: 'mobile-first' | 'desktop-first' | 'all-devices';
  primary_kpis: string[];
  suggested_ad_types: ('CallOnly' | 'RSA' | 'ETA' | 'Display')[];
  suggested_extensions: ('CallExtension' | 'LocationExtension' | 'SitelinkExtension' | 'CalloutExtension')[];
}

export function classifyIntent(input: IntentClassifierInput): IntentClassificationResult {
  const landingExtraction: LandingExtraction | null = input.landingPageData ? {
    domain: input.landingPageUrl || '',
    url: input.landingPageUrl || '',
    phones: input.landingPageData.hasPhone ? [''] : [],
    services: [],
    emails: [],
    addresses: [],
    tokens: [],
  } : null;

  const result = mapGoalToIntent(input.goal, landingExtraction, input.trackingPhone);
  
  return {
    ...result,
    intent_id: result.intentId,
    intent_label: result.intentLabel,
    recommended_device_profile: result.recommendedDevice === 'mobile-first' ? 'mobile-first' : 
                                result.recommendedDevice === 'desktop-first' ? 'desktop-first' : 'all-devices',
    primary_kpis: result.primaryKPIs,
    suggested_ad_types: result.suggestedAdTypes as any,
    suggested_extensions: result.intentId === IntentId.CALL ? 
      ['CallExtension', 'LocationExtension'] as any :
      ['SitelinkExtension', 'CalloutExtension'] as any,
    persona: result.persona || getPersona(input.vertical || 'general', result.intentId),
  };
}
