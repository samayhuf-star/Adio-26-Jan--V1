#!/usr/bin/env python3
"""
Google Ads Editor CSV Export Fix
Addresses all 6 CSV generation issues:
1. Schema mapping to exact Google Ads Editor headers
2. Field length validation + safe truncation
3. Proper CSV library with correct quoting/escaping
4. UTF-8 BOM + CRLF line endings
5. Single validation layer (Pydantic + CSV post-check)
6. Robust field counting (no regex)
"""

import csv
import io
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime

# ============================================================================
# GOOGLE ADS EDITOR HEADERS (Exact order required)
# ============================================================================

GOOGLE_ADS_EDITOR_HEADERS = [
    'Row Type',
    'Campaign',
    'Campaign ID',
    'Campaign Status',
    'Campaign Type',
    'Campaign Budget',
    'Budget Type',
    'Bidding Strategy Type',
    'Start Date',
    'End Date',
    'Location Type',
    'Location Code',
    'AdGroup',
    'AdGroup Status',
    'Default Max CPC',
    'Keyword',
    'Match Type',
    'Keyword Status',
    'Keyword Max CPC',
    'Keyword Final URL',
    'Ad Type',
    'Ad Status',
    'Headline 1',
    'Headline 2',
    'Headline 3',
    'Headline 4',
    'Headline 5',
    'Headline 6',
    'Headline 7',
    'Headline 8',
    'Headline 9',
    'Headline 10',
    'Headline 11',
    'Headline 12',
    'Headline 13',
    'Headline 14',
    'Headline 15',
    'Description 1',
    'Description 2',
    'Description 3',
    'Description 4',
    'Final URL',
    'Final Mobile URL',
    'Path1',
    'Path2',
    'Tracking Template',
    'Custom Parameters',
    'Asset Type',
    'Asset Name',
    'Asset URL',
    'Negative Keyword',
    'Operation',
]

# ============================================================================
# VALIDATION MODELS (Pydantic)
# ============================================================================

class CampaignExportRequest(BaseModel):
    """Request model for CSV export"""
    campaign_name: str = Field(..., min_length=1, max_length=255)
    ad_groups: List[Dict[str, Any]] = Field(..., min_items=1)
    location_targeting: Optional[Dict[str, Any]] = None
    budget: Optional[float] = None
    bidding_strategy: Optional[str] = "MANUAL_CPC"
    
    @validator('campaign_name')
    def validate_campaign_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Campaign name cannot be empty')
        return v.strip()


class ValidationError(BaseModel):
    """Validation error model"""
    row_index: Optional[int] = None
    field: str
    message: str
    severity: str = "error"  # "error" or "warning"


class CSVExportResponse(BaseModel):
    """Response model for CSV export"""
    success: bool
    csv_content: Optional[str] = None
    filename: Optional[str] = None
    validation_errors: List[ValidationError] = []
    warnings: List[ValidationError] = []
    row_count: int = 0
    message: Optional[str] = None


# ============================================================================
# FIELD LENGTH VALIDATION & TRUNCATION
# ============================================================================

def truncate_headline(text: str, max_length: int = 30) -> str:
    """Truncate headline to max 30 characters, preserving words when possible"""
    if not text:
        return ''
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    # Try to cut at word boundary
    truncated = text[:max_length - 3]
    last_space = truncated.rfind(' ')
    if last_space > max_length * 0.7:  # Only use word boundary if reasonable
        return truncated[:last_space] + '...'
    return truncated + '...'


def truncate_description(text: str, max_length: int = 90) -> str:
    """Truncate description to max 90 characters, preserving words when possible"""
    if not text:
        return ''
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    # Try to cut at word boundary
    truncated = text[:max_length - 3]
    last_space = truncated.rfind(' ')
    if last_space > max_length * 0.7:
        return truncated[:last_space] + '...'
    return truncated + '...'


def truncate_path(text: str, max_length: int = 15) -> str:
    """Truncate path to max 15 characters"""
    if not text:
        return ''
    text = str(text).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length]


# ============================================================================
# KEYWORD MATCH TYPE PARSING
# ============================================================================

