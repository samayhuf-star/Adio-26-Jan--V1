/**
 * Campaign Intelligence - Data Schemas (Engineer-Ready)
 * 
 * Complete and explicit TypeScript types
 */

// ============================================================================
// Enums
// ============================================================================

export enum IntentId {
  CALL = "CALL_INTENT",
  LEAD = "LEAD_INTENT",
  TRAFFIC = "TRAFFIC_INTENT",
  PURCHASE = "PURCHASE_INTENT",
  RESEARCH = "RESEARCH_INTENT",
}

export type MatchType = "EXACT" | "PHRASE" | "BROAD" | "BMM";

// ============================================================================
// Core Objects
// ============================================================================

export interface IntentResult {
  intentId: IntentId;
  intentLabel: string;
  confidence: number;       // 0..1
  persona?: string;         // e.g. "Local Emergency Seeker"
  recommendedDevice: "mobile-first" | "desktop-first" | "any";
  primaryKPIs: string[];    // e.g. ["calls","call_conversion_rate"]
  suggestedAdTypes: string[]; // e.g. ["CallOnly","RSA"]
}

export interface LandingExtraction {
  domain: string;
  url: string;
  title?: string;
  h1?: string;
  description?: string;
  services: string[];       // normalized tokens e.g. ["wiring","fan repair"]
  phones: string[];         // E.164 normalized preferred
  emails: string[];
  hours?: Record<string, string>; // { "mon":"09:00-18:00", ... }
  addresses: string[];     // freeform
  structuredData?: any;     // parsed schema.org
  tokens: string[];        // tokenized page text (for keyword gen)
}

export interface VerticalConfig {
  verticalId: string;       // "electrician"
  serviceTokens: string[];  // seeds
  trustPhrases: string[];   // "licensed","insured"
  emergencyModifiers: string[]; // "24/7","emergency"
  negativeDefaults: string[]; // "free","DIY","jobs"
  adTemplates?: Array<{ type: string; template: string }>;
}

export interface KeywordObject {
  text: string;             // raw text e.g. "electrician near me"
  normalized: string;       // normalized lowercase no punctuation
  matchType: MatchType;
  intentScore: number;      // 0..1
  suggestedBidCents?: number; // in account currency cents (or paise)
  generatedBy?: string;     // template id
}

export interface AdObject {
  id?: string;
  type: "RSA" | "CALL_ONLY" | "ETA" | "DISPLAY";
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  phone?: string;           // for call-only or call extension
  paths?: string[];         // path1, path2
  status?: "ENABLED" | "PAUSED" | "DISABLED";
  policyIssues?: PolicyIssue[];
}

export interface PolicyIssue {
  code: string;
  severity: "warning" | "error" | "block";
  message: string;
}

export interface DNIMap {
  keyHash: string;          // deterministic key (campaign+adgroup hash)
  phone: string;            // E.164
  providerId?: string;
  expiresAt?: string;       // ISO date
}

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

export type CampaignGoal = 'calls' | 'leads' | 'purchases' | 'traffic';
export type CampaignIntent = 'CALL_INTENT' | 'LEAD_INTENT' | 'TRAFFIC_INTENT' | 'PURCHASE_INTENT';
export type Vertical = 
  | 'electrician' 
  | 'plumber' 
  | 'hvac' 
  | 'roofer' 
  | 'painter'
  | 'lawyer'
  | 'dentist'
  | 'doctor'
  | 'restaurant'
  | 'auto_repair'
  | 'general';

// ============================================================================
// Additional Types
// ============================================================================

export interface IntentClassification {
  intent: CampaignIntent;
  suggestedMatchTypes: MatchType[];
  tone: 'urgent' | 'professional' | 'friendly' | 'authoritative';
  voice: string;
  confidence: number; // 0-1
}

export interface LandingPageData {
  domain: string;
  title: string | null;
  h1: string | null;
  metaDescription: string | null;
  services: string[];
  phones: string[];
  emails: string[];
  hours: Record<string, string> | null;
  addresses: string[];
  schemas: {
    org?: any;
    localBusiness?: any;
  };
  page_text_tokens: string[];
  extractionMethod: 'crawl' | 'api' | 'manual' | 'fallback';
  extractedAt: string;
}

export interface BidSuggestion {
  keyword: string;
  matchType: MatchType;
  intent: CampaignIntent;
  suggestedCPC: number;
  suggestedCPCFormatted: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  baseCPCMultiplier: number;
}

export interface BidTier {
  matchType: MatchType;
  intent: CampaignIntent;
  multiplier: {
    min: number;
    max: number;
    default: number;
  };
}

export interface PolicyCheck {
  passed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
}

export interface PolicyViolation {
  type: 'prohibited_content' | 'trademark' | 'medical_claim' | 'weapon' | 'drug' | 'other';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  field: string;
  value: string;
  suggestion?: string;
}

export interface PolicyWarning {
  type: 'disclaimer_missing' | 'regulatory_flag' | 'tone_mismatch' | 'other';
  message: string;
  field: string;
  value: string;
  suggestion?: string;
}

export interface LocalizationConfig {
  geo: string; // Country code or region
  language: string; // ISO 639-1 code
  currency: string; // ISO 4217 code
  dateFormat: string;
  phoneFormat: string;
  timezone: string;
}

export interface LocalizedContent {
  original: string;
  localized: string;
  locale: string;
  confidence: number;
}

export interface TrackingConfig {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  dniEnabled: boolean;
  dniProvider?: 'callrail' | 'calltracking' | 'invoca' | 'custom';
  trackingNumber?: string;
  clickTrackingEnabled: boolean;
}

export interface TrackingParams {
  finalUrl: string;
  trackingUrl: string;
  utmParams: Record<string, string>;
  dniParams?: Record<string, string>;
}

export interface DeviceConfig {
  primaryDevice: 'mobile' | 'desktop' | 'tablet' | 'all';
  mobileOptimizations: MobileOptimizations;
  desktopOptimizations: DesktopOptimizations;
}

export interface MobileOptimizations {
  shorterHeadlines: boolean;
  callExtensions: boolean;
  clickToCall: boolean;
  simplifiedCTAs: boolean;
  maxHeadlineLength: number; // Typically 25-30 for mobile
}

export interface DesktopOptimizations {
  longerDescriptions: boolean;
  multipleCTAs: boolean;
  detailedBenefits: boolean;
  maxDescriptionLength: number; // Typically 90 for desktop
}

export interface CampaignIntelligence {
  intent: IntentClassification;
  landingPage: LandingPageData;
  vertical: VerticalConfig | null;
  bidSuggestions: BidSuggestion[];
  policyCheck: PolicyCheck;
  localization: LocalizationConfig;
  tracking: TrackingConfig;
  deviceConfig: DeviceConfig;
  generatedAt: string;
}
