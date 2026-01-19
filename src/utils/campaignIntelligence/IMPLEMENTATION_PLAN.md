# Implementation Plan - Campaign Intelligence Module

## Status: Awaiting Specifications

This document will be updated with:
1. Data schemas (TypeScript interfaces)
2. Sample rules/algorithms (pseudocode/logic)
3. Regex/snippets (validation patterns)
4. Validation tests (test cases)
5. Prioritized rollout plan

---

## Current Structure

### Files Created:
- ✅ `schemas.ts` - TypeScript interfaces (placeholder)
- ✅ `README.md` - Module documentation
- ⏳ `intentClassifier.ts` - Awaiting specifications
- ⏳ `landingPageExtractor.ts` - Awaiting specifications
- ⏳ `verticalTemplates.ts` - Awaiting specifications
- ⏳ `bidSuggestions.ts` - Awaiting specifications
- ⏳ `policyChecks.ts` - Awaiting specifications
- ⏳ `localization.ts` - Awaiting specifications
- ⏳ `tracking.ts` - Awaiting specifications
- ⏳ `deviceDefaults.ts` - Awaiting specifications
- ⏳ `tests/` - Test files (awaiting specifications)

---

## Integration Points

### 1. CampaignBuilder2.tsx
- **Step 1**: Add vertical selection dropdown
- **Step 1**: Add goal selection (calls/leads/purchases)
- **Step 1**: Add language selection
- **Step 2**: Integrate landing page extractor
- **Step 2**: Apply intent classifier
- **Step 3**: Use vertical templates for ad generation
- **Step 4**: Apply bid suggestions
- **Step 5**: Run policy checks before export

### 2. AdsBuilder.tsx
- Integrate vertical-specific ad templates
- Apply device-aware defaults
- Use intent-based tone/voice
- Add tracking parameters (UTM/DNI)

### 3. KeywordPlanner.tsx
- Use landing page extracted services
- Apply vertical-specific modifiers
- Use intent-based keyword expansion
- Apply bid suggestions

### 4. CSV Export
- Add UTM parameters to final URLs
- Add DNI tracking numbers
- Apply localization formatting

---

## Next Steps

1. **Receive Specifications** from user
2. **Implement Core Modules** based on specs
3. **Write Tests** for validation
4. **Integrate** into existing components
5. **Test End-to-End** campaign generation
6. **Deploy** in prioritized phases

---

## Notes

- All modules should be deterministic (no randomness in production)
- All modules should be testable (unit tests required)
- All modules should be configurable (via schemas/config)
- All modules should handle errors gracefully (fail-safe defaults)