def parse_match_type(keyword: str) -> tuple:
    """
    Parse keyword to extract match type and clean text
    Returns: (match_type, clean_keyword)
    """
    if not keyword:
        return 'BROAD', ''
    
    keyword = str(keyword).strip()
    
    # Exact match: [keyword]
    if keyword.startswith('[') and keyword.endswith(']'):
        return 'EXACT', keyword[1:-1].strip()
    
    # Phrase match: "keyword"
    if keyword.startswith('"') and keyword.endswith('"'):
        return 'PHRASE', keyword[1:-1].strip()
    
    # Negative exact: -[keyword]
    if keyword.startswith('-[') and keyword.endswith(']'):
        return 'NEGATIVE_EXACT', keyword[2:-1].strip()
    
    # Negative phrase: -"keyword"
    if keyword.startswith('-"') and keyword.endswith('"'):
        return 'NEGATIVE_PHRASE', keyword[2:-1].strip()
    
    # Negative broad: -keyword
    if keyword.startswith('-'):
        return 'NEGATIVE_BROAD', keyword[1:].strip()
    
    # Default: broad match
    return 'BROAD', keyword


# ============================================================================
# CSV ROW GENERATION
# ============================================================================

def create_campaign_row(campaign_name: str, budget: Optional[float] = None, 
                       bidding_strategy: str = "MANUAL_CPC") -> Dict[str, str]:
    """Create a CAMPAIGN row"""
    return {
        'Row Type': 'CAMPAIGN',
        'Campaign': campaign_name,
        'Campaign ID': '',
        'Campaign Status': 'ENABLED',
        'Campaign Type': 'SEARCH',
        'Campaign Budget': str(budget) if budget else '',
        'Budget Type': 'DAILY',
        'Bidding Strategy Type': bidding_strategy,
        'Start Date': '',
        'End Date': '',
        'Location Type': '',
        'Location Code': '',
        'AdGroup': '',
        'AdGroup Status': '',
        'Default Max CPC': '',
        'Keyword': '',
        'Match Type': '',
        'Keyword Status': '',
        'Keyword Max CPC': '',
        'Keyword Final URL': '',
        'Ad Type': '',
        'Ad Status': '',
        'Headline 1': '',
        'Headline 2': '',
        'Headline 3': '',
        'Headline 4': '',
        'Headline 5': '',
        'Headline 6': '',
        'Headline 7': '',
        'Headline 8': '',
        'Headline 9': '',
        'Headline 10': '',
        'Headline 11': '',
        'Headline 12': '',
        'Headline 13': '',
        'Headline 14': '',
        'Headline 15': '',
        'Description 1': '',
        'Description 2': '',
        'Description 3': '',
        'Description 4': '',
        'Final URL': '',
        'Final Mobile URL': '',
        'Path1': '',
        'Path2': '',
        'Tracking Template': '',
        'Custom Parameters': '',
        'Asset Type': '',
        'Asset Name': '',
        'Asset URL': '',
        'Negative Keyword': '',
        'Operation': 'NEW',
    }


def create_adgroup_row(campaign_name: str, adgroup_name: str, 
                      default_max_cpc: Optional[float] = None) -> Dict[str, str]:
    """Create an ADGROUP row"""
    row = create_campaign_row(campaign_name)
    row.update({
        'Row Type': 'ADGROUP',
        'AdGroup': adgroup_name,
        'AdGroup Status': 'ENABLED',
        'Default Max CPC': str(default_max_cpc) if default_max_cpc else '',
    })
    return row


def create_keyword_row(campaign_name: str, adgroup_name: str, keyword: str,
                      match_type: Optional[str] = None,
                      max_cpc: Optional[float] = None,
                      final_url: Optional[str] = None) -> Dict[str, str]:
    """Create a KEYWORD row"""
    if match_type is None:
        match_type, keyword = parse_match_type(keyword)
    else:
        keyword = parse_match_type(keyword)[1]  # Clean keyword
    
    row = create_campaign_row(campaign_name)
    row.update({
        'Row Type': 'KEYWORD',
        'AdGroup': adgroup_name,
        'Keyword': keyword,
        'Match Type': match_type,
        'Keyword Status': 'ENABLED',
        'Keyword Max CPC': str(max_cpc) if max_cpc else '',
        'Keyword Final URL': final_url or '',
    })
    return row


