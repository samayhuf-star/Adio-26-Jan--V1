/**
 * Google Ads Editor CSV Generator & Validator V4
 * Comprehensive implementation following Google Ads Editor specifications
 * 
 * Features:
 * - Strict validation (errors block export)
 * - Permissive validation (warnings allow export)
 * - Support for all entity types (campaigns, ad groups, keywords, ads, negatives, locations)
 * - Normalization of match types, headers, values
 * - Pre-flight checklist
 * - UTF-8 encoding
 * - Proper CSV quoting and escaping
 */

export interface CSVValidationResult {
    valid: boolean;
    errors: CSVValidationError[];
    warnings: CSVValidationWarning[];
    rowCounts: {
        campaigns: number;
        adGroups: number;
        keywords: number;
        ads: number;
        negatives: number;
        locations: number;
    };
}

export interface CSVValidationError {
    row: number;
    entity: string;
    field?: string;
    message: string;
    severity: 'error' | 'critical';
}

export interface CSVValidationWarning {
    row: number;
    entity: string;
    field?: string;
    message: string;
    suggestion?: string;
}

export interface CSVRow {
    [key: string]: string | number | null | undefined;
}

// Canonical header names (English, as required by Google Ads Editor)
export const CANONICAL_HEADERS = {
    // Campaign/Ad Group
    CAMPAIGN: 'Campaign',
    CAMPAIGN_TYPE: 'Campaign Type',
    CAMPAIGN_STATUS: 'Campaign Status',
    DAILY_BUDGET: 'Daily budget',
    AD_GROUP: 'Ad Group',
    AD_GROUP_STATUS: 'Ad Group Status',
    NETWORK_SETTINGS: 'Network Settings',
    START_DATE: 'Start date',
    END_DATE: 'End date',
    LANGUAGE: 'Language',
    
    // Keywords
    KEYWORD: 'Keyword',
    MATCH_TYPE: 'Match Type',
    MAX_CPC: 'Max CPC',
    FINAL_URL: 'Final URL',
    LABELS: 'Labels',
    
    // Ads
    AD_TYPE: 'Ad Type',
    HEADLINE_1: 'Headline 1',
    HEADLINE_2: 'Headline 2',
    HEADLINE_3: 'Headline 3',
    HEADLINE_4: 'Headline 4',
    HEADLINE_5: 'Headline 5',
    HEADLINE_6: 'Headline 6',
    HEADLINE_7: 'Headline 7',
    HEADLINE_8: 'Headline 8',
    HEADLINE_9: 'Headline 9',
    HEADLINE_10: 'Headline 10',
    HEADLINE_11: 'Headline 11',
    HEADLINE_12: 'Headline 12',
    HEADLINE_13: 'Headline 13',
    HEADLINE_14: 'Headline 14',
    HEADLINE_15: 'Headline 15',
    DESCRIPTION_1: 'Description 1',
    DESCRIPTION_2: 'Description 2',
    DESCRIPTION_3: 'Description 3',
    DESCRIPTION_4: 'Description 4',
    PATH_1: 'Path 1',
    PATH_2: 'Path 2',
    PIN_HEADLINE_POSITIONS: 'Pin Headline Positions',
    
    // Row Type & Status
    ROW_TYPE: 'Row Type',
    STATUS: 'Status',
    
    // Negative Keywords
    NEGATIVE_KEYWORD: 'Negative Keyword',
    NEGATIVE_KEYWORD_LIST: 'Negative Keyword List',
    
    // Location Targeting
    CRITERION_TYPE: 'Criterion Type',
    LOCATION_NAME: 'Location Name',
    LOCATION_ID: 'Location ID',
    
    // Assets
    ASSET_TYPE: 'Asset Type',
    LINK_TEXT: 'Link Text',
    DESCRIPTION_LINE_1: 'Description Line 1',
    DESCRIPTION_LINE_2: 'Description Line 2',
    IMAGE_FILE_PATH: 'Image File Path',
    IMAGE_URL: 'Image URL',
    
    // Call Extensions
    PHONE_NUMBER: 'Phone Number',
    COUNTRY_CODE: 'Country Code',
    
    // Callouts
    CALLOUT_TEXT: 'Callout Text',
    
    // Structured Snippets
    HEADER: 'Header',
    VALUES: 'Values',
    
    // Location Targeting
    LOCATION: 'Location',
    TARGET_TYPE: 'Target Type',
    BID_ADJUSTMENT: 'Bid Adjustment',
    IS_EXCLUSION: 'Is Exclusion',
} as const;

