#!/usr/bin/env python3
"""
Adiology Ad Generator Fallback Script
Generates proper Google Ads for services and products when main generation fails
"""

import json
import re
import sys
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, urljoin
import random

# ============================================================================
# BUSINESS TYPE DETECTION
# ============================================================================

PRODUCT_KEYWORDS = [
    'buy', 'shop', 'store', 'purchase', 'product', 'item', 'goods', 'merchandise',
    'equipment', 'tools', 'supplies', 'parts', 'accessories', 'hardware', 'furniture',
    'appliances', 'electronics', 'clothing', 'shoes', 'watch', 'phone', 'laptop',
    'camera', 'bike', 'car', 'vehicle', 'toy', 'game', 'book', 'software',
    'price', 'cost', 'cheap', 'sale', 'discount', 'deal', 'order', 'cart'
]

SERVICE_KEYWORDS = [
    'service', 'repair', 'installation', 'maintenance', 'cleaning', 'plumbing',
    'electrician', 'carpenter', 'contractor', 'lawyer', 'attorney', 'doctor',
    'dentist', 'consultant', 'coach', 'trainer', 'teacher', 'tutor', 'therapist',
    'mechanic', 'technician', 'specialist', 'professional', 'expert', 'care',
    'treatment', 'consultation', 'inspection', 'emergency', 'support', 'help',
    'fix', 'restore', 'replace', 'install', 'upgrade', 'improve', 'hire', 'book',
    'schedule', 'appointment', 'estimate', 'quote'
]

EMERGENCY_KEYWORDS = [
    'emergency', '24/7', 'urgent', 'now', 'immediate', 'asap', 'tonight', 'today',
    'crisis', 'broken', 'leak', 'flood', 'fire', 'burst', 'overflow'
]

LOCAL_KEYWORDS = [
    'near me', 'nearby', 'in my area', 'local', 'closest', 'in', 'around'
]


def detect_business_type(keywords: List[str], industry: str = '') -> str:
    """
    Detect if keywords are for product, service, emergency, or local intent
    Returns: 'product', 'service', 'emergency', or 'local'
    """
    keyword_text = ' '.join(keywords).lower()
    industry_lower = industry.lower()
    
    # Check for emergency first
    if any(term in keyword_text for term in EMERGENCY_KEYWORDS):
        return 'emergency'
    
    # Check for local
    if any(term in keyword_text for term in LOCAL_KEYWORDS):
        return 'local'
    
    # Check for product indicators
    product_score = sum(1 for term in PRODUCT_KEYWORDS if term in keyword_text)
    service_score = sum(1 for term in SERVICE_KEYWORDS if term in keyword_text)
    
    # Industry-based detection
    service_industries = ['plumbing', 'electrical', 'hvac', 'legal', 'medical', 'dental', 
                         'cleaning', 'services', 'service', 'repair', 'maintenance']
    product_industries = ['product', 'products', 'shop', 'store', 'retail', 'ecommerce']
    
    if any(term in industry_lower for term in service_industries):
        service_score += 2
    if any(term in industry_lower for term in product_industries):
        product_score += 2
    
    # Default to service if ambiguous (most businesses are service-based)
    if product_score > service_score:
        return 'product'
    return 'service'


# ============================================================================
# AD COPY TEMPLATES
# ============================================================================

def to_title_case(text: str) -> str:
    """Convert text to title case following Google Ads rules"""
    small_words = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']
    words = text.split()
    
    result = []
    for i, word in enumerate(words):
        if i == 0 or word.lower() not in small_words or len(word) == 1:
            result.append(word.capitalize())
        else:
            result.append(word.lower())
    
    return ' '.join(result)


def clean_keyword(keyword: str) -> str:
    """Clean and format keyword for ad copy"""
    # Remove quotes
    cleaned = re.sub(r'["\'""]', '', keyword)
    # Remove excessive punctuation
    cleaned = re.sub(r'[!]{2,}', '!', cleaned)
    cleaned = re.sub(r'[?]{2,}', '?', cleaned)
    # Trim
    return cleaned.strip()


