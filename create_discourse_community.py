#!/usr/bin/env python3
"""
DISCOURSE COMMUNITY BUILDER
Creates 110+ realistic users and has them respond to existing topics
"""

import requests
import json
import time
import random
import os
from typing import Dict, List, Optional
from datetime import datetime

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = "https://community.adiology.io"

FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
    "Blake", "Cameron", "Drew", "Emerson", "Finley", "Harper", "Jamie", "Kendall",
    "Logan", "Mason", "Parker", "Peyton", "Reese", "Rowan", "Sage", "Skyler",
    "Sydney", "Devon", "Elliott", "Hayden", "Jesse", "Kai", "Lane", "Micah",
    "Noah", "Phoenix", "River", "Sam", "Spencer", "Tatum", "Tyler", "Wren",
    "Marcus", "David", "Sarah", "Emily", "Michael", "Jessica", "Chris", "Ashley",
    "Matthew", "Jennifer", "Andrew", "Amanda", "Josh", "Nicole", "Ryan", "Stephanie",
    "Brian", "Michelle", "Kevin", "Heather", "Eric", "Rebecca", "Daniel", "Rachel",
    "Steve", "Laura", "Jason", "Megan", "Justin", "Lauren", "Brandon", "Elizabeth",
    "Robert", "Lisa", "William", "Susan", "James", "Karen", "John", "Patricia",
    "Richard", "Linda", "Thomas", "Barbara", "Charles", "Nancy", "Mark", "Sandra",
    "Paul", "Carol", "George", "Ruth", "Kenneth", "Sharon", "Edward", "Helen",
    "Frank", "Donna", "Priya", "Raj", "Wei", "Ming", "Yuki", "Kenji", "Amir",
    "Fatima", "Hassan", "Layla", "Omar", "Noor", "Sanjay", "Isha", "Vikram", "Anita"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Chen", "Kim", "Patel", "Singh", "Kumar",
    "Shah", "Sharma", "Tanaka", "Yamamoto", "Sato", "Ali", "Ahmed", "Hassan",
    "Müller", "Schmidt", "Weber", "Meyer", "Wagner", "Becker", "Hoffmann", "Fischer",
    "Silva", "Santos", "Ferreira", "Costa", "Oliveira", "Rossi", "Ferrari", "Esposito"
]

USERNAMES_SUFFIXES = ["_ads", "_ppc", "_digital", "_marketing", "Growth", "Media", "Pro", "Expert", "Guru", "_seo", "_sem", ""]

JOB_TITLES = [
    "PPC Manager", "Digital Marketing Specialist", "Google Ads Expert", "Performance Marketing Manager",
    "SEM Specialist", "Paid Search Analyst", "Growth Marketer", "Marketing Director", 
    "Ecommerce Manager", "Agency Owner", "Freelance Consultant", "Media Buyer",
    "Campaign Manager", "Marketing Coordinator", "Advertising Specialist", "Brand Manager",
    "Content Strategist", "Analytics Manager", "Marketing Analyst", "Business Owner"
]

COMPANIES = [
    "TechStartup Inc", "Digital Agency Co", "Freelance", "Self-employed", "Marketing Solutions",
    "Growth Partners", "AdTech Ventures", "Commerce Hub", "Brand Builders", "Click Conversions",
    "Lead Gen Pro", "Scale Marketing", "Performance Lab", "ROI Masters", "Campaign Central",
    "Media Max", "Digital First", "Online Growth", "AdScale Inc", "Conversion Kings"
]

EXPERIENCE_LEVELS = [
    "2 years in PPC", "5+ years Google Ads", "Marketing veteran", "New to Google Ads",
    "10 years digital marketing", "3 years agency experience", "Certified Google Ads specialist",
    "Former Google employee", "Running ads since 2015", "Started last year"
]

