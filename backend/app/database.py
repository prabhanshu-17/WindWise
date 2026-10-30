import sqlite3
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.config import DB_PATH

logger = logging.getLogger(__name__)

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and indexes in SQLite."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS actuals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publish_time TEXT NOT NULL,
                start_time TEXT NOT NULL,
                settlement_date TEXT,
                settlement_period INTEGER,
                fuel_type TEXT NOT NULL,
                generation REAL NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(start_time, fuel_type)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publish_time TEXT NOT NULL,
                start_time TEXT NOT NULL,
                generation REAL NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(publish_time, start_time)
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)

            # Create performance indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_actuals_start_time ON actuals(start_time);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_actuals_settlement_date ON actuals(settlement_date);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_actuals_fuel ON actuals(fuel_type);")

            conn.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_start_time ON forecasts(start_time);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_publish_time ON forecasts(publish_time);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_pub_start ON forecasts(publish_time, start_time);")

        logger.info("Database initialized successfully at %s", DB_PATH)
    finally:
        conn.close()

def upsert_actuals(records: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Inserts or ignores duplicate actual records.
    Only inserts WIND actuals.
    """
    if not records:
        return {"inserted": 0, "filtered_non_wind": 0, "duplicates": 0}

    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    inserted = 0
    filtered_non_wind = 0
    duplicates = 0

    try:
        with conn:
            for r in records:
                fuel_type = r.get("fuelType", "").upper()
                if fuel_type != "WIND":
                    filtered_non_wind += 1
                    continue

                start_time = r.get("startTime")
                publish_time = r.get("publishTime")
                settlement_date = r.get("settlementDate")
                settlement_period = r.get("settlementPeriod")
                generation = r.get("generation")

                if start_time is None or generation is None:
                    continue

                cursor = conn.execute("""
                    INSERT OR IGNORE INTO actuals 
                    (publish_time, start_time, settlement_date, settlement_period, fuel_type, generation, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (publish_time, start_time, settlement_date, settlement_period, "WIND", float(generation), now))
                
                if cursor.rowcount > 0:
                    inserted += 1
                else:
                    duplicates += 1

        update_sync_metadata("last_actuals_sync", now)
    finally:
        conn.close()

    return {
        "inserted": inserted,
        "filtered_non_wind": filtered_non_wind,
        "duplicates": duplicates
    }

def upsert_forecasts(records: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Inserts or ignores duplicate forecast records.
    Unique constraint on (publish_time, start_time).
    """
    if not records:
        return {"inserted": 0, "duplicates": 0}

    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    inserted = 0
    duplicates = 0

    try:
        with conn:
            for r in records:
                start_time = r.get("startTime")
                publish_time = r.get("publishTime")
                generation = r.get("generation")

                if start_time is None or publish_time is None or generation is None:
                    continue

                cursor = conn.execute("""
                    INSERT OR IGNORE INTO forecasts 
                    (publish_time, start_time, generation, created_at)
                    VALUES (?, ?, ?, ?)
                """, (publish_time, start_time, float(generation), now))

                if cursor.rowcount > 0:
                    inserted += 1
                else:
                    duplicates += 1

        update_sync_metadata("last_forecasts_sync", now)
    finally:
        conn.close()

    return {
        "inserted": inserted,
        "duplicates": duplicates
    }

def update_sync_metadata(key: str, value: str):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO sync_metadata (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """, (key, str(value), now))
    finally:
        conn.close()

def get_sync_metadata(key: str) -> Optional[str]:
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT value FROM sync_metadata WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else None
    finally:
        conn.close()

def get_all_sync_metadata() -> Dict[str, str]:
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT key, value, updated_at FROM sync_metadata")
        return {row["key"]: row["value"] for row in cursor.fetchall()}
    finally:
        conn.close()

