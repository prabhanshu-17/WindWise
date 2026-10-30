import logging
from typing import Any
from fastapi import APIRouter, Query, HTTPException
from app.models import DecisionReplayResponse
from app.analytics import get_decision_replay

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Decision Replay"])

@router.get("/decision-replay", response_model=DecisionReplayResponse)
def get_replay(
    delivery_date: Any = Query("2026-01-15", description="Target delivery date YYYY-MM-DD"),
    cutoff: Any = Query("2026-01-14T10:00:00Z", description="Historical decision cutoff timestamp (ISO)")
):
    """
    Historical Decision Replay:
    Filters forecasts where publishTime <= cutoff.
    Strictly prevents look-ahead bias.
    """
    try:
        clean_date = delivery_date if isinstance(delivery_date, str) else getattr(delivery_date, "default", "2026-01-15")
        clean_cutoff = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", "2026-01-14T10:00:00Z")
        data = get_decision_replay(delivery_date=clean_date, decision_cutoff=clean_cutoff)
        return DecisionReplayResponse(**data)
    except Exception as e:
        logger.error("Error generating decision replay: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
