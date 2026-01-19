#!/usr/bin/env python3
"""
Test script for CSV export functionality
Tests the /export-csv endpoint with sample data
"""

import requests
import json
from export_csv_fix import CampaignExportRequest

# Test data - minimal valid campaign
test_request = {
    "campaign_name": "Test Campaign",
    "ad_groups": [
        {
            "name": "Test Ad Group",
            "keywords": ["plumber", "electrician", "hvac"],
            "ads": [
                {
                    "type": "rsa",
                    "headline1": "Professional Plumber",
                    "headline2": "Expert Service",
                    "headline3": "Licensed & Insured",
                    "description1": "Professional plumbing services you can trust.",
                    "description2": "Fast, reliable service available 24/7.",
                    "finalUrl": "https://example.com"
                }
            ],
            "negativeKeywords": []
        }
    ],
    "location_targeting": None,
    "budget": None,
    "bidding_strategy": "MANUAL_CPC"
}

def test_export_csv():
    """Test the /export-csv endpoint"""
    url = "http://localhost:8000/export-csv"
    
    print("Testing CSV export endpoint...")
    print(f"URL: {url}")
    print(f"Request: {json.dumps(test_request, indent=2)}")
    print("\n" + "="*50 + "\n")
    
    try:
        response = requests.post(
            url,
            json=test_request,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"Content-Disposition: {response.headers.get('Content-Disposition', 'N/A')}")
        print("\n" + "="*50 + "\n")
        
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            
            if 'text/csv' in content_type:
                # Success - CSV file
                csv_content = response.text
                print("✅ CSV Export Successful!")
                print(f"CSV Length: {len(csv_content)} characters")
                print(f"First 200 chars: {csv_content[:200]}")
                
                # Check for UTF-8 BOM
                if csv_content.startswith('\ufeff'):
                    print("✅ UTF-8 BOM present")
                else:
                    print("⚠️  UTF-8 BOM missing")
                
                # Check line endings
                if '\r\n' in csv_content:
                    print("✅ CRLF line endings present")
                else:
                    print("⚠️  CRLF line endings not found (using LF)")
                
                # Count rows
                rows = csv_content.split('\r\n') if '\r\n' in csv_content else csv_content.split('\n')
                print(f"Total rows: {len(rows)}")
                
                # Save to file for inspection
                filename = "test_export.csv"
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(csv_content)
                print(f"✅ CSV saved to: {filename}")
                
            else:
                # JSON response (validation errors)
                error_data = response.json()
                print("❌ CSV Export Failed - Validation Errors:")
                print(json.dumps(error_data, indent=2))
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server is not running")
        print("Start the server with: cd backend && python3 ad_generator_api.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_export_csv()