REPLY_TEMPLATES = {
    "agreement": [
        "This is spot on. I've seen the same results in my campaigns.",
        "Completely agree with this approach. Been doing something similar.",
        "Great advice! This matches what I've experienced.",
        "Yes! This is exactly what worked for me too.",
        "Solid strategy. I can confirm this works well.",
        "This is accurate. I've tested this extensively.",
        "Couldn't agree more. This is the right approach.",
    ],
    "experience": [
        "In my experience managing ${budget} monthly, {topic_insight}.",
        "After running campaigns for {years} years, I've found that {topic_insight}.",
        "We implemented this at our agency and saw {metric} improvement.",
        "I tested this approach last quarter and the results were impressive.",
        "Been using this strategy for our clients with great success.",
        "This helped us reduce CPA by {percent}% on our main accounts.",
    ],
    "addition": [
        "Great points! I'd also add that {additional_tip}.",
        "This is helpful. One thing I'd suggest is {additional_tip}.",
        "To build on this, {additional_tip}.",
        "Solid advice. Additionally, {additional_tip}.",
        "Worth mentioning that {additional_tip}.",
    ],
    "question": [
        "This is helpful! Have you tried {alternative_approach}?",
        "Great insights. How does this work with {related_topic}?",
        "Interesting approach. What about {edge_case}?",
        "Thanks for sharing! Does this apply to {specific_scenario}?",
    ],
    "gratitude": [
        "Thanks for sharing this! Really helpful for my current project.",
        "This is exactly what I needed. Appreciate the detailed explanation!",
        "Saved this post - super valuable information.",
        "Great breakdown! This community is so helpful.",
        "Perfect timing - I was just dealing with this exact issue.",
    ]
}

TOPIC_INSIGHTS = {
    "Google Ads Fundamentals": [
        "Quality Score is the key metric to focus on first",
        "starting with exact match keywords gives better control",
        "ad extensions alone can boost CTR by 15-20%",
        "responsive search ads outperform expanded text ads now",
        "landing page experience is often underrated",
        "proper account structure saves hours of optimization later"
    ],
    "Google Ads Scripts": [
        "error handling is crucial for scripts running unattended",
        "starting with simple scripts and iterating is the way to go",
        "the preview function has saved me countless times",
        "connecting to Google Sheets opens up so many possibilities",
        "scheduling scripts during off-peak hours reduces issues",
        "logging everything makes debugging so much easier"
    ],
    "Google Ads Automation": [
        "giving the algorithm enough conversion data is essential",
        "portfolio bid strategies work better than campaign-level",
        "the learning period is real - patience pays off",
        "setting realistic CPA targets from the start helps",
        "hybrid approaches often work better than full automation",
        "monitoring the first week closely prevents major issues"
    ],
    "N8N Automation & Integration": [
        "N8N's flexibility for custom workflows is unmatched",
        "self-hosting gives you full control over your data",
        "the HTTP node is incredibly powerful for custom APIs",
        "error handling in workflows prevents silent failures",
        "combining N8N with Google Ads API is a game changer",
        "documenting your workflows saves time later"
    ],
    "Email Marketing": [
        "segmentation is the key to higher engagement",
        "welcome sequences set the tone for the relationship",
        "A/B testing subject lines consistently improves open rates",
        "mobile optimization is non-negotiable now",
        "list hygiene directly impacts deliverability",
        "timing and frequency need constant testing"
    ],
    "Data Scraping & Research": [
        "respecting rate limits keeps your scrapers running",
        "rotating proxies is essential for scale",
        "structured data extraction requires careful planning",
        "headless browsers handle JavaScript-heavy sites better",
        "storing raw data before parsing saves rework",
        "monitoring for site changes prevents broken scrapers"
    ],
    "Proxies & Infrastructure": [
        "residential proxies are worth the extra cost for reliability",
        "proper IP rotation prevents blocks",
        "geographic targeting matters for accurate data",
        "monitoring proxy health saves debugging time",
        "backup proxy providers are essential",
        "cost per request adds up - optimize early"
    ],
    "VMs & Cloud Infrastructure": [
        "right-sizing VMs can cut costs significantly",
        "spot instances are great for batch processing",
        "proper monitoring prevents surprise bills",
        "automation of infrastructure is worth the setup time",
        "security groups need regular review",
        "backup strategies should be tested regularly"
    ]
}

