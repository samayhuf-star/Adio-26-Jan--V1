#!/usr/bin/env python3
"""
Fix Discourse comments with unresolved placeholder text.
Finds and replaces {timeframe}, {activity}, {additional_tip}, {key_point}, {outcome}, etc.
"""

import requests
import os
import re
import time

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = "https://community.adiology.io"
DISCOURSE_USERNAME = "system"

PLACEHOLDER_REPLACEMENTS = {
    "{detail}": "always test variations first",
    "{metric}": "CTR",
    "{pitfall}": "automation without monitoring",
    "{timeframe}": "6 months",
    "{activity}": "manage campaigns",
    "{additional_tip}": "using the right tools",
    "{key_point}": "conversion tracking is critical",
    "{extra_insight}": "testing is essential",
    "{outcome}": "campaign performance",
}

PLACEHOLDER_PATTERN = re.compile(r'\{(detail|metric|pitfall|timeframe|activity|additional_tip|key_point|extra_insight|outcome)\}')

def get_all_posts():
    """Fetch all posts from Discourse"""
    headers = {
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": DISCOURSE_USERNAME,
        "Content-Type": "application/json"
    }
    
    all_posts = []
    page = 0
    
    while True:
        url = f"{DISCOURSE_URL}/posts.json?before={page * 50 if page > 0 else ''}"
        if page > 0:
            url = f"{DISCOURSE_URL}/posts.json"
        
        response = requests.get(
            f"{DISCOURSE_URL}/admin/plugins/explorer/queries/run.json",
            headers=headers,
            params={"id": -1}
        )
        
        posts_url = f"{DISCOURSE_URL}/posts.json"
        response = requests.get(posts_url, headers=headers)
        
        if response.status_code != 200:
            print(f"Error fetching posts: {response.status_code}")
            break
            
        data = response.json()
        posts = data.get("latest_posts", [])
        
        if not posts:
            break
            
        all_posts.extend(posts)
        page += 1
        
        if page >= 20:
            break
            
        time.sleep(0.5)
    
    return all_posts

def search_posts_with_placeholders():
    """Search for posts containing placeholder text"""
    headers = {
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": DISCOURSE_USERNAME,
        "Content-Type": "application/json"
    }
    
    problem_posts = []
    search_terms = ["timeframe", "activity", "additional_tip", "key_point", "outcome", "extra_insight"]
    
    for term in search_terms:
        search_query = f"{{{term}}}"
        url = f"{DISCOURSE_URL}/search.json"
        
        response = requests.get(url, headers=headers, params={"q": search_query})
        
        if response.status_code == 200:
            data = response.json()
            posts = data.get("posts", [])
            for post in posts:
                if post["id"] not in [p["id"] for p in problem_posts]:
                    problem_posts.append(post)
            print(f"Found {len(posts)} posts containing {{{term}}}")
        else:
            print(f"Search failed for {term}: {response.status_code}")
        
        time.sleep(1)
    
    return problem_posts

def get_post_content(post_id):
    """Get full post content"""
    headers = {
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": DISCOURSE_USERNAME,
    }
    
    url = f"{DISCOURSE_URL}/posts/{post_id}.json"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    return None

def update_post(post_id, new_content):
    """Update a post with new content"""
    headers = {
        "Content-Type": "application/json",
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": DISCOURSE_USERNAME,
    }
    
    url = f"{DISCOURSE_URL}/posts/{post_id}.json"
    payload = {
        "post": {
            "raw": new_content,
            "edit_reason": "Fixing placeholder text"
        }
    }
    response = requests.put(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        print(f"      API Response: {response.status_code} - {response.text[:200]}")
    
    return response.status_code == 200

def fix_placeholders(text):
    """Replace all placeholders with actual values"""
    fixed_text = text
    for placeholder, replacement in PLACEHOLDER_REPLACEMENTS.items():
        fixed_text = fixed_text.replace(placeholder, replacement)
    return fixed_text

def main():
    if not DISCOURSE_API_KEY:
        print("ERROR: DISCOURSE_API_KEY environment variable not set")
        return
    
    print("="*60)
    print("DISCOURSE COMMENT PLACEHOLDER FIX")
    print("="*60)
    print(f"Discourse URL: {DISCOURSE_URL}")
    print()
    
    print("Searching for posts with placeholder text...")
    problem_posts = search_posts_with_placeholders()
    
    if not problem_posts:
        print("\nNo posts with placeholders found via search.")
        print("Trying alternative method - fetching recent posts...")
        
        headers = {
            "Api-Key": DISCOURSE_API_KEY,
            "Api-Username": DISCOURSE_USERNAME,
        }
        
        topics_with_issues = []
        
        for page in range(1, 30):
            url = f"{DISCOURSE_URL}/latest.json?page={page}"
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                break
                
            data = response.json()
            topics = data.get("topic_list", {}).get("topics", [])
            
            if not topics:
                break
            
            for topic in topics:
                topic_url = f"{DISCOURSE_URL}/t/{topic['id']}.json"
                topic_response = requests.get(topic_url, headers=headers)
                
                if topic_response.status_code == 200:
                    topic_data = topic_response.json()
                    posts = topic_data.get("post_stream", {}).get("posts", [])
                    
                    for post in posts:
                        raw = post.get("raw", "") or post.get("cooked", "")
                        if PLACEHOLDER_PATTERN.search(raw):
                            topics_with_issues.append({
                                "id": post["id"],
                                "topic_id": topic["id"],
                                "raw": raw
                            })
                
                time.sleep(0.3)
            
            print(f"Scanned page {page}, found {len(topics_with_issues)} posts with issues so far...")
            time.sleep(0.5)
        
        problem_posts = topics_with_issues
    
    print(f"\nFound {len(problem_posts)} posts with placeholder issues")
    
    if not problem_posts:
        print("No posts need fixing!")
        return
    
    fixed_count = 0
    failed_count = 0
    
    for post_info in problem_posts:
        post_id = post_info["id"]
        
        post_data = get_post_content(post_id)
        if not post_data:
            print(f"  Could not fetch post {post_id}")
            failed_count += 1
            continue
        
        original_content = post_data.get("raw", "")
        
        if not PLACEHOLDER_PATTERN.search(original_content):
            continue
        
        fixed_content = fix_placeholders(original_content)
        
        if fixed_content != original_content:
            print(f"  Fixing post {post_id}...")
            print(f"    Before: {original_content[:80]}...")
            print(f"    After:  {fixed_content[:80]}...")
            
            if update_post(post_id, fixed_content):
                fixed_count += 1
                print(f"    ✓ Fixed!")
            else:
                failed_count += 1
                print(f"    ✗ Failed to update")
        
        time.sleep(1)
    
    print()
    print("="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Posts fixed: {fixed_count}")
    print(f"Posts failed: {failed_count}")
    print("="*60)

if __name__ == "__main__":
    main()
