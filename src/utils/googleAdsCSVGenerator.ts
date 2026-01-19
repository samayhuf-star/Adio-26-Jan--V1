/**
 * Google Ads Editor CSV Generator
 * Production-ready CSV generation with full validation and Google Ads Editor compatibility
 */

// Types
type RowObject = Record<string, any>;
type ValidationResult = { fatal: boolean; errors: string[]; warnings: string[]; rowIndex?: number };

// Config & helpers
const REQUIRED_HEADERS = [
  'Row Type', 'Campaign', 'Ad Group', 'Ad Type', 'Keyword', 'Match Type', 'Final URL',
  'Asset Type', 'Asset Name', 'Asset URL', 'Location Type', 'Location Value', 'Operation'
];

const VALID_ROW_TYPES = new Set([
  'CAMPAIGN', 'ADGROUP', 'AD', 'KEYWORD', 'NEGATIVE_KEYWORD', 'ASSET', 'LOCATION',
  'CAMPAIGN_ASSET', 'AD_ASSET', 'AD_EXTENSION', 'SHARED_BUDGET'
]);

// Simple ISO country whitelist (expand as needed)
const ISO2_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'IN', 'DE', 'FR', 'ES', 'IT', 'NL', 'BR', 'MX', 'JP', 'CN']);