def create_ad_row(campaign_name: str, adgroup_name: str, ad: Dict[str, Any],
                 validation_errors: List[ValidationError]) -> Dict[str, str]:
    """Create an AD row with field length validation"""
    row = create_campaign_row(campaign_name)
    
    # Determine ad type
    ad_type = ad.get('type', 'rsa').upper()
    if ad_type == 'RSA' or ad_type == 'DKI':
        ad_type_str = 'RESPONSIVE_SEARCH_AD'
    elif ad_type == 'CALLONLY' or ad_type == 'CALL_ONLY':
        ad_type_str = 'CALL_ONLY_AD'
    else:
        ad_type_str = 'RESPONSIVE_SEARCH_AD'
    
    # Validate and truncate headlines
    headlines = []
    for i in range(1, 16):
        headline_key = f'headline{i}'
        headline = ad.get(headline_key, '').strip()
        if headline:
            original_len = len(headline)
            headline = truncate_headline(headline, 30)
            if len(headline) != original_len:
                validation_errors.append(ValidationError(
                    field=f'Headline {i}',
                    message=f'Headline {i} truncated from {original_len} to 30 characters',
                    severity='warning'
                ))
            headlines.append(headline)
        else:
            headlines.append('')
    
    # Validate and truncate descriptions
    descriptions = []
    for i in range(1, 5):
        desc_key = f'description{i}'
        description = ad.get(desc_key, '').strip()
        if description:
            original_len = len(description)
            description = truncate_description(description, 90)
            if len(description) != original_len:
                validation_errors.append(ValidationError(
                    field=f'Description {i}',
                    message=f'Description {i} truncated from {original_len} to 90 characters',
                    severity='warning'
                ))
            descriptions.append(description)
        else:
            descriptions.append('')
    
    # Validate paths
    path1 = truncate_path(ad.get('path1', '').strip(), 15)
    path2 = truncate_path(ad.get('path2', '').strip(), 15)
    
    # Validate final URL
    final_url = ad.get('finalUrl') or ad.get('final_url', '').strip()
    if not final_url:
        validation_errors.append(ValidationError(
            field='Final URL',
            message='Final URL is required for ads',
            severity='error'
        ))
    
    # Validate minimum requirements
    non_empty_headlines = [h for h in headlines[:3] if h]
    non_empty_descriptions = [d for d in descriptions[:2] if d]
    
    if len(non_empty_headlines) < 3:
        validation_errors.append(ValidationError(
            field='Headlines',
            message='At least 3 headlines are required for Responsive Search Ads',
            severity='error'
        ))
    
    if len(non_empty_descriptions) < 2:
        validation_errors.append(ValidationError(
            field='Descriptions',
            message='At least 2 descriptions are required for Responsive Search Ads',
            severity='error'
        ))
    
    # Build row
    row.update({
        'Row Type': 'AD',
        'AdGroup': adgroup_name,
        'Ad Type': ad_type_str,
        'Ad Status': 'ENABLED',
        'Final URL': final_url,
        'Path1': path1,
        'Path2': path2,
    })
    
    # Add headlines
    for i, headline in enumerate(headlines, 1):
        row[f'Headline {i}'] = headline
    
    # Add descriptions
    for i, description in enumerate(descriptions, 1):
        row[f'Description {i}'] = description
    
    return row


def create_location_row(campaign_name: str, location_type: str, 
                       location_code: str) -> Dict[str, str]:
    """Create a LOCATION targeting row"""
    row = create_campaign_row(campaign_name)
    row.update({
        'Row Type': 'LOCATION',
        'Location Type': location_type.upper(),
        'Location Code': str(location_code).strip(),
    })
    return row


# ============================================================================
# CSV GENERATION WITH PROPER FORMATTING
# ============================================================================

