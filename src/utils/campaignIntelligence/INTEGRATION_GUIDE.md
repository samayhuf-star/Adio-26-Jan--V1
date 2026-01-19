# Campaign Intelligence Integration Guide

## Overview

All core modules have been implemented. This guide shows how to integrate them into the existing CampaignBuilder2.tsx wizard.

## Implementation Status

✅ **All 8 Core Modules Complete:**
1. ✅ Intent & Persona Classifier
2. ✅ Landing Page Extractor
3. ✅ Vertical Templates & Rules
4. ✅ Bid Suggestions
5. ✅ Policy & Safety Checks
6. ✅ Localization Support
7. ✅ UTM + DNI Tracking
8. ✅ Device-Aware Defaults

## Integration Points

### 1. CampaignBuilder2.tsx - Step 1 (Input Collection)

**Add to state:**
```typescript
import { generateCampaignIntelligence } from '../utils/campaignIntelligence';

// Add to component state
const [campaignIntelligence, setCampaignIntelligence] = useState<CampaignIntelligence | null>(null);
const [landingPageData, setLandingPageData] = useState<LandingPageExtractionResult | null>(null);
const [intentClassification, setIntentClassification] = useState<IntentClassificationResult | null>(null);
```

**On URL input change:**
```typescript
const handleUrlChange = async (url: string) => {
  if (!url) return;
  
  // Extract landing page content
  const extracted = await extractLandingPageContent(url);
  setLandingPageData(extracted);
  
  // Auto-populate fields
  if (extracted.phones.length > 0) {
    setPhoneNumber(extracted.phones[0]);
  }
  if (extracted.services.length > 0) {
    // Suggest services for keywords
  }
};
```

**On goal/vertical change:**
```typescript
const handleGoalChange = async (goal: string, vertical: string) => {
  // Classify intent
  const intent = classifyIntent({
    goal,
    goalType: goal as CampaignGoal,
    landingPageUrl: url,
    landingPageData: landingPageData ? {
      hasPhone: landingPageData.phones.length > 0,
      hasForm: false, // Detect from landing page
    } : undefined,
    vertical,
  });
  
  setIntentClassification(intent);
  
  // Update UI based on intent
  if (intent.intent_id === 'CALL_INTENT') {
    // Show call-only ad options
    // Enable phone number field
    // Set device preference to mobile
  }
};
```

### 2. CampaignBuilder2.tsx - Step 2 (Keywords)

**Use vertical templates for keyword expansion:**
```typescript
import { getServiceTokens, getKeywordModifiers, getEmergencyModifiers } from '../utils/campaignIntelligence/verticalTemplates';

const generateKeywordsWithVertical = (seedKeywords: string[], vertical: string) => {
  const serviceTokens = getServiceTokens(vertical);
  const modifiers = getKeywordModifiers(vertical);
  const emergencyMods = getEmergencyModifiers(vertical);
  
  // Combine with seed keywords
  // Apply modifiers
  // Use intent to filter/prioritize
};
```

**Apply bid suggestions:**
```typescript
import { calculateBidSuggestions, hasEmergencyModifier } from '../utils/campaignIntelligence/bidSuggestions';
import { getEmergencyModifiers } from '../utils/campaignIntelligence/verticalTemplates';

const keywordsWithBids = keywords.map(kw => {
  const emergencyMods = getEmergencyModifiers(vertical);
  const hasEmergency = hasEmergencyModifier(kw.text, emergencyMods);
  
  const bidSuggestion = calculateBidSuggestion({
    keyword: kw.text,
    matchType: kw.matchType,
    intent: intentClassification.intent_id,
    hasEmergencyModifier: hasEmergency,
  });
  
  return {
    ...kw,
    suggestedBid: bidSuggestion.suggestedCPC,
    bidReason: bidSuggestion.reasoning,
  };
});
```

### 3. CampaignBuilder2.tsx - Step 3 (Ads)

**Use vertical templates for ad generation:**
```typescript
import { getAdTemplate, renderAdTemplate } from '../utils/campaignIntelligence/verticalTemplates';

const generateAdsWithTemplates = (vertical: string, intent: CampaignIntent) => {
  const template = getAdTemplate(vertical, intent);
  
  if (template) {
    const rendered = renderAdTemplate(template, {
      business: businessName,
      modifier: '24/7',
      service: 'Electrician',
      city: 'New York',
    });
    
    // Use rendered.headline and rendered.description
  }
};
```

**Apply device-aware optimizations:**
```typescript
import { optimizeHeadlineForDevice, optimizeDescriptionForDevice } from '../utils/campaignIntelligence/deviceDefaults';

const optimizeAdForDevice = (ad: Ad, intent: CampaignIntent) => {
  ad.headline = optimizeHeadlineForDevice(ad.headline, 'mobile', intent);
  ad.description = optimizeDescriptionForDevice(ad.description, 'mobile', intent);
};
```

