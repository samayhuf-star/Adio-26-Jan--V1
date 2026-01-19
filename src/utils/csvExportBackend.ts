/**
 * Frontend CSV Export Integration
 * Calls backend API for proper CSV generation with validation
 */

import { api } from './api';
import { notifications } from './notifications';
import { projectId, publicAnonKey } from './supabase/info';
import { validateAndFixAds, formatValidationReport } from './adValidationUtils';

// API Base URL
// For local development, uncomment the line below and comment out the production URL
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000'
  : `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;

/**
 * Convert Campaign Builder 1 data to backend request format
 */
function convertToExportRequest(
  campaignName: string,
  adGroups: any[],
  generatedAds: any[],
  locationTargeting?: any,
  budget?: number,
  biddingStrategy?: string,
  negativeKeywords?: string,
  allAdGroupsValue: string = 'ALL_AD_GROUPS'
): any {
  return {
    campaign_name: campaignName || 'Campaign 1',
    ad_groups: adGroups.map(group => ({
      name: group.name,
      keywords: Array.isArray(group.keywords) 
        ? group.keywords 
        : (typeof group.keywords === 'string' ? group.keywords.split('\n').filter((k: string) => k.trim()) : []),
      negativeKeywords: group.negativeKeywords || []
    })),
    // Validate and fix ads before sending to backend
    generated_ads: (() => {
      const filteredAds = generatedAds.filter(ad => 
        ad.type === 'rsa' || ad.type === 'dki' || ad.type === 'callonly'
      );
      const { ads: validatedAds, report } = validateAndFixAds(filteredAds);
      
      // Log validation report if ads were fixed
      if (report.fixed > 0) {
        console.log('✅ Frontend ad validation:', formatValidationReport(report));
      }
      
      return validatedAds;
    })(),
    location_targeting: locationTargeting,
    budget: budget,
    bidding_strategy: biddingStrategy || 'MANUAL_CPC',
    negative_keywords: negativeKeywords 
      ? negativeKeywords.split('\n').filter((k: string) => k.trim())
      : [],
    all_ad_groups_value: allAdGroupsValue
  };
}

/**
 * Main CSV export function
 * Replaces generateCSV in CampaignBuilder.tsx
 * Returns void for sync exports, or { async: true, job_id, ... } for async exports
 */
export async function generateCSVWithBackend(
  campaignName: string,
  adGroups: any[],
  generatedAds: any[],
  locationTargeting?: any,
  budget?: number,
  biddingStrategy?: string,
  negativeKeywords?: string,
  allAdGroupsValue: string = 'ALL_AD_GROUPS'
): Promise<void> {
  try {
    // Show loading notification
    notifications.info('Generating CSV...', {
      title: 'Exporting',
      description: 'Validating and generating Google Ads Editor CSV file...',
      duration: 0 // Don't auto-dismiss
    });

    // Convert to backend format
    const request = convertToExportRequest(
      campaignName,
      adGroups,
      generatedAds,
      locationTargeting,
      budget,
      biddingStrategy,
      negativeKeywords,
      allAdGroupsValue
    );

    console.log('CSV Export Request:', JSON.stringify(request, null, 2));

    // Call backend API
    const response = await fetch(`${API_BASE}/export-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(request)
    });

    // Note: Loading notification auto-dismisses or stays visible during async operation

    // Check response status first
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();
        
        if (contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            // Not valid JSON, use text if it's short
            if (responseText && responseText.length < 500) {
              errorMessage = responseText;
            }
          }
        } else {
          // Try to read as text for non-JSON error responses
          if (responseText && responseText.length < 500) {
            errorMessage = responseText;
          }
        }
      } catch (parseError) {
        // If we can't parse the error, use the status text
        console.error('Error parsing error response:', parseError);
      }
      
      notifications.error('CSV export failed', {
        title: 'Export Error',
        description: errorMessage,
        priority: 'high',
        duration: 10000
      });
      throw new Error(errorMessage);
    }

    // Check if response is CSV file (success) or JSON (validation errors or async)
    const contentType = response.headers.get('content-type') || '';
    
    // Check for async export response
    if (contentType.includes('application/json')) {
      let jsonData;
      let responseText = '';
      try {
        responseText = await response.text();
        // Try to parse JSON, but handle cases where response might not be valid JSON
        jsonData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response status:', response.status, response.statusText);
        console.error('Response text (first 500 chars):', responseText.substring(0, 500));
        console.error('Content-Type:', contentType);
        notifications.error('Invalid response from server', {
          title: 'Export Error',
          description: `The server returned an invalid response (${response.status}). Please try again or contact support.`,
          priority: 'high',
          duration: 10000
        });
        throw new Error(`Invalid JSON response from server: ${response.status} ${response.statusText}`);
      }
      
      // Check if this is an async export response
      if (jsonData.async === true && jsonData.job_id) {
        // Large export - show message
        notifications.info(
          `We're processing your request. Please check saved campaigns in 2 minutes to download the CSV.`,
          {
            title: 'Large Export in Progress',
            description: `Your campaign with ${jsonData.estimated_rows} rows is being processed. The CSV will be available in your saved campaigns shortly.`,
            duration: 15000
          }
        );
        
        // Return job_id so caller can save it with campaign
        return {
          async: true,
          job_id: jsonData.job_id,
          estimated_rows: jsonData.estimated_rows,
          message: jsonData.message
        } as any;
      }
      
      // Regular validation errors
      if (jsonData.validation_errors && jsonData.validation_errors.length > 0) {
        // Handle validation errors (existing code)
        const errorMessages = jsonData.validation_errors
          .map((err: any, idx: number) => {
            const rowInfo = err.row_index ? ` (Row ${err.row_index})` : '';
            return `${idx + 1}. ${err.field}${rowInfo}: ${err.message}`;
          })
          .join('\n');

        const warningMessages = jsonData.warnings && jsonData.warnings.length > 0
          ? jsonData.warnings
              .map((warn: any, idx: number) => {
                const rowInfo = warn.row_index ? ` (Row ${warn.row_index})` : '';
                return `${idx + 1}. ${warn.field}${rowInfo}: ${warn.message}`;
              })
              .join('\n')
          : '';

        let fullMessage = `Validation failed:\n\n${errorMessages}`;
        if (warningMessages) {
          fullMessage += `\n\nWarnings:\n${warningMessages}`;
        }

        notifications.error(fullMessage, {
          title: 'CSV Export Failed',
          description: `Please fix ${jsonData.validation_errors.length} error(s) before exporting.`,
          duration: 15000,
          priority: 'high'
        });
        return;
      }
    }
    
    if (contentType.includes('text/csv')) {
      // Success - download CSV file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'campaign_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get row count from headers
      const rowCount = response.headers.get('x-row-count');
      const warningsCount = response.headers.get('x-warnings-count');
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      let successMessage = `Campaign exported to ${filename}. Ready for Google Ads Editor import.`;
      if (warningsCount && parseInt(warningsCount) > 0) {
        successMessage += ` (${warningsCount} warning(s) - check console for details)`;
      }

      // Check for backend auto-fix report in response headers
      const autoFixCount = response.headers.get('x-auto-fixed-count');
      const autoFixReport = response.headers.get('x-auto-fix-report');
      
      if (autoFixCount && parseInt(autoFixCount) > 0) {
        successMessage += `\n\n✅ Backend auto-fixed ${autoFixCount} issue(s)`;
        if (autoFixReport) {
          console.log('Backend auto-fix report:', autoFixReport);
        }
      }

      notifications.success(successMessage, {
        title: 'Export Complete',
        description: `Exported ${rowCount || 'unknown'} rows successfully.${autoFixCount && parseInt(autoFixCount) > 0 ? ` Backend auto-fixed ${autoFixCount} issue(s).` : ''}`
      });

      console.log(`✅ CSV exported: ${filename}, ${rowCount} rows`);
    } else {
      // Validation errors - parse JSON response
      let errorData;
      try {
        const text = await response.text();
        errorData = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse error response as JSON:', parseError);
        // If it's not JSON, show a generic error
        notifications.error('CSV export failed', {
          title: 'Export Error',
          description: `Server returned an invalid response. Status: ${response.status}`,
          priority: 'high',
          duration: 10000
        });
        throw new Error('Invalid response format from server');
      }
      
      console.error('CSV Export Validation Errors:', errorData);

      if (errorData.validation_errors && errorData.validation_errors.length > 0) {
        // Format validation errors for display
        const errorMessages = errorData.validation_errors
          .map((err: any, idx: number) => {
            const rowInfo = err.row_index ? ` (Row ${err.row_index})` : '';
            return `${idx + 1}. ${err.field}${rowInfo}: ${err.message}`;
          })
          .join('\n');

        const warningMessages = errorData.warnings && errorData.warnings.length > 0
          ? errorData.warnings
              .map((warn: any, idx: number) => {
                const rowInfo = warn.row_index ? ` (Row ${warn.row_index})` : '';
                return `${idx + 1}. ${warn.field}${rowInfo}: ${warn.message}`;
              })
              .join('\n')
          : '';

        let fullMessage = `Validation failed:\n\n${errorMessages}`;
        if (warningMessages) {
          fullMessage += `\n\nWarnings:\n${warningMessages}`;
        }

        notifications.error(fullMessage, {
          title: 'CSV Export Failed',
          description: `Please fix ${errorData.validation_errors.length} error(s) before exporting.`,
          duration: 15000, // Show for 15 seconds
          priority: 'high'
        });
      } else {
        notifications.error(errorData.message || 'CSV export failed', {
          title: 'Export Error',
          description: 'An unexpected error occurred during CSV export.',
          priority: 'high'
        });
      }
    }
  } catch (error) {
    console.error('CSV export error:', error);
    
    // Check if it's a network error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError = 
      errorMessage.includes('fetch') || 
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to fetch');

    if (isNetworkError) {
      notifications.warning('Backend unavailable, using local CSV generation', {
        title: 'Fallback Mode',
        description: 'The backend CSV exporter is unavailable. Using local generation (may have validation issues).',
        duration: 10000
      });
      
      // Optionally fall back to local generation
      // You can call the original generateCSV function here if needed
      throw new Error('Backend unavailable - please check server connection');
    } else {
      notifications.error('CSV export failed', {
        title: 'Export Error',
        description: errorMessage,
        priority: 'high',
        duration: 10000
      });
      throw error;
    }
  }
}