def format_dki_keyword(keyword: str) -> str:
    """Format keyword for DKI: {KeyWord:Default Text}"""
    cleaned = clean_keyword(keyword)
    title_cased = to_title_case(cleaned)
    return f"{{KeyWord:{title_cased}}}"


def truncate_text(text: str, max_length: int) -> str:
    """Truncate text to max length, preserving words"""
    if len(text) <= max_length:
        return text
    # Try to cut at word boundary
    truncated = text[:max_length - 3]
    last_space = truncated.rfind(' ')
    if last_space > max_length * 0.7:  # Only use word boundary if reasonable
        return truncated[:last_space] + '...'
    return truncated + '...'


# ============================================================================
# SERVICE AD GENERATION
# ============================================================================

def generate_service_headlines(keyword: str, business_name: str = '', location: str = '') -> List[str]:
    """Generate service-focused headlines"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    headlines = [
        f"Professional {title_kw}",
        f"Expert {title_kw} Services",
        f"Licensed {title_kw}",
        f"Trusted {title_kw} Experts",
        f"Quality {title_kw} Service",
        f"Affordable {title_kw}",
        f"Fast {title_kw} Service",
        f"Reliable {title_kw}",
        f"Same Day {title_kw}",
        f"24/7 {title_kw} Available",
    ]
    
    if business_name:
        headlines.extend([
            f"{business_name} - {title_kw}",
            f"{business_name} Experts",
        ])
    
    if location:
        headlines.extend([
            f"{title_kw} in {location}",
            f"Local {title_kw} Near You",
            f"{location} {title_kw} Pros",
        ])
    
    # Add DKI variations
    dki_kw = format_dki_keyword(keyword)
    headlines.extend([
        f"{dki_kw} - Official Site",
        f"Get {dki_kw} Help",
        f"Book {dki_kw} Now",
        f"Call for {dki_kw}",
        f"Top Rated {dki_kw}",
    ])
    
    # Truncate to 30 chars and remove duplicates
    unique_headlines = []
    seen = set()
    for h in headlines:
        truncated = truncate_text(h, 30)
        if truncated not in seen and len(truncated) >= 10:
            unique_headlines.append(truncated)
            seen.add(truncated)
    
    return unique_headlines[:15]


def generate_service_descriptions(keyword: str, business_name: str = '', location: str = '', base_url: str = '') -> List[str]:
    """Generate service-focused descriptions"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    descriptions = [
        f"Professional {title_kw} services you can trust. Licensed, insured & satisfaction guaranteed. Free estimates available.",
        f"Looking for reliable {title_kw}? We provide fast, affordable services{f' in {location}' if location else ''}. Call now or book online!",
        f"Expert {title_kw} at fair prices. Our certified technicians deliver quality workmanship. Same-day service available.",
        f"Trusted {title_kw} professionals{f' in {location}' if location else ''}. From repairs to installations, we handle it all. 5-star rated.",
        f"Get quality {title_kw} services with licensed professionals. Fast response times. Free quotes. Available 7 days a week.",
    ]
    
    if business_name:
        descriptions.append(
            f"{business_name}: Your local {title_kw} experts. Quality service, fair pricing, guaranteed satisfaction. Call today!"
        )
    
    # Truncate to 90 chars
    unique_descriptions = []
    seen = set()
    for d in descriptions:
        truncated = truncate_text(d, 90)
        if truncated not in seen and len(truncated) >= 30:
            unique_descriptions.append(truncated)
            seen.add(truncated)
    
    return unique_descriptions[:4]


# ============================================================================
# PRODUCT AD GENERATION
# ============================================================================

