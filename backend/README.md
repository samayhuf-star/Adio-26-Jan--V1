# Keyword Generator Backend

FastAPI backend with Celery for async keyword generation.

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Start Redis (required for Celery):**
```bash
docker run -p 6379:6379 redis
```

Or install Redis locally and start it.

3. **Start Celery worker (in a separate terminal):**
```bash
celery -A backend.celery_app worker --loglevel=info
```

4. **Start FastAPI server:**
```bash
uvicorn backend.backend:app --reload --port 8000
```

## API Endpoints

### POST `/api/keywords`
Generate keywords. Use `?sync=1` for synchronous mode (recommended for testing).

**Request:**
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

**Response (sync mode):**
```json
{
  "results": [...],
  "counts": {
    "raw_candidates": 500,
    "unique_normalized": 300,
    "returned": 300
  }
}
```

**Response (async mode):**
```json
{
  "job_id": "abc123",
  "status": "queued"
}
```

### GET `/api/keywords/{job_id}/status`
Check job status.

### GET `/api/keywords/{job_id}/result`
Get job result (404 if not ready).

### POST `/api/export/google-ads`
Export keywords to Google Ads CSV format.

## Environment Variables

- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379/0`)
- `VITE_KEYWORD_API_BASE`: Frontend API base URL (default: `http://localhost:8000`)

## Production Deployment

For production, configure:
- Redis on a managed service (AWS ElastiCache, Redis Cloud, etc.)
- Celery workers on separate servers/containers
- FastAPI behind a reverse proxy (nginx, Traefik)
- CORS origins restricted to your frontend domain
- Rate limiting
- Authentication/API keys

