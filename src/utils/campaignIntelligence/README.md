# Campaign Intelligence Module

This module implements production-grade campaign generation logic with:
- Deterministic intent classification
- Landing page extraction
- Vertical templates & rules
- Bid suggestions
- Policy/safety checks
- Localization
- UTM/DNI tracking
- Device-aware defaults

## Structure

```
campaignIntelligence/
├── intentClassifier.ts      # Goal → Intent mapping
├── landingPageExtractor.ts  # URL parsing & content extraction
├── verticalTemplates.ts     # Industry-specific templates
├── bidSuggestions.ts        # Match type + intent based bidding
├── policyChecks.ts         # Safety & policy validation
├── localization.ts         # Geo & language support
├── tracking.ts             # UTM + DNI integration
├── deviceDefaults.ts       # Mobile/desktop optimization
├── schemas.ts              # TypeScript interfaces
└── tests/                  # Validation tests
```

## Integration Points

- **CampaignBuilder2.tsx**: Main wizard integration
- **AdsBuilder.tsx**: Ad generation with templates
- **KeywordPlanner.tsx**: Keyword expansion with intent
- **CSV Export**: Enhanced with tracking parameters