// Valid match types (canonical)
export const VALID_MATCH_TYPES = ['Exact', 'Phrase', 'Broad'] as const;
export type MatchType = typeof VALID_MATCH_TYPES[number];

// Valid row types
export const VALID_ROW_TYPES = [
    'campaign',
    'ad group',
    'keyword',
    'ad',
    'sitelink',
    'call',
    'callout',
    'structured snippet',
    'location',
    'location target',
    'location targeting',
    'negative keyword',
] as const;

// Field length limits (configurable)
export const FIELD_LIMITS = {
    HEADLINE_MAX: 30,
    DESCRIPTION_MAX: 90,
    PATH_MAX: 15,
    CALLOUT_MAX: 25,
    CAMPAIGN_NAME_MAX: 255,
    AD_GROUP_NAME_MAX: 255,
} as const;

/**
 * Normalize header names to canonical English headers
 */
export function normalizeHeader(header: string): string {
    const normalized = header.trim();
    const headerMap: { [key: string]: string } = {
        'campaign': CANONICAL_HEADERS.CAMPAIGN,
        'ad group': CANONICAL_HEADERS.AD_GROUP,
        'ad groups': CANONICAL_HEADERS.AD_GROUP, // Handle plural
        'keyword': CANONICAL_HEADERS.KEYWORD,
        'keywords': CANONICAL_HEADERS.KEYWORD,
        'match type': CANONICAL_HEADERS.MATCH_TYPE,
        'match types': CANONICAL_HEADERS.MATCH_TYPE,
        'final url': CANONICAL_HEADERS.FINAL_URL,
        'row type': CANONICAL_HEADERS.ROW_TYPE,
        'status': CANONICAL_HEADERS.STATUS,
    };
    
    const lower = normalized.toLowerCase();
    return headerMap[lower] || normalized;
}

/**
 * Normalize match type to canonical form
 */
export function normalizeMatchType(matchType: string | null | undefined): MatchType | null {
    if (!matchType) return null;
    
    const normalized = matchType.trim();
    const lower = normalized.toLowerCase();
    
    // Handle shorthand formats
    if (normalized.startsWith('[') && normalized.endsWith(']')) return 'Exact';
    if (normalized.startsWith('"') && normalized.endsWith('"')) return 'Phrase';
    
    // Handle canonical names
    if (lower === 'exact' || lower === 'exact match') return 'Exact';
    if (lower === 'phrase' || lower === 'phrase match') return 'Phrase';
    if (lower === 'broad' || lower === 'broad match') return 'Broad';
    
    return null; // Invalid
}

/**
 * Extract keyword text from formatted keyword (remove brackets/quotes)
 */
export function extractKeywordText(keyword: string): string {
    return keyword.replace(/^\[|\]$|^"|"$/g, '').trim();
}

/**
 * Validate URL format
 */
