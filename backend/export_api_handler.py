#!/usr/bin/env python3
"""
Export API Handler - Clean endpoint handler for CSV export
Can be used as standalone or integrated into existing FastAPI app
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging

from export_csv_fix import (
    CampaignExportRequest,
    CSVExportResponse,
    export_campaign_to_csv
)
from csv_export_adapter import map_frontend_to_backend

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["export"])


class ExportRequestModel(BaseModel):
    """Request model for CSV export endpoint"""
    campaign_name: str = Field(..., min_length=1, max_length=255)
    ad_groups: List[Dict[str, Any]] = Field(..., min_items=1)
    generated_ads: Optional[List[Dict[str, Any]]] = []
    location_targeting: Optional[Dict[str, Any]] = None
    budget: Optional[float] = Field(None, ge=0)
    bidding_strategy: Optional[str] = "MANUAL_CPC"
    negative_keywords: Optional[List[str]] = []
    all_ad_groups_value: Optional[str] = "ALL_AD_GROUPS"


@router.post("/export-csv", response_model=None)
async def export_csv_handler(request: ExportRequestModel):
    """
    Export campaign to Google Ads Editor CSV format
    
    Accepts Campaign Builder 1 frontend format and converts to backend format
    Returns CSV file on success, JSON with errors on validation failure
    """
    try:
        logger.info(f"CSV export requested for campaign: {request.campaign_name}")
        
        # Map frontend format to backend format
        export_request = map_frontend_to_backend(
            campaign_name=request.campaign_name,
            ad_groups=request.ad_groups,
            generated_ads=request.generated_ads or [],
            all_ad_groups_value=request.all_ad_groups_value or "ALL_AD_GROUPS",
            location_targeting=request.location_targeting,
            budget=request.budget,
            bidding_strategy=request.bidding_strategy or "MANUAL_CPC",
            negative_keywords=request.negative_keywords or []
        )
        
        # Generate CSV
        result = export_campaign_to_csv(export_request)
        
        # If successful, return CSV file
        if result.success and result.csv_content:
            logger.info(f"CSV export successful: {result.row_count} rows, filename: {result.filename}")
            
            return Response(
                content=result.csv_content,
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{result.filename}"',
                    "Content-Type": "text/csv; charset=utf-8",
                    "X-Row-Count": str(result.row_count),
                    "X-Warnings-Count": str(len(result.warnings))
                }
            )
        
        # If validation failed, return JSON with errors
        logger.warning(f"CSV export validation failed: {len(result.validation_errors)} errors")
        
        return CSVExportResponse(
            success=False,
            validation_errors=result.validation_errors,
            warnings=result.warnings,
            row_count=result.row_count,
            message=result.message
        )
        
    except Exception as e:
        logger.error(f"CSV export error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CSV export failed: {str(e)}"
        )


@router.post("/export-csv/direct")
async def export_csv_direct(request: CampaignExportRequest):
    """
    Direct export endpoint - accepts backend format directly
    Useful for testing or direct API calls
    """
    try:
        logger.info(f"Direct CSV export requested for campaign: {request.campaign_name}")
        
        result = export_campaign_to_csv(request)
        
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
        
    except Exception as e:
        logger.error(f"Direct CSV export error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CSV export failed: {str(e)}"
        )


# Example usage in FastAPI app:
# from fastapi import FastAPI
# from export_api_handler import router
# 
# app = FastAPI()
# app.include_router(router)

