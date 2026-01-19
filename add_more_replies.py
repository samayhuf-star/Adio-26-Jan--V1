#!/usr/bin/env python3
"""
Add more replies to Discourse topics with better rate limiting
"""

import requests
import json
import time
import random
import os
from typing import Dict, List

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = "https://community.adiology.io"

REPLY_INTROS = [
    "Great discussion here!", "This is really helpful.", "Thanks for sharing this.",
    "I've been thinking about this too.", "Excellent points made here.",
    "Really appreciate this breakdown.", "This resonates with my experience.",
    "Interesting perspective on this.", "Good question to explore.",
    "This comes up often in my work.", "I had similar thoughts on this.",
    "Adding to the conversation here.", "Building on what was said.",
    "From my side of things,", "Worth noting from experience,",
    "This is a common challenge.", "I've seen this pattern before.",
    "To add another angle,", "Something I've observed:",
    "In practice, I've found", "Real-world example:",
]

TOPIC_RESPONSES = {
    "Google Ads": [
        "Quality Score improvements take time but pay dividends in lower CPCs.",
        "Testing ad copy continuously is essential - we run 3-4 variants always.",
        "Match types have evolved - broad match with Smart Bidding can work well now.",
        "Landing page experience often gets overlooked but impacts everything.",
        "Segmenting by device gives much better insights into performance.",
        "Extensions are free real estate - use all that apply to your business.",
        "The search term report is gold for finding negative keywords.",
        "Account structure matters more than people realize.",
        "Responsive search ads have become our go-to format.",
        "Competitor analysis helps with positioning your ads.",
    ],
    "Scripts": [
        "Start simple and iterate - complex scripts break more often.",
        "Error handling saved us countless times with automated scripts.",
        "The preview function is essential before going live.",
        "Connecting to Sheets opens up powerful reporting possibilities.",
        "Scheduling during off-peak hours reduces issues significantly.",
        "Logging everything makes debugging much easier later.",
        "Template scripts are a great starting point for custom work.",
        "Version control for scripts is often overlooked but crucial.",
        "Breaking scripts into functions improves maintainability.",
        "Testing on small data sets first prevents major issues.",
    ],
    "Automation": [
        "Giving algorithms enough data is the key to success.",
        "The learning period is real - patience is required.",
        "Portfolio strategies often outperform campaign-level bidding.",
        "Hybrid approaches can work better than full automation.",
        "Monitoring closely in the first weeks prevents surprises.",
        "Setting realistic targets from the start is crucial.",
        "Conversion tracking accuracy makes or breaks automation.",
        "Seasonality adjustments help automation perform better.",
        "Testing on a subset before full rollout is wise.",
        "Regular review of automated decisions catches issues early.",
    ],
    "N8N": [
        "Self-hosting gives full control over data and workflows.",
        "The HTTP node handles almost any API integration.",
        "Error handling in workflows prevents silent failures.",
        "Documenting workflows saves time for future maintenance.",
        "N8N's flexibility for custom logic is impressive.",
        "Combining triggers creates powerful automation chains.",
        "Testing each node individually helps debugging.",
        "Credential management is straightforward once set up.",
        "The community templates are great starting points.",
        "Version control for workflows helps with changes.",
    ],
    "Email": [
        "Segmentation is where the real engagement gains happen.",
        "Welcome sequences set expectations for the relationship.",
        "A/B testing subject lines consistently improves results.",
        "Mobile optimization is non-negotiable at this point.",
        "List hygiene directly impacts deliverability rates.",
        "Timing tests reveal surprising insights about your audience.",
        "Personalization beyond first name makes a difference.",
        "Clear CTAs drive the actions you want.",
        "Monitoring engagement metrics helps adjust strategy.",
        "Re-engagement campaigns can revive dormant subscribers.",
    ],
    "Scraping": [
        "Respecting rate limits keeps scrapers running long-term.",
        "Rotating proxies is essential when scaling up.",
        "Structured extraction requires careful element selection.",
        "Headless browsers handle dynamic content better.",
        "Storing raw data before parsing prevents rework.",
        "Monitoring for site changes prevents broken scrapers.",
        "Legal considerations vary by jurisdiction and use case.",
        "Caching reduces load and improves performance.",
        "Error recovery logic handles temporary failures.",
        "Data validation catches extraction issues early.",
    ],
    "Proxies": [
        "Residential proxies are worth the premium for reliability.",
        "Geographic targeting matters for accurate data collection.",
        "Monitoring proxy health saves debugging time.",
        "Backup providers are essential for continuity.",
        "Cost per request adds up - optimize where possible.",
        "IP rotation patterns affect success rates.",
        "Authentication methods vary by provider.",
        "Bandwidth limits can surprise if not tracked.",
        "Response time impacts overall operation speed.",
        "Testing before commitment helps choose providers.",
    ],
    "VMs": [
        "Right-sizing VMs can significantly reduce costs.",
        "Spot instances are excellent for batch processing.",
        "Proper monitoring prevents surprise billing.",
        "Automation of infrastructure pays for itself quickly.",
        "Security groups require regular review.",
        "Backup strategies should be tested periodically.",
        "Container orchestration simplifies deployment.",
        "Auto-scaling handles traffic variations well.",
        "Region selection affects latency and costs.",
        "Documentation of setup helps with reproduction.",
    ],
}

