#!/usr/bin/env python3
"""
Fix Discourse replies that have unresolved template variables like {detail}, {metric}, etc.
"""

import requests
import os
import random
import time
import re

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://adiology.discourse.group")
DISCOURSE_USERNAME = "system"

session = requests.Session()
session.headers.update({
    "Api-Key": DISCOURSE_API_KEY,
    "Api-Username": DISCOURSE_USERNAME,
    "Content-Type": "application/json"
})

# Replacement content for each placeholder type
DETAIL_OPTIONS = [
    "focusing on your audience targeting first before worrying about bid strategies",
    "testing multiple ad variations simultaneously to find what resonates",
    "using negative keywords aggressively from day one",
    "starting with manual CPC to understand your market before automation",
    "building custom audiences based on your best customers",
    "implementing proper conversion tracking before scaling spend",
    "focusing on landing page optimization alongside ad copy",
    "segmenting campaigns by device type for better control",
    "using ad scheduling to focus budget on high-converting hours",
    "creating tightly themed ad groups with 15-20 keywords each"
]

METRIC_OPTIONS = [
    "CTR", "conversion rate", "ROAS", "Quality Score", "cost per acquisition",
    "impression share", "click-through rate", "revenue per click", "ad relevance",
    "landing page experience score", "average position", "cost efficiency"
]

PITFALL_OPTIONS = [
    "broad match keywords eating your budget on irrelevant searches",
    "not checking the search terms report weekly for negative keyword opportunities",
    "setting and forgetting campaigns without regular optimization",
    "using the same ad copy across all ad groups instead of customizing",
    "ignoring mobile performance which often differs significantly",
    "not having enough conversion data before enabling smart bidding",
    "overlooking the importance of ad extensions for CTR",
    "focusing only on clicks instead of conversion quality"
]

TIMEFRAME_OPTIONS = [
    "6 months", "over a year", "3 months now", "since Q1", "the past quarter",
    "about 8 months", "nearly two years", "since last summer", "for several months"
]

ACTIVITY_OPTIONS = [
    "manage client accounts", "optimize campaign performance", "approach keyword research",
    "structure my ad groups", "handle budget allocation", "think about bidding strategy",
    "analyze competitor data", "build landing pages", "create ad copy", "run A/B tests"
]

ADDITIONAL_TIP_OPTIONS = [
    "adding countdown timers in promotions",
    "using IF functions in ad copy for personalization",
    "creating separate campaigns for brand and non-brand keywords",
    "implementing dynamic keyword insertion carefully",
    "setting up proper attribution modeling",
    "using audience observation mode before targeting",
    "creating video ads for Discovery campaigns",
    "leveraging customer match lists for targeting"
]

EXTRA_INSIGHT_OPTIONS = [
    "combining this with proper audience exclusions",
    "layering geographic bid adjustments on top",
    "testing responsive search ads alongside expanded text ads",
    "implementing cross-device tracking",
    "using scripts to automate routine optimizations",
    "setting up automated alerts for performance changes",
    "integrating CRM data for better targeting",
    "building remarketing lists from high-intent visitors"
]

KEY_POINT_OPTIONS = [
    "matching search intent with landing page content",
    "the relationship between Quality Score and actual CPC",
    "how ad relevance impacts impression share",
    "the importance of negative keyword management",
    "understanding the learning period for smart bidding",
    "proper conversion tracking setup before scaling",
    "segmentation by customer value for ROAS optimization",
    "the difference between observation and targeting audiences"
]

OUTCOME_OPTIONS = [
    "overall ROAS", "campaign efficiency", "lead quality", "conversion rates",
    "cost per acquisition", "brand visibility", "market share", "customer acquisition costs",
    "return on ad spend", "profit margins", "campaign scalability"
]

def get_posts_with_placeholders():
    """Fetch all posts that contain placeholder variables"""
    posts_to_fix = []
    page = 0
    
    while True:
        response = session.get(f"{DISCOURSE_URL}/latest.json?page={page}&per_page=100")
        if response.status_code != 200:
            break
            
        data = response.json()
        topics = data.get('topic_list', {}).get('topics', [])
        
        if not topics:
            break
        
        for topic in topics:
            if not topic.get('title', '').startswith('[Q&A]'):
                continue
                
            topic_id = topic['id']
            topic_response = session.get(f"{DISCOURSE_URL}/t/{topic_id}.json")
            
            if topic_response.status_code != 200:
                continue
                
            topic_data = topic_response.json()
            post_stream = topic_data.get('post_stream', {}).get('posts', [])
            
            for post in post_stream:
                raw = post.get('raw', '') or post.get('cooked', '')
                post_id = post.get('id')
                
                # Check for placeholder patterns
                if re.search(r'\{(detail|metric|pitfall|timeframe|activity|additional_tip|extra_insight|key_point|outcome)\}', raw):
                    posts_to_fix.append({
                        'post_id': post_id,
                        'topic_id': topic_id,
                        'raw': raw,
                        'title': topic.get('title', '')
                    })
            
            time.sleep(0.3)
        
        page += 1
        time.sleep(0.5)
        
        if len(topics) < 100:
            break
    
    return posts_to_fix

