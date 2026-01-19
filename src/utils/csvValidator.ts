/**
 * CSV Validator for Google Ads Editor Format
 * Validates campaign structure before export to ensure 100% Google Ads Editor compatibility
 */

export interface ValidationError {
  type: 'error' | 'warning';
  field: string;
  message: string;
  row?: number;
  entity?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate entire campaign structure before CSV export
 */
export function validateCampaignForExport(structure: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate structure exists
  if (!structure || !structure.campaigns || structure.campaigns.length === 0) {
    errors.push({
      type: 'error',
      field: 'campaigns',
      message: 'No campaigns found. At least one campaign is required.'
    });
    return { isValid: false, errors, warnings };
  }

  structure.campaigns.forEach((campaign: any, campaignIndex: number) => {
    // Validate campaign name
    if (!campaign.campaign_name || campaign.campaign_name.trim() === '') {
      errors.push({
        type: 'error',
        field: 'campaign_name',
        message: `Campaign #${campaignIndex + 1}: Campaign name is required`,
        entity: 'Campaign'
      });
    } else if (campaign.campaign_name.length > 255) {
      errors.push({
        type: 'error',
        field: 'campaign_name',
        message: `Campaign "${campaign.campaign_name}": Name exceeds 255 characters`,
        entity: 'Campaign'
      });
    }

    // Validate ad groups exist
    if (!campaign.adgroups || campaign.adgroups.length === 0) {
      errors.push({
        type: 'error',
        field: 'adgroups',
        message: `Campaign "${campaign.campaign_name}": No ad groups found. At least one ad group is required.`,
        entity: 'Campaign'
      });
      return; // Skip further validation for this campaign
    }

    campaign.adgroups.forEach((adGroup: any, adGroupIndex: number) => {
      const adGroupIdentifier = `Campaign "${campaign.campaign_name}" > Ad Group #${adGroupIndex + 1}`;

      // Validate ad group name
      if (!adGroup.adgroup_name || adGroup.adgroup_name.trim() === '') {
        errors.push({
          type: 'error',
          field: 'adgroup_name',
          message: `${adGroupIdentifier}: Ad group name is required`,
          entity: 'Ad Group'
        });
      } else if (adGroup.adgroup_name.length > 255) {
        errors.push({
          type: 'error',
          field: 'adgroup_name',
          message: `${adGroupIdentifier} "${adGroup.adgroup_name}": Name exceeds 255 characters`,
          entity: 'Ad Group'
        });
      }

      // Validate keywords exist
      if (!adGroup.keywords || adGroup.keywords.length === 0) {
        errors.push({
          type: 'error',
          field: 'keywords',
          message: `${adGroupIdentifier} "${adGroup.adgroup_name}": No keywords found. At least one keyword is required.`,
          entity: 'Ad Group'
        });
      } else {
        // Validate each keyword
        adGroup.keywords.forEach((keyword: string, keywordIndex: number) => {
          if (!keyword || keyword.trim() === '') {
            errors.push({
              type: 'error',
              field: 'keyword',
              message: `${adGroupIdentifier} "${adGroup.adgroup_name}": Keyword #${keywordIndex + 1} is empty`,
              entity: 'Keyword'
            });
          } else {
            const cleanKeyword = keyword.replace(/^\[|\]$|^"|"$/g, '').trim();
            if (cleanKeyword.length > 80) {
              errors.push({
                type: 'error',
                field: 'keyword',
                message: `${adGroupIdentifier} "${adGroup.adgroup_name}": Keyword "${cleanKeyword.substring(0, 50)}..." exceeds 80 characters`,
                entity: 'Keyword'
              });
            }
          }
        });
      }

      // Validate ads exist
      if (!adGroup.ads || adGroup.ads.length === 0) {
        warnings.push({
          type: 'warning',
          field: 'ads',
          message: `${adGroupIdentifier} "${adGroup.adgroup_name}": No ads found. A default ad will be created.`,
          entity: 'Ad Group'
        });
      } else {
        // Validate each ad
        adGroup.ads.forEach((ad: any, adIndex: number) => {
          const adIdentifier = `${adGroupIdentifier} "${adGroup.adgroup_name}" > Ad #${adIndex + 1}`;

          // Validate Final URL
          if (!ad.final_url || ad.final_url.trim() === '') {
            errors.push({
              type: 'error',
              field: 'final_url',
              message: `${adIdentifier}: Final URL is required`,
              entity: 'Ad'
            });
          } else {
            // Validate URL format
            if (!isValidURL(ad.final_url)) {
              errors.push({
                type: 'error',
                field: 'final_url',
                message: `${adIdentifier}: Invalid URL format "${ad.final_url}"`,
                entity: 'Ad'
              });
            }
          }

          // Validate headlines
          if (!ad.headline1 || ad.headline1.trim() === '') {
            errors.push({
              type: 'error',
              field: 'headline1',
              message: `${adIdentifier}: At least Headline 1 is required`,
              entity: 'Ad'
            });
          }

          // Validate headline character limits (30 chars each)
          for (let i = 1; i <= 15; i++) {
            const headlineKey = `headline${i}`;
            if (ad[headlineKey] && ad[headlineKey].length > 30) {
              errors.push({
                type: 'error',
                field: headlineKey,
                message: `${adIdentifier}: Headline ${i} "${ad[headlineKey].substring(0, 20)}..." exceeds 30 characters (${ad[headlineKey].length} chars)`,
                entity: 'Ad'
              });
            }
          }

          // Validate descriptions
          if (!ad.description1 || ad.description1.trim() === '') {
            errors.push({
              type: 'error',
              field: 'description1',
              message: `${adIdentifier}: At least Description 1 is required`,
              entity: 'Ad'
            });
          }

          // Validate description character limits (90 chars each)
          for (let i = 1; i <= 4; i++) {
            const descKey = `description${i}`;
            if (ad[descKey] && ad[descKey].length > 90) {
              errors.push({
                type: 'error',
                field: descKey,
                message: `${adIdentifier}: Description ${i} "${ad[descKey].substring(0, 30)}..." exceeds 90 characters (${ad[descKey].length} chars)`,
                entity: 'Ad'
              });
            }
          }

          // Validate path fields (15 chars each)
          if (ad.path1 && ad.path1.length > 15) {
            errors.push({
              type: 'error',
              field: 'path1',
              message: `${adIdentifier}: Path 1 "${ad.path1}" exceeds 15 characters`,
              entity: 'Ad'
            });
          }
          if (ad.path2 && ad.path2.length > 15) {
            errors.push({
              type: 'error',
              field: 'path2',
              message: `${adIdentifier}: Path 2 "${ad.path2}" exceeds 15 characters`,
              entity: 'Ad'
            });
          }

          // Validate extensions if present
          if (ad.extensions && Array.isArray(ad.extensions)) {
            ad.extensions.forEach((ext: any, extIndex: number) => {
              validateExtension(ext, `${adIdentifier} > Extension #${extIndex + 1}`, errors, warnings);
            });
          }
        });
      }

      // Validate negative keywords if present
      if (adGroup.negative_keywords && Array.isArray(adGroup.negative_keywords)) {
        adGroup.negative_keywords.forEach((negKw: string, negIndex: number) => {
          if (negKw && negKw.trim() !== '') {
            const cleanNeg = negKw.replace(/^\[|\]$|^"|"$/g, '').trim();
            if (cleanNeg.length > 80) {
              errors.push({
                type: 'error',
                field: 'negative_keyword',
                message: `${adGroupIdentifier} "${adGroup.adgroup_name}": Negative keyword "${cleanNeg.substring(0, 50)}..." exceeds 80 characters`,
                entity: 'Negative Keyword'
              });
            }
          }
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate extension data
 */
function validateExtension(ext: any, identifier: string, errors: ValidationError[], warnings: ValidationError[]) {
  const extType = ext.extensionType || ext.type;

  switch (extType) {
    case 'sitelink':
      if (ext.links && Array.isArray(ext.links)) {
        ext.links.forEach((link: any, linkIndex: number) => {
          const linkId = `${identifier} (Sitelink #${linkIndex + 1})`;
          
          if (!link.text && !link.linkText) {
            errors.push({
              type: 'error',
              field: 'sitelink_text',
              message: `${linkId}: Sitelink text is required`,
              entity: 'Sitelink'
            });
          } else {
            const text = link.text || link.linkText;
            if (text.length > 25) {
              errors.push({
                type: 'error',
                field: 'sitelink_text',
                message: `${linkId}: Sitelink text "${text}" exceeds 25 characters`,
                entity: 'Sitelink'
              });
            }
          }

          if (!link.url && !link.finalUrl) {
            errors.push({
              type: 'error',
              field: 'sitelink_url',
              message: `${linkId}: Sitelink URL is required`,
              entity: 'Sitelink'
            });
          }

          if (link.description && link.description.length > 35) {
            errors.push({
              type: 'error',
              field: 'sitelink_description',
              message: `${linkId}: Sitelink description exceeds 35 characters`,
              entity: 'Sitelink'
            });
          }
        });
      }
      break;

    case 'call':
      if (!ext.phone && !ext.phoneNumber) {
        errors.push({
          type: 'error',
          field: 'phone_number',
          message: `${identifier}: Phone number is required for Call extension`,
          entity: 'Call Extension'
        });
      }
      break;

    case 'callout':
      const calloutText = ext.text || ext.value;
      if (!calloutText) {
        errors.push({
          type: 'error',
          field: 'callout_text',
          message: `${identifier}: Callout text is required`,
          entity: 'Callout'
        });
      } else if (calloutText.length > 25) {
        errors.push({
          type: 'error',
          field: 'callout_text',
          message: `${identifier}: Callout text "${calloutText}" exceeds 25 characters`,
          entity: 'Callout'
        });
      }
      break;
  }
}

/**
 * Validate URL format
 */
function isValidURL(url: string): boolean {
  try {
    // Must start with http:// or https://
    if (!url.match(/^https?:\/\//i)) {
      return false;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('❌ ERRORS (Must fix before export):');
    lines.push('');
    result.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('⚠️  WARNINGS (Recommended to fix):');
    lines.push('');
    result.warnings.forEach((warning, index) => {
      lines.push(`${index + 1}. ${warning.message}`);
    });
  }

  return lines.join('\n');
}

