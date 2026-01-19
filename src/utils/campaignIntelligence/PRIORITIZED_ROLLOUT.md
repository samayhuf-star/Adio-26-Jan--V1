# Prioritized Rollout Plan

## Practical Implementation Order + Rough Effort Notes

### Tier 1 — Must Ship (2-4 sprints)

**Priority: Critical - Unblocks core flows**

#### 1. Intent Classifier (Deterministic) ⏱️ 1-2 days
- **Effort:** Low
- **Value:** High - Unlocks many flows
- **Status:** ✅ Complete
- **Files:** `intentClassifier.ts`
- **Integration:** Add to CampaignBuilder2.tsx Step 1

#### 2. Landing Page Extraction (Basic DOM + Schema.org) ⏱️ 3-5 days
- **Effort:** Medium
- **Value:** High - Foundation for keyword/ad generation
- **Status:** ✅ Complete (needs headless fallback)
- **Files:** `landingPageExtractor.ts`
- **Integration:** Trigger on URL input in Step 1
- **Note:** Add headless render fallback for JS-heavy SPAs

#### 3. Device-Aware Defaults & Mobile-First Rules ⏱️ 1-2 days
- **Effort:** Low
- **Value:** Medium - Improves CALL campaign performance
- **Status:** ✅ Complete
- **Files:** `deviceDefaults.ts`
- **Integration:** Apply in ad generation and CSV export

#### 4. Vertical Config Skeleton (Top 10 Verticals) ⏱️ 2-3 days
- **Effort:** Medium
- **Value:** High - Enables vertical-specific logic
- **Status:** ✅ Complete (9 verticals)
- **Files:** `verticalTemplates.ts`
- **Integration:** Use in keyword/ad generation
- **Note:** Expand to top 10 most common verticals

#### 5. Basic Policy Checks (Blocklist + High-Severity Regex) ⏱️ 2-3 days
- **Effort:** Medium
- **Value:** High - Prevents policy violations
- **Status:** ✅ Complete
- **Files:** `policyChecks.ts`
- **Integration:** Run during ad generation and review step

**Tier 1 Total Effort:** ~10-15 days (2-3 sprints)

---

### Tier 2 — High Value (2-6 sprints)

**Priority: Important - Enhances quality and automation**

#### 6. Match-Type + Intent Bid Suggestion Logic ⏱️ 2-3 days
- **Effort:** Low
- **Value:** High - Improves bid accuracy
- **Status:** ✅ Complete
- **Files:** `bidSuggestions.ts`
- **Integration:** Attach to keyword objects, show in UI
- **Note:** Requires baseCPC input (API or heuristic)

#### 7. DNI & UTM Integration ⏱️ 3-5 days
- **Effort:** Medium
- **Value:** High - Enables tracking and call attribution
- **Status:** ✅ Complete (needs provider API integration)
- **Files:** `tracking.ts`
- **Integration:** Add to final URL generation, CSV export
- **Note:** Requires DNI provider API setup

#### 8. Improved Negative Suggestion Flow ⏱️ 2-4 days
- **Effort:** Medium
- **Value:** Medium - Reduces wasted spend
- **Status:** ⚠️ Partial (needs SQR integration)
- **Files:** `negativeKeywordsGenerator.ts` (existing)
- **Integration:** Use SQRs if available, fallback to heuristics
- **Note:** Requires access to Search Query Reports

#### 9. CSV Export: Extra Columns ⏱️ 1-2 days
- **Effort:** Low
- **Value:** Medium - Better campaign visibility
- **Status:** ⏳ Pending
- **Files:** `csvGeneratorV3.ts`
- **Integration:** Add columns: intent_id, persona, suggested_bid_reason, dni_phone, locale, PolicyStatus

**Tier 2 Total Effort:** ~8-14 days (2-3 sprints)

---

### Tier 3 — Advanced (Ongoing)

**Priority: Nice-to-Have - Continuous improvement**

#### 10. ML-Based Intent Classifier & Policy Model ⏱️ 4-8 weeks
- **Effort:** High
- **Value:** Medium - Improves recall/precision
- **Status:** ⏳ Future
- **Note:** Requires training data, model deployment

#### 11. CPA-Driven Bids Using Historical Conversion Data ⏱️ 2-4 weeks
- **Effort:** Medium-High
- **Value:** High - Optimizes for conversions
- **Status:** ⏳ Future
- **Note:** Requires conversion tracking integration

#### 12. Multi-Language Template Library & Translation Fallback ⏱️ 2-4 weeks
- **Effort:** Medium
- **Value:** Medium - Expands market reach
- **Status:** ⏳ Future (basic localization exists)
- **Note:** Requires translation API or library

#### 13. Semantic Clustering for Large Keyword Sets ⏱️ 3-6 weeks
- **Effort:** High
- **Value:** Medium - Better ad group organization
- **Note:** Requires embeddings model (OpenAI, etc.)

---

## Quick Integration Notes (Practical)

### Deterministic Algorithms
✅ All algorithms use fixed logic (no randomness)
- Intent scoring: deterministic keyword matching
- Bid calculation: fixed multipliers
- Keyword grouping: token-based hashing

### Provenance Metadata
✅ Every generated object includes:
- `generatedBy`: Module version (e.g., "intent_v1.0")
- `templateId`: Template identifier (e.g., "electrician_call_01")
- `reason`: Human-readable explanation

### Fail-Safe Patterns
✅ All modules include fallbacks:
- Landing extraction fails → Manual entry form
- Intent unclear → Default to TRAFFIC
- Bid calculation fails → Use base CPC
- Policy check fails → Warning (not block)

### Reason Strings
✅ Critical outputs include reasoning:
- Bid suggestions: `"base=2000 * intent(CALL)=1.2 * match(EXACT)=1 => 2400"`
- Policy violations: `"Prohibited term found: 'guarantee cure'"`
- Intent classification: Confidence score + persona

---

## Implementation Checklist

### Tier 1 (Must Ship)
- [x] Intent classifier
- [x] Landing page extractor (basic)
- [x] Device-aware defaults
- [x] Vertical configs (9 verticals)
- [x] Basic policy checks
- [ ] **Integration into CampaignBuilder2.tsx**

### Tier 2 (High Value)
- [x] Bid suggestions
- [x] UTM tracking
- [ ] DNI provider API integration
- [ ] SQR-based negative suggestions
- [ ] CSV export updates

### Tier 3 (Advanced)
- [ ] ML intent classifier
- [ ] CPA-driven bids
- [ ] Translation library
- [ ] Semantic clustering

---

## Next Immediate Steps

1. **Integrate Tier 1 modules into CampaignBuilder2.tsx** (Priority 1)
   - Add intent classification on goal input
   - Trigger landing page extraction on URL input
   - Apply device defaults in ad generation
   - Run policy checks in review step

2. **Update CSV Export** (Priority 2)
   - Add new columns to csvGeneratorV3.ts
   - Include intent_id, persona, bid_reason, etc.

3. **Test End-to-End** (Priority 3)
   - Full campaign generation flow
   - Validate all outputs
   - Check CSV format

