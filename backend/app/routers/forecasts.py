import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.models import ForecastExplorerResponse
from app.analytics import query_forecasts, get_forecast_explorer_data

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Forecast Generation"])

@router.get("/forecasts", response_model=List[Dict[str, Any]])
def get_forecasts(
    start_date: Any = Query(None, description="Start date/time ISO string"),
    end_date: Any = Query(None, description="End date/time ISO string"),
    cutoff: Any = Query(None, description="Max publish cutoff ISO string")
):
    try:
        clean_start = start_date if isinstance(start_date, str) else getattr(start_date, "default", None)
        clean_end = end_date if isinstance(end_date, str) else getattr(end_date, "default", None)
        clean_cut = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", None)
        return query_forecasts(start_date=clean_start, end_date=clean_end, max_publish_time=clean_cut)
    except Exception as e:
        logger.error("Error retrieving forecasts: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecasts/explorer", response_model=ForecastExplorerResponse)
def get_forecast_explorer(
    delivery_date: Any = Query("2026-01-15", description="Delivery date YYYY-MM-DD"),
    cutoff: Any = Query(None, description="Decision cutoff timestamp"),
    vintage: Any = Query(None, description="Specific forecast vintage publishTime")
):
    try:
        clean_date = delivery_date if isinstance(delivery_date, str) else getattr(delivery_date, "default", "2026-01-15")
        clean_cutoff = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", None)
        clean_vintage = vintage if isinstance(vintage, str) else getattr(vintage, "default", None)
        data = get_forecast_explorer_data(delivery_date=clean_date, cutoff=clean_cutoff, vintage=clean_vintage)
        return ForecastExplorerResponse(**data)
    except Exception as e:
        logger.error("Error generating forecast explorer: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