def generate_csv_rows(request: CampaignExportRequest, 
                     validation_errors: List[ValidationError]) -> List[Dict[str, str]]:
    """Generate all CSV rows from request"""
    rows = []
    
    # Campaign row
    rows.append(create_campaign_row(
        request.campaign_name,
        request.budget,
        request.bidding_strategy or "MANUAL_CPC"
    ))
    
    # Process ad groups
    for adgroup in request.ad_groups:
        adgroup_name = adgroup.get('name', '').strip()
        if not adgroup_name:
            validation_errors.append(ValidationError(
                field='AdGroup name',
                message='AdGroup name is required',
                severity='error'
            ))
            continue
        
        # AdGroup row
        rows.append(create_adgroup_row(
            request.campaign_name,
            adgroup_name,
            adgroup.get('defaultMaxCPC')
        ))
        
        # Keywords
        keywords = adgroup.get('keywords', [])
        for keyword in keywords:
            if isinstance(keyword, str):
                rows.append(create_keyword_row(
                    request.campaign_name,
                    adgroup_name,
                    keyword
                ))
            elif isinstance(keyword, dict):
                rows.append(create_keyword_row(
                    request.campaign_name,
                    adgroup_name,
                    keyword.get('text', keyword.get('keyword', '')),
                    keyword.get('matchType'),
                    keyword.get('maxCPC'),
                    keyword.get('finalURL')
                ))
        
        # Ads
        ads = adgroup.get('ads', [])
        for ad in ads:
            ad_row = create_ad_row(request.campaign_name, adgroup_name, ad, validation_errors)
            # Only add row if no fatal errors
            fatal_errors = [e for e in validation_errors if e.severity == 'error' and e.field in ['Final URL', 'Headlines', 'Descriptions']]
            if not any(e.field in ['Final URL', 'Headlines', 'Descriptions'] for e in validation_errors[-3:]):
                rows.append(ad_row)
        
        # Negative keywords
        negative_keywords = adgroup.get('negativeKeywords', [])
        for neg_kw in negative_keywords:
            match_type, clean_kw = parse_match_type(neg_kw if isinstance(neg_kw, str) else neg_kw.get('text', ''))
            if clean_kw:
                row = create_campaign_row(request.campaign_name)
                row.update({
                    'Row Type': 'NEGATIVE_KEYWORD',
                    'AdGroup': adgroup_name,
                    'Negative Keyword': clean_kw,
                    'Match Type': match_type,
                })
                rows.append(row)
    
    # Location targeting
    if request.location_targeting:
        locations = request.location_targeting.get('locations', [])
        for loc in locations:
            loc_type = loc.get('type', 'COUNTRY')
            loc_code = loc.get('code', loc.get('value', ''))
            if loc_code:
                rows.append(create_location_row(
                    request.campaign_name,
                    loc_type,
                    loc_code
                ))
    
    return rows


def generate_csv_content(rows: List[Dict[str, str]]) -> str:
    """
    Generate CSV content with proper formatting:
    - UTF-8 BOM
    - CRLF line endings
    - Proper quoting and escaping
    """
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=GOOGLE_ADS_EDITOR_HEADERS,
        extrasaction='ignore',  # Ignore extra fields not in headers
        lineterminator='\r\n'  # CRLF for Windows/Google Ads Editor
    )
    
    writer.writeheader()
    for row in rows:
        # Ensure all header fields exist in row
        complete_row = {header: row.get(header, '') for header in GOOGLE_ADS_EDITOR_HEADERS}
        writer.writerow(complete_row)
    
    csv_content = output.getvalue()
    output.close()
    
    # Add UTF-8 BOM
    return '\ufeff' + csv_content


# ============================================================================
# VALIDATION & POST-CHECK
# ============================================================================

