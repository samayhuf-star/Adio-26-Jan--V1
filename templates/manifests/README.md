# Template Manifests

This directory contains JSON manifest files for each vertical/template.

## Manifest Structure

Each manifest file should follow this structure:

```json
{
  "slug": "lawn-care",
  "title": "GreenEdge Lawn Care",
  "themeId": "green-edge",
  "hero": {
    "heading": "Professional Lawn Care Services",
    "subheading": "Transform your yard with expert lawn care",
    "ctaText": "Get Free Quote"
  },
  "hero_image": "https://images.unsplash.com/photo-...",
  "features": {
    "heading": "Why Choose Us",
    "items": [
      {
        "icon": "🌱",
        "title": "Expert Care",
        "desc": "Professional specialists"
      }
    ]
  },
  "services": {
    "heading": "Our Services",
    "subheading": "Complete solutions",
    "items": [
      {
        "image": "https://...",
        "title": "Service Name",
        "desc": "Description",
        "price": "From $99"
      }
    ]
  },
  "testimonials": {
    "heading": "What Customers Say",
    "items": [
      {
        "name": "John Doe",
        "company": "Homeowner",
        "rating": 5,
        "text": "Great service!",
        "avatar": "https://..."
      }
    ]
  },
  "cta": {
    "heading": "Ready to Get Started?",
    "subheading": "Contact us today",
    "ctaText": "Call Now"
  },
  "contact": {
    "phone": "+1-800-123-4567",
    "email": "info@example.com",
    "hours": "Mon-Sat: 7AM-6PM"
  },
  "footer": {
    "companyName": "Company Name",
    "tagline": "Tagline",
    "address": "123 Street, City, ST 12345",
    "links": [
      { "text": "Privacy Policy", "href": "/policies/privacy.html" },
      { "text": "Terms of Service", "href": "/policies/terms.html" }
    ],
    "copyright": "© 2024 Company Name. All rights reserved."
  },
  "seo": {
    "title": "Page Title",
    "description": "Meta description",
    "keywords": "keyword1, keyword2"
  },
  "policies": {
    "privacy": {
      "lastUpdated": "2024-01-01",
      "content": "<h2>Privacy Policy</h2><p>Content...</p>"
    },
    "terms": {
      "lastUpdated": "2024-01-01",
      "content": "<h2>Terms of Service</h2><p>Content...</p>"
    }
  }
}
```

## Available Themes

- `green-edge` - Green theme (default)
- `blue-ocean` - Blue theme
- `purple-royal` - Purple theme
- `orange-fire` - Orange theme
- `teal-fresh` - Teal theme
- `red-bold` - Red theme

See `themes.json` for all available themes.

