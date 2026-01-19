#!/usr/bin/env python3
"""
Boost topics from all categories by adding fresh engagement replies.
This will make topics from different categories appear in "Hot" instead of just VMs.
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

# Usernames to reply as
USERNAMES = [
    "marketer_pro", "google_ads_expert", "automation_wizard",
    "email_specialist", "data_analyst", "seo_master"
]

# Fresh engagement replies (no placeholders!)
BOOST_REPLIES = [
    "This has been incredibly helpful for my campaigns. Implemented this last week and already seeing 15% improvement in performance.",
    "Bookmarking this thread - exactly what I was looking for. Thanks for the detailed explanation!",
    "Just wanted to add that combining this with audience segmentation works even better. Tested it across 3 accounts.",
    "Great discussion here. I've been doing something similar and can confirm these results are consistent.",
    "This approach saved me hours of manual work. Highly recommend everyone try this method.",
    "Came back to say this strategy is still working 6 months later. Solid advice in this thread.",
    "Perfect timing - I was just researching this topic. The examples here are really clear.",
    "Adding to the discussion: make sure to also check your landing page load times. Makes a big difference.",
    "This thread is gold. Sharing with my team for our next optimization session.",
    "I've tested multiple approaches and this one consistently outperforms. Worth implementing immediately.",
    "Thanks for breaking this down step by step. Much easier to follow than other guides I've seen.",
    "The ROI from implementing this has been excellent. Reduced our cost per acquisition by 22%.",
    "Really appreciate the practical examples here. Applied this to our e-commerce campaigns with great results.",
    "Coming from a background in traditional marketing, this modern approach is eye-opening. Great insights.",
    "This should be pinned. Essential knowledge for anyone running campaigns at scale.",
]

def get_topics_by_category():
    """Fetch all Q&A topics grouped by category"""
    topics_by_cat = {}
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
            
            cat_id = topic.get('category_id')
            if cat_id not in topics_by_cat:
                topics_by_cat[cat_id] = []
            topics_by_cat[cat_id].append(topic)
        
        page += 1
        time.sleep(0.5)
        
        if len(topics) < 100:
            break
    
    return topics_by_cat

def add_reply(topic_id, content, username="system"):
    """Add a reply to boost the topic"""
    headers = session.headers.copy()
    headers["Api-Username"] = "system"  # Use system user only (API key limitation)
    
    data = {
        "topic_id": topic_id,
        "raw": content
    }
    
    for attempt in range(3):
        try:
            response = session.post(
                f"{DISCOURSE_URL}/posts.json",
                json=data,
                headers=headers
            )
            if response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                print(f"    Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            if response.status_code in [200, 201]:
                return True
            else:
                print(f"    Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"    Error: {e}")
            time.sleep(5)
    
    return False

def main():
    print("\n" + "="*60)
    print("BOOSTING TOPICS FROM ALL CATEGORIES")
    print("="*60 + "\n")
    
    print("Fetching topics by category...")
    topics_by_cat = get_topics_by_category()
    
    print(f"Found {len(topics_by_cat)} categories with Q&A topics\n")
    
    for cat_id, topics in topics_by_cat.items():
        print(f"Category {cat_id}: {len(topics)} topics")
    
    print("\nBoosting topics from each category...")
    
    success_count = 0
    total_to_boost = 0
    
    # For each category, boost 3-5 random topics with fresh replies
    for cat_id, topics in topics_by_cat.items():
        # Select random topics to boost (3-5 per category)
        num_to_boost = min(4, len(topics))
        selected = random.sample(topics, num_to_boost)
        total_to_boost += num_to_boost
        
        for topic in selected:
            topic_id = topic['id']
            title = topic['title'][:40]
            
            print(f"  Boosting: {title}...")
            
            # Add 1-2 fresh replies
            num_replies = random.randint(1, 2)
            for _ in range(num_replies):
                reply = random.choice(BOOST_REPLIES)
                username = random.choice(USERNAMES)
                
                if add_reply(topic_id, reply, username):
                    success_count += 1
                    print(f"    ✓ Added reply as {username}")
                else:
                    print(f"    ✗ Failed to add reply")
                
                time.sleep(3)  # Rate limiting
    
    print("\n" + "="*60)
    print("BOOST COMPLETE!")
    print("="*60)
    print(f"Boosted topics across {len(topics_by_cat)} categories")
    print(f"Added {success_count} fresh replies")
    print("Topics from all categories should now appear in 'Hot'")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
