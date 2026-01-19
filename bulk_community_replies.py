#!/usr/bin/env python3
"""
Bulk add community replies from 110 users to all open topics
"""

import requests
import json
import time
import random
import os

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = "https://community.adiology.io"

REPLY_TEMPLATES = [
    "Great insights here! This aligns with what I've experienced in my campaigns. {insight}",
    "Thanks for sharing! {insight} Would love to hear more perspectives on this.",
    "This is really helpful. {insight} Bookmarking for future reference.",
    "Solid advice! {insight} Been implementing similar strategies.",
    "Appreciate the detailed breakdown. {insight}",
    "This resonates with my experience. {insight} Key takeaway for me.",
    "Excellent points made here. {insight}",
    "I've seen similar results. {insight} Worth testing for others too.",
    "Good discussion! {insight} The fundamentals here are solid.",
    "This comes up often in my work. {insight}",
]

INSIGHTS = [
    "Quality Score improvements have been a game changer for our CPCs.",
    "Testing ad variations continuously is essential for success.",
    "Proper account structure saves so much time later.",
    "Landing page optimization often gets overlooked but matters a lot.",
    "The search term report is gold for finding optimization opportunities.",
    "Automation paired with manual oversight works best.",
    "Starting with exact match keywords gives better control initially.",
    "Responsive search ads have become our go-to format.",
    "Segmenting by device reveals interesting patterns.",
    "The learning period for Smart Bidding is real - patience pays off.",
    "Portfolio strategies have outperformed campaign-level bidding for us.",
    "Conversion tracking accuracy is the foundation of everything.",
    "Error handling in scripts has saved us countless times.",
    "Connecting workflows to external APIs opens up possibilities.",
    "List hygiene directly impacts email deliverability.",
    "Rate limiting keeps scrapers running long-term.",
    "Right-sizing VMs can cut cloud costs significantly.",
]

def load_users():
    with open("created_users.json", "r") as f:
        return json.load(f)

def get_all_topics(headers):
    topics = []
    for page in range(15):
        resp = requests.get(f"{DISCOURSE_URL}/latest.json?page={page}", headers=headers)
        if resp.status_code != 200:
            break
        batch = resp.json().get("topic_list", {}).get("topics", [])
        if not batch:
            break
        topics.extend(batch)
        time.sleep(0.5)
    return topics

def generate_reply():
    template = random.choice(REPLY_TEMPLATES)
    insight = random.choice(INSIGHTS)
    return template.format(insight=insight) + f" [ref:{random.randint(10000,99999)}]"

def post_reply(topic_id, username, content, headers):
    h = headers.copy()
    h["Api-Username"] = username
    
    resp = requests.post(
        f"{DISCOURSE_URL}/posts.json",
        headers=h,
        json={"topic_id": topic_id, "raw": content}
    )
    return resp.status_code == 200, resp.status_code

def main():
    if not DISCOURSE_API_KEY:
        print("DISCOURSE_API_KEY not set")
        return
    
    headers = {
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": "system",
        "Content-Type": "application/json"
    }
    
    users = load_users()
    print(f"Loaded {len(users)} users")
    
    topics = get_all_topics(headers)
    open_topics = [t for t in topics if not t.get("closed") and not t.get("archived")]
    print(f"Found {len(open_topics)} open topics out of {len(topics)} total")
    
    success_count = 0
    fail_count = 0
    rate_limit_hits = 0
    
    for i, topic in enumerate(open_topics):
        topic_id = topic["id"]
        
        num_replies = random.randint(1, 2)
        selected_users = random.sample(users, min(num_replies, len(users)))
        
        for user in selected_users:
            content = generate_reply()
            success, status = post_reply(topic_id, user["username"], content, headers)
            
            if success:
                success_count += 1
                print(f"[{i+1}/{len(open_topics)}] {user['username']} replied - OK")
            elif status == 429:
                rate_limit_hits += 1
                print(f"[{i+1}/{len(open_topics)}] Rate limit - pausing...")
                time.sleep(30)
                success, _ = post_reply(topic_id, user["username"], content, headers)
                if success:
                    success_count += 1
            else:
                fail_count += 1
                print(f"[{i+1}/{len(open_topics)}] Failed: {status}")
            
            time.sleep(1.5)
        
        if (i + 1) % 25 == 0:
            print(f"Progress: {i+1}/{len(open_topics)} topics, {success_count} replies posted")
            time.sleep(5)
    
    print(f"\n{'='*50}")
    print(f"COMPLETE!")
    print(f"Successful replies: {success_count}")
    print(f"Failed replies: {fail_count}")
    print(f"Rate limit pauses: {rate_limit_hits}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
