# backend/backend.py

"""
FastAPI backend for AI Keyword Planner (Celery-enabled).

Run (dev):
  1. Start Redis: docker run -p 6379:6379 redis
  2. Start Celery worker: celery -A backend.celery_app worker --loglevel=info
  3. Start FastAPI: uvicorn backend.backend:app --reload --port 8000

Notes:
 - This implementation uses Celery + Redis as broker & result backend.
 - For small jobs you can pass ?sync=1 to POST /api/keywords to run synchronously (useful for testing).
"""

import os
import re
import time
import json
import requests
from difflib import SequenceMatcher
from urllib.parse import quote_plus
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse, StreamingResponse
from celery import Celery
from celery.result import AsyncResult

# ------------ CONFIG -------------
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# path to uploaded screenshot (user-supplied file)
SCREENSHOT_PATH = "/mnt/data/Screenshot 2025-11-24 at 9.13.41 AM.png"

# ------------- Celery -------------
celery_app = Celery("backend", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

# Optional Celery tuning (workers, time limits etc) can be set via celery config
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# ------------- FastAPI -------------
app = FastAPI(title="AI Keyword Planner - Backend")

# CORS middleware
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://www.adiology.online",
        "https://adiology.online"
    ],  # Add your production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------- Request / Response models -------------
class KeywordRequest(BaseModel):
    seed: str
    geo: Optional[str] = None
    intent: Optional[str] = None
    funnel: Optional[str] = None
    depth: Optional[str] = "medium"
    max_results: Optional[int] = 200
    include_synonyms: Optional[bool] = True
    include_related: Optional[bool] = True
    commercial_mods_count: Optional[int] = 12
    match_types: Optional[List[str]] = ["broad", "phrase", "exact"]
    negative_keywords: Optional[List[str]] = []

# ------------- Generation logic (adapted & compact) -------------
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; KeywordPlanner/1.0; +https://your.site)"
}

COMMERCIAL_MODIFIERS = [
    "near me", "nearby", "price", "cost", "cheap", "best",
    "services", "service", "hire", "quote", "contact", "appointment",
    "emergency", "24/7", "reviews", "ratings", "book", "schedule", "login", "signup"
]

INTENT_PATTERNS = {
    "lead": ["quote", "estimate", "consultation", "contact", "inquiry", "demo", "form", "help", "assistance"],
    "call": ["call", "phone", "phone number", "contact number", "near me", "emergency", "helpline"],
    "booking": ["book", "appointment", "schedule", "reserve", "availability", "same day", "today", "now"],
    "signup": ["sign up", "register", "free trial", "trial", "create account", "get started"],
    "purchase": ["buy", "price", "cost", "deal", "discount", "offer"]
}

def fetch_google_autocomplete(seed: str, geo: Optional[str] = None) -> List[str]:
    """
    Uses Google's public suggestqueries endpoint for simple autocomplete.
    This is best-effort; in prod replace with a paid SERP API for reliability.
    """
    try:
        q = quote_plus(seed)
        url = f"https://suggestqueries.google.com/complete/search?client=firefox&q={q}"
        if geo:
            url += f"&gl={geo}"
        resp = requests.get(url, headers=HEADERS, timeout=6)
        resp.raise_for_status()
        data = resp.json()
        suggestions = data[1] if isinstance(data, list) and len(data) > 1 else []
        return [s for s in suggestions if isinstance(s, str)]
    except Exception:
        return []

def a_to_z_expansion(seed: str, geo: Optional[str]=None, letters: str="abcdefghijklmnopqrstuvwxyz0123456789"):
    out = set()
    for ch in letters:
        query = f"{seed} {ch}"
        suggestions = fetch_google_autocomplete(query, geo)
        for s in suggestions:
            out.add(s)
        time.sleep(0.06)  # polite pacing
    return list(out)

def normalize_kw(k: str) -> str:
    k = k.strip().lower()
    k = re.sub(r"\s+", " ", k)
    return k

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