// Validate date YYYY-MM-DD
function isDateYMD(s?: string): boolean {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isNumberLike(s?: any): boolean {
  if (s === undefined || s === null || s === '') return false;
  return !isNaN(Number(String(s).replace(/,/g, '')));
}

function isURL(s?: string): boolean {
  if (!s) return false;
  try {
    const u = new URL(s);
    return ['http:', 'https:'].includes(u.protocol);
  } catch (e) {
    return false;
  }
}

// ZIP fix for postal codes
function fixZip(zip: any): string {
  if (zip === undefined || zip === null) return '';
  const z = String(zip).trim();
  if (!z) return '';
  // Leading zero -> must add apostrophe
  if (/^0\d{4}$/.test(z)) return `'${z}`;
  // purely numeric -> wrap in quotes so CSV preserves it
  if (/^\d+$/.test(z)) return `"${z}"`;
  return `"${z}"`;
}

// Build a flat list of ordered rows for Editor following spec
export function flattenCampaignsToRows(campaigns: any[]): RowObject[] {
  const rows: RowObject[] = [];

  for (const c of campaigns) {
    // Campaign row
    rows.push({
      'Row Type': 'CAMPAIGN',
      'Campaign': c.name || c.campaign || '',
      'Campaign Status': c.status === 'ENABLED' || c.status === 'Enabled' || !c.status ? 'Enabled' : c.status,
      'Campaign Type': c.type === 'SEARCH' || c.type === 'Search' || !c.type ? 'Search' : c.type,
      'Budget': c.budget ?? '',
      'Start Date': c.startDate ?? '',
      'End Date': c.endDate ?? '',
      'Operation': c.operation || 'NEW'
    });

    // shared budget (optional)
    if (c.sharedBudgetName) {
      rows.push({
        'Row Type': 'SHARED_BUDGET',
        'Shared Budget Name': c.sharedBudgetName,
        'Budget': c.budget ?? '',
        'Operation': 'NEW'
      });
    }

    // ad groups
    const adGroups = Array.isArray(c.adGroups) ? c.adGroups : [];
    for (const ag of adGroups) {
      rows.push({
        'Row Type': 'ADGROUP',
        'Campaign': c.name || c.campaign || '',
        'Ad Group': ag.name || ag.adGroup || '',
        'Ad Group Status': ag.status === 'ENABLED' || ag.status === 'Enabled' || !ag.status ? 'Enabled' : ag.status,
        'Default Max CPC': ag.defaultBid ?? '',
        'Operation': ag.operation || 'NEW'
      });

      // Ads
      const ads = Array.isArray(ag.ads) ? ag.ads : [];
      for (const ad of ads) {
        const base: RowObject = {
          'Row Type': 'AD',
          'Campaign': c.name || c.campaign || '',
          'Ad Group': ag.name || ag.adGroup || '',
          'Ad Type': ad.type === 'RESPONSIVE_SEARCH_AD' || ad.type === 'rsa' || !ad.type ? 'Responsive search ad' : ad.type,
          'Final URL': Array.isArray(ad.finalUrls) ? (ad.finalUrls[0] || '') : (ad.finalUrl || ''),
          'Operation': ad.operation || 'NEW'
        };

        // add headlines/descriptions if present
        if (Array.isArray(ad.headlines)) {
          ad.headlines.forEach((h: string, idx: number) => {
            base[`Headline ${idx + 1}`] = h;
          });
        }
        if (Array.isArray(ad.descriptions)) {
          ad.descriptions.forEach((d: string, idx: number) => {
            base[`Description ${idx + 1}`] = d;
          });
        }

        if (ad.id) base['Ad ID'] = ad.id;
        rows.push(base);

        // Ad Asset links (if provided)
        if (Array.isArray(ad.assets)) {
          for (const a of ad.assets) {
            rows.push({
              'Row Type': 'AD_ASSET',
              'Campaign': c.name || c.campaign || '',
              'Ad Group': ag.name || ag.adGroup || '',
              'Ad ID': ad.id || '',
              'Asset Type': a.type || '',
              'Asset Name': a.name || '',
              'Asset URL': a.url || '',
              'Operation': 'NEW'
            });
          }
        }
      }

      // Keywords for ad group
      const kws = Array.isArray(ag.keywords) ? ag.keywords : [];
      for (const kw of kws) {
        const keywordText = kw.phrase || kw.keyword || kw.text || kw;
        const matchType = (kw.matchType || 'PHRASE').toUpperCase();
        
        rows.push({
          'Row Type': 'KEYWORD',
          'Campaign': c.name || c.campaign || '',
          'Ad Group': ag.name || ag.adGroup || '',
          'Keyword': keywordText,
          'Match Type': matchType,
          'CPC Bid': kw.maxCpc ?? '',
          'Operation': kw.operation || 'NEW'
        });
      }

      // Negative keywords per adgroup
      const ng = Array.isArray(ag.negatives) ? ag.negatives : [];
      for (const n of ng) {
        rows.push({
          'Row Type': 'NEGATIVE_KEYWORD',
          'Campaign': c.name || c.campaign || '',
          'Ad Group': ag.name || ag.adGroup || '',
          'Keyword': n.text || n.keyword || '',
          'Match Type': (n.matchType || 'PHRASE').toUpperCase(),
          'Operation': n.operation || 'NEW'
        });
      }
    }

    // campaign-level negatives
    if (Array.isArray(c.negatives)) {
      for (const n of c.negatives) {
        rows.push({
          'Row Type': 'NEGATIVE_KEYWORD',
          'Campaign': c.name || c.campaign || '',
          'Ad Group': '',
          'Keyword': n.text || n.keyword || '',
          'Match Type': (n.matchType || 'PHRASE').toUpperCase(),
          'Operation': n.operation || 'NEW'
        });
      }
    }

    // locations
    if (Array.isArray(c.locations)) {
      for (const loc of c.locations) {
        let val = loc.value ?? '';
        if ((loc.type || '').toUpperCase() === 'ZIP') val = fixZip(val);
        rows.push({
          'Row Type': 'LOCATION',
          'Campaign': c.name || c.campaign || '',
          'Location Type': (loc.type || '').toUpperCase(),
          'Location Value': val,
          'Operation': 'NEW'
        });
      }
    }

    // assets at campaign level
    if (Array.isArray(c.assets)) {
      for (const a of c.assets) {
        rows.push({
          'Row Type': 'ASSET',
          'Asset Type': (a.type || '').toUpperCase(),
          'Asset Name': a.name || '',
          'Asset URL': a.url || '',
          'Operation': 'NEW'
        });

        // Campaign Asset link
        rows.push({
          'Row Type': 'CAMPAIGN_ASSET',
          'Campaign': c.name || c.campaign || '',
          'Asset Name': a.name || '',
          'Asset Type': (a.type || '').toUpperCase(),
          'Operation': 'NEW'
        });
      }
    }
  }

  return rows;
}

// Flatten if payload already contains rows
function flattenRowsInput(maybeRows: any[]): RowObject[] {
  return maybeRows.map(r => {
    const copy = { ...r };
    if ((copy['Location Type'] || '').toUpperCase() === 'ZIP') {
      copy['Location Value'] = fixZip(copy['Location Value']);
    }
    return copy;
  });
}

// Validation functions
function validateRowObject(r: RowObject, idx: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rowType = (r['Row Type'] || '').toString().toUpperCase().trim();

  if (!rowType) {
    errors.push('Missing Row Type');
    return { fatal: true, errors, warnings, rowIndex: idx };
  }

  if (!VALID_ROW_TYPES.has(rowType)) {
    warnings.push(`Unknown Row Type "${rowType}"`);
  }

  // Per-row-type checks
  if (rowType === 'CAMPAIGN') {
    if (!r['Campaign'] || String(r['Campaign']).trim() === '') errors.push('Campaign name required');
    if (r['Budget'] && !isNumberLike(r['Budget'])) warnings.push('Campaign budget is not numeric');
    if (r['Start Date'] && !isDateYMD(r['Start Date'])) warnings.push('Campaign Start Date not YYYY-MM-DD');
    if (r['End Date'] && !isDateYMD(r['End Date'])) warnings.push('Campaign End Date not YYYY-MM-DD');
  }

  if (rowType === 'ADGROUP') {
    if (!r['Ad Group'] || String(r['Ad Group']).trim() === '') errors.push('AdGroup name required');
    if (r['Campaign'] && String(r['Campaign']).trim() === '') errors.push('AdGroup must reference a Campaign name');
  }

  if (rowType === 'AD') {
    const type = (r['Ad Type'] || '').toString().toUpperCase();
    if (!r['Final URL'] || String(r['Final URL']).trim() === '') errors.push('Ad must have a Final URL');
    if (type === 'RESPONSIVE_SEARCH_AD' || type === 'RESPONSIVE SEARCH AD' || type.includes('RESPONSIVE') && type.includes('SEARCH')) {
      const hCount = Object.keys(r).filter(k => /^Headline\s+\d+/i.test(k)).length;
      const dCount = Object.keys(r).filter(k => /^Description\s+\d+/i.test(k)).length;
      if (hCount < 3) warnings.push('RSA should have at least 3 headlines (warning)');
      if (dCount < 2) warnings.push('RSA should have at least 2 descriptions (warning)');
    }
    if (r['Final URL'] && !isURL(r['Final URL'])) warnings.push('Final URL may not be valid (must be http(s) URL)');
  }

  if (rowType === 'KEYWORD') {
    if (!r['Keyword'] || String(r['Keyword']).trim() === '') errors.push('Keyword text required');
    const mt = (r['Match Type'] || '').toString().toUpperCase();
    if (!['BROAD', 'PHRASE', 'EXACT'].includes(mt)) warnings.push('Keyword Match Type should be BROAD/PHRASE/EXACT');
  }

  if (rowType === 'NEGATIVE_KEYWORD') {
    const mt = (r['Match Type'] || '').toString().toUpperCase();
    if (!['PHRASE', 'EXACT'].includes(mt)) errors.push('Negative keywords must be PHRASE or EXACT (not broad)');
    if (!r['Keyword'] || String(r['Keyword']).trim() === '') errors.push('Negative keyword text required');
  }

  if (rowType === 'ASSET') {
    if (!r['Asset Type'] || !r['Asset Name']) errors.push('Asset Type and Asset Name are required');
    if ((r['Asset Type'] || '').toString().toUpperCase() === 'IMAGE') {
      if (!r['Asset URL'] || (String(r['Asset URL']).trim() === '')) errors.push('Asset URL required for image assets');
    }
  }

  if (rowType === 'LOCATION') {
    const lt = (r['Location Type'] || '').toString().toUpperCase();
    const lv = r['Location Value'];
    if (!lt) errors.push('Location Type required');
    if (!lv && lv !== 0) errors.push('Location Value required');
    if (lt === 'COUNTRY' && !ISO2_COUNTRIES.has(String(lv).toUpperCase())) warnings.push('Country code not in known ISO2 list');
    if (lt === 'ZIP') {
      const raw = String(lv || '').replace(/['"]/g, '');
      if (!/^[A-Za-z0-9 -]+$/.test(raw)) warnings.push('ZIP contains unusual characters');
    }
  }

  const fatal = errors.length > 0;
  return { fatal, errors, warnings, rowIndex: idx };
}

// Validate entire dataset
export function validateRows(rows: RowObject[]): { fatalErrors: Array<{ rowIndex: number; errors: string[] }>; warnings: Array<{ rowIndex?: number; msg: string }> } {
  const fatalErrors: Array<{ rowIndex: number; errors: string[] }> = [];
  const warnings: Array<{ rowIndex?: number; msg: string }> = [];

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return { fatalErrors: [{ rowIndex: -1, errors: ['No rows provided'] }], warnings: [] };
  }

  // Track campaigns/adgroups existence for cross-checks
  const campaigns = new Set<string>();
  const adgroups = new Set<string>();

  rows.forEach((r) => {
    const rt = (r['Row Type'] || '').toString().toUpperCase();
    if (rt === 'CAMPAIGN') {
      const name = (r['Campaign'] || '').toString();
      if (name) campaigns.add(name);
    }
    if (rt === 'ADGROUP') {
      const campaignName = (r['Campaign'] || '').toString();
      const agName = (r['Ad Group'] || '').toString();
      if (campaignName && agName) adgroups.add(`${campaignName}||${agName}`);
    }
  });

  // Validate each row
  rows.forEach((r, idx) => {
    const res = validateRowObject(r, idx);
    if (res.fatal) {
      fatalErrors.push({ rowIndex: idx, errors: res.errors });
    }
    res.warnings.forEach(w => warnings.push({ rowIndex: idx, msg: w }));
  });

  // Cross validations
  rows.forEach((r, idx) => {
    const rt = (r['Row Type'] || '').toString().toUpperCase();
    if (rt === 'ADGROUP') {
      const campaignName = (r['Campaign'] || '').toString();
      if (campaignName && !campaigns.has(campaignName)) {
        fatalErrors.push({ rowIndex: idx, errors: [`AdGroup references missing Campaign "${campaignName}"`] });
      }
    }
    if (rt === 'KEYWORD' || rt === 'AD' || rt === 'NEGATIVE_KEYWORD') {
      const campaignName = (r['Campaign'] || '').toString();
      const adg = (r['Ad Group'] || '').toString();
      if (!campaignName) {
        fatalErrors.push({ rowIndex: idx, errors: ['Row must include Campaign name'] });
      } else {
        if (adg) {
          if (!adgroups.has(`${campaignName}||${adg}`)) {
            warnings.push({ rowIndex: idx, msg: `AdGroup "${adg}" not found earlier in file for Campaign "${campaignName}". Ensure AdGroup row exists.` });
          }
        }
      }
    }
  });

  return { fatalErrors, warnings };
}

// Ordering function (Editor-required)
function orderRowsForEditor(rows: RowObject[]): RowObject[] {
  const order = [
    'CAMPAIGN', 'SHARED_BUDGET', 'ADGROUP', 'AD', 'KEYWORD', 'NEGATIVE_KEYWORD',
    'LOCATION', 'ASSET', 'CAMPAIGN_ASSET', 'AD_ASSET', 'AD_EXTENSION', 'LABEL'
  ];

  const buckets: RowObject[] = [];
  for (const t of order) {
    for (const r of rows) {
      if ((r['Row Type'] || '').toString().toUpperCase() === t) buckets.push(r);
    }
  }

  // append any other rows that didn't match expected type
  const others = rows.filter(r => !order.includes((r['Row Type'] || '').toString().toUpperCase()));
  return [...buckets, ...others];
}

// Build header set: union of known headers and keys from rows
function buildHeaders(rows: RowObject[]): string[] {
  const set = new Set<string>();
  for (const h of REQUIRED_HEADERS) set.add(h);
  for (const r of rows) {
    Object.keys(r || {}).forEach(k => set.add(k));
  }
  return Array.from(set);
}

// Convert rows to CSV string
export function convertRowsToCsv(rows: RowObject[]): string {
  const ordered = orderRowsForEditor(rows);
  const headers = buildHeaders(ordered);
  const rest = headers.filter(h => !REQUIRED_HEADERS.includes(h)).sort();
  const finalHeaders = [...REQUIRED_HEADERS.filter(h => headers.includes(h)), ...rest];

  // Simple CSV generation (can be replaced with csv-stringify if needed)
  const escapeCSV = (value: any): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];
  lines.push(finalHeaders.map(escapeCSV).join(','));

  for (const row of ordered) {
    const values = finalHeaders.map(h => escapeCSV(row[h]));
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

// Main export function
export function generateGoogleAdsCSV(campaigns: any[]): { csv: string; validation: { fatalErrors: any[]; warnings: any[] } } {
  const rows = flattenCampaignsToRows(campaigns);
  const validation = validateRows(rows);
  
  if (validation.fatalErrors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.fatalErrors)}`);
  }

  const csv = convertRowsToCsv(rows);
  return { csv, validation };
}