export function validateURL(url: string | null | undefined): { valid: boolean; fixed?: string } {
    if (!url || !url.trim()) {
        return { valid: false };
    }
    
    const trimmed = url.trim();
    
    // Check if already valid
    if (/^https?:\/\/.+/.test(trimmed)) {
        return { valid: true };
    }
    
    // Try to fix common issues
    if (trimmed.startsWith('www.')) {
        return { valid: true, fixed: `https://${trimmed}` };
    }
    
    // Add https:// if missing
    if (!trimmed.includes('://')) {
        return { valid: true, fixed: `https://${trimmed}` };
    }
    
    return { valid: false };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(date: string | null | undefined): boolean {
    if (!date) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Validate numeric value
 */
export function validateNumeric(value: string | number | null | undefined, min: number = 0): boolean {
    if (value === null || value === undefined) return false;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= min;
}

/**
 * Escape CSV value (proper quoting and escaping)
 */
export function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    
    const str = String(value).trim();
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
}

/**
 * Detect entity type from row
 */
export function detectEntityType(row: CSVRow): string {
    const rowType = String(row[CANONICAL_HEADERS.ROW_TYPE] || '').trim().toLowerCase();
    
    if (rowType) return rowType;
    
    // Infer from column presence
    if (row[CANONICAL_HEADERS.KEYWORD]) return 'keyword';
    if (row[CANONICAL_HEADERS.AD_TYPE] || row[CANONICAL_HEADERS.HEADLINE_1]) return 'ad';
    if (row[CANONICAL_HEADERS.NEGATIVE_KEYWORD]) return 'negative keyword';
    if (row[CANONICAL_HEADERS.LOCATION_NAME] || row[CANONICAL_HEADERS.LOCATION_ID]) return 'location';
    if (row[CANONICAL_HEADERS.CAMPAIGN] && !row[CANONICAL_HEADERS.AD_GROUP]) return 'campaign';
    if (row[CANONICAL_HEADERS.AD_GROUP]) return 'ad group';
    
    return 'unknown';
}

/**
 * Validate required fields for entity type
 */
export function validateRequiredFields(
    row: CSVRow,
    entityType: string,
    rowNumber: number
): CSVValidationError[] {
    const errors: CSVValidationError[] = [];
    const entity = entityType.toLowerCase();
    
    // Campaign
    if (entity === 'campaign') {
        if (!row[CANONICAL_HEADERS.CAMPAIGN]) {
            errors.push({
                row: rowNumber,
                entity: 'Campaign',
                field: CANONICAL_HEADERS.CAMPAIGN,
                message: 'Missing Campaign name — Campaign is required for Campaign rows.',
                severity: 'error',
            });
        }
    }
    
    // Ad Group
    if (entity === 'ad group') {
        if (!row[CANONICAL_HEADERS.CAMPAIGN]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad Group',
                field: CANONICAL_HEADERS.CAMPAIGN,
                message: 'Missing Campaign name — Campaign is required for Ad Group rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.AD_GROUP]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad Group',
                field: CANONICAL_HEADERS.AD_GROUP,
                message: 'Missing Ad Group name — Ad Group is required for Ad Group rows.',
                severity: 'error',
            });
        }
    }
    
    // Keyword
    if (entity === 'keyword') {
        if (!row[CANONICAL_HEADERS.CAMPAIGN]) {
            errors.push({
                row: rowNumber,
                entity: 'Keyword',
                field: CANONICAL_HEADERS.CAMPAIGN,
                message: 'Missing Campaign name — Campaign is required for Keyword rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.AD_GROUP]) {
            errors.push({
                row: rowNumber,
                entity: 'Keyword',
                field: CANONICAL_HEADERS.AD_GROUP,
                message: 'Missing Ad Group name — Ad Group is required for Keyword rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.KEYWORD]) {
            errors.push({
                row: rowNumber,
                entity: 'Keyword',
                field: CANONICAL_HEADERS.KEYWORD,
                message: 'Missing Keyword — Keyword is required for Keyword rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.MATCH_TYPE]) {
            errors.push({
                row: rowNumber,
                entity: 'Keyword',
                field: CANONICAL_HEADERS.MATCH_TYPE,
                message: 'Missing Match Type — Match Type is required for Keyword rows.',
                severity: 'error',
            });
        }
    }
    
    // Ad (RSA/DKI)
    if (entity === 'ad') {
        if (!row[CANONICAL_HEADERS.CAMPAIGN]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: CANONICAL_HEADERS.CAMPAIGN,
                message: 'Missing Campaign name — Campaign is required for Ad rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.AD_GROUP]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: CANONICAL_HEADERS.AD_GROUP,
                message: 'Missing Ad Group name — Ad Group is required for Ad rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.AD_TYPE]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: CANONICAL_HEADERS.AD_TYPE,
                message: 'Missing Ad Type — Ad Type is required for Ad rows.',
                severity: 'error',
            });
        }
        
        // RSA/DKI requires at least 3 headlines and 2 descriptions
        const headlineCount = [
            CANONICAL_HEADERS.HEADLINE_1,
            CANONICAL_HEADERS.HEADLINE_2,
            CANONICAL_HEADERS.HEADLINE_3,
        ].filter(h => row[h] && String(row[h]).trim()).length;
        
        if (headlineCount < 3) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: 'Headlines',
                message: `Insufficient headlines — RSA/DKI ads require at least 3 headlines. Found: ${headlineCount}.`,
                severity: 'error',
            });
        }
        
        const descriptionCount = [
            CANONICAL_HEADERS.DESCRIPTION_1,
            CANONICAL_HEADERS.DESCRIPTION_2,
        ].filter(d => row[d] && String(row[d]).trim()).length;
        
        if (descriptionCount < 2) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: 'Descriptions',
                message: `Insufficient descriptions — RSA/DKI ads require at least 2 descriptions. Found: ${descriptionCount}.`,
                severity: 'error',
            });
        }
        
        if (!row[CANONICAL_HEADERS.FINAL_URL]) {
            errors.push({
                row: rowNumber,
                entity: 'Ad',
                field: CANONICAL_HEADERS.FINAL_URL,
                message: 'Missing Final URL — cannot create RSA/DKI without Final URL.',
                severity: 'error',
            });
        }
    }
    
    // Negative Keyword
    if (entity === 'negative keyword') {
        if (!row[CANONICAL_HEADERS.NEGATIVE_KEYWORD]) {
            errors.push({
                row: rowNumber,
                entity: 'Negative Keyword',
                field: CANONICAL_HEADERS.NEGATIVE_KEYWORD,
                message: 'Missing Negative Keyword — Negative Keyword is required for Negative Keyword rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.MATCH_TYPE]) {
            errors.push({
                row: rowNumber,
                entity: 'Negative Keyword',
                field: CANONICAL_HEADERS.MATCH_TYPE,
                message: 'Missing Match Type — Match Type is required for Negative Keyword rows.',
                severity: 'error',
            });
        }
    }
    
    // Location
    if (entity === 'location' || entity === 'location target' || entity === 'location targeting') {
        if (!row[CANONICAL_HEADERS.CAMPAIGN]) {
            errors.push({
                row: rowNumber,
                entity: 'Location',
                field: CANONICAL_HEADERS.CAMPAIGN,
                message: 'Missing Campaign name — Campaign is required for Location rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.CRITERION_TYPE]) {
            errors.push({
                row: rowNumber,
                entity: 'Location',
                field: CANONICAL_HEADERS.CRITERION_TYPE,
                message: 'Missing Criterion Type — Criterion Type is required for Location rows.',
                severity: 'error',
            });
        }
        if (!row[CANONICAL_HEADERS.LOCATION_NAME] && !row[CANONICAL_HEADERS.LOCATION_ID]) {
            errors.push({
                row: rowNumber,
                entity: 'Location',
                field: CANONICAL_HEADERS.LOCATION_NAME,
                message: 'Missing Location Name or Location ID — at least one is required for Location rows.',
                severity: 'error',
            });
        }
    }
    
    return errors;
}

/**
 * Validate value types and formats
 */
export function validateValueTypes(
    row: CSVRow,
    entityType: string,
    rowNumber: number
): { errors: CSVValidationError[]; warnings: CSVValidationWarning[] } {
    const errors: CSVValidationError[] = [];
    const warnings: CSVValidationWarning[] = [];
    
    // Validate Match Type
    if (row[CANONICAL_HEADERS.MATCH_TYPE]) {
        const matchType = normalizeMatchType(String(row[CANONICAL_HEADERS.MATCH_TYPE]));
        if (!matchType) {
            errors.push({
                row: rowNumber,
                entity: entityType,
                field: CANONICAL_HEADERS.MATCH_TYPE,
                message: `Invalid Match Type '${row[CANONICAL_HEADERS.MATCH_TYPE]}' — accepted: Exact/Phrase/Broad.`,
                severity: 'error',
            });
        }
    }
    
    // Validate Final URL
    if (row[CANONICAL_HEADERS.FINAL_URL]) {
        const urlValidation = validateURL(String(row[CANONICAL_HEADERS.FINAL_URL]));
        if (!urlValidation.valid) {
            errors.push({
                row: rowNumber,
                entity: entityType,
                field: CANONICAL_HEADERS.FINAL_URL,
                message: `Invalid Final URL format — must be a valid URL starting with http:// or https://`,
                severity: 'error',
            });
        }
    }
    
    // Validate headline lengths
    for (let i = 1; i <= 15; i++) {
        const headlineKey = `Headline ${i}` as keyof typeof CANONICAL_HEADERS;
        if (row[headlineKey]) {
            const headline = String(row[headlineKey]);
            if (headline.length > FIELD_LIMITS.HEADLINE_MAX) {
                warnings.push({
                    row: rowNumber,
                    entity: entityType,
                    field: headlineKey,
                    message: `Headline ${i} exceeds ${FIELD_LIMITS.HEADLINE_MAX} characters — might be truncated on import.`,
                    suggestion: `Current: ${headline.length} chars. Reduce to ${FIELD_LIMITS.HEADLINE_MAX} or less.`,
                });
            }
        }
    }
    
    // Validate description lengths
    for (let i = 1; i <= 4; i++) {
        const descKey = `Description ${i}` as keyof typeof CANONICAL_HEADERS;
        if (row[descKey]) {
            const description = String(row[descKey]);
            if (description.length > FIELD_LIMITS.DESCRIPTION_MAX) {
                warnings.push({
                    row: rowNumber,
                    entity: entityType,
                    field: descKey,
                    message: `Description ${i} exceeds ${FIELD_LIMITS.DESCRIPTION_MAX} characters — might be truncated on import.`,
                    suggestion: `Current: ${description.length} chars. Reduce to ${FIELD_LIMITS.DESCRIPTION_MAX} or less.`,
                });
            }
        }
    }
    
    // Validate path lengths
    for (let i = 1; i <= 2; i++) {
        const pathKey = `Path ${i}` as keyof typeof CANONICAL_HEADERS;
        if (row[pathKey]) {
            const path = String(row[pathKey]);
            if (path.length > FIELD_LIMITS.PATH_MAX) {
                warnings.push({
                    row: rowNumber,
                    entity: entityType,
                    field: pathKey,
                    message: `Path ${i} exceeds ${FIELD_LIMITS.PATH_MAX} characters — might be truncated on import.`,
                    suggestion: `Current: ${path.length} chars. Reduce to ${FIELD_LIMITS.PATH_MAX} or less.`,
                });
            }
            // Check for spaces (paths should be path-safe)
            if (path.includes(' ')) {
                warnings.push({
                    row: rowNumber,
                    entity: entityType,
                    field: pathKey,
                    message: `Path ${i} contains spaces — should be path-safe (no spaces).`,
                    suggestion: 'Replace spaces with hyphens or underscores.',
                });
            }
        }
    }
    
    // Validate Max CPC
    if (row[CANONICAL_HEADERS.MAX_CPC]) {
        if (!validateNumeric(row[CANONICAL_HEADERS.MAX_CPC], 0.01)) {
            warnings.push({
                row: rowNumber,
                entity: entityType,
                field: CANONICAL_HEADERS.MAX_CPC,
                message: 'Max CPC is not a valid number or is below minimum.',
                suggestion: 'Enter a numeric value >= 0.01.',
            });
        }
    }
    
    // Validate dates
    if (row[CANONICAL_HEADERS.START_DATE] && !validateDate(String(row[CANONICAL_HEADERS.START_DATE]))) {
        errors.push({
            row: rowNumber,
            entity: entityType,
            field: CANONICAL_HEADERS.START_DATE,
            message: `Invalid Start date format — expected YYYY-MM-DD.`,
            severity: 'error',
        });
    }
    
    if (row[CANONICAL_HEADERS.END_DATE] && !validateDate(String(row[CANONICAL_HEADERS.END_DATE]))) {
        errors.push({
            row: rowNumber,
            entity: entityType,
            field: CANONICAL_HEADERS.END_DATE,
            message: `Invalid End date format — expected YYYY-MM-DD.`,
            severity: 'error',
        });
    }
    
    return { errors, warnings };
}

/**
 * Check for duplicate rows
 */
export function checkDuplicates(rows: CSVRow[]): CSVValidationWarning[] {
    const warnings: CSVValidationWarning[] = [];
    const seen = new Map<string, number[]>();
    
    rows.forEach((row, idx) => {
        const entityType = detectEntityType(row);
        const rowNumber = idx + 2; // +2 because row 1 is header
        
        // Check for duplicate keywords
        if (entityType === 'keyword') {
            const key = `${row[CANONICAL_HEADERS.CAMPAIGN]}|${row[CANONICAL_HEADERS.AD_GROUP]}|${row[CANONICAL_HEADERS.KEYWORD]}|${row[CANONICAL_HEADERS.MATCH_TYPE]}`;
            if (seen.has(key)) {
                const existing = seen.get(key)!;
                warnings.push({
                    row: rowNumber,
                    entity: 'Keyword',
                    message: `Duplicate keyword row — same Campaign+Ad Group+Keyword+Match Type combination found at row ${existing[0]}.`,
                    suggestion: 'Remove duplicate or verify if intentional.',
                });
            } else {
                seen.set(key, [rowNumber]);
            }
        }
    });
    
    return warnings;
}

/**
 * Comprehensive CSV validation
 */
export function validateCSVRows(
    rows: CSVRow[],
    headers: string[]
): CSVValidationResult {
    const errors: CSVValidationError[] = [];
    const warnings: CSVValidationWarning[] = [];
    
    // Normalize headers
    const normalizedHeaders = headers.map(normalizeHeader);
    
    // Normalize rows
    const normalizedRows: CSVRow[] = rows.map(row => {
        const normalized: CSVRow = {};
        Object.keys(row).forEach(key => {
            const normalizedKey = normalizeHeader(key);
            normalized[normalizedKey] = row[key];
        });
        return normalized;
    });
    
    // Count entities
    const rowCounts = {
        campaigns: 0,
        adGroups: 0,
        keywords: 0,
        ads: 0,
        negatives: 0,
        locations: 0,
    };
    
    // Validate each row
    normalizedRows.forEach((row, idx) => {
        const rowNumber = idx + 2; // +2 because row 1 is header
        const entityType = detectEntityType(row);
        
        // Count entities
        if (entityType === 'campaign') rowCounts.campaigns++;
        else if (entityType === 'ad group') rowCounts.adGroups++;
        else if (entityType === 'keyword') rowCounts.keywords++;
        else if (entityType === 'ad') rowCounts.ads++;
        else if (entityType === 'negative keyword') rowCounts.negatives++;
        else if (entityType === 'location' || entityType === 'location target') rowCounts.locations++;
        
        // Validate required fields
        const requiredErrors = validateRequiredFields(row, entityType, rowNumber);
        errors.push(...requiredErrors);
        
        // Validate value types
        const typeValidation = validateValueTypes(row, entityType, rowNumber);
        errors.push(...typeValidation.errors);
        warnings.push(...typeValidation.warnings);
    });
    
    // Check for duplicates
    const duplicateWarnings = checkDuplicates(normalizedRows);
    warnings.push(...duplicateWarnings);
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        rowCounts,
    };
}

/**
 * Generate CSV content from rows
 */
export function generateCSVContent(
    headers: string[],
    rows: CSVRow[],
    encoding: 'utf-8' = 'utf-8'
): string {
    // Normalize headers
    const normalizedHeaders = headers.map(normalizeHeader);
    
    // Normalize and escape rows
    const normalizedRows = rows.map(row => {
        return normalizedHeaders.map(header => {
            const value = row[header] ?? '';
            return escapeCSV(value);
        });
    });
    
    // Build CSV content
    const csvLines = [
        normalizedHeaders.map(escapeCSV).join(','),
        ...normalizedRows.map(row => row.join(','))
    ];
    
    return csvLines.join('\n');
}

/**
 * Create CSV blob with UTF-8 encoding (no BOM)
 */
export function createCSVBlob(content: string): Blob {
    // UTF-8 without BOM (as required by Google Ads Editor)
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
}

