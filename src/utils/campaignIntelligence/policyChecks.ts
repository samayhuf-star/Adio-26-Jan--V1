/**
 * Policy & Safety Checks
 * 
 * Block/flag disallowed claims and risky phrases
 */

import type { PolicyCheck, PolicyViolation, PolicyWarning } from './schemas';

export interface PolicyCheckInput {
  adText?: string;
  headline?: string;
  description?: string;
  keyword?: string;
  finalUrl?: string;
  vertical?: string;
  allowedDomains?: string[];
}

// Prohibited terms list
const PROHIBITED_TERMS = [
  'guarantee cure',
  'cure cancer',
  'cure disease',
  '100% cure',
  'miracle cure',
  'instant cure',
];

// Sensitive industry rules
const MEDICAL_CLAIMS = [
  'prescription',
  'FDA approved treatment',
  'cure',
  'heal',
  'treat disease',
];

const LEGAL_SUPERLATIVES = [
  'guaranteed win',
  'guaranteed settlement',
  'always win',
];

// Disallowed superlatives (context-dependent)
const DISALLOWED_SUPERLATIVES = [
  'best in the world',
  'number one',
  'top rated worldwide',
];

/**
 * Run policy checks on campaign content
 */
export function runPolicyChecks(input: PolicyCheckInput): PolicyCheck {
  const violations: PolicyViolation[] = [];
  const warnings: PolicyWarning[] = [];

  // Check ad text
  if (input.adText) {
    checkProhibitedContent(input.adText, 'ad_text', violations);
    checkMedicalClaims(input.adText, input.vertical, 'ad_text', violations, warnings);
    checkSuperlatives(input.adText, input.vertical, 'ad_text', warnings);
  }

  // Check headline
  if (input.headline) {
    checkProhibitedContent(input.headline, 'headline', violations);
    checkMedicalClaims(input.headline, input.vertical, 'headline', violations, warnings);
  }

  // Check description
  if (input.description) {
    checkProhibitedContent(input.description, 'description', violations);
    checkMedicalClaims(input.description, input.vertical, 'description', violations, warnings);
  }

  // Check keyword
  if (input.keyword) {
    checkProhibitedContent(input.keyword, 'keyword', violations);
  }

  // Check final URL
  if (input.finalUrl) {
    checkDomainAllowed(input.finalUrl, input.allowedDomains, violations);
  }

  // Check for missing disclaimers (warnings)
  if (input.vertical === 'medical' || input.vertical === 'doctor' || input.vertical === 'dentist') {
    if (input.adText && !hasMedicalDisclaimer(input.adText)) {
      warnings.push({
        type: 'disclaimer_missing',
        message: 'Medical content should include appropriate disclaimers',
        field: 'ad_text',
        value: input.adText,
        suggestion: 'Add disclaimer: "Not a substitute for professional medical advice"',
      });
    }
  }

  if (input.vertical === 'lawyer' || input.vertical === 'legal') {
    if (input.adText && !hasLegalDisclaimer(input.adText)) {
      warnings.push({
        type: 'disclaimer_missing',
        message: 'Legal content should include appropriate disclaimers',
        field: 'ad_text',
        value: input.adText || '',
        suggestion: 'Add disclaimer: "Attorney advertising. Results may vary."',
      });
    }
  }

  const passed = violations.length === 0;
  const hasCriticalViolations = violations.some(v => v.severity === 'critical');

  return {
    passed: passed && !hasCriticalViolations,
    violations,
    warnings,
  };
}

/**
 * Check for prohibited content
 */
function checkProhibitedContent(
  text: string,
  field: string,
  violations: PolicyViolation[]
): void {
  const lowerText = text.toLowerCase();
  
  PROHIBITED_TERMS.forEach(term => {
    if (lowerText.includes(term.toLowerCase())) {
      violations.push({
        type: 'prohibited_content',
        severity: 'critical',
        message: `Prohibited term found: "${term}"`,
        field,
        value: text,
        suggestion: `Remove or replace "${term}"`,
      });
    }
  });
}

