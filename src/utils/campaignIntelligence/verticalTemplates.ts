/**
 * Vertical-Specific Templates & Rules
 * 
 * Industry-specific phrasing, negative lists, and ad templates
 */

import type { Vertical, CampaignIntent } from './schemas';

export interface VerticalConfig {
  vertical_id: Vertical;
  service_tokens: string[];
  trust_phrases: string[];
  emergency_modifiers: string[];
  negative_default: string[];
  ad_templates: AdTemplate[];
  keyword_modifiers: string[];
  regulatory_flags?: string[];
  disclaimers?: string[];
}

export interface AdTemplate {
  type: 'call' | 'lead' | 'traffic' | 'purchase';
  headline: string; // Supports {{business}}, {{modifier}}, {{service}}, {{city}}
  description: string;
  cta?: string;
}

// Vertical configurations
const VERTICAL_CONFIGS: Record<Vertical, VerticalConfig> = {
  electrician: {
    vertical_id: 'electrician',
    service_tokens: ['wiring', 'breaker', 'fan repair', 're-wiring', 'electrical installation', 'panel upgrade', 'outlet repair'],
    trust_phrases: ['licensed', 'insured', 'certified', 'bonded', 'experienced'],
    emergency_modifiers: ['24/7', 'emergency', 'same day', 'urgent', 'immediate'],
    negative_default: ['free', 'DIY', 'training', 'jobs', 'careers', 'how to', 'tutorial'],
    keyword_modifiers: ['near me', 'emergency', 'licensed', '24/7', 'affordable', 'professional'],
    ad_templates: [
      {
        type: 'call',
        headline: 'Call {{business}} — {{modifier}} {{service}}',
        description: 'Fast {{service}} in {{city}} - Call now',
        cta: 'Call Now',
      },
      {
        type: 'lead',
        headline: '{{service}} Services — Free Quote',
        description: 'Get a free estimate for {{service}}. Licensed & insured.',
        cta: 'Get Quote',
      },
    ],
    regulatory_flags: ['electrical_license_required'],
    disclaimers: ['Licensed electrician required for all work'],
  },
  plumber: {
    vertical_id: 'plumber',
    service_tokens: ['drain cleaning', 'pipe repair', 'water heater', 'leak repair', 'faucet installation', 'toilet repair'],
    trust_phrases: ['licensed', 'insured', 'certified', 'experienced', 'professional'],
    emergency_modifiers: ['24/7', 'emergency', 'same day', 'urgent', 'immediate'],
    negative_default: ['free', 'DIY', 'training', 'jobs', 'how to', 'tutorial', 'plumbing school'],
    keyword_modifiers: ['near me', 'emergency', 'licensed', '24/7', 'affordable'],
    ad_templates: [
      {
        type: 'call',
        headline: 'Emergency {{service}} — Call Now',
        description: '24/7 {{service}} in {{city}}. Fast response.',
        cta: 'Call Now',
      },
    ],
  },
  hvac: {
    vertical_id: 'hvac',
    service_tokens: ['AC repair', 'heating repair', 'installation', 'maintenance', 'duct cleaning'],
    trust_phrases: ['licensed', 'certified', 'NATE certified', 'experienced'],
    emergency_modifiers: ['24/7', 'emergency', 'same day'],
    negative_default: ['free', 'DIY', 'training', 'jobs'],
    keyword_modifiers: ['near me', 'emergency', 'licensed', '24/7'],
    ad_templates: [
      {
        type: 'call',
        headline: '{{modifier}} {{service}} — Call Today',
        description: 'Expert {{service}} in {{city}}. Licensed technicians.',
      },
    ],
  },
  lawyer: {
    vertical_id: 'lawyer',
    service_tokens: ['personal injury', 'divorce', 'criminal defense', 'estate planning', 'business law'],
    trust_phrases: ['licensed attorney', 'experienced', 'bar certified', 'winning record'],
    emergency_modifiers: ['free consultation', 'immediate help', '24/7'],
    negative_default: ['free legal advice', 'DIY', 'forms', 'templates'],
    keyword_modifiers: ['near me', 'free consultation', 'experienced', 'winning'],
    ad_templates: [
      {
        type: 'lead',
        headline: 'Free Consultation — {{service}} Attorney',
        description: 'Experienced {{service}} lawyer. Free case evaluation.',
        cta: 'Get Consultation',
      },
    ],
    regulatory_flags: ['legal_disclaimer_required', 'no_guarantee_of_outcome'],
    disclaimers: ['Attorney advertising. Results may vary.'],
  },
  dentist: {
    vertical_id: 'dentist',
    service_tokens: ['cleaning', 'whitening', 'root canal', 'crown', 'implant', 'extraction'],
    trust_phrases: ['licensed', 'experienced', 'gentle', 'modern equipment'],
    emergency_modifiers: ['same day', 'emergency', 'immediate'],
    negative_default: ['free', 'DIY', 'training', 'jobs'],
    keyword_modifiers: ['near me', 'experienced', 'gentle', 'affordable'],
    ad_templates: [
      {
        type: 'call',
        headline: '{{service}} — Book Appointment',
        description: 'Gentle {{service}} in {{city}}. New patients welcome.',
        cta: 'Book Now',
      },
    ],
  },
  doctor: {
    vertical_id: 'doctor',
    service_tokens: ['consultation', 'checkup', 'treatment', 'diagnosis'],
    trust_phrases: ['board certified', 'licensed', 'experienced', 'MD'],
    emergency_modifiers: ['same day', 'urgent care', 'immediate'],
    negative_default: ['free diagnosis', 'DIY treatment', 'self-diagnosis'],
    keyword_modifiers: ['near me', 'board certified', 'experienced'],
    ad_templates: [
      {
        type: 'call',
        headline: 'Book {{service}} Appointment',
        description: 'Board-certified doctors in {{city}}. Same-day appointments.',
        cta: 'Book Appointment',
      },
    ],
    regulatory_flags: ['medical_disclaimer_required', 'no_guarantee_of_cure'],
    disclaimers: ['Not a substitute for professional medical advice'],
  },
  restaurant: {
    vertical_id: 'restaurant',
    service_tokens: ['dining', 'catering', 'takeout', 'delivery', 'reservations'],
    trust_phrases: ['award-winning', 'fresh', 'authentic', 'family-owned'],
    emergency_modifiers: ['same day', 'immediate'],
    negative_default: ['free meal', 'coupons', 'discount codes'],
    keyword_modifiers: ['near me', 'award-winning', 'authentic'],
    ad_templates: [
      {
        type: 'call',
        headline: 'Reserve Table at {{business}}',
        description: 'Award-winning cuisine in {{city}}. Book your table.',
        cta: 'Reserve Now',
      },
    ],
  },
  auto_repair: {
    vertical_id: 'auto_repair',
    service_tokens: ['oil change', 'brake repair', 'engine repair', 'transmission', 'tire service'],
    trust_phrases: ['certified mechanics', 'ASE certified', 'warranty', 'experienced'],
    emergency_modifiers: ['same day', 'emergency', 'immediate'],
    negative_default: ['free', 'DIY', 'training', 'jobs'],
    keyword_modifiers: ['near me', 'certified', 'warranty', 'affordable'],
    ad_templates: [
      {
        type: 'call',
        headline: '{{modifier}} {{service}} — Call Now',
        description: 'Expert {{service}} in {{city}}. Certified mechanics.',
        cta: 'Call Now',
      },
    ],
  },
  general: {
    vertical_id: 'general',
    service_tokens: ['service', 'consultation', 'support'],
    trust_phrases: ['professional', 'experienced', 'reliable'],
    emergency_modifiers: ['24/7', 'same day', 'emergency'],
    negative_default: ['free', 'DIY', 'training'],
    keyword_modifiers: ['near me', 'professional', 'affordable'],
    ad_templates: [
      {
        type: 'call',
        headline: '{{modifier}} {{service}}',
        description: 'Professional {{service}} in {{city}}.',
      },
    ],
  },
};

