# Backend Auto-Fix Specification

This document describes the backend auto-fix functionality for CSV generation that should be implemented on the server side.

## Overview

The backend should automatically fix common validation issues in ads before generating CSV files, ensuring all exports are valid and ready for Google Ads Editor import.

## Frontend Implementation

The frontend has been updated with:
- `src/utils/adValidationUtils.ts` - Validation and auto-fix utilities
- Integration in `CampaignBuilder3.tsx`, `CampaignHistoryView.tsx`, and `csvExportBackend.ts`
- Frontend validates and fixes ads before sending to backend

## Backend Requirements

### 1. Auto-Fix Functionality

The backend should implement the same validation logic as the frontend:

#### Required Functions:
- `ensureThreeHeadlines(ad)` - Ensures RSA ads have at least 3 headlines
- `ensureTwoDescriptions(ad)` - Ensures RSA ads have at least 2 descriptions
- `validateAndFixAd(ad)` - Validates and fixes a single ad
- `validateAndFixAds(ads)` - Validates and fixes an array of ads

#### Auto-Fix Rules:
1. **Headlines**: 
   - Minimum 3 headlines for RSA ads
   - Maximum 30 characters per headline
   - Default headlines if missing: "Professional Service", "Expert Solutions", "Quality Guaranteed"

2. **Descriptions**:
   - Minimum 2 descriptions for RSA ads
   - Maximum 90 characters per description
   - Default descriptions if missing: "Get professional service you can trust.", "Contact us today for expert assistance."

3. **Paths**:
   - Maximum 15 characters per path
   - Truncate if exceeded

4. **Final URL**:
   - Must start with `https://`
   - Add `https://` prefix if missing

### 2. Reporting Mechanism

The backend should return detailed reports about what was fixed:

#### Response Headers:
- `X-Auto-Fixed-Count`: Number of ads that were auto-fixed
- `X-Auto-Fix-Report`: JSON string with detailed fix report

#### Response Body (for JSON responses):
```json
{
  "auto_fix_report": {
    "fixed": 5,
    "warnings": ["Ad 2: Missing final URL - will use default"],
    "errors": [],
    "details": [
      {
        "ad_index": 0,
        "ad_type": "rsa",
        "fixes": ["Added default headline 3: Quality Guaranteed"],
        "warnings": []
      }
    ]
  }
}
```

### 3. Implementation Example (Node.js/Python)

```javascript
// Example backend implementation
function validateAndFixAds(ads) {
  const report = {
    fixed: 0,
    warnings: [],
    errors: [],
    details: []
  };

  const fixedAds = ads.map((ad, index) => {
    const adReport = {
      ad_index: index,
      ad_type: ad.type || 'rsa',
      fixes: [],
      warnings: []
    };

    // Ensure 3 headlines
    if (ad.type === 'rsa' || !ad.type) {
      const headlines = [
        ad.headline1, ad.headline2, ad.headline3,
        ad.headline4, ad.headline5
      ].filter(h => h && h.trim());

      while (headlines.length < 3) {
        const defaults = [
          'Professional Service',
          'Expert Solutions',
          'Quality Guaranteed'
        ];
        headlines.push(defaults[headlines.length]);
        adReport.fixes.push(`Added default headline ${headlines.length}`);
      }

      // Update ad with fixed headlines
      headlines.forEach((h, i) => {
        ad[`headline${i + 1}`] = h.substring(0, 30);
      });
    }

    // Ensure 2 descriptions
    if (ad.type === 'rsa' || !ad.type) {
      const descriptions = [
        ad.description1, ad.description2
      ].filter(d => d && d.trim());

      while (descriptions.length < 2) {
        const defaults = [
          'Get professional service you can trust.',
          'Contact us today for expert assistance.'
        ];
        descriptions.push(defaults[descriptions.length]);
        adReport.fixes.push(`Added default description ${descriptions.length}`);
      }

      // Update ad with fixed descriptions
      descriptions.forEach((d, i) => {
        ad[`description${i + 1}`] = d.substring(0, 90);
      });
    }

    if (adReport.fixes.length > 0) {
      report.fixed++;
    }

    report.details.push(adReport);
    return ad;
  });

  return { ads: fixedAds, report };
}
```

### 4. API Endpoint Integration

The `/export-csv` endpoint should:

1. Receive campaign data with ads
2. Call `validateAndFixAds()` on the ads array
3. Generate CSV with fixed ads
4. Include auto-fix report in response headers
5. Return CSV file with proper headers

#### Response Headers:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="campaign_export.csv"
X-Row-Count: 150
X-Warnings-Count: 0
X-Auto-Fixed-Count: 3
X-Auto-Fix-Report: {"fixed":3,"details":[...]}
```

### 5. Frontend Integration

The frontend (`csvExportBackend.ts`) already:
- Validates and fixes ads before sending to backend
- Reads `X-Auto-Fixed-Count` header from response
- Displays auto-fix information in success notifications
- Logs detailed reports to console

## Benefits

1. **Proactive Validation**: Issues are fixed before CSV generation
2. **Transparent Reporting**: Users see what was fixed
3. **Consistent Quality**: All exports meet Google Ads requirements
4. **Reduced Errors**: Fewer validation failures in Google Ads Editor
5. **Better UX**: Users don't need to manually fix common issues

## Testing

Test cases:
1. Ad with 0 headlines → Should add 3 default headlines
2. Ad with 1 headline → Should add 2 more default headlines
3. Ad with 2 headlines → Should add 1 more default headline
4. Ad with 0 descriptions → Should add 2 default descriptions
5. Ad with 1 description → Should add 1 more default description
6. Headline > 30 chars → Should truncate to 30
7. Description > 90 chars → Should truncate to 90
8. Path > 15 chars → Should truncate to 15
9. Final URL without https:// → Should add https:// prefix
