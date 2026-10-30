import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.analytics import query_actuals

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Actual Generation"])

@router.get("/actuals", response_model=List[Dict[str, Any]])
def get_actuals(
    start_date: Optional[str] = Query(None, description="Start date/time ISO string"),
    end_date: Optional[str] = Query(None, description="End date/time ISO string")
):
    try:
        return query_actuals(start_date=start_date, end_date=end_date)
    except Exception as e:
        logger.error("Error retrieving actuals: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
