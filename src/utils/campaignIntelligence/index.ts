/**
 * Campaign Intelligence Module - Main Export
 * 
 * Production-grade campaign generation logic
 */

// Core modules
export * from './intentClassifier';
export * from './landingPageExtractor';
export * from './verticalTemplates';
export * from './bidSuggestions';
export * from './policyChecks';
export * from './localization';
export * from './tracking';
export * from './deviceDefaults';

// Schemas
export * from './schemas';

// Main orchestration function
export { generateCampaignIntelligence } from './orchestrator';

