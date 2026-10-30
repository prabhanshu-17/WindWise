import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.analytics import get_accuracy_analysis
from app.config import DEFAULT_MONTH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Forecast Accuracy"])

@router.get("/accuracy", response_model=Dict[str, Any])
def get_accuracy(
    month: Any = Query(DEFAULT_MONTH, description="Evaluation month YYYY-MM"),
    cutoff: Any = Query(None, description="Optional decision cutoff timestamp")
):
    try:
        clean_month = month if isinstance(month, str) else getattr(month, "default", DEFAULT_MONTH)
        clean_cutoff = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", None)
        return get_accuracy_analysis(month=clean_month, cutoff=clean_cutoff)
    except Exception as e:
        logger.error("Error generating accuracy analysis: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
