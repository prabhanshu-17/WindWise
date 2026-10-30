import logging
from typing import Optional, Any
from fastapi import APIRouter, Query, HTTPException, Response
from app.analytics import export_csv
from app.config import DEFAULT_MONTH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Export Data"])

@router.get("/export")
def export_dataset(
    dataset: Any = Query("accuracy", description="Dataset to export: 'accuracy', 'actuals', or 'forecasts'"),
    month: Any = Query(DEFAULT_MONTH, description="Evaluation month YYYY-MM"),
    cutoff: Any = Query(None, description="Optional decision cutoff timestamp")
):
    try:
        clean_ds = dataset if isinstance(dataset, str) else getattr(dataset, "default", "accuracy")
        clean_month = month if isinstance(month, str) else getattr(month, "default", DEFAULT_MONTH)
        clean_cutoff = cutoff if isinstance(cutoff, str) else getattr(cutoff, "default", None)
        csv_content = export_csv(dataset_type=clean_ds, month=clean_month, cutoff=clean_cutoff)
        filename = f"windwise_{clean_ds}_{clean_month}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        logger.error("Error exporting dataset %s: %s", dataset, e)
        raise HTTPException(status_code=500, detail=str(e))