def validate_csv_content(csv_content: str) -> tuple[bool, List[ValidationError]]:
    """
    Post-check CSV content using csv.reader (robust field counting)
    Returns: (is_valid, errors)
    """
    errors = []
    lines = csv_content.split('\r\n')
    
    if len(lines) < 2:  # Header + at least one row
        errors.append(ValidationError(
            field='CSV',
            message='CSV must contain at least a header and one data row',
            severity='error'
        ))
        return False, errors
    
    # Check header
    header_line = lines[0]
    reader = csv.reader([header_line])
    header_fields = next(reader)
    
    if len(header_fields) != len(GOOGLE_ADS_EDITOR_HEADERS):
        errors.append(ValidationError(
            field='Header',
            message=f'Header has {len(header_fields)} fields, expected {len(GOOGLE_ADS_EDITOR_HEADERS)}',
            severity='error'
        ))
    
    # Check each row has correct field count
    for i, line in enumerate(lines[1:], start=2):
        if not line.strip():
            continue
        reader = csv.reader([line])
        try:
            fields = next(reader)
            if len(fields) != len(GOOGLE_ADS_EDITOR_HEADERS):
                errors.append(ValidationError(
                    row_index=i,
                    field='Row',
                    message=f'Row {i} has {len(fields)} fields, expected {len(GOOGLE_ADS_EDITOR_HEADERS)}',
                    severity='error'
                ))
        except Exception as e:
            errors.append(ValidationError(
                row_index=i,
                field='Row',
                message=f'Row {i} parsing error: {str(e)}',
                severity='error'
            ))
    
    return len([e for e in errors if e.severity == 'error']) == 0, errors


# ============================================================================
# MAIN EXPORT FUNCTION
# ============================================================================

def estimate_export_size(request: CampaignExportRequest) -> int:
    """
    Estimate the number of rows that will be generated
    Returns approximate row count
    """
    estimated_rows = 1  # Campaign row
    
    for adgroup in request.ad_groups:
        estimated_rows += 1  # AdGroup row
        estimated_rows += len(adgroup.get('keywords', []))  # Keywords
        estimated_rows += len(adgroup.get('ads', []))  # Ads
        estimated_rows += len(adgroup.get('negativeKeywords', []))  # Negative keywords
    
    if request.location_targeting:
        estimated_rows += len(request.location_targeting.get('locations', []))
    
    return estimated_rows


def export_campaign_to_csv(request: CampaignExportRequest) -> CSVExportResponse:
    """
    Main function to export campaign to CSV with full validation
    """
    validation_errors = []
    warnings = []
    
    try:
        # Generate rows
        rows = generate_csv_rows(request, validation_errors)
        
        if not rows:
            return CSVExportResponse(
                success=False,
                validation_errors=[ValidationError(
                    field='Campaign',
                    message='No rows generated. Check ad groups and ads.',
                    severity='error'
                )],
                message='Export failed: No data to export'
            )
        
        # Separate errors and warnings
        errors = [e for e in validation_errors if e.severity == 'error']
        warnings = [e for e in validation_errors if e.severity == 'warning']
        
        # If fatal errors, don't generate CSV
        if errors:
            return CSVExportResponse(
                success=False,
                validation_errors=errors,
                warnings=warnings,
                row_count=len(rows),
                message=f'Export failed: {len(errors)} validation error(s)'
            )
        
        # Generate CSV content
        csv_content = generate_csv_content(rows)
        
        # Post-validate CSV content
        is_valid, post_errors = validate_csv_content(csv_content)
        if not is_valid:
            errors.extend(post_errors)
            return CSVExportResponse(
                success=False,
                validation_errors=errors,
                warnings=warnings,
                row_count=len(rows),
                message=f'CSV validation failed: {len(post_errors)} error(s)'
            )
        
        # Generate filename
        safe_name = ''.join(c for c in request.campaign_name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_name}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return CSVExportResponse(
            success=True,
            csv_content=csv_content,
            filename=filename,
            validation_errors=[],
            warnings=warnings,
            row_count=len(rows),
            message=f'CSV exported successfully: {len(rows)} rows'
        )
        
    except Exception as e:
        return CSVExportResponse(
            success=False,
            validation_errors=[ValidationError(
                field='Export',
                message=f'Export failed: {str(e)}',
                severity='error'
            )],
            message=f'Export error: {str(e)}'
        )

