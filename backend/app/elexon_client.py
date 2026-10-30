import logging
import time
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime, timezone
from app.config import ELEXON_BASE_URL, ELEXON_TIMEOUT_SECONDS, MAX_RETRIES
from app.database import upsert_actuals, upsert_forecasts, update_sync_metadata

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self, base_url: str = ELEXON_BASE_URL, timeout: float = ELEXON_TIMEOUT_SECONDS):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def fetch_actual_stream(self, publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
        """
        Fetches actual half-hourly generation records from FUELHH stream endpoint.
        URL: /datasets/FUELHH/stream?publishDateTimeFrom=...&publishDateTimeTo=...
        """
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        return self._get_with_retry(url, params)

    def fetch_forecast_stream(self, publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
        """
        Fetches wind generation forecast records from WINDFOR stream endpoint.
        URL: /datasets/WINDFOR/stream?publishDateTimeFrom=...&publishDateTimeTo=...
        """
        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        return self._get_with_retry(url, params)

    def _get_with_retry(self, url: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
        retries = 0
        last_error = None
        while retries < MAX_RETRIES:
            try:
                logger.info("Requesting %s with params %s (attempt %d/%d)", url, params, retries + 1, MAX_RETRIES)
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        # Some endpoints wrap in {"data": [...]}, stream returns list directly
                        if isinstance(data, dict) and "data" in data:
                            return data["data"]
                        elif isinstance(data, list):
                            return data
                        return []
                    elif resp.status_code == 404:
                        logger.warning("Elexon endpoint %s returned 404 for params %s", url, params)
                        return []
                    else:
                        logger.warning("Elexon endpoint %s returned status %d: %s", url, resp.status_code, resp.text[:200])
            except Exception as e:
                logger.warning("Error fetching from %s (attempt %d/%d): %s", url, retries + 1, MAX_RETRIES, e)
                last_error = e

            retries += 1
            if retries < MAX_RETRIES:
                time.sleep(2 ** retries)

        if last_error:
            logger.error("Failed after %d retries: %s", MAX_RETRIES, last_error)
            raise last_error
        return []

def sync_elexon_january_2026() -> Dict[str, Any]:
    """
    Downloads all January 2026 data from Elexon FUELHH and WINDFOR streams
    and saves it to the SQLite database.
    """
    client = ElexonClient()
    logger.info("Beginning January 2026 Elexon data sync...")

    # 1. Sync FUELHH actuals in 5-day chunks
    fuelhh_chunks = [
        ("2026-01-01T00:00:00Z", "2026-01-06T00:00:00Z"),
        ("2026-01-06T00:00:00Z", "2026-01-11T00:00:00Z"),
        ("2026-01-11T00:00:00Z", "2026-01-16T00:00:00Z"),
        ("2026-01-16T00:00:00Z", "2026-01-21T00:00:00Z"),
        ("2026-01-21T00:00:00Z", "2026-01-26T00:00:00Z"),
        ("2026-01-26T00:00:00Z", "2026-02-01T02:00:00Z"),
    ]

    total_actual_inserted = 0
    total_non_wind_filtered = 0
    total_actual_duplicates = 0

    for pub_from, pub_to in fuelhh_chunks:
        try:
            records = client.fetch_actual_stream(pub_from, pub_to)
            res = upsert_actuals(records)
            total_actual_inserted += res["inserted"]
            total_non_wind_filtered += res["filtered_non_wind"]
            total_actual_duplicates += res["duplicates"]
            logger.info("FUELHH chunk %s-%s: %d inserted, %d filtered", pub_from, pub_to, res["inserted"], res["filtered_non_wind"])
        except Exception as e:
            logger.error("Error syncing FUELHH chunk %s-%s: %s", pub_from, pub_to, e)

    # 2. Sync WINDFOR forecasts in 5-day chunks
    # Note: Day-ahead forecasts for Jan 1 start on Dec 30 2025
    windfor_chunks = [
        ("2025-12-30T00:00:00Z", "2026-01-05T00:00:00Z"),
        ("2026-01-05T00:00:00Z", "2026-01-10T00:00:00Z"),
        ("2026-01-10T00:00:00Z", "2026-01-15T00:00:00Z"),
        ("2026-01-15T00:00:00Z", "2026-01-20T00:00:00Z"),
        ("2026-01-20T00:00:00Z", "2026-01-25T00:00:00Z"),
        ("2026-01-25T00:00:00Z", "2026-02-01T12:00:00Z"),
    ]

    total_forecast_inserted = 0
    total_forecast_duplicates = 0

    for pub_from, pub_to in windfor_chunks:
        try:
            records = client.fetch_forecast_stream(pub_from, pub_to)
            res = upsert_forecasts(records)
            total_forecast_inserted += res["inserted"]
            total_forecast_duplicates += res["duplicates"]
            logger.info("WINDFOR chunk %s-%s: %d inserted", pub_from, pub_to, res["inserted"])
        except Exception as e:
            logger.error("Error syncing WINDFOR chunk %s-%s: %s", pub_from, pub_to, e)

    now = datetime.now(timezone.utc).isoformat()
    update_sync_metadata("last_full_sync", now)

    return {
        "status": "success",
        "last_sync": now,
        "actuals": {
            "inserted": total_actual_inserted,
            "filtered_non_wind": total_non_wind_filtered,
            "duplicates": total_actual_duplicates
        },
        "forecasts": {
            "inserted": total_forecast_inserted,
            "duplicates": total_forecast_duplicates
        }
    }
