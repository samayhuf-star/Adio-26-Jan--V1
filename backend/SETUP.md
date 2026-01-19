# Crazy Keywords Builder - Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Redis

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 6379:6379 redis
```

**Option B: Local Installation**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Start Celery Worker

In a separate terminal:
```bash
cd backend
celery -A backend.celery_app worker --loglevel=info
```

### 4. Start FastAPI Server

In another terminal:
```bash
cd backend
uvicorn backend.backend:app --reload --port 8000
```

### 5. Configure Frontend

Set the backend URL in your frontend `.env` file:
```env
VITE_KEYWORD_API_BASE=http://localhost:8000
```

Or update `src/components/CrazyKeywordsBuilder.tsx`:
```typescript
const KEYWORD_API_BASE = 'http://localhost:8000'; // or your production URL
```

## API Endpoints

### POST `/api/keywords`
Generate keywords synchronously or asynchronously.

**Query Parameters:**
- `sync=1` - Run synchronously (recommended for testing, max 500 results)

**Request Body:**
```json
{
  "seed": "plumber service",
  "geo": "US",
  "intent": "lead",
  "funnel": "bottom",
  "depth": "medium",
  "max_results": 300,
  "include_synonyms": true,
  "include_related": true,
  "commercial_mods_count": 12,
  "match_types": ["broad", "phrase", "exact"],
  "negative_keywords": ["cheap", "free", "job"]
}
```

**Response (Sync Mode):**
```json
{
  "results": [
    {
      "id": "0-plumber_service_near_me",
      "keyword": "plumber service near me",
      "score": 95,
      "intentTags": ["call", "lead"],
      "funnelStage": null,
      "cpc_est": 2.15,
      "matchVariants": {
        "broad": "plumber service near me",
        "phrase": "\"plumber service near me\"",
        "exact": "[plumber service near me]"
      }
    }
  ],
  "counts": {
    "raw_candidates": 500,
    "unique_normalized": 300,
    "returned": 300
  }
}
```

**Response (Async Mode):**
```json
{
  "job_id": "abc-123-def-456",
  "status": "queued"
}
```

### GET `/api/keywords/{job_id}/status`
Check async job status.

**Response:**
```json
{
  "job_id": "abc-123-def-456",
  "state": "SUCCESS",
  "result": {
    "results": [...],
    "counts": {...}
  }
}
```

### POST `/api/export/google-ads`
Export keywords to Google Ads CSV format.

**Request Body:**
```json
{
  "keywords": ["plumber near me", "emergency plumber"],
  "intent": "lead",
  "adgroup_prefix": "lead_group",
  "campaign_name": "Search Campaign 1",
  "match_type": "Phrase"
}
```

## Production Deployment

### Option 1: Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  celery:
    build: .
    command: celery -A backend.celery_app worker --loglevel=info
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0
  
  api:
    build: .
    command: uvicorn backend.backend:app --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0
      - FRONTEND_URL=https://www.adiology.online
```

### Option 2: Cloud Deployment

**Recommended Platforms:**
- **FastAPI**: Railway, Render, Fly.io, AWS ECS
- **Redis**: Redis Cloud, AWS ElastiCache, Upstash
- **Celery Workers**: Same as FastAPI or separate worker instances

**Environment Variables:**
```env
REDIS_URL=redis://your-redis-host:6379/0
FRONTEND_URL=https://www.adiology.online
```

## Testing

### Test Sync Mode
```bash
curl -X POST "http://localhost:8000/api/keywords?sync=1" \
  -H "Content-Type: application/json" \
  -d '{
    "seed": "plumber",
    "max_results": 50
  }'
```

### Test Async Mode
```bash
# Start job
curl -X POST "http://localhost:8000/api/keywords" \
  -H "Content-Type: application/json" \
  -d '{
    "seed": "plumber",
    "max_results": 500
  }'

# Check status (use job_id from response)
curl "http://localhost:8000/api/keywords/{job_id}/status"
```

## Troubleshooting

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check REDIS_URL environment variable

### Celery Worker Not Processing Jobs
- Check Celery logs for errors
- Ensure Redis is accessible from Celery worker
- Verify task is registered: `celery -A backend.celery_app inspect registered`

### CORS Errors
- Update `allow_origins` in `backend.py` to include your frontend URL
- Check browser console for specific CORS error messages

### Frontend Can't Connect
- Verify backend is running: `curl http://localhost:8000/health`
- Check `VITE_KEYWORD_API_BASE` environment variable
- Ensure backend URL is accessible from frontend domain

