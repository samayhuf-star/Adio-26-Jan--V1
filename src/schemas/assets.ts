/**
 * Google Ads Assets (Extensions) Zod Schemas
 * 
 * Reference: google_ads_rules.md Section 6
 * 
 * All character limits, minimums, and maximums are strictly enforced
 * per Google Ads API requirements.
 */

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

const urlSchema = z.string().url().min(1, 'URL is required');

const nonEmptyString = z.string().min(1, 'Field cannot be empty');

// ============================================================================
// A. Sitelink Assets
// ============================================================================

export const sitelinkAssetSchema = z.object({
  linkText: z
    .string()
    .max(25, 'Link text must be 25 characters or less')
    .min(1, 'Link text is required'),
  descriptionLine1: z
    .string()
    .max(35, 'Description line 1 must be 35 characters or less')
    .optional(),
  descriptionLine2: z
    .string()
    .max(35, 'Description line 2 must be 35 characters or less')
    .optional(),
  finalUrl: urlSchema.refine(
    (url) => url.length > 0,
    'Final URL is required and must be unique (cannot match ad final URL)'
  ),
});

export const sitelinkAssetsArraySchema = z
  .array(sitelinkAssetSchema)
  .min(2, 'Minimum 2 sitelinks required to serve')
  .max(20, 'Maximum 20 sitelinks per entity');

// ============================================================================
// B. Callout Assets
// ============================================================================

export const calloutAssetSchema = z.object({
  text: z
    .string()
    .max(25, 'Callout text must be 25 characters or less')
    .min(1, 'Callout text is required')
    .refine(
      (text) => !/^[.,!?;:]/.test(text),
      'Callout text cannot start with punctuation'
    ),
  // Note: Repetition check with ad headlines should be done at form level
});

export const calloutAssetsArraySchema = z
  .array(calloutAssetSchema)
  .min(2, 'Minimum 2 callouts required to serve')
  .max(20, 'Maximum 20 callouts per entity');

// ============================================================================
// C. Structured Snippets
// ============================================================================

export const structuredSnippetHeaderSchema = z.enum([
  'Amenities',
  'Brands',
  'Courses',
  'Degree programs',
  'Destinations',
  'Featured hotels',
  'Insurance coverage',
  'Models',
  'Neighborhoods',
  'Service catalog',
  'Shows',
  'Styles',
  'Types',
]);

export const structuredSnippetValueSchema = z
  .string()
  .max(25, 'Structured snippet value must be 25 characters or less')
  .min(1, 'Value is required');

export const structuredSnippetSchema = z.object({
  header: structuredSnippetHeaderSchema,
  values: z
    .array(structuredSnippetValueSchema)
    .min(3, 'Minimum 3 values required per header')
    .max(10, 'Maximum 10 values per header'),
});

export const structuredSnippetsArraySchema = z.array(structuredSnippetSchema);

// ============================================================================
// D. Image Assets
// ============================================================================

export const imageAssetTypeSchema = z.enum(['square', 'landscape']);

export const imageAssetSchema = z.object({
  type: imageAssetTypeSchema,
  url: urlSchema,
  altText: z.string().optional(),
  // File validation (size, format) should be done at upload time
  // Square: Min 300x300, Max 5MB
  // Landscape: Min 600x314, Max 5MB
  // Formats: JPG, PNG, Static GIF
});

export const imageAssetsArraySchema = z.array(imageAssetSchema);

// ============================================================================
// E. Call Assets
// ============================================================================

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 recommended)')
  .min(1, 'Phone number is required');

export const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 letters (e.g., US, GB, IN)')
  .toUpperCase();

export const callAssetSchema = z.object({
  phoneNumber: phoneNumberSchema,
  countryCode: countryCodeSchema,
  // Note: Phone verification is required per 2025 rules
  // This should be validated via API before submission
  isVerified: z.boolean().optional(), // Set by backend after verification
});

export const callAssetsArraySchema = z.array(callAssetSchema);

// ============================================================================
// F. Lead Form Assets
// ============================================================================

export const leadFormQuestionTypeSchema = z.enum([
  'Name',
  'Email',
  'Phone',
  'Zip',
  'City',
  'State',
  'Country',
  'Company',
  'Job Title',
  'Custom',
]);

export const leadFormQuestionSchema = z.object({
  type: leadFormQuestionTypeSchema,
  label: z.string().optional(), // For custom questions
  required: z.boolean().default(true),
});

