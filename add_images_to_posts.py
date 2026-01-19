#!/usr/bin/env python3
"""
Add relevant screenshots/images to 50% of Discourse Q&A answers randomly.
"""

import requests
import os
import random
import time
import glob

DISCOURSE_API_KEY = os.environ.get("DISCOURSE_API_KEY", "")
DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://adiology.discourse.group")
DISCOURSE_USERNAME = "system"

session = requests.Session()
session.headers.update({
    "Api-Key": DISCOURSE_API_KEY,
    "Api-Username": DISCOURSE_USERNAME
})

# Category to image mapping
CATEGORY_IMAGES = {
    "Google Ads": glob.glob("attached_assets/stock_images/google_ads_dashboard_*.jpg"),
    "Scripts": glob.glob("attached_assets/stock_images/code_programming_*.jpg"),
    "Automation": glob.glob("attached_assets/stock_images/data_analytics_*.jpg"),
    "N8N": glob.glob("attached_assets/stock_images/data_analytics_*.jpg"),
    "Email": glob.glob("attached_assets/stock_images/email_marketing_*.jpg"),
    "Data Scraping": glob.glob("attached_assets/stock_images/data_analytics_*.jpg"),
    "Proxies": glob.glob("attached_assets/stock_images/server_infrastructur_*.jpg"),
    "Virtual Machines": glob.glob("attached_assets/stock_images/server_infrastructur_*.jpg"),
}

# Default images for any category
DEFAULT_IMAGES = (
    glob.glob("attached_assets/stock_images/google_ads_dashboard_*.jpg") +
    glob.glob("attached_assets/stock_images/data_analytics_*.jpg")
)

def upload_image_to_discourse(image_path):
    """Upload an image to Discourse and return the URL"""
    try:
        with open(image_path, 'rb') as f:
            files = {
                'file': (os.path.basename(image_path), f, 'image/jpeg'),
                'type': (None, 'composer'),
                'synchronous': (None, 'true')
            }
            
            response = session.post(
                f"{DISCOURSE_URL}/uploads.json",
                files=files
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('url') or data.get('short_url')
            else:
                print(f"    Upload failed: {response.status_code}")
                return None
    except Exception as e:
        print(f"    Upload error: {e}")
        return None

def get_category_name(category_id, categories_map):
    """Get category name from ID"""
    return categories_map.get(category_id, "General")

def get_all_posts():
    """Fetch all Q&A posts (answers, not questions)"""
    all_posts = []
    categories_map = {}
    
    # First get categories
    try:
        response = session.get(f"{DISCOURSE_URL}/categories.json")
        if response.status_code == 200:
            cats = response.json().get('category_list', {}).get('categories', [])
            for cat in cats:
                categories_map[cat['id']] = cat['name']
    except:
        pass
    
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
            cat_id = topic.get('category_id')
            cat_name = get_category_name(cat_id, categories_map)
            
            # Get posts for this topic
            topic_response = session.get(f"{DISCOURSE_URL}/t/{topic_id}.json")
            if topic_response.status_code != 200:
                continue
            
            topic_data = topic_response.json()
            post_stream = topic_data.get('post_stream', {}).get('posts', [])
            
            # Skip the first post (question), get answers
            for post in post_stream[1:]:  # Skip first post
                post_id = post.get('id')
                raw = post.get('raw', '')
                
                # Skip if already has an image
                if '![' in raw or '<img' in raw:
                    continue
                
                all_posts.append({
                    'post_id': post_id,
                    'topic_id': topic_id,
                    'category': cat_name,
                    'raw': raw,
                    'title': topic.get('title', '')
                })
            
            time.sleep(0.3)
        
        page += 1
        time.sleep(0.5)
        
        if len(topics) < 100:
            break
    
    return all_posts

def get_image_for_category(category_name):
    """Get a relevant image for the category"""
    for key, images in CATEGORY_IMAGES.items():
        if key.lower() in category_name.lower():
            if images:
                return random.choice(images)
    
    # Fall back to default images
    if DEFAULT_IMAGES:
        return random.choice(DEFAULT_IMAGES)
    
    return None

def update_post_with_image(post_id, current_raw, image_url):
    """Update a post to include an image"""
    # Add image at the end of the post
    new_raw = current_raw.strip() + f"\n\n![Relevant Screenshot]({image_url})"
    
    for attempt in range(3):
        try:
            response = session.put(
                f"{DISCOURSE_URL}/posts/{post_id}.json",
                json={"post": {"raw": new_raw}}
            )
            if response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                print(f"    Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            if response.status_code == 200:
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
    print("ADDING IMAGES TO 50% OF DISCOURSE POSTS")
    print("="*60 + "\n")
    
    # Upload all images to Discourse first
    print("Uploading images to Discourse...")
    uploaded_images = {}
    
    all_local_images = (
        glob.glob("attached_assets/stock_images/google_ads_dashboard_*.jpg") +
        glob.glob("attached_assets/stock_images/email_marketing_*.jpg") +
        glob.glob("attached_assets/stock_images/data_analytics_*.jpg") +
        glob.glob("attached_assets/stock_images/server_infrastructur_*.jpg") +
        glob.glob("attached_assets/stock_images/code_programming_*.jpg")
    )
    
    for img_path in all_local_images:
        print(f"  Uploading: {os.path.basename(img_path)}...")
        url = upload_image_to_discourse(img_path)
        if url:
            uploaded_images[img_path] = url
            print(f"    ✓ Uploaded: {url}")
        else:
            print(f"    ✗ Failed")
        time.sleep(2)
    
    if not uploaded_images:
        print("No images uploaded! Check API permissions.")
        return
    
    print(f"\nUploaded {len(uploaded_images)} images\n")
    
    # Get all posts
    print("Fetching Q&A posts...")
    posts = get_all_posts()
    print(f"Found {len(posts)} posts without images\n")
    
    if not posts:
        print("No posts found!")
        return
    
    # Randomly select 50%
    num_to_update = len(posts) // 2
    selected_posts = random.sample(posts, num_to_update)
    
    print(f"Randomly selected {num_to_update} posts (50%)\n")
    
    success_count = 0
    
    for idx, post in enumerate(selected_posts, 1):
        post_id = post['post_id']
        category = post['category']
        title = post['title'][:40]
        raw = post['raw']
        
        print(f"[{idx}/{num_to_update}] Adding image to: {title}...")
        print(f"    Category: {category}")
        
        # Get a relevant image URL
        local_img = get_image_for_category(category)
        if local_img and local_img in uploaded_images:
            image_url = uploaded_images[local_img]
        else:
            # Use any uploaded image
            image_url = random.choice(list(uploaded_images.values()))
        
        if update_post_with_image(post_id, raw, image_url):
            success_count += 1
            print(f"    ✓ Added image")
        else:
            print(f"    ✗ Failed")
        
        time.sleep(3)
        
        if idx % 10 == 0:
            print(f"\n--- Progress: {idx}/{num_to_update} ({success_count} updated) ---\n")
            time.sleep(5)
    
    print("\n" + "="*60)
    print("IMAGE ADDITION COMPLETE!")
    print("="*60)
    print(f"✓ Successfully added images to: {success_count} posts")
    print(f"Total posts: {len(posts)}")
    print(f"Updated: ~50% ({num_to_update} selected)")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
