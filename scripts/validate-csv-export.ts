/**
 * validate-csv-export.ts
 * 
 * Generates CSVs for all 7 campaign structure types using the actual exporter,
 * then validates every row against Google Ads Editor import requirements.
 * 
 * Run with: npx tsx scripts/validate-csv-export.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateMasterCSV, MASTER_CSV_HEADERS, COLUMN_INDEX, CampaignDataV5, AdGroupV5, KeywordV5, AdV5 } from '../src/utils/googleAdsEditorCSVExporterV5';

// ─── Test data ───────────────────────────────────────────────────────────────

const TEST_KEYWORDS_RAW = [
  'delta dental insurance',
  'dental insurance plans',
  'affordable dental coverage',
  'dental insurance for families',
  'best dental insurance providers',
  'dental plan comparison',
  'dental insurance quotes',
  'low cost dental insurance',
  'delta dental network dentists',
  'dental coverage options',
];

const SAMPLE_HEADLINES = [
  'Delta Dental Insurance Plans',
  'Affordable Dental Coverage',
  'Compare Dental Plans Today',
  'Get a Free Dental Quote',
  'Top Rated Dental Insurance',
  'Trusted Dental Providers',
  'Quality Dental Coverage',
  'Find a Dentist Near You',
  'Dental Insurance Made Easy',
  'Save on Dental Care Today',
  'Protect Your Family\'s Smile',
  'Plans Starting From',
  'Expert Dental Guidance',
  'Flexible Dental Options',
  'Apply For Coverage Today',
];

const SAMPLE_DESCRIPTIONS = [
  'Compare top dental insurance plans and find the right coverage for your family. Get a free quote now.',
  'Affordable dental coverage with access to thousands of providers. Sign up today and save on dental care.',
  'Comprehensive dental plans with no waiting periods. Find the perfect plan for your budget and needs.',
  'Delta Dental provides comprehensive coverage with a large network of trusted dentists near you.',
];

const FINAL_URL = 'https://www.deltadentalins.com/plans';

// ─── Structure generators (mirroring CampaignBuilder3.tsx logic) ─────────────

type RawKeyword = { text: string; matchType: string };

function dedup(rawKeywords: RawKeyword[]): RawKeyword[] {
  const seen = new Set<string>();
  return rawKeywords.filter(kw => {
    const key = kw.text.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toV5MatchType(mt: string): 'Broad' | 'Phrase' | 'Exact' {
  const lower = mt.toLowerCase();
  if (lower === 'exact') return 'Exact';
  if (lower === 'phrase') return 'Phrase';
  return 'Broad';
}

function makeKeyword(text: string, matchType: string): KeywordV5 {
  return { text, matchType: toV5MatchType(matchType), status: 'Enabled', finalUrl: FINAL_URL };
}

function makeAd(adGroupName: string): AdV5 {
  const cleanKw = adGroupName.replace(/\s+-\s+(Broad|Phrase|Exact)$/i, '').trim();
  const shortKw = cleanKw.length > 30 ? cleanKw.substring(0, 30).replace(/\s+\S*$/, '') : cleanKw;
  const toTitle = (s: string) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const dkiHeadline = shortKw ? `{KeyWord:${toTitle(shortKw)}}` : SAMPLE_HEADLINES[0];
  const headlines = [dkiHeadline, ...SAMPLE_HEADLINES.filter(h => h !== dkiHeadline)].slice(0, 15);
  return {
    type: 'RSA',
    headlines,
    descriptions: SAMPLE_DESCRIPTIONS.slice(0, 4),
    path1: 'Dental',
    path2: 'Plans',
    finalUrl: FINAL_URL,
    status: 'Enabled',
  };
}

const MATCH_TYPES = ['broad', 'phrase', 'exact'];

function generateAdGroups(structureType: string, rawKws: string[]): AdGroupV5[] {
  const keywords: RawKeyword[] = dedup(rawKws.map(t => ({ text: t, matchType: 'broad' })));
  const groups: AdGroupV5[] = [];

  if (structureType === 'skag') {
    keywords.forEach((kw, idx) => {
      const kwVariants = MATCH_TYPES.map(mt => makeKeyword(kw.text, mt));
      const ag: AdGroupV5 = {
        name: kw.text,
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: kwVariants,
        ads: [],
      };
      ag.ads = [makeAd(ag.name)];
      groups.push(ag);
    });

  } else if (structureType === 'skag_split') {
    const matchTypeLabels: Record<string, string> = { broad: 'Broad', phrase: 'Phrase', exact: 'Exact' };
    keywords.forEach((kw) => {
      MATCH_TYPES.forEach(mt => {
        const ag: AdGroupV5 = {
          name: `${kw.text} - ${matchTypeLabels[mt]}`,
          maxCpc: 2.0,
          status: 'Enabled',
          keywords: [makeKeyword(kw.text, mt)],
          ads: [],
        };
        ag.ads = [makeAd(ag.name)];
        groups.push(ag);
      });
    });

  } else if (structureType === 'match_type') {
    const broadKws = keywords.map(kw => makeKeyword(kw.text, 'broad'));
    const phraseKws = keywords.map(kw => makeKeyword(kw.text, 'phrase'));
    const exactKws = keywords.map(kw => makeKeyword(kw.text, 'exact'));
    ['Broad Match', 'Phrase Match', 'Exact Match'].forEach((name, idx) => {
      const ag: AdGroupV5 = {
        name,
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: [broadKws, phraseKws, exactKws][idx],
        ads: [makeAd(name)],
      };
      groups.push(ag);
    });

  } else if (structureType === 'long_tail') {
    const themeGroups: Record<string, RawKeyword[]> = {};
    keywords.forEach(kw => {
      const words = kw.text.split(/\s+/);
      const theme = words.slice(0, 2).join(' ').toLowerCase();
      if (!themeGroups[theme]) themeGroups[theme] = [];
      themeGroups[theme].push(kw);
    });
    Object.entries(themeGroups).slice(0, 15).forEach(([theme, kwList]) => {
      const titleTheme = theme.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const ag: AdGroupV5 = {
        name: `Long-Tail - ${titleTheme}`,
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: kwList.map(kw => makeKeyword(kw.text, 'phrase')),
        ads: [],
      };
      ag.ads = [makeAd(ag.name)];
      groups.push(ag);
    });

  } else if (structureType === 'brand_split') {
    const brandTerms = 'delta dental insurance'.split(/\s+/).filter(w => w.length > 2);
    const brandedKws = keywords.filter(kw => brandTerms.some(bt => kw.text.includes(bt)));
    const nonBrandedKws = keywords.filter(kw => !brandTerms.some(bt => kw.text.includes(bt)));
    if (brandedKws.length > 0) {
      const ag: AdGroupV5 = {
        name: 'Branded Keywords',
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: brandedKws.map(kw => makeKeyword(kw.text, 'exact')),
        ads: [makeAd('Branded Keywords')],
      };
      groups.push(ag);
    }
    if (nonBrandedKws.length > 0) {
      const ag: AdGroupV5 = {
        name: 'Non-Branded Keywords',
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: nonBrandedKws.map(kw => makeKeyword(kw.text, 'broad')),
        ads: [makeAd('Non-Branded Keywords')],
      };
      groups.push(ag);
    }

  } else if (structureType === 'alpha_beta') {
    const alphaKws = keywords.filter(kw => kw.text.split(/\s+/).length <= 3);
    const betaKws = keywords.filter(kw => kw.text.split(/\s+/).length > 3);
    if (alphaKws.length > 0) {
      groups.push({
        name: 'Alpha - Exact Match',
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: alphaKws.map(kw => makeKeyword(kw.text, 'exact')),
        ads: [makeAd('Alpha - Exact Match')],
      });
    }
    if (betaKws.length > 0) {
      groups.push({
        name: 'Beta - Broad Match',
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: betaKws.map(kw => makeKeyword(kw.text, 'broad')),
        ads: [makeAd('Beta - Broad Match')],
      });
    }

  } else if (structureType === 'ngram') {
    const ngramGroups: Record<string, RawKeyword[]> = {};
    keywords.forEach(kw => {
      const wordCount = kw.text.split(/\s+/).filter(Boolean).length;
      const label = `${wordCount}-Word`;
      if (!ngramGroups[label]) ngramGroups[label] = [];
      ngramGroups[label].push(kw);
    });
    Object.entries(ngramGroups).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([label, kwList]) => {
      groups.push({
        name: `${label} Keywords`,
        maxCpc: 2.0,
        status: 'Enabled',
        keywords: kwList.map(kw => makeKeyword(kw.text, 'broad')),
        ads: [makeAd(`${label} Keywords`)],
      });
    });
  }

  return groups;
}

// ─── CSV row parser ───────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(current); current = ''; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Validation rules ─────────────────────────────────────────────────────────

const VALID_CRITERION_TYPES = new Set(['Broad', 'Phrase', 'Exact']);
const VALID_AD_TYPES = new Set(['Responsive search ad', 'Call-only ad', 'Expanded text ad']);
const VALID_CAMPAIGN_TYPES = new Set(['Search', 'Display', 'Shopping', 'Video', 'Performance Max']);
const EXPECTED_COLUMN_COUNT = MASTER_CSV_HEADERS.length;

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

function validateCSV(csvContent: string, structureType: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
  const [headerLine, ...dataLines] = lines;
  const headerCols = parseCSVLine(headerLine);

  // 1. Column count
  results.push({
    name: 'Header column count = 183',
    pass: headerCols.length === EXPECTED_COLUMN_COUNT,
    detail: `Got ${headerCols.length}, expected ${EXPECTED_COLUMN_COUNT}`,
  });

  const kwIdx = COLUMN_INDEX['Keyword'];
  const criterionIdx = COLUMN_INDEX['Criterion Type'];
  const adTypeIdx = COLUMN_INDEX['Ad Type'];
  const campaignTypeIdx = COLUMN_INDEX['Campaign Type'];
  const bidStratIdx = COLUMN_INDEX['Bid Strategy Type'];
  const finalUrlIdx = COLUMN_INDEX['Final URL'];
  const adGroupIdx = COLUMN_INDEX['Ad Group'];
  const campaignIdx = COLUMN_INDEX['Campaign'];
  const h1Idx = COLUMN_INDEX['Headline 1'];
  const d1Idx = COLUMN_INDEX['Description 1'];

  // Track keyword uniqueness
  const seenKwKeys = new Set<string>();
  const duplicateKws: string[] = [];

  // Track per-row issues
  const criterionErrors: string[] = [];
  const kwEmptyErrors: number[] = [];
  const adTypeErrors: string[] = [];
  const headlineErrors: string[] = [];
  const descErrors: string[] = [];
  const urlErrors: string[] = [];
  const colCountErrors: number[] = [];

  let campaignRowOk = false;
  let bidStratOk = false;
  const skagSplitNameErrors: string[] = [];

  dataLines.forEach((line, lineIdx) => {
    const row = parseCSVLine(line);
    const rowNum = lineIdx + 2; // 1-indexed, +1 for header

    // Column count per row
    if (row.length !== EXPECTED_COLUMN_COUNT) {
      colCountErrors.push(rowNum);
    }

    const kwText = row[kwIdx] || '';
    const criterion = row[criterionIdx] || '';
    const adType = row[adTypeIdx] || '';
    const campaignType = row[campaignTypeIdx] || '';
    const bidStrat = row[bidStratIdx] || '';
    const finalUrl = row[finalUrlIdx] || '';
    const adGroup = row[adGroupIdx] || '';
    const campaign = row[campaignIdx] || '';

    // Campaign row checks
    if (campaignType) {
      campaignRowOk = VALID_CAMPAIGN_TYPES.has(campaignType);
    }
    if (bidStrat) {
      bidStratOk = bidStrat.trim().length > 0;
    }

    // Keyword row checks (rows with a Keyword value)
    if (kwText) {
      // Criterion Type must be capitalized
      if (!VALID_CRITERION_TYPES.has(criterion)) {
        criterionErrors.push(`Row ${rowNum}: "${criterion}" (keyword: "${kwText}")`);
      }
      // No keyword text empty
      if (!kwText.trim()) {
        kwEmptyErrors.push(rowNum);
      }
      // Dedup check
      const key = `${campaign}|${adGroup}|${kwText.toLowerCase().trim()}|${criterion}`;
      if (seenKwKeys.has(key)) {
        duplicateKws.push(`"${kwText}" [${criterion}] in adgroup "${adGroup}"`);
      } else {
        seenKwKeys.add(key);
      }
    }

    // Ad row checks (rows with Ad Type)
    if (adType) {
      if (!VALID_AD_TYPES.has(adType)) {
        adTypeErrors.push(`Row ${rowNum}: "${adType}"`);
      }
      // Headline checks (at least 3, each ≤ 30 chars)
      let headlineCount = 0;
      let headlineTooLong = false;
      for (let i = 0; i < 15; i++) {
        const hIdx = COLUMN_INDEX[`Headline ${i + 1}`];
        const hText = hIdx !== undefined ? (row[hIdx] || '') : '';
        if (hText.trim()) {
          headlineCount++;
          if (hText.length > 30) headlineTooLong = true;
        }
      }
      if (headlineCount < 3) {
        headlineErrors.push(`Row ${rowNum}: only ${headlineCount} headlines (adgroup "${adGroup}")`);
      }
      if (headlineTooLong) {
        headlineErrors.push(`Row ${rowNum}: headline > 30 chars (adgroup "${adGroup}")`);
      }
      // Description checks (at least 2, each ≤ 90 chars)
      let descCount = 0;
      let descTooLong = false;
      for (let i = 0; i < 4; i++) {
        const dIdx = COLUMN_INDEX[`Description ${i + 1}`];
        const dText = dIdx !== undefined ? (row[dIdx] || '') : '';
        if (dText.trim()) {
          descCount++;
          if (dText.length > 90) descTooLong = true;
        }
      }
      if (descCount < 2) {
        descErrors.push(`Row ${rowNum}: only ${descCount} descriptions (adgroup "${adGroup}")`);
      }
      if (descTooLong) {
        descErrors.push(`Row ${rowNum}: description > 90 chars (adgroup "${adGroup}")`);
      }
      // Final URL
      if (!finalUrl || !finalUrl.startsWith('http')) {
        urlErrors.push(`Row ${rowNum}: "${finalUrl}" (adgroup "${adGroup}")`);
      }
    }

    // Ad group name length check
    if (adGroup && adGroup.length > 255) {
      headlineErrors.push(`Row ${rowNum}: ad group name > 255 chars: "${adGroup.substring(0, 60)}..."`);
    }

    // SKAG Split: name should end with " - Broad", " - Phrase", or " - Exact"
    if (structureType === 'skag_split' && adGroup && kwText) {
      if (!/\s+-\s+(Broad|Phrase|Exact)$/.test(adGroup)) {
        skagSplitNameErrors.push(`"${adGroup}"`);
      }
    }
  });

  results.push({
    name: 'All data rows have 183 columns',
    pass: colCountErrors.length === 0,
    detail: colCountErrors.length === 0 ? 'OK' : `${colCountErrors.length} rows with wrong column count: rows ${colCountErrors.slice(0, 5).join(', ')}`,
  });
  results.push({
    name: 'Campaign row: Campaign Type is valid',
    pass: campaignRowOk,
    detail: campaignRowOk ? 'OK' : 'Campaign Type missing or invalid',
  });
  results.push({
    name: 'Campaign row: Bid Strategy Type is non-empty',
    pass: bidStratOk,
    detail: bidStratOk ? 'OK' : 'Bid Strategy Type is empty',
  });
  results.push({
    name: 'Keyword rows: Criterion Type is Broad/Phrase/Exact (capitalized)',
    pass: criterionErrors.length === 0,
    detail: criterionErrors.length === 0 ? 'OK' : `${criterionErrors.length} errors:\n    ${criterionErrors.slice(0, 5).join('\n    ')}`,
  });
  results.push({
    name: 'Keyword rows: no duplicates (Campaign+AdGroup+Keyword+MatchType)',
    pass: duplicateKws.length === 0,
    detail: duplicateKws.length === 0 ? 'OK' : `${duplicateKws.length} duplicates:\n    ${duplicateKws.slice(0, 5).join('\n    ')}`,
  });
  results.push({
    name: 'Ad rows: Ad Type is valid',
    pass: adTypeErrors.length === 0,
    detail: adTypeErrors.length === 0 ? 'OK' : `${adTypeErrors.length} errors:\n    ${adTypeErrors.slice(0, 5).join('\n    ')}`,
  });
  results.push({
    name: 'Ad rows: >= 3 headlines, each <= 30 chars',
    pass: headlineErrors.length === 0,
    detail: headlineErrors.length === 0 ? 'OK' : `${headlineErrors.length} issues:\n    ${headlineErrors.slice(0, 5).join('\n    ')}`,
  });
  results.push({
    name: 'Ad rows: >= 2 descriptions, each <= 90 chars',
    pass: descErrors.length === 0,
    detail: descErrors.length === 0 ? 'OK' : `${descErrors.length} issues:\n    ${descErrors.slice(0, 5).join('\n    ')}`,
  });
  results.push({
    name: 'Ad rows: Final URL starts with http',
    pass: urlErrors.length === 0,
    detail: urlErrors.length === 0 ? 'OK' : `${urlErrors.length} errors:\n    ${urlErrors.slice(0, 5).join('\n    ')}`,
  });

  if (structureType === 'skag_split') {
    const uniqueNameErrors = [...new Set(skagSplitNameErrors)];
    results.push({
      name: 'SKAG Split: ad group names end with " - Broad/Phrase/Exact"',
      pass: uniqueNameErrors.length === 0,
      detail: uniqueNameErrors.length === 0 ? 'OK' : `${uniqueNameErrors.length} bad names:\n    ${uniqueNameErrors.slice(0, 5).join('\n    ')}`,
    });
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const STRUCTURE_TYPES = ['skag', 'skag_split', 'match_type', 'long_tail', 'brand_split', 'alpha_beta', 'ngram'];

let totalPass = 0;
let totalFail = 0;

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  Google Ads Editor CSV Validation — All 7 Campaign Types');
console.log('══════════════════════════════════════════════════════════════════\n');

for (const structureType of STRUCTURE_TYPES) {
  const adGroups = generateAdGroups(structureType, TEST_KEYWORDS_RAW);

  const campaignData: CampaignDataV5 = {
    campaignName: `Test Campaign - ${structureType.toUpperCase()}`,
    dailyBudget: 100,
    campaignType: 'Search',
    bidStrategy: 'Maximize Conversions',
    networks: 'Google search',
    status: 'Enabled',
    url: FINAL_URL,
    adGroups,
    negativeKeywords: ['free dental', 'cheap dental', 'cheap dentist'],
    locations: {
      countries: ['United States'],
      countryCode: 'US',
    },
    sitelinks: [
      { text: 'Dental Plans', description1: 'View all dental plans', description2: 'Find the right plan for you', finalUrl: FINAL_URL },
      { text: 'Find a Dentist', description1: 'Search dentists near you', description2: 'In-network providers available', finalUrl: FINAL_URL },
    ],
    callouts: [
      { text: 'Free Quote', status: 'Enabled' },
      { text: 'No Waiting Period', status: 'Enabled' },
      { text: 'Large Network', status: 'Enabled' },
    ],
    snippets: [
      { header: 'Insurance coverage', values: 'Preventive, Basic, Major, Orthodontic', status: 'Enabled' },
    ],
  };

  const csvContent = generateMasterCSV(campaignData);

  // Write CSV to /tmp
  const outPath = `/tmp/validate_${structureType}.csv`;
  fs.writeFileSync(outPath, csvContent, 'utf8');

  // Parse and validate
  const checks = validateCSV(csvContent, structureType);

  const lineCount = csvContent.split(/\r?\n/).filter(l => l.trim()).length - 1; // exclude header
  const passCount = checks.filter(c => c.pass).length;
  const failCount = checks.filter(c => !c.pass).length;
  totalPass += passCount;
  totalFail += failCount;

  const statusIcon = failCount === 0 ? '✓' : '✗';
  console.log(`─── ${structureType.toUpperCase()} (${adGroups.length} ad groups, ${lineCount} data rows) ${statusIcon}`);
  console.log(`    CSV written to: ${outPath}`);

  for (const check of checks) {
    const icon = check.pass ? '  ✓' : '  ✗';
    console.log(`${icon} ${check.name}`);
    if (!check.pass) {
      console.log(`      → ${check.detail}`);
    }
  }
  console.log('');
}

console.log('══════════════════════════════════════════════════════════════════');
console.log(`  TOTAL: ${totalPass} passed, ${totalFail} failed`);
console.log(`  STATUS: ${totalFail === 0 ? '✓ ALL CHECKS PASSED — CSVs are Google Ads Editor ready' : '✗ SOME CHECKS FAILED — fix required'}`);
console.log('══════════════════════════════════════════════════════════════════\n');

if (totalFail > 0) process.exit(1);