def generate_product_headlines(keyword: str, business_name: str = '') -> List[str]:
    """Generate product-focused headlines"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    headlines = [
        f"Shop {title_kw} Deals",
        f"Buy {title_kw} Online",
        f"{title_kw} - Best Prices",
        f"{title_kw} Sale - Save Now",
        f"Quality {title_kw} Products",
        f"Top Rated {title_kw}",
        f"Official {title_kw} Store",
        f"Genuine {title_kw} Products",
        f"Free Shipping on {title_kw}",
        f"{title_kw} - Next Day Delivery",
    ]
    
    if business_name:
        headlines.extend([
            f"{business_name} - {title_kw}",
            f"Shop {title_kw} at {business_name}",
        ])
    
    # Add DKI variations
    dki_kw = format_dki_keyword(keyword)
    headlines.extend([
        f"Buy {dki_kw} Online",
        f"Shop {dki_kw} Deals",
        f"{dki_kw} - Best Prices",
        f"Order {dki_kw} Today",
        f"Get {dki_kw} Now",
    ])
    
    # Truncate to 30 chars and remove duplicates
    unique_headlines = []
    seen = set()
    for h in headlines:
        truncated = truncate_text(h, 30)
        if truncated not in seen and len(truncated) >= 10:
            unique_headlines.append(truncated)
            seen.add(truncated)
    
    return unique_headlines[:15]


def generate_product_descriptions(keyword: str, business_name: str = '', base_url: str = '') -> List[str]:
    """Generate product-focused descriptions"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    descriptions = [
        f"Shop {title_kw} at unbeatable prices. Best prices guaranteed. Free shipping on orders over $50. Easy returns. Buy with confidence!",
        f"Looking for {title_kw}? Browse our huge selection at competitive prices. Customer reviews, fast delivery & hassle-free returns.",
        f"Get the best {title_kw} deals online. Quality products, verified sellers, secure checkout. Order now & save up to 30%!",
        f"{title_kw} - Your trusted destination. Compare models, read reviews & find the perfect fit. Price match guarantee available.",
        f"Quality {title_kw} with fast shipping and easy returns. Shop our latest collection. Secure checkout. Order today!",
    ]
    
    if business_name:
        descriptions.append(
            f"{business_name} - Your trusted {title_kw} store. Quality products, verified sellers, secure checkout. Shop now!"
        )
    
    # Truncate to 90 chars
    unique_descriptions = []
    seen = set()
    for d in descriptions:
        truncated = truncate_text(d, 90)
        if truncated not in seen and len(truncated) >= 30:
            unique_descriptions.append(truncated)
            seen.add(truncated)
    
    return unique_descriptions[:4]


# ============================================================================
# EMERGENCY AD GENERATION
# ============================================================================

