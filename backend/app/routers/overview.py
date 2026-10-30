import logging
from typing import Optional, Any
from fastapi import APIRouter, Query, HTTPException
from app.models import OverviewResponse
from app.analytics import get_overview_data
from app.config import DEFAULT_MONTH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Executive Overview"])

@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    month: Any = Query(DEFAULT_MONTH, description="Evaluation month YYYY-MM"),
    cutoff: Any = Query(None, description="Optional decision cutoff timestamp (ISO)")
):
    try:
        clean_month = month if isinstance(month, str) else getattr(month, "default", DEFAULT_MONTH)
        clean_cutoff = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", None)
        data = get_overview_data(month=clean_month, cutoff=clean_cutoff)
        return OverviewResponse(**data)
    except Exception as e:
        logger.error("Error generating overview: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to generate overview: {str(e)}")
