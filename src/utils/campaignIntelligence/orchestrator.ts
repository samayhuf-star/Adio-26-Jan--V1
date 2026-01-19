/**
 * Campaign Intelligence Orchestrator
 * 
 * Main function to generate complete campaign intelligence
 */

import { classifyIntent } from './intentClassifier';
import { extractLandingPageContent } from './landingPageExtractor';
import { getVerticalConfig } from './verticalTemplates';
import { calculateBidSuggestions } from './bidSuggestions';
import { runPolicyChecks } from './policyChecks';
import { getLocalizationConfig } from './localization';
import { generateTrackingConfig } from './tracking';
import { getDeviceConfig } from './deviceDefaults';
import type { CampaignIntelligence, Vertical, CampaignIntent, BidSuggestion, PolicyCheck, LocalizationConfig, TrackingConfig, DeviceConfig, IntentClassification, MatchType } from './schemas';
import type { VerticalConfig } from './verticalTemplates';

export interface CampaignIntelligenceInput {
  goal: string;
  goalType?: 'calls' | 'leads' | 'purchases' | 'traffic';
  landingPageUrl: string;
  vertical: Vertical | string;
  geo: string;
  language?: string;
  campaignId?: string;
  trackingPhone?: string;
  allowedDomains?: string[];
  baseCPCEstimate?: number;
}

/**
 * Generate complete campaign intelligence
 */
export async function generateCampaignIntelligence(
  input: CampaignIntelligenceInput
): Promise<CampaignIntelligence> {
  // 1. Extract landing page content
  const landingPage = await extractLandingPageContent(input.landingPageUrl);

  // 2. Classify intent
  const intentResult = classifyIntent({
    goal: input.goal,
    goalType: input.goalType,
    landingPageUrl: input.landingPageUrl,
    landingPageData: {
      hasPhone: landingPage.phones.length > 0,
      hasForm: false, // TODO: Detect forms in landing page
      hasEcommerce: false, // TODO: Detect e-commerce signals
      hasCart: false,
      hasPriceTags: false,
    },
    trackingPhone: input.trackingPhone,
    vertical: input.vertical,
  });

  // 3. Get vertical config
  const vertical = getVerticalConfig(input.vertical);

  // 4. Get localization config
  const localization = getLocalizationConfig(input.geo, input.language);

  // 5. Generate tracking config
  const tracking = generateTrackingConfig(input.campaignId || 'campaign-1', {
    dniEnabled: intentResult.intentId === 'CALL' && landingPage.phones.length > 0,
  });

  // 6. Get device config
  const deviceConfig = getDeviceConfig(intentResult.intentId as CampaignIntent);

  // 7. Run policy checks (on sample content - will be run on actual ads later)
  const policyCheck = runPolicyChecks({
    vertical: input.vertical,
    allowedDomains: input.allowedDomains,
  });

  // 8. Bid suggestions will be generated per keyword later
  const bidSuggestions: BidSuggestion[] = [];

  // Map intent result to IntentClassification format
  const intentClassification: IntentClassification = {
    intent: intentResult.intentId as unknown as CampaignIntent,
    suggestedMatchTypes: ['EXACT', 'PHRASE'] as MatchType[],
    tone: 'professional',
    voice: intentResult.intentLabel || 'default',
    confidence: intentResult.confidence,
  };

  // Map landing page to LandingPageData format  
  const landingPageData = {
    domain: landingPage.domain,
    title: landingPage.title || null,
    h1: landingPage.h1 || null,
    metaDescription: landingPage.metaDescription || null,
    services: landingPage.services,
    phones: landingPage.phones,
    emails: landingPage.emails,
    hours: landingPage.hours || null,
    addresses: landingPage.addresses,
    schemas: landingPage.schemas || {},
    page_text_tokens: landingPage.page_text_tokens,
    extractionMethod: 'crawl' as const,
    extractedAt: new Date().toISOString(),
  };

  // Map vertical to schema VerticalConfig format
  const verticalConfig = vertical ? {
    verticalId: vertical.vertical,
    serviceTokens: vertical.service_tokens,
    trustPhrases: vertical.trust_phrases,
    emergencyModifiers: vertical.emergency_modifiers || [],
    negativeDefaults: vertical.negative_defaults || [],
    adTemplates: vertical.ad_templates || [],
  } : null;

  return {
    intent: intentClassification,
    landingPage: landingPageData,
    vertical: verticalConfig,
    bidSuggestions,
    policyCheck,
    localization,
    tracking,
    deviceConfig,
    generatedAt: new Date().toISOString(),
  };
}