/**
 * Get vertical configuration
 */
export function getVerticalConfig(vertical: Vertical | string): VerticalConfig {
  const verticalKey = (vertical || 'general').toLowerCase() as Vertical;
  return VERTICAL_CONFIGS[verticalKey] || VERTICAL_CONFIGS.general;
}

/**
 * Get service tokens for a vertical
 */
export function getServiceTokens(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).service_tokens;
}

/**
 * Get trust phrases for a vertical
 */
export function getTrustPhrases(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).trust_phrases;
}

/**
 * Get emergency modifiers for a vertical
 */
export function getEmergencyModifiers(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).emergency_modifiers;
}

/**
 * Get default negative keywords for a vertical
 */
export function getDefaultNegatives(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).negative_default;
}

/**
 * Get ad template for vertical and intent
 */
export function getAdTemplate(
  vertical: Vertical | string,
  intent: CampaignIntent
): AdTemplate | null {
  const config = getVerticalConfig(vertical);
  const templateType = 
    intent === 'CALL_INTENT' ? 'call' :
    intent === 'LEAD_INTENT' ? 'lead' :
    intent === 'TRAFFIC_INTENT' ? 'traffic' :
    'purchase';
  
  const template = config.ad_templates.find(t => t.type === templateType);
  return template || config.ad_templates[0] || null;
}

/**
 * Render ad template with variables
 */
export function renderAdTemplate(
  template: AdTemplate,
  variables: {
    business?: string;
    modifier?: string;
    service?: string;
    city?: string;
  }
): { headline: string; description: string; cta?: string } {
  let headline = template.headline;
  let description = template.description;
  let cta = template.cta;

  // Replace variables
  headline = headline.replace(/\{\{business\}\}/g, variables.business || '');
  headline = headline.replace(/\{\{modifier\}\}/g, variables.modifier || '');
  headline = headline.replace(/\{\{service\}\}/g, variables.service || '');
  headline = headline.replace(/\{\{city\}\}/g, variables.city || '');

  description = description.replace(/\{\{business\}\}/g, variables.business || '');
  description = description.replace(/\{\{modifier\}\}/g, variables.modifier || '');
  description = description.replace(/\{\{service\}\}/g, variables.service || '');
  description = description.replace(/\{\{city\}\}/g, variables.city || '');

  return { headline, description, cta };
}

/**
 * Get keyword modifiers for a vertical
 */
export function getKeywordModifiers(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).keyword_modifiers;
}

/**
 * Get regulatory flags for a vertical
 */
export function getRegulatoryFlags(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).regulatory_flags || [];
}

/**
 * Get disclaimers for a vertical
 */
export function getDisclaimers(vertical: Vertical | string): string[] {
  return getVerticalConfig(vertical).disclaimers || [];
}