def load_users():
    try:
        with open("created_users.json", "r") as f:
            return json.load(f)
    except:
        return []

def get_topics(headers: Dict) -> List[Dict]:
    topics = []
    for page in range(10):
        try:
            response = requests.get(f"{DISCOURSE_URL}/latest.json?page={page}", headers=headers)
            if response.status_code != 200:
                break
            data = response.json()
            topic_list = data.get("topic_list", {}).get("topics", [])
            if not topic_list:
                break
            topics.extend(topic_list)
            time.sleep(0.5)
        except Exception as e:
            print(f"Error: {e}")
            break
    return topics

def get_category_key(title: str) -> str:
    title_lower = title.lower()
    if "script" in title_lower:
        return "Scripts"
    if "automat" in title_lower or "bid" in title_lower or "smart" in title_lower:
        return "Automation"
    if "n8n" in title_lower or "workflow" in title_lower:
        return "N8N"
    if "email" in title_lower or "newsletter" in title_lower:
        return "Email"
    if "scrap" in title_lower or "crawl" in title_lower:
        return "Scraping"
    if "proxy" in title_lower or "proxies" in title_lower:
        return "Proxies"
    if "vm" in title_lower or "cloud" in title_lower or "server" in title_lower:
        return "VMs"
    return "Google Ads"

def generate_unique_reply(topic_title: str, index: int) -> str:
    category = get_category_key(topic_title)
    responses = TOPIC_RESPONSES.get(category, TOPIC_RESPONSES["Google Ads"])
    intro = REPLY_INTROS[index % len(REPLY_INTROS)]
    content = responses[index % len(responses)]
    additions = [
        f" Been seeing this in accounts we manage.",
        f" Would love to hear other perspectives.",
        f" This has been a game changer for us.",
        f" Definitely worth testing.",
        f" Key insight for anyone starting out.",
        f" This applies across different industries.",
        f" Something we discuss with clients often.",
        f" Important consideration for scaling.",
    ]
    return f"{intro} {content}{additions[index % len(additions)]}"

def post_reply(topic_id: int, username: str, content: str, headers: Dict) -> bool:
    try:
        h = headers.copy()
        h["Api-Username"] = username
        response = requests.post(
            f"{DISCOURSE_URL}/posts.json",
            headers=h,
            json={"topic_id": topic_id, "raw": content}
        )
        return response.status_code == 200
    except:
        return False

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
    if not users:
        print("No users found in created_users.json")
        return
    
    print(f"Loaded {len(users)} users")
    
    topics = get_topics(headers)
    print(f"Found {len(topics)} topics")
    
    successful = 0
    failed = 0
    reply_index = 0
    
    for i, topic in enumerate(topics):
        topic_id = topic["id"]
        topic_title = topic.get("title", "")
        
        user = random.choice(users)
        content = generate_unique_reply(topic_title, reply_index)
        reply_index += 1
        
        if post_reply(topic_id, user["username"], content, headers):
            successful += 1
            print(f"[{i+1}/{len(topics)}] Reply by {user['username']} - OK")
        else:
            failed += 1
            print(f"[{i+1}/{len(topics)}] Reply failed")
        
        time.sleep(2)
        
        if (i + 1) % 30 == 0:
            print("Pausing for rate limit...")
            time.sleep(10)
    
    print(f"\nDone! Successful: {successful}, Failed: {failed}")

if __name__ == "__main__":
    main()