def heuristic_score(keyword: str, seed: str) -> int:
    k = keyword.lower()
    base_sim = similarity(k, seed.lower())
    comm = 1.0 if any(mod in k for mod in COMMERCIAL_MODIFIERS) else 0.0
    words = len(k.split())
    if words <= 2:
        length_factor = 0.95
    elif words <= 4:
        length_factor = 1.0
    elif words <= 7:
        length_factor = 0.9
    else:
        length_factor = 0.75
    score = (base_sim * 0.6 + comm * 0.2 + length_factor * 0.2)
    return int(round(score * 100))

def detect_intent(keyword: str) -> List[str]:
    tags = []
    k = keyword.lower()
    for name, patterns in INTENT_PATTERNS.items():
        for p in patterns:
            if p in k:
                tags.append(name)
                break
    return tags or ["general"]

def generate_keywords_core(seed: str, geo: Optional[str]=None, max_results: int=200,
                           a2z: bool=True, use_related: bool=True, commercial_mods_count: int=12,
                           negative_keywords: Optional[List[str]]=None):
    """
    Core generation function. Returns list of dict results.
    """
    negative_keywords = negative_keywords or []
    seed = normalize_kw(seed)
    candidates = set()

    # 1) direct autocomplete
    candidates.update(fetch_google_autocomplete(seed, geo))
    time.sleep(0.05)

    # 2) a->z expansion
    if a2z:
        candidates.update(a_to_z_expansion(seed, geo))

    candidates.add(seed)
    candidates.add(f"{seed} services")
    candidates.add(f"{seed} near me")

    # 3) commercial modifiers applied to top base candidates (limit to avoid explosion)
    base_list = list(candidates)[:150]
    for c in base_list:
        for mod in COMMERCIAL_MODIFIERS[:max(1, min(commercial_mods_count, len(COMMERCIAL_MODIFIERS)))]:
            candidates.add(f"{c} {mod}")
            candidates.add(f"{mod} {c}")

    # 4) normalize and filter negatives
    normalized = {normalize_kw(c) for c in candidates if c and len(c) > 1}
    if negative_keywords:
        neg_patterns = [normalize_kw(n) for n in negative_keywords if n]
        def is_negative(k):
            return any(np in k for np in neg_patterns)
        normalized = {k for k in normalized if not is_negative(k)}

    # 5) filter trivial tokens
    normalized = {c for c in normalized if len(c) > 2 and not re.match(r'^[0-9]+$', c)}

    # 6) score and prepare results
    scored = []
    for k in normalized:
        sc = heuristic_score(k, seed)
        scored.append((sc, k))
    scored.sort(key=lambda x: (x[0], -len(x[1])), reverse=True)
    top = scored[:max_results]

    results = []
    for idx, (s, k) in enumerate(top):
        intent_tags = detect_intent(k)
        results.append({
            "id": f"{idx}-{k.replace(' ', '_')}",
            "keyword": k,
            "score": s,
            "intentTags": intent_tags,
            "funnelStage": None,
            "cpc_est": round(1 + (100 - s) * 0.03, 2),
            "matchVariants": {
                "broad": k,
                "phrase": f"\"{k}\"",
                "exact": f"[{k}]"
            },
            "source": ["autocomplete", "a2z"]
        })
    return {
        "results": results,
        "counts": {
            "raw_candidates": len(candidates),
            "unique_normalized": len(normalized),
            "returned": len(results)
        }
    }

# ------------- Celery task -------------
@celery_app.task(bind=True)
def celery_generate_keywords(self, payload):
    """
    Celery worker task wrapper that calls generate_keywords_core.
    The payload is the dict of KeywordRequest.
    """
    # optionally update state messages to show progress
    # self.update_state(state='PROGRESS', meta={'stage': 'starting'})
    seed = payload.get("seed")
    geo = payload.get("geo")
    max_results = payload.get("max_results", 200)
    commercial_mods_count = payload.get("commercial_mods_count", 12)
    negative_keywords = payload.get("negative_keywords", [])
    # perform generation (this may take a while)
    out = generate_keywords_core(seed=seed, geo=geo, max_results=max_results,
                                 a2z=True, use_related=payload.get("include_related", True),
                                 commercial_mods_count=commercial_mods_count,
                                 negative_keywords=negative_keywords)
    return out

