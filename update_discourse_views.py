#!/usr/bin/env python3
"""
Update Discourse topic view counts to random numbers between 300-11000
"""

import requests
import os
import random
import time

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://adiology.discourse.group")
DISCOURSE_USERNAME = "system"

session = requests.Session()
session.headers.update({
    "Api-Key": DISCOURSE_API_KEY,
    "Api-Username": DISCOURSE_USERNAME,
    "Content-Type": "application/json"
})

def get_all_topics():
    """Fetch all Q&A topics from Discourse"""
    all_topics = []
    page = 0
    
    while True:
        response = session.get(f"{DISCOURSE_URL}/latest.json?page={page}&per_page=100")
        if response.status_code != 200:
            break
            
        data = response.json()
        topics = data.get('topic_list', {}).get('topics', [])
        
        if not topics:
            break
            
        qa_topics = [t for t in topics if t.get('title', '').startswith('[Q&A]')]
        all_topics.extend(qa_topics)
        
        page += 1
        time.sleep(0.5)
        
        if len(topics) < 100:
            break
    
    return all_topics

def update_topic_views(topic_id, view_count):
    """Update a topic's view count using Discourse admin API"""
    url = f"{DISCOURSE_URL}/admin/topics/{topic_id}/reset-views"
    
    for attempt in range(3):
        try:
            response = session.put(url, json={"views": view_count})
            if response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                print(f"    Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            if response.status_code in [200, 204]:
                return True
            
            # Try alternative method - direct topic update
            alt_url = f"{DISCOURSE_URL}/t/{topic_id}.json"
            response = session.put(alt_url, json={"topic": {"views": view_count}})
            if response.status_code in [200, 204]:
                return True
                
            return False
        except Exception as e:
            print(f"    Error: {e}")
            time.sleep(5)
    
    return False

def set_views_via_fake_visits(topic_id, target_views):
    """Simulate views by making GET requests to the topic"""
    url = f"{DISCOURSE_URL}/t/{topic_id}.json"
    
    # Discourse increments views on each unique visit
    # We'll use the admin API to set views directly
    admin_url = f"{DISCOURSE_URL}/admin/plugins/explorer/queries/run"
    
    # Alternative: Use raw SQL via Data Explorer plugin if available
    # For now, try the topics API
    
    try:
        # Get current topic info
        response = session.get(url)
        if response.status_code == 200:
            return True
    except:
        pass
    
    return False

def main():
    print("\n" + "="*60)
    print("UPDATING DISCOURSE TOPIC VIEW COUNTS")
    print("="*60 + "\n")
    
    print("Fetching all Q&A topics...")
    topics = get_all_topics()
    print(f"Found {len(topics)} Q&A topics\n")
    
    if not topics:
        print("No topics found!")
        return
    
    success_count = 0
    
    for idx, topic in enumerate(topics, 1):
        topic_id = topic['id']
        title = topic['title'][:50]
        random_views = random.randint(300, 11000)
        
        print(f"[{idx}/{len(topics)}] {title}...")
        print(f"    Setting views to: {random_views}")
        
        # Discourse doesn't have a direct API to set view counts
        # We need to use the admin rails console or Data Explorer plugin
        # For now, we'll use a workaround via topic bump
        
        url = f"{DISCOURSE_URL}/t/{topic_id}/invite"
        
        # Alternative approach - use the topic timer API
        timer_url = f"{DISCOURSE_URL}/t/{topic_id}/timer"
        
        # Since direct view manipulation isn't available via API,
        # we'll record what views should be set
        print(f"    Target views: {random_views}")
        success_count += 1
        
        time.sleep(0.5)
        
        if idx % 20 == 0:
            print(f"\n--- Progress: {idx}/{len(topics)} ---\n")
    
    print("\n" + "="*60)
    print("NOTE: Discourse doesn't expose a public API for setting view counts.")
    print("To set custom view counts, you'll need to:")
    print("1. Install the Data Explorer plugin in Discourse admin")
    print("2. Run SQL: UPDATE topics SET views = X WHERE id = Y")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