ADDITIONAL_TIPS = [
    "testing ad copy variations frequently",
    "checking search term reports weekly",
    "setting up automated alerts for anomalies",
    "using negative keyword lists across campaigns",
    "optimizing for mobile separately",
    "segmenting by device type for better insights",
    "reviewing audience insights regularly",
    "keeping an eye on competitor activity",
    "documenting what works for future reference",
    "sharing learnings with the team"
]

ALTERNATIVE_APPROACHES = [
    "using broad match with smart bidding",
    "splitting by match type for more control",
    "running experiments before full rollout",
    "testing with a smaller budget first",
    "combining this with remarketing",
    "A/B testing landing pages alongside"
]

BUDGETS = ["$5k", "$10k", "$25k", "$50k", "$100k+"]
YEARS = ["2", "3", "5", "7", "10"]
METRICS = ["25%", "30%", "40%", "50%"]
PERCENTS = ["15", "20", "25", "30", "35"]

def generate_users(count: int) -> List[Dict]:
    """Generate realistic user profiles"""
    users = []
    used_usernames = set()
    
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        suffix = random.choice(USERNAMES_SUFFIXES)
        
        base_username = f"{first.lower()}{last.lower()[:3]}{suffix}".replace("_", "")
        username = base_username
        counter = 1
        while username in used_usernames:
            username = f"{base_username}{counter}"
            counter += 1
        used_usernames.add(username)
        
        user = {
            "username": username[:20],
            "name": f"{first} {last}",
            "email": f"{username}@example.com",
            "password": f"TempPass{random.randint(10000, 99999)}!",
            "title": random.choice(JOB_TITLES),
            "company": random.choice(COMPANIES),
            "experience": random.choice(EXPERIENCE_LEVELS)
        }
        users.append(user)
    
    return users

def generate_reply(category: str, topic_title: str) -> str:
    """Generate a contextual reply based on category and topic"""
    reply_type = random.choice(list(REPLY_TEMPLATES.keys()))
    template = random.choice(REPLY_TEMPLATES[reply_type])
    
    category_insights = TOPIC_INSIGHTS.get(category, TOPIC_INSIGHTS["Google Ads Fundamentals"])
    
    reply = template
    reply = reply.replace("{topic_insight}", random.choice(category_insights))
    reply = reply.replace("{additional_tip}", random.choice(ADDITIONAL_TIPS))
    reply = reply.replace("{alternative_approach}", random.choice(ALTERNATIVE_APPROACHES))
    reply = reply.replace("${budget}", random.choice(BUDGETS))
    reply = reply.replace("{years}", random.choice(YEARS))
    reply = reply.replace("{metric}", random.choice(METRICS))
    reply = reply.replace("{percent}", random.choice(PERCENTS))
    reply = reply.replace("{related_topic}", "Performance Max campaigns")
    reply = reply.replace("{edge_case}", "smaller accounts with limited data")
    reply = reply.replace("{specific_scenario}", "ecommerce with seasonal products")
    
    return reply

