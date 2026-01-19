/**
 * Integration Helpers for CampaignBuilder3.tsx
 * 
 * Helper functions to integrate campaign intelligence into the wizard
 */

import { mapGoalToIntent } from './intentClassifier';
import { IntentId } from './schemas';
import { extractLandingPageContent } from './landingPageExtractor';
import { getVerticalConfig, getServiceTokens, getKeywordModifiers } from './verticalTemplates';
import { suggestBidCents, groupKeywordsToAdGroups } from './bidSuggestions';
import { runPolicyChecks } from './policyChecks';
import { getDeviceConfig } from './deviceDefaults';
import type { IntentResult, LandingExtraction, MatchType } from './schemas';

/**
 * Handle URL change - extract landing page content
 */
export async function handleUrlChange(
  url: string,
  onExtracted: (data: LandingExtraction) => void,
  onError: (error: string) => void
): Promise<void> {
  if (!url || !url.trim() || !url.match(/^https?:\/\/.+/i)) {
    return;
  }

  try {
    const extracted = await extractLandingPageContent(url);
    
    // Convert to LandingExtraction format
    const landingExtraction: LandingExtraction = {
      domain: extracted.domain,
      url: extracted.domain,
      title: extracted.title || undefined,
      h1: extracted.h1 || undefined,
      description: extracted.metaDescription || undefined,
      services: extracted.services,
      phones: extracted.phones,
      emails: extracted.emails,
      hours: extracted.hours || undefined,
      addresses: extracted.addresses,
      structuredData: extracted.schemas,
      tokens: extracted.page_text_tokens,
    };
    
    onExtracted(landingExtraction);
  } catch (error) {
    console.warn('Landing page extraction failed:', error);
    onError('Could not extract landing page content. You can continue manually.');
  }
}

/**
 * Handle goal/vertical change - classify intent
 */
export function handleGoalChange(
  goal: string,
  vertical: string,
  landingPage: LandingExtraction | null,
  onClassified: (result: IntentResult) => void,
  providedPhone?: string
): void {
  if (!goal || !goal.trim()) {
    return;
  }

  const intentResult = mapGoalToIntent(goal, landingPage, providedPhone);
  onClassified(intentResult);
}

/**
 * Get suggested keywords from landing page and vertical
 */
export function getSuggestedKeywordsFromIntelligence(
  landingPage: LandingExtraction | null,
  vertical: string
): string[] {
  const suggestions: string[] = [];
  
  // Add services from landing page
  if (landingPage?.services) {
    suggestions.push(...landingPage.services);
  }
  
  // Add service tokens from vertical
  const verticalConfig = getVerticalConfig(vertical);
  suggestions.push(...verticalConfig.service_tokens);
  
  // Add modifiers
  const modifiers = getKeywordModifiers(vertical);
  if (landingPage?.services && landingPage.services.length > 0) {
    landingPage.services.forEach(service => {
      modifiers.forEach(modifier => {
        suggestions.push(`${service} ${modifier}`);
      });
    });
  }
  
  return [...new Set(suggestions)].slice(0, 50); // Dedupe and limit
}

/**
 * Apply bid suggestions to keywords
 */
export function applyBidSuggestionsToKeywords(
  keywords: Array<{ text: string; matchType: MatchType }>,
  intent: IntentId,
  baseCPCCents?: number,
  emergencyModifiers?: string[]
): Array<{ text: string; matchType: MatchType; suggestedBidCents: number; bidReason: string }> {
  return keywords.map(kw => {
    const hasEmergency = emergencyModifiers?.some(m => 
      kw.text.toLowerCase().includes(m.toLowerCase())
    ) || false;
    
    const bidResult = suggestBidCents(
      baseCPCCents || null,
      intent,
      kw.matchType,
      hasEmergency ? ['emergency'] : []
    );
    
    return {
      ...kw,
      suggestedBidCents: bidResult.bid,
      bidReason: bidResult.reason,
    };
  });
}

/**
 * Check if ad passes policy checks
 */
export function validateAdWithPolicy(
  headline: string,
  description: string,
  finalUrl: string,
  vertical: string
): { passed: boolean; issues: Array<{ severity: string; message: string }> } {
  const check = runPolicyChecks({
    headline,
    description,
    finalUrl,
    vertical,
  });
  
  return {
    passed: check.passed,
    issues: [
      ...check.violations.map(v => ({
        severity: v.severity,
        message: v.message,
      })),
      ...check.warnings.map(w => ({
        severity: 'warning',
        message: w.message,
      })),
    ],
  };
}

