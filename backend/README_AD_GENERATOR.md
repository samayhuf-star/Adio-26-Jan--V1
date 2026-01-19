# Ad Generator Fallback - Python Script

## Overview
This Python script provides a fallback ad generation system that properly differentiates between **services** and **products**, generating appropriate ad copy for each type.

## Features

### Business Type Detection
- **Automatic Detection**: Analyzes keywords and industry to determine if ads should be for products or services
- **Intent Recognition**: Detects emergency, local, product, and service intents
- **Smart Fallback**: Defaults to service if ambiguous (most businesses are service-based)

### Service Ads
- Professional, trust-focused headlines
- Emphasis on licensing, expertise, reliability
- Local/geographic targeting support
- 24/7 availability messaging
- Free estimates and quotes

### Product Ads
- Purchase-focused headlines
- Price and value messaging
- Shipping and delivery information
- Shop/buy CTAs
- Product quality and reviews

### Emergency Ads
- Urgency-focused messaging
- 24/7 availability
- Fast response times
- Immediate help messaging

## Usage

### Command Line

```bash
# Basic usage
python backend/ad_generator_fallback.py input.json

# From stdin
echo '{"keywords": ["plumber near me"], "industry": "plumbing"}' | python backend/ad_generator_fallback.py -
```

### Input JSON Format

```json
{
  "keywords": ["plumber near me", "emergency plumbing"],
  "business_type": "service",  // optional, auto-detected
  "business_name": "ABC Plumbing",
  "location": "New York",
  "industry": "plumbing",
  "base_url": "https://www.example.com",
  "ad_type": "RSA",  // RSA, DKI, or CALL_ONLY
  "num_ads": 3
}
```

### Output Format

```json
{
  "success": true,
  "business_type": "service",
  "ads": [
    {
      "id": "ad_1",
      "type": "rsa",
      "adType": "RSA",
      "headline1": "Professional Plumber Near Me",
      "headline2": "Expert Plumbing Services",
      "headline3": "Licensed Plumber",
      "description1": "Professional plumbing services you can trust...",
      "description2": "Looking for reliable plumbing? We provide...",
      "path1": "services",
      "path2": "contact",
      "finalUrl": "https://www.example.com/plumber-near-me",
      "selected": true
    }
  ],
  "count": 3
}
```

## API Server

### Start the API server:

```bash
cd backend
python ad_generator_api.py
```

### API Endpoints

**POST /generate**
- Generate ads based on request body
- Returns ad generation response

**GET /health**
- Health check endpoint

**GET /**
- API information

### Example API Call

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["plumber near me"],
    "industry": "plumbing",
    "business_name": "ABC Plumbing",
    "base_url": "https://www.example.com",
    "ad_type": "RSA",
    "num_ads": 3
  }'
```

## Integration with Frontend

The frontend can call this API as a fallback when the main ad generation fails:

```typescript
// In your ad generation utility
async function generateAdsFallback(input: AdGenerationInput) {
  try {
    const response = await fetch('http://localhost:8000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: input.keywords,
        industry: input.industry,
        business_name: input.businessName,
        location: input.location,
        base_url: input.baseUrl,
        ad_type: input.adType,
        num_ads: 3
      })
    });
    
    const data = await response.json();
    return data.ads;
  } catch (error) {
    console.error('Fallback ad generation failed:', error);
    return [];
  }
}
```

## Business Type Detection Logic

1. **Emergency**: Keywords contain "emergency", "24/7", "urgent", "now", etc.
2. **Local**: Keywords contain "near me", "nearby", "local", etc.
3. **Product**: Keywords contain "buy", "shop", "purchase", "product", etc.
4. **Service**: Default for service industries (plumbing, electrical, etc.) or service keywords

## Ad Type Support

- **RSA (Responsive Search Ads)**: 3-15 headlines, 2-4 descriptions
- **DKI (Dynamic Keyword Insertion)**: Uses {KeyWord:Default Text} format
- **CALL_ONLY**: For call-only ads with phone numbers

## Requirements

```bash
pip install fastapi uvicorn pydantic
```

## Deployment

### As Supabase Edge Function

1. Copy `ad_generator_fallback.py` to your Supabase Edge Function
2. Update imports and deploy
3. Call from frontend when main generation fails

### As Standalone API

1. Deploy `ad_generator_api.py` to your server
2. Update frontend to call the API endpoint
3. Use as fallback in ad generation flow

## Testing

```bash
# Test with sample input
python backend/ad_generator_fallback.py <<EOF
{
  "keywords": ["plumber near me"],
  "industry": "plumbing",
  "business_name": "ABC Plumbing",
  "base_url": "https://www.example.com",
  "ad_type": "RSA",
  "num_ads": 3
}
EOF
```

