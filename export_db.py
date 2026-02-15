# export_db_api.py
import os
import json

# Get your Replit DB URL from environment
REPLIT_DB_URL = os.environ.get('REPLIT_DB_URL')

if not REPLIT_DB_URL:
    print("❌ REPLIT_DB_URL not found. Are you running this in Replit?")
    print("You can find it in Secrets tab: REPLIT_DB_URL")
    exit(1)

# List all keys
response = requests.get(f"{REPLIT_DB_URL}?prefix=")
keys = response.text.strip().split('\n') if response.text else []

print(f"Found {len(keys)} keys in database")

# Export all data
data = {}
for key in keys:
    if key:  # Skip empty lines
        response = requests.get(f"{REPLIT_DB_URL}/{key}")
        if response.status_code == 200:
            try:
                # Try to parse as JSON
                data[key] = response.json()
            except:
                # Store as plain text
                data[key] = response.text
            print(f"✅ Exported: {key}")

# Save to file
with open('db_export.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"\n✅ Successfully exported {len(data)} records to db_export.json")
print(f"📦 File size: {os.path.getsize('db_export.json')} bytes")