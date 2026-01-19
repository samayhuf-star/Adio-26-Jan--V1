#!/usr/bin/env python3
"""
CSV Export Adapter - Mapping Functions
Converts Campaign Builder 1 frontend data format to backend export request format
"""

from typing import Dict, List, Any, Optional
from export_csv_fix import CampaignExportRequest


def map_frontend_to_backend(
    campaign_name: str,
    ad_groups: List[Dict[str, Any]],
    generated_ads: List[Dict[str, Any]],
    all_ad_groups_value: str = "ALL_AD_GROUPS",
    location_targeting: Optional[Dict[str, Any]] = None,
    budget: Optional[float] = None,
    bidding_strategy: str = "MANUAL_CPC",
    negative_keywords: Optional[List[str]] = None
) -> CampaignExportRequest:
    """
    Map Campaign Builder 1 frontend data structure to backend export request
    
    Args:
        campaign_name: Campaign name
        ad_groups: List of ad groups with keywords
        generated_ads: List of all generated ads (may reference ad groups or ALL_AD_GROUPS)
        all_ad_groups_value: Value used to indicate ads apply to all groups
        location_targeting: Location targeting data
        budget: Campaign budget
        bidding_strategy: Bidding strategy type
        negative_keywords: Global negative keywords
    
    Returns:
        CampaignExportRequest ready for export
    """
    
    # Map ad groups with their ads
    mapped_ad_groups = []
    
    for ad_group in ad_groups:
        ad_group_name = ad_group.get('name', '').strip()
        if not ad_group_name:
            continue
        
        # Get keywords for this ad group
        keywords = ad_group.get('keywords', [])
        if isinstance(keywords, str):
            # If keywords is a string, split by newline
            keywords = [k.strip() for k in keywords.split('\n') if k.strip()]
        elif not isinstance(keywords, list):
            keywords = []
        
        # Get ads for this ad group
        # Ads can be assigned to specific group or ALL_AD_GROUPS
        group_ads = [
            ad for ad in generated_ads
            if ad.get('adGroup') == ad_group_name or ad.get('adGroup') == all_ad_groups_value
        ]
        
        # Filter out extension-only ads (they have extensionType)
        group_ads = [ad for ad in group_ads if not ad.get('extensionType')]
        
        # Map ads to backend format
        mapped_ads = []
        for ad in group_ads:
            # Check if ad has any content - skip completely empty ads
            has_headlines = any([
                ad.get('headline1'), ad.get('headline2'), ad.get('headline3'),
                ad.get('headlines') and len(ad.get('headlines', [])) > 0
            ])
            has_descriptions = any([
                ad.get('description1'), ad.get('description2'),
                ad.get('descriptions') and len(ad.get('descriptions', [])) > 0
            ])
            
            # Skip ads that have no content at all (they're likely placeholders)
            if not has_headlines and not has_descriptions:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Skipping empty ad in group '{ad_group_name}' - ad has no headlines or descriptions. Ad keys: {list(ad.keys())}")
                continue
            # Handle both camelCase and snake_case field names
            # Also check for nested structures (e.g., ad.headlines[0])
            def get_field(ad_obj, *keys):
                """Get field value trying multiple key variations"""
                for key in keys:
                    if key in ad_obj and ad_obj[key]:
                        return str(ad_obj[key]).strip()
                return ''
            
            # Try multiple field name variations
            headline1 = get_field(ad, 'headline1', 'headline_1', 'Headline1', 'Headline 1')
            headline2 = get_field(ad, 'headline2', 'headline_2', 'Headline2', 'Headline 2')
            headline3 = get_field(ad, 'headline3', 'headline_3', 'Headline3', 'Headline 3')
            
            # Check if headlines are in an array
            if not headline1 and 'headlines' in ad and isinstance(ad['headlines'], list) and len(ad['headlines']) > 0:
                headlines_list = ad['headlines']
                headline1 = str(headlines_list[0]).strip() if len(headlines_list) > 0 else ''
                headline2 = str(headlines_list[1]).strip() if len(headlines_list) > 1 else ''
                headline3 = str(headlines_list[2]).strip() if len(headlines_list) > 2 else ''
            
            description1 = get_field(ad, 'description1', 'description_1', 'Description1', 'Description 1')
            description2 = get_field(ad, 'description2', 'description_2', 'Description2', 'Description 2')
            
            # Check if descriptions are in an array
            if not description1 and 'descriptions' in ad and isinstance(ad['descriptions'], list) and len(ad['descriptions']) > 0:
                descriptions_list = ad['descriptions']
                description1 = str(descriptions_list[0]).strip() if len(descriptions_list) > 0 else ''
                description2 = str(descriptions_list[1]).strip() if len(descriptions_list) > 1 else ''
            
            mapped_ad = {
                'type': ad.get('type', 'rsa').lower(),
                'headline1': headline1,
                'headline2': headline2,
                'headline3': headline3,
                'headline4': get_field(ad, 'headline4', 'headline_4', 'Headline4', 'Headline 4'),
                'headline5': get_field(ad, 'headline5', 'headline_5', 'Headline5', 'Headline 5'),
                'headline6': get_field(ad, 'headline6', 'headline_6', 'Headline6', 'Headline 6'),
                'headline7': get_field(ad, 'headline7', 'headline_7', 'Headline7', 'Headline 7'),
                'headline8': get_field(ad, 'headline8', 'headline_8', 'Headline8', 'Headline 8'),
                'headline9': get_field(ad, 'headline9', 'headline_9', 'Headline9', 'Headline 9'),
                'headline10': get_field(ad, 'headline10', 'headline_10', 'Headline10', 'Headline 10'),
                'headline11': get_field(ad, 'headline11', 'headline_11', 'Headline11', 'Headline 11'),
                'headline12': get_field(ad, 'headline12', 'headline_12', 'Headline12', 'Headline 12'),
                'headline13': get_field(ad, 'headline13', 'headline_13', 'Headline13', 'Headline 13'),
                'headline14': get_field(ad, 'headline14', 'headline_14', 'Headline14', 'Headline 14'),
                'headline15': get_field(ad, 'headline15', 'headline_15', 'Headline15', 'Headline 15'),
                'description1': description1,
                'description2': description2,
                'description3': get_field(ad, 'description3', 'description_3', 'Description3', 'Description 3'),
                'description4': get_field(ad, 'description4', 'description_4', 'Description4', 'Description 4'),
                'finalUrl': get_field(ad, 'finalUrl', 'final_url', 'finalURL', 'Final URL', 'FinalURL'),
                'path1': get_field(ad, 'path1', 'path_1', 'Path1', 'Path 1'),
                'path2': get_field(ad, 'path2', 'path_2', 'Path2', 'Path 2'),
            }
            mapped_ads.append(mapped_ad)
        
        # Get negative keywords for this ad group
        group_negative_keywords = ad_group.get('negativeKeywords', [])
        if isinstance(group_negative_keywords, str):
            group_negative_keywords = [k.strip() for k in group_negative_keywords.split('\n') if k.strip()]
        elif not isinstance(group_negative_keywords, list):
            group_negative_keywords = []
        
        # Add global negative keywords if provided
        if negative_keywords:
            group_negative_keywords.extend(negative_keywords)
        
        mapped_ad_groups.append({
            'name': ad_group_name,
            'keywords': keywords,
            'ads': mapped_ads,
            'negativeKeywords': list(set(group_negative_keywords)),  # Remove duplicates
            'defaultMaxCPC': ad_group.get('defaultMaxCPC') or ad_group.get('default_max_cpc')
        })
    
    # Map location targeting
    mapped_location_targeting = None
    if location_targeting:
        locations = []
        
        # Country
        if location_targeting.get('country'):
            locations.append({
                'type': 'COUNTRY',
                'code': location_targeting['country']
            })
        
        # States
        if location_targeting.get('states'):
            for state in location_targeting['states']:
                if state and str(state).strip():
                    locations.append({
                        'type': 'STATE',
                        'code': str(state).strip()
                    })
        
        # Cities
        if location_targeting.get('cities'):
            for city in location_targeting['cities']:
                if city and str(city).strip():
                    locations.append({
                        'type': 'CITY',
                        'code': str(city).strip()
                    })
        
        # ZIP codes
        if location_targeting.get('zipCodes') or location_targeting.get('zip_codes'):
            zips = location_targeting.get('zipCodes') or location_targeting.get('zip_codes', [])
            for zip_code in zips:
                if zip_code and str(zip_code).strip():
                    locations.append({
                        'type': 'ZIP',
                        'code': str(zip_code).strip()
                    })
        
        if locations:
            mapped_location_targeting = {'locations': locations}
    
    return CampaignExportRequest(
        campaign_name=campaign_name or 'Campaign 1',
        ad_groups=mapped_ad_groups,
        location_targeting=mapped_location_targeting,
        budget=budget,
        bidding_strategy=bidding_strategy or 'MANUAL_CPC'
    )


def map_simple_format(
    campaign_name: str,
    ad_groups_data: List[Dict[str, Any]],
    location_data: Optional[Dict[str, Any]] = None
) -> CampaignExportRequest:
    """
    Simplified mapping for direct API calls
    
    Expected format:
    {
        "campaign_name": "My Campaign",
        "ad_groups": [
            {
                "name": "Ad Group 1",
                "keywords": ["plumber", "electrician"],
                "ads": [...],
                "negativeKeywords": ["free", "cheap"]
            }
        ],
        "location_targeting": {
            "locations": [
                {"type": "COUNTRY", "code": "US"},
                {"type": "CITY", "code": "New York"}
            ]
        }
    }
    """
    return CampaignExportRequest(
        campaign_name=campaign_name,
        ad_groups=ad_groups_data,
        location_targeting=location_data,
        budget=None,
        bidding_strategy="MANUAL_CPC"
    )