/**
 * Check for medical claims
 */
function checkMedicalClaims(
  text: string,
  vertical: string | undefined,
  field: string,
  violations: PolicyViolation[],
  warnings: PolicyWarning[]
): void {
  if (vertical !== 'medical' && vertical !== 'doctor' && vertical !== 'dentist') {
    return; // Only check medical claims for medical verticals
  }

  const lowerText = text.toLowerCase();
  
  MEDICAL_CLAIMS.forEach(claim => {
    if (lowerText.includes(claim.toLowerCase())) {
      violations.push({
        type: 'medical_claim',
        severity: 'high',
        message: `Specific medical claim found: "${claim}"`,
        field,
        value: text,
        suggestion: 'Medical claims must be substantiated and comply with regulations',
      });
    }
  });
}

/**
 * Check for disallowed superlatives
 */
function checkSuperlatives(
  text: string,
  vertical: string | undefined,
  field: string,
  warnings: PolicyWarning[]
): void {
  const lowerText = text.toLowerCase();
  
  DISALLOWED_SUPERLATIVES.forEach(superlative => {
    if (lowerText.includes(superlative.toLowerCase())) {
      warnings.push({
        type: 'tone_mismatch',
        message: `Unsubstantiated superlative: "${superlative}"`,
        field,
        value: text,
        suggestion: 'Use more specific, verifiable claims',
      });
    }
  });

  // Check legal superlatives
  if (vertical === 'lawyer' || vertical === 'legal') {
    LEGAL_SUPERLATIVES.forEach(superlative => {
      if (lowerText.includes(superlative.toLowerCase())) {
        warnings.push({
          type: 'regulatory_flag',
          message: `Legal superlative that may violate advertising rules: "${superlative}"`,
          field,
          value: text,
          suggestion: 'Avoid guarantees of outcomes',
        });
      }
    });
  }
}

/**
 * Check if domain is allowed
 */
function checkDomainAllowed(
  url: string,
  allowedDomains: string[] | undefined,
  violations: PolicyViolation[]
): void {
  if (!allowedDomains || allowedDomains.length === 0) {
    return; // No restrictions
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    const isAllowed = allowedDomains.some(allowed => {
      const allowedDomain = allowed.replace(/^www\./, '');
      return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
    });

    if (!isAllowed) {
      violations.push({
        type: 'other',
        severity: 'high',
        message: `Domain "${domain}" is not in allowed domains list`,
        field: 'final_url',
        value: url,
        suggestion: `Add "${domain}" to allowed domains or use an allowed domain`,
      });
    }
  } catch (e) {
    // Invalid URL format
    violations.push({
      type: 'other',
      severity: 'medium',
      message: 'Invalid URL format',
      field: 'final_url',
      value: url,
      suggestion: 'Use a valid URL format (http:// or https://)',
    });
  }
}

/**
 * Check if text has medical disclaimer
 */
function hasMedicalDisclaimer(text: string): boolean {
  const lowerText = text.toLowerCase();
  const disclaimerPhrases = [
    'not a substitute',
    'professional medical advice',
    'consult your doctor',
    'seek medical attention',
  ];
  
  return disclaimerPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Check if text has legal disclaimer
 */
function hasLegalDisclaimer(text: string): boolean {
  const lowerText = text.toLowerCase();
  const disclaimerPhrases = [
    'attorney advertising',
    'results may vary',
    'no guarantee',
    'past results',
  ];
  
  return disclaimerPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Check multiple items at once (for batch processing)
 */
export function runBatchPolicyChecks(
  items: PolicyCheckInput[]
): Array<{ item: PolicyCheckInput; check: PolicyCheck }> {
  return items.map(item => ({
    item,
    check: runPolicyChecks(item),
  }));
}

