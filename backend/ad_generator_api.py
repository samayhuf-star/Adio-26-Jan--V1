#!/usr/bin/env python3
"""
FastAPI endpoint for ad generation fallback
Can be deployed as a Supabase Edge Function or standalone API
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime

from ad_generator_fallback import generate_ads, detect_business_type
from export_csv_fix import (
    CampaignExportRequest,
    CSVExportResponse,
    export_campaign_to_csv,
    estimate_export_size
)

# Threshold for async processing (rows)
ASYNC_EXPORT_THRESHOLD = 1000

# Storage for async exports (in production, use Redis or database)
async_exports = {}

app = FastAPI(title="Adiology Ad Generator Fallback API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AdGenerationRequest(BaseModel):
    keywords: List[str]
    business_type: Optional[str] = None
    business_name: str = ""
    location: str = ""
    industry: str = ""
    base_url: str = ""
    ad_type: str = "RSA"  # RSA, DKI, or CALL_ONLY
    num_ads: int = 3


class AdGenerationResponse(BaseModel):
    success: bool
    business_type: str
    ads: List[dict]
    count: int
    message: Optional[str] = None


@app.post("/generate", response_model=AdGenerationResponse)
async def generate_ads_endpoint(request: AdGenerationRequest):
    """
    Generate ads based on keywords and business type
    """
    try:
        # Auto-detect business type if not provided
        detected_type = detect_business_type(request.keywords, request.industry)
        business_type = request.business_type or detected_type
        
        # Generate ads
        ads = generate_ads(
            keywords=request.keywords,
            business_type=business_type,
            business_name=request.business_name,
            location=request.location,
            industry=request.industry,
            base_url=request.base_url,
            ad_type=request.ad_type,
            num_ads=request.num_ads
        )
        
        return AdGenerationResponse(
            success=True,
            business_type=business_type,
            ads=ads,
            count=len(ads),
            message=f"Generated {len(ads)} {request.ad_type} ads for {business_type} business"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ad_generator_fallback"}


def process_async_export(job_id: str, request: CampaignExportRequest):
    """Background task to process large CSV exports"""
    try:
        result = export_campaign_to_csv(request)
        async_exports[job_id] = {
            'status': 'completed' if result.success else 'failed',
            'result': result,
            'completed_at': datetime.now().isoformat()
        }
    except Exception as e:
        async_exports[job_id] = {
            'status': 'failed',
            'error': str(e),
            'completed_at': datetime.now().isoformat()
        }


@app.post("/export-csv")
async def export_csv_endpoint(request: CampaignExportRequest, background_tasks: BackgroundTasks):
    """
    Export campaign to Google Ads Editor CSV format with full validation
    For large exports (>1000 rows), processes asynchronously
    """
    try:
        # Estimate export size
        estimated_rows = estimate_export_size(request)
        
        # Check if export should be async
        if estimated_rows > ASYNC_EXPORT_THRESHOLD:
            # Generate job ID
            job_id = str(uuid.uuid4())
            
            # Start background task
            background_tasks.add_task(process_async_export, job_id, request)
            
            # Return async response
            async_exports[job_id] = {
                'status': 'processing',
                'estimated_rows': estimated_rows,
                'started_at': datetime.now().isoformat()
            }
            
            return {
                "success": True,
                "async": True,
                "job_id": job_id,
                "message": f"Large export detected ({estimated_rows} rows). Processing in background. Check saved campaigns in 2 minutes to download.",
                "estimated_rows": estimated_rows,
                "estimated_time_minutes": 2
            }
        
        # Small export - process synchronously
        result = export_campaign_to_csv(request)
        
        # If successful, return CSV file
        if result.success and result.csv_content:
            return Response(
                content=result.csv_content,
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{result.filename}"',
                    "Content-Type": "text/csv; charset=utf-8"
                }
            )
        
        # If validation failed, return JSON with errors
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CSV export failed: {str(e)}"
        )


@app.get("/export-csv/{job_id}")
async def get_async_export(job_id: str):
    """Get status or result of async CSV export"""
    if job_id not in async_exports:
        raise HTTPException(status_code=404, detail="Export job not found")
    
    export_info = async_exports[job_id]
    
    if export_info['status'] == 'processing':
        return {
            "status": "processing",
            "message": "Export is still being processed. Please check again in a moment."
        }
    
    if export_info['status'] == 'failed':
        return {
            "status": "failed",
            "error": export_info.get('error', 'Unknown error')
        }
    
    # Export completed
    result = export_info['result']
    if result.success and result.csv_content:
        return Response(
            content=result.csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{result.filename}"',
                "Content-Type": "text/csv; charset=utf-8"
            }
        )
    
    return result


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "service": "Adiology Ad Generator Fallback API",
        "version": "1.0.0",
        "endpoints": {
            "POST /generate": "Generate ads for services or products",
            "POST /export-csv": "Export campaign to Google Ads Editor CSV",
            "GET /health": "Health check"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

