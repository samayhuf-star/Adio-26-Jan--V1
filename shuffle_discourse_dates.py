#!/usr/bin/env python3
"""
Shuffle Discourse topic timestamps to random dates within the last 30 days
"""

import requests
import os
import random
import time
from datetime import datetime, timedelta

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
            
        # Filter Q&A topics (skip system topics)
        qa_topics = [t for t in topics if t.get('title', '').startswith('[Q&A]')]
        all_topics.extend(qa_topics)
        
        page += 1
        time.sleep(0.5)
        
        if len(topics) < 100:
            break
    
    return all_topics

def generate_random_timestamp():
    """Generate a random timestamp within the last 30 days"""
    now = datetime.utcnow()
    days_ago = random.randint(1, 30)
    hours = random.randint(0, 23)
    minutes = random.randint(0, 59)
    seconds = random.randint(0, 59)
    
    random_date = now - timedelta(days=days_ago, hours=hours, minutes=minutes, seconds=seconds)
    return random_date.strftime("%Y-%m-%dT%H:%M:%SZ")

def update_topic_timestamp(topic_id, new_timestamp):
    """Update a topic's timestamp using Discourse API"""
    url = f"{DISCOURSE_URL}/t/{topic_id}/change-timestamp"
    
    # Convert ISO format to Unix timestamp
    dt = datetime.strptime(new_timestamp, "%Y-%m-%dT%H:%M:%SZ")
    unix_timestamp = str(int(dt.timestamp()))
    
    for attempt in range(3):
        try:
            # Use form data instead of JSON
            response = session.put(url, data={"timestamp": unix_timestamp})
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
    print("SHUFFLING DISCOURSE TOPIC TIMESTAMPS")
    print("="*60 + "\n")
    
    print("Fetching all Q&A topics...")
    topics = get_all_topics()
    print(f"Found {len(topics)} Q&A topics\n")
    
    if not topics:
        print("No topics found!")
        return
    
    # Shuffle topics to randomize processing order
    random.shuffle(topics)
    
    success_count = 0
    fail_count = 0
    
    for idx, topic in enumerate(topics, 1):
        topic_id = topic['id']
        title = topic['title'][:50]
        new_timestamp = generate_random_timestamp()
        
        print(f"[{idx}/{len(topics)}] Updating: {title}...")
        print(f"    New date: {new_timestamp}")
        
        if update_topic_timestamp(topic_id, new_timestamp):
            success_count += 1
            print("    ✓ Updated")
        else:
            fail_count += 1
            print("    ✗ Failed")
        
        # Rate limiting
        time.sleep(2)
        
        if idx % 10 == 0:
            print(f"\n--- Progress: {idx}/{len(topics)} ({success_count} success, {fail_count} failed) ---\n")
            time.sleep(3)
    
    print("\n" + "="*60)
    print("TIMESTAMP SHUFFLE COMPLETE!")
    print("="*60)
    print(f"✓ Successfully updated: {success_count} topics")
    print(f"✗ Failed: {fail_count} topics")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