# --------------- API endpoints ---------------
@app.get("/health")
def health():
    return {"status": "ok", "screenshot_sample": SCREENSHOT_PATH}

@app.post("/api/keywords", status_code=202)
def api_keywords(req: KeywordRequest, sync: Optional[int] = 0):
    """
    Create a keyword generation job. By default returns a job_id for async processing.
    Pass ?sync=1 (and keep max_results small) to run synchronously and get immediate JSON results.
    """
    # basic validation
    if not req.seed or not req.seed.strip():
        raise HTTPException(status_code=400, detail="seed is required")

    payload = req.dict()
    # If sync requested (small runs), run local function (no Celery)
    if int(sync):
        payload_small = payload.copy()
        maxr = min(500, payload_small.get("max_results", 200))
        res = generate_keywords_core(seed=payload_small["seed"],
                                     geo=payload_small.get("geo"),
                                     max_results=maxr,
                                     a2z=(payload_small.get("depth","medium") != "short"),
                                     use_related=payload_small.get("include_related", True),
                                     commercial_mods_count=payload_small.get("commercial_mods_count", 12),
                                     negative_keywords=payload_small.get("negative_keywords", []))
        return JSONResponse(content=res)

    # enqueue Celery job
    task = celery_generate_keywords.apply_async(args=[payload])
    return {"job_id": task.id, "status": "queued"}

@app.get("/api/keywords/{job_id}/status")
def api_job_status(job_id: str):
    """
    Check Celery job status. If finished, returns full results in 'result'.
    """
    res = AsyncResult(job_id, app=celery_app)
    response = {"job_id": job_id, "state": res.state}
    if res.state == "FAILURE":
        response["error"] = str(res.result)
    if res.state == "SUCCESS":
        response["result"] = res.result  # the dict returned by generate_keywords_core
    else:
        # optionally return partial meta if available (res.info)
        if res.info:
            response["meta"] = res.info
    return JSONResponse(content=response)

@app.get("/api/keywords/{job_id}/result")
def api_job_result(job_id: str):
    """
    Retrieve JSON result for a finished job. 404 if not ready.
    """
    res = AsyncResult(job_id, app=celery_app)
    if res.state != "SUCCESS":
        raise HTTPException(status_code=404, detail=f"job not ready (state={res.state})")
    return JSONResponse(content=res.result)

# --------- Server-side Google Ads CSV export (streaming) ----------
class ExportRequest(BaseModel):
    keywords: List[str]
    intent: Optional[str] = None
    adgroup_prefix: Optional[str] = "ai_group"
    campaign_name: Optional[str] = "Search Campaign 1"
    match_type: Optional[str] = "Phrase"  # Phrase | Exact | Broad

@app.post("/api/export/google-ads")
def api_export_google_ads(req: ExportRequest):
    """
    Accepts a list of keywords and returns a CSV formatted for Google Ads Editor.
    For large lists, this should be implemented as an async job and streamed from storage.
    """

    def stream():
        header = ["Campaign", "Ad group", "Criterion", "Type", "Max CPC", "Status"]
        yield ",".join(header) + "\n"
        for kw in req.keywords:
            campaign = req.campaign_name
            adgroup = req.adgroup_prefix
            crit = f"\"{kw.replace('\"','\"\"')}\""  # escape quotes
            mtype = req.match_type
            maxcpc = ""  # set by user or estimation logic
            status = "Enabled"
            row = [campaign, adgroup, crit, mtype, maxcpc, status]
            yield ",".join(row) + "\n"

    return StreamingResponse(stream(), media_type="text/csv")

# --------------- simple local-run CLI helper ---------------
if __name__ == "__main__":
    print("This module is intended to be run by uvicorn, e.g.:")
    print("uvicorn backend.backend:app --reload --port 8000")