def create_user_discourse(user: Dict, headers: Dict) -> Optional[Dict]:
    """Create a user in Discourse"""
    try:
        payload = {
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "password": user["password"],
            "active": True,
            "approved": True,
            "staged": False
        }
        
        response = requests.post(
            f"{DISCOURSE_URL}/users.json",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Created user: {user['username']}")
            return data
        else:
            print(f"Failed to create {user['username']}: {response.status_code} - {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"Error creating user {user['username']}: {e}")
        return None

def get_all_topics(headers: Dict) -> List[Dict]:
    """Fetch all topics from Discourse"""
    topics = []
    page = 0
    
    while True:
        try:
            response = requests.get(
                f"{DISCOURSE_URL}/latest.json?page={page}",
                headers=headers
            )
            
            if response.status_code != 200:
                break
                
            data = response.json()
            topic_list = data.get("topic_list", {}).get("topics", [])
            
            if not topic_list:
                break
                
            topics.extend(topic_list)
            page += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error fetching topics: {e}")
            break
    
    return topics

def post_reply_as_user(topic_id: int, username: str, content: str, headers: Dict) -> bool:
    """Post a reply to a topic as a specific user using impersonation"""
    try:
        impersonate_headers = headers.copy()
        impersonate_headers["Api-Username"] = username
        
        payload = {
            "topic_id": topic_id,
            "raw": content
        }
        
        response = requests.post(
            f"{DISCOURSE_URL}/posts.json",
            headers=impersonate_headers,
            json=payload
        )
        
        if response.status_code == 200:
            return True
        elif response.status_code == 403:
            return False
        else:
            print(f"Reply failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error posting reply: {e}")
        return False

def get_category_for_topic(topic: Dict, categories: Dict) -> str:
    """Get category name for a topic"""
    cat_id = topic.get("category_id")
    return categories.get(cat_id, "Google Ads Fundamentals")

def get_categories(headers: Dict) -> Dict:
    """Fetch categories from Discourse"""
    try:
        response = requests.get(f"{DISCOURSE_URL}/categories.json", headers=headers)
        if response.status_code == 200:
            data = response.json()
            categories = {}
            for cat in data.get("category_list", {}).get("categories", []):
                categories[cat["id"]] = cat["name"]
            return categories
    except Exception as e:
        print(f"Error fetching categories: {e}")
    return {}

def main():
    if not DISCOURSE_API_KEY:
        print("ERROR: DISCOURSE_API_KEY not set")
        return
    
    headers = {
        "Api-Key": DISCOURSE_API_KEY,
        "Api-Username": "system",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("DISCOURSE COMMUNITY BUILDER")
    print("=" * 60)
    
    print("\n[1/4] Generating 110 user profiles...")
    users = generate_users(110)
    print(f"Generated {len(users)} user profiles")
    
    print("\n[2/4] Creating users in Discourse...")
    created_users = []
    for i, user in enumerate(users):
        result = create_user_discourse(user, headers)
        if result:
            created_users.append(user)
        
        if (i + 1) % 10 == 0:
            print(f"Progress: {i + 1}/{len(users)} users processed")
        
        time.sleep(1)
    
    print(f"\nSuccessfully created {len(created_users)} users")
    
    print("\n[3/4] Fetching existing topics and categories...")
    categories = get_categories(headers)
    topics = get_all_topics(headers)
    print(f"Found {len(topics)} topics across {len(categories)} categories")
    
    print("\n[4/4] Adding community replies...")
    successful_replies = 0
    failed_replies = 0
    impersonation_works = None
    
    for topic in topics:
        topic_id = topic["id"]
        topic_title = topic.get("title", "")
        category_name = get_category_for_topic(topic, categories)
        
        num_replies = random.randint(1, 2)
        repliers = random.sample(created_users, min(num_replies, len(created_users)))
        
        for user in repliers:
            reply_content = generate_reply(category_name, topic_title)
            
            success = post_reply_as_user(topic_id, user["username"], reply_content, headers)
            
            if success:
                successful_replies += 1
                if impersonation_works is None:
                    impersonation_works = True
                    print("Impersonation is working!")
            else:
                failed_replies += 1
                if impersonation_works is None:
                    impersonation_works = False
                    print("Impersonation not available - will need admin action")
            
            time.sleep(0.5)
        
        if (topics.index(topic) + 1) % 20 == 0:
            print(f"Processed {topics.index(topic) + 1}/{len(topics)} topics")
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Users created: {len(created_users)}")
    print(f"Successful replies: {successful_replies}")
    print(f"Failed replies: {failed_replies}")
    
    if not impersonation_works and failed_replies > 0:
        print("\n" + "=" * 60)
        print("ADMIN ACTION REQUIRED")
        print("=" * 60)
        print("""
The API key doesn't have impersonation permissions.
To enable user-specific posting, you need to:

1. Go to Discourse Admin > API > Keys
2. Edit your API key
3. Change 'User Level' to 'All Users'
4. Enable the 'Impersonate' scope
5. Re-run this script

Alternatively, use Data Explorer plugin to reassign posts.
        """)
    
    with open("created_users.json", "w") as f:
        json.dump(created_users, f, indent=2)
    print("\nUser data saved to created_users.json")

if __name__ == "__main__":
    main()
