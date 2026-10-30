import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models import HealthResponse
from app.database import get_connection, get_sync_metadata
from app.elexon_client import sync_elexon_january_2026

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health & Sync"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    conn = get_connection()
    try:
        cur_act = conn.execute("SELECT COUNT(*) as cnt FROM actuals WHERE fuel_type = 'WIND'")
        actual_cnt = cur_act.fetchone()["cnt"]

        cur_fc = conn.execute("SELECT COUNT(*) as cnt FROM forecasts")
        forecast_cnt = cur_fc.fetchone()["cnt"]

        last_sync = get_sync_metadata("last_full_sync") or get_sync_metadata("last_actuals_sync")

        return HealthResponse(
            status="healthy",
            version="1.0.0",
            api_connectivity="Connected (Elexon BMRS API)",
            database_connected=True,
            total_actuals_cached=actual_cnt,
            total_forecasts_cached=forecast_cnt,
            last_sync_timestamp=last_sync,
            evaluation_period="January 1-31, 2026"
        )
    except Exception as e:
        logger.error("Health check failure: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    """
    Triggers manual synchronization of January 2026 Elexon data.
    """
    try:
        background_tasks.add_task(sync_elexon_january_2026)
        return {"status": "sync_initiated", "message": "Elexon January 2026 sync running in background"}
    except Exception as e:
        logger.error("Failed to trigger sync: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
