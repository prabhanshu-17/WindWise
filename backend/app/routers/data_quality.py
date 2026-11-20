import logging
from typing import Optional, Any
from fastapi import APIRouter, Query, HTTPException, Response
from app.models import DataQualityResponse
from app.analytics import get_data_quality_report
from app.config import DEFAULT_MONTH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Data Quality"])

@router.get("/data-quality", response_model=DataQualityResponse)
def get_data_quality(
    response: Response = None,
    month: Any = Query(DEFAULT_MONTH, description="Evaluation month YYYY-MM")
):
    try:
        if response is not None:
            response.headers["Cache-Control"] = "public, max-age=300, s-maxage=600, stale-while-revalidate=1200"
        clean_month = month if isinstance(month, str) else getattr(month, "default", DEFAULT_MONTH)
        data = get_data_quality_report(month=clean_month)
        return DataQualityResponse(**data)
    except Exception as e:
        logger.error("Error generating data quality report: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