export const leadFormAssetSchema = z.object({
  headline: z
    .string()
    .max(30, 'Headline must be 30 characters or less')
    .min(1, 'Headline is required'),
  businessName: z
    .string()
    .max(25, 'Business name must be 25 characters or less')
    .min(1, 'Business name is required'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .min(1, 'Description is required'),
  questions: z
    .array(leadFormQuestionSchema)
    .min(1, 'At least 1 question is required')
    .max(10, 'Maximum 10 questions allowed'),
  backgroundImageUrl: urlSchema.optional(), // 1200x628 (1.91:1)
  privacyPolicyUrl: urlSchema, // Mandatory
  submissionMessage: z.object({
    headline: z
      .string()
      .max(30, 'Submission headline must be 30 characters or less')
      .min(1, 'Submission headline is required'),
    description: z
      .string()
      .max(200, 'Submission description must be 200 characters or less')
      .min(1, 'Submission description is required'),
  }),
});

export const leadFormAssetsArraySchema = z.array(leadFormAssetSchema);

// ============================================================================
// G. Price Assets
// ============================================================================

export const priceUnitSchema = z.enum([
  'none',
  'per_hour',
  'per_day',
  'per_week',
  'per_month',
  'per_year',
  'per_night',
]);

export const currencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be 3 letters (e.g., USD, EUR)')
  .toUpperCase();

export const priceItemSchema = z.object({
  header: z
    .string()
    .max(25, 'Price header must be 25 characters or less')
    .min(1, 'Header is required'),
  description: z
    .string()
    .max(25, 'Price description must be 25 characters or less')
    .optional(),
  price: z
    .number()
    .positive('Price must be a positive number')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')),
  currency: currencyCodeSchema,
  unit: priceUnitSchema,
});

export const priceAssetSchema = z.object({
  items: z
    .array(priceItemSchema)
    .min(3, 'Minimum 3 price items required')
    .max(8, 'Maximum 8 price items allowed'),
});

export const priceAssetsArraySchema = z.array(priceAssetSchema);

// ============================================================================
// H. Promotion Assets
// ============================================================================

export const promotionTypeSchema = z.enum(['monetary', 'percent']);

export const promotionOccasionSchema = z.enum([
  'Christmas',
  'Black Friday',
  'New Year',
  'Valentine\'s Day',
  'Easter',
  'Mother\'s Day',
  'Father\'s Day',
  'Independence Day',
  'Labor Day',
  'Halloween',
  'Thanksgiving',
  'Cyber Monday',
  'Other',
]);

export const promotionAssetSchema = z.object({
  promotionType: promotionTypeSchema,
  discountValue: z
    .number()
    .positive('Discount value must be positive')
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid discount format')),
  item: z
    .string()
    .max(20, 'Item description must be 20 characters or less')
    .min(1, 'Item description is required'),
  occasion: promotionOccasionSchema.optional(),
  promotionCode: z
    .string()
    .max(15, 'Promotion code must be 15 characters or less')
    .optional(),
  startDate: z.string().datetime().optional(), // ISO 8601
  endDate: z.string().datetime().optional(), // ISO 8601
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) > new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const promotionAssetsArraySchema = z.array(promotionAssetSchema);

// ============================================================================
// Asset Application Level
// ============================================================================

export const assetApplicationLevelSchema = z.enum([
  'account',
  'campaign',
  'ad_group',
]);

// ============================================================================
// Combined Assets Schema (for form validation)
// ============================================================================

export const googleAdsAssetsSchema = z.object({
  applicationLevel: assetApplicationLevelSchema,
  sitelinks: sitelinkAssetsArraySchema.optional(),
  callouts: calloutAssetsArraySchema.optional(),
  structuredSnippets: structuredSnippetsArraySchema.optional(),
  images: imageAssetsArraySchema.optional(),
  calls: callAssetsArraySchema.optional(),
  leadForms: leadFormAssetsArraySchema.optional(),
  prices: priceAssetsArraySchema.optional(),
  promotions: promotionAssetsArraySchema.optional(),
}).refine(
  (data) => {
    // At least one asset type must be provided
    return !!(
      data.sitelinks?.length ||
      data.callouts?.length ||
      data.structuredSnippets?.length ||
      data.images?.length ||
      data.calls?.length ||
      data.leadForms?.length ||
      data.prices?.length ||
      data.promotions?.length
    );
  },
  {
    message: 'At least one asset type must be provided',
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type SitelinkAsset = z.infer<typeof sitelinkAssetSchema>;
export type CalloutAsset = z.infer<typeof calloutAssetSchema>;
export type StructuredSnippet = z.infer<typeof structuredSnippetSchema>;
export type ImageAsset = z.infer<typeof imageAssetSchema>;
export type CallAsset = z.infer<typeof callAssetSchema>;
export type LeadFormAsset = z.infer<typeof leadFormAssetSchema>;
export type PriceAsset = z.infer<typeof priceAssetSchema>;
export type PromotionAsset = z.infer<typeof promotionAssetSchema>;
export type GoogleAdsAssets = z.infer<typeof googleAdsAssetsSchema>;
export type AssetApplicationLevel = z.infer<typeof assetApplicationLevelSchema>;