**Run policy checks:**
```typescript
import { runPolicyChecks } from '../utils/campaignIntelligence/policyChecks';

const validateAd = (ad: Ad, vertical: string) => {
  const check = runPolicyChecks({
    headline: ad.headline,
    description: ad.description,
    finalUrl: ad.finalUrl,
    vertical,
  });
  
  if (!check.passed) {
    // Show violations/warnings
    // Block export if critical violations
  }
};
```

### 4. CampaignBuilder2.tsx - Step 6 (Review/Export)

**Add tracking parameters:**
```typescript
import { buildTrackingParams } from '../utils/campaignIntelligence/tracking';

const addTrackingToAds = (ads: Ad[], campaignId: string, adGroupId: string) => {
  return ads.map(ad => {
    const tracking = buildTrackingParams(
      ad.finalUrl,
      trackingConfig,
      {
        campaignId,
        adGroupId,
        keyword: ad.keyword,
        adId: ad.id,
        dniPhone: dniPhone, // If DNI enabled
      }
    );
    
    return {
      ...ad,
      finalUrl: tracking.trackingUrl,
    };
  });
};
```

**Apply device bid modifiers:**
```typescript
import { formatDeviceBidModifiersForCSV } from '../utils/campaignIntelligence/deviceDefaults';

const deviceModifiers = formatDeviceBidModifiersForCSV(intentClassification.intent_id);
// Add to ad group CSV row
```

### 5. CSV Export Updates

**Update csvGeneratorV3.ts to include new columns:**

```typescript
// Add new columns to CSV headers
const newColumns = [
  'Intent ID',
  'Persona',
  'Suggested Bid Reason',
  'DNI Phone',
  'Locale',
  'Policy Status',
];

// When generating rows:
row['Intent ID'] = campaignIntelligence.intent.intent_id;
row['Persona'] = campaignIntelligence.intent.persona;
row['Suggested Bid Reason'] = keyword.bidReason || '';
row['DNI Phone'] = dniPhone || '';
row['Locale'] = campaignIntelligence.localization.language;
row['Policy Status'] = policyCheck.passed ? 'Approved' : 'Review Required';
```

**Add Call Extension rows for DNI:**
```typescript
if (dniEnabled && dniPhone) {
  // Add Call Extension row
  const callExtensionRow = {
    'Campaign': campaignName,
    'Ad Group': adGroupName,
    'Row Type': 'call',
    'Asset Type': 'Call',
    'Phone Number': dniPhone,
    'Country Code': '+1',
  };
  rows.push(callExtensionRow);
}
```

## Example Integration Flow

```typescript
// 1. User enters URL and goal
const intelligence = await generateCampaignIntelligence({
  goal: 'calls',
  goalType: 'calls',
  landingPageUrl: 'https://example.com',
  vertical: 'electrician',
  geo: 'United States',
  language: 'en',
  campaignId: 'campaign-123',
});

// 2. Use intent to guide UI
if (intelligence.intent.intent_id === 'CALL_INTENT') {
  // Show call-focused options
  // Enable phone number field
  // Set mobile-first defaults
}

// 3. Use landing page data
if (intelligence.landingPage.phones.length > 0) {
  setPhoneNumber(intelligence.landingPage.phones[0]);
}
if (intelligence.landingPage.services.length > 0) {
  // Pre-populate service keywords
}

// 4. Generate keywords with vertical templates
const keywords = generateKeywordsWithVertical(
  seedKeywords,
  intelligence.vertical.vertical_id,
  intelligence.intent.intent_id
);

// 5. Calculate bid suggestions
const keywordsWithBids = calculateBidSuggestions(
  keywords,
  intelligence.intent.intent_id,
  baseCPC
);

// 6. Generate ads with templates
const ads = generateAdsWithTemplates(
  intelligence.vertical,
  intelligence.intent.intent_id,
  intelligence.landingPage
);

// 7. Run policy checks
const policyResults = runBatchPolicyChecks(ads.map(ad => ({
  headline: ad.headline,
  description: ad.description,
  finalUrl: ad.finalUrl,
  vertical: intelligence.vertical.vertical_id,
})));

// 8. Add tracking
const adsWithTracking = ads.map(ad => ({
  ...ad,
  finalUrl: buildTrackingURL(ad.finalUrl, utmParams),
}));

// 9. Export with new columns
exportToCSV(campaign, {
  includeIntelligence: true,
  intelligence,
});
```

## Testing Checklist

- [ ] Intent classification works for all goal types
- [ ] Landing page extraction handles various page structures
- [ ] Vertical templates generate appropriate ads
- [ ] Bid suggestions are calculated correctly
- [ ] Policy checks catch violations
- [ ] Localization formats content correctly
- [ ] Tracking URLs are generated properly
- [ ] Device modifiers are applied
- [ ] CSV export includes all new columns

## Next Steps

1. Integrate into CampaignBuilder2.tsx step by step
2. Add UI for displaying intent classification
3. Add policy check warnings in review step
4. Update CSV export format
5. Test end-to-end campaign generation