def generate_emergency_headlines(keyword: str, business_name: str = '') -> List[str]:
    """Generate emergency-focused headlines"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    headlines = [
        f"24/7 Emergency {title_kw}",
        f"{title_kw} - Open Now",
        f"Urgent {title_kw} Help",
        f"Fast {title_kw} Response",
        f"{title_kw} in 30 Minutes",
        f"Same Hour {title_kw}",
        f"Emergency {title_kw} Fix",
        f"Immediate {title_kw} Help",
        f"Licensed Emergency {title_kw}",
        f"Trusted 24/7 {title_kw}",
    ]
    
    # Add DKI variations
    dki_kw = format_dki_keyword(keyword)
    headlines.extend([
        f"Emergency {dki_kw} Help",
        f"24/7 {dki_kw} Available",
        f"Call Now for {dki_kw}",
    ])
    
    # Truncate to 30 chars
    unique_headlines = []
    seen = set()
    for h in headlines:
        truncated = truncate_text(h, 30)
        if truncated not in seen and len(truncated) >= 10:
            unique_headlines.append(truncated)
            seen.add(truncated)
    
    return unique_headlines[:15]


def generate_emergency_descriptions(keyword: str, business_name: str = '', location: str = '') -> List[str]:
    """Generate emergency-focused descriptions"""
    clean_kw = clean_keyword(keyword)
    title_kw = to_title_case(clean_kw)
    
    descriptions = [
        f"{title_kw} emergency? We're here 24/7! Rapid response for all urgent issues. Call now - we're on our way!",
        f"Don't panic! Our emergency {title_kw} team is available around the clock. Fast arrival, expert repairs, fair pricing.",
        f"24/7 emergency {title_kw} services{f' in {location}' if location else ''}. We respond in 30 minutes or less. Call now!",
        f"{title_kw} emergency? Licensed professionals ready to solve your crisis day or night. No extra fees!",
    ]
    
    # Truncate to 90 chars
    unique_descriptions = []
    seen = set()
    for d in descriptions:
        truncated = truncate_text(d, 90)
        if truncated not in seen and len(truncated) >= 30:
            unique_descriptions.append(truncated)
            seen.add(truncated)
    
    return unique_descriptions[:4]


# ============================================================================
# URL GENERATION
# ============================================================================

def generate_final_url(base_url: str, keyword: str) -> str:
    """Generate SEO-friendly final URL from base URL and keyword"""
    if not base_url:
        return base_url
    
    try:
        parsed = urlparse(base_url)
        clean_kw = clean_keyword(keyword).lower().replace(' ', '-')
        # Remove special characters
        clean_kw = re.sub(r'[^a-z0-9\-]', '', clean_kw)
        
        # Generate path
        path_options = [
            f"/{clean_kw}",
            f"/{clean_kw}/deals",
            f"/shop/{clean_kw}",
            f"/services/{clean_kw}",
            f"/contact",
        ]
        
        return urljoin(base_url, random.choice(path_options))
    except:
        return base_url


def generate_display_paths(keyword: str, business_type: str) -> Tuple[str, str]:
    """Generate display URL paths (max 15 chars each)"""
    clean_kw = clean_keyword(keyword).lower()
    
    if business_type == 'product':
        paths = [
            ('shop', 'now'),
            ('deals', 'sale'),
            ('products', 'buy'),
            ('store', 'online'),
        ]
    else:  # service
        paths = [
            ('services', 'contact'),
            ('book', 'now'),
            ('quote', 'free'),
            ('contact', 'us'),
        ]
    
    # Try to use keyword if short enough
    kw_words = clean_kw.split()[:2]
    if len(' '.join(kw_words)) <= 15:
        path1 = kw_words[0][:15] if kw_words else 'services'
        path2 = kw_words[1][:15] if len(kw_words) > 1 else 'contact'
        return (path1, path2)
    
    return random.choice(paths)


# ============================================================================
# MAIN AD GENERATION FUNCTION
# ============================================================================

def generate_ads(
    keywords: List[str],
    business_type: Optional[str] = None,
    business_name: str = '',
    location: str = '',
    industry: str = '',
    base_url: str = '',
    ad_type: str = 'RSA',  # 'RSA', 'DKI', or 'CALL_ONLY'
    num_ads: int = 3
) -> List[Dict]:
    """
    Generate ads based on keywords and business type
    
    Args:
        keywords: List of keywords
        business_type: 'product', 'service', 'emergency', 'local' (auto-detected if None)
        business_name: Name of the business
        location: Location string
        industry: Industry name
        base_url: Base URL for final URLs
        ad_type: 'RSA', 'DKI', or 'CALL_ONLY'
        num_ads: Number of ads to generate
    
    Returns:
        List of ad dictionaries
    """
    if not keywords:
        return []
    
    main_keyword = keywords[0]
    
    # Auto-detect business type if not provided
    if not business_type:
        business_type = detect_business_type(keywords, industry)
    
    ads = []
    
    for i in range(num_ads):
        # Select keyword for this ad (cycle through if multiple)
        keyword = keywords[i % len(keywords)]
        
        # Generate headlines and descriptions based on type
        if business_type == 'product':
            headlines = generate_product_headlines(keyword, business_name)
            descriptions = generate_product_descriptions(keyword, business_name, base_url)
        elif business_type == 'emergency':
            headlines = generate_emergency_headlines(keyword, business_name)
            descriptions = generate_emergency_descriptions(keyword, business_name, location)
        else:  # service or local
            headlines = generate_service_headlines(keyword, business_name, location)
            descriptions = generate_service_descriptions(keyword, business_name, location, base_url)
        
        # Generate URLs
        final_url = generate_final_url(base_url, keyword)
        path1, path2 = generate_display_paths(keyword, business_type)
        
        # Create ad based on type
        if ad_type == 'DKI':
            # DKI ad with 5 headlines
            dki_kw = format_dki_keyword(keyword)
            ad = {
                'id': f'ad_{i+1}',
                'type': 'dki',
                'adType': 'DKI',
                'headline1': f"{dki_kw} - Official Site"[:30],
                'headline2': f"Buy {dki_kw}"[:30],
                'headline3': f"Top Rated {dki_kw}"[:30],
                'headline4': f"Get {dki_kw} Help"[:30],
                'headline5': f"Shop {dki_kw} Deals"[:30] if business_type == 'product' else f"Call for {dki_kw}"[:30],
                'description1': descriptions[0] if descriptions else '',
                'description2': descriptions[1] if len(descriptions) > 1 else descriptions[0] if descriptions else '',
                'path1': path1[:15],
                'path2': path2[:15],
                'finalUrl': final_url,
                'selected': True,
            }
        elif ad_type == 'CALL_ONLY':
            # Call-only ad
            ad = {
                'id': f'ad_{i+1}',
                'type': 'callonly',
                'adType': 'CallOnly',
                'headline1': headlines[0] if headlines else '',
                'headline2': headlines[1] if len(headlines) > 1 else headlines[0] if headlines else '',
                'description1': descriptions[0] if descriptions else '',
                'description2': descriptions[1] if len(descriptions) > 1 else descriptions[0] if descriptions else '',
                'phoneNumber': '',  # Should be provided separately
                'businessName': business_name or 'Business',
                'finalUrl': final_url,
                'selected': True,
            }
        else:  # RSA
            # RSA ad with multiple headlines
            ad = {
                'id': f'ad_{i+1}',
                'type': 'rsa',
                'adType': 'RSA',
                'headline1': headlines[0] if headlines else '',
                'headline2': headlines[1] if len(headlines) > 1 else headlines[0] if headlines else '',
                'headline3': headlines[2] if len(headlines) > 2 else headlines[0] if headlines else '',
                'headline4': headlines[3] if len(headlines) > 3 else '',
                'headline5': headlines[4] if len(headlines) > 4 else '',
                'description1': descriptions[0] if descriptions else '',
                'description2': descriptions[1] if len(descriptions) > 1 else descriptions[0] if descriptions else '',
                'path1': path1[:15],
                'path2': path2[:15],
                'finalUrl': final_url,
                'selected': True,
            }
        
        ads.append(ad)
    
    return ads


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """CLI interface for the ad generator"""
    if len(sys.argv) < 2:
        print("Usage: python ad_generator_fallback.py <input_json>")
        print("\nInput JSON format:")
        print(json.dumps({
            "keywords": ["plumber near me", "emergency plumbing"],
            "business_type": "service",  # optional, auto-detected
            "business_name": "ABC Plumbing",
            "location": "New York",
            "industry": "plumbing",
            "base_url": "https://www.example.com",
            "ad_type": "RSA",  # RSA, DKI, or CALL_ONLY
            "num_ads": 3
        }, indent=2))
        sys.exit(1)
    
    try:
        # Read input from file or stdin
        if sys.argv[1] == '-':
            input_data = json.load(sys.stdin)
        else:
            with open(sys.argv[1], 'r') as f:
                input_data = json.load(f)
        
        # Generate ads
        ads = generate_ads(
            keywords=input_data.get('keywords', []),
            business_type=input_data.get('business_type'),
            business_name=input_data.get('business_name', ''),
            location=input_data.get('location', ''),
            industry=input_data.get('industry', ''),
            base_url=input_data.get('base_url', ''),
            ad_type=input_data.get('ad_type', 'RSA'),
            num_ads=input_data.get('num_ads', 3)
        )
        
        # Output results
        output = {
            'success': True,
            'business_type': detect_business_type(input_data.get('keywords', []), input_data.get('industry', '')),
            'ads': ads,
            'count': len(ads)
        }
        
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e),
            'ads': []
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()