def fix_placeholders(raw_text):
    """Replace all placeholder variables with actual content"""
    fixed = raw_text
    
    # Replace each placeholder type
    fixed = re.sub(r'\{detail\}', lambda m: random.choice(DETAIL_OPTIONS), fixed)
    fixed = re.sub(r'\{metric\}', lambda m: random.choice(METRIC_OPTIONS), fixed)
    fixed = re.sub(r'\{pitfall\}', lambda m: random.choice(PITFALL_OPTIONS), fixed)
    fixed = re.sub(r'\{timeframe\}', lambda m: random.choice(TIMEFRAME_OPTIONS), fixed)
    fixed = re.sub(r'\{activity\}', lambda m: random.choice(ACTIVITY_OPTIONS), fixed)
    fixed = re.sub(r'\{additional_tip\}', lambda m: random.choice(ADDITIONAL_TIP_OPTIONS), fixed)
    fixed = re.sub(r'\{extra_insight\}', lambda m: random.choice(EXTRA_INSIGHT_OPTIONS), fixed)
    fixed = re.sub(r'\{key_point\}', lambda m: random.choice(KEY_POINT_OPTIONS), fixed)
    fixed = re.sub(r'\{outcome\}', lambda m: random.choice(OUTCOME_OPTIONS), fixed)
    
    # Also handle double braces version {{placeholder}}
    fixed = re.sub(r'\{\{detail\}\}', lambda m: random.choice(DETAIL_OPTIONS), fixed)
    fixed = re.sub(r'\{\{metric\}\}', lambda m: random.choice(METRIC_OPTIONS), fixed)
    fixed = re.sub(r'\{\{pitfall\}\}', lambda m: random.choice(PITFALL_OPTIONS), fixed)
    fixed = re.sub(r'\{\{timeframe\}\}', lambda m: random.choice(TIMEFRAME_OPTIONS), fixed)
    fixed = re.sub(r'\{\{activity\}\}', lambda m: random.choice(ACTIVITY_OPTIONS), fixed)
    fixed = re.sub(r'\{\{additional_tip\}\}', lambda m: random.choice(ADDITIONAL_TIP_OPTIONS), fixed)
    fixed = re.sub(r'\{\{extra_insight\}\}', lambda m: random.choice(EXTRA_INSIGHT_OPTIONS), fixed)
    fixed = re.sub(r'\{\{key_point\}\}', lambda m: random.choice(KEY_POINT_OPTIONS), fixed)
    fixed = re.sub(r'\{\{outcome\}\}', lambda m: random.choice(OUTCOME_OPTIONS), fixed)
    
    return fixed

def update_post(post_id, new_content):
    """Update a post's content via Discourse API"""
    url = f"{DISCOURSE_URL}/posts/{post_id}.json"
    
    for attempt in range(3):
        try:
            response = session.put(url, json={"post": {"raw": new_content}})
            if response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                print(f"    Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            if response.status_code == 200:
                return True
            else:
                print(f"    Failed: {response.status_code} - {response.text[:100]}")
                return False
        except Exception as e:
            print(f"    Error: {e}")
            time.sleep(5)
    
    return False

def main():
    print("\n" + "="*60)
    print("FIXING DISCOURSE REPLY PLACEHOLDERS")
    print("="*60 + "\n")
    
    print("Scanning for posts with placeholder variables...")
    posts = get_posts_with_placeholders()
    print(f"Found {len(posts)} posts to fix\n")
    
    if not posts:
        print("No posts with placeholders found!")
        return
    
    success_count = 0
    fail_count = 0
    
    for idx, post in enumerate(posts, 1):
        post_id = post['post_id']
        title = post['title'][:40]
        old_content = post['raw']
        
        print(f"[{idx}/{len(posts)}] Fixing post {post_id} in: {title}...")
        
        # Fix the placeholders
        new_content = fix_placeholders(old_content)
        
        if new_content != old_content:
            if update_post(post_id, new_content):
                success_count += 1
                print("    ✓ Fixed")
            else:
                fail_count += 1
                print("    ✗ Failed")
        else:
            print("    - No changes needed")
        
        time.sleep(2)
        
        if idx % 10 == 0:
            print(f"\n--- Progress: {idx}/{len(posts)} ({success_count} fixed, {fail_count} failed) ---\n")
            time.sleep(3)
    
    print("\n" + "="*60)
    print("PLACEHOLDER FIX COMPLETE!")
    print("="*60)
    print(f"✓ Successfully fixed: {success_count} posts")
    print(f"✗ Failed: {fail_count} posts")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
