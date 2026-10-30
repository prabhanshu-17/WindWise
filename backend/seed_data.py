import sys
import logging
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import init_db, get_connection
from app.elexon_client import sync_elexon_january_2026

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")

def main():
    logger.info("Initializing database...")
    init_db()

    logger.info("Syncing January 2026 data from Elexon...")
    result = sync_elexon_january_2026()
    logger.info("Sync result: %s", result)

    conn = get_connection()
    try:
        cur_act = conn.execute("SELECT COUNT(*) as cnt FROM actuals WHERE fuel_type = 'WIND'")
        act_cnt = cur_act.fetchone()["cnt"]

        cur_fc = conn.execute("SELECT COUNT(*) as cnt FROM forecasts")
        fc_cnt = cur_fc.fetchone()["cnt"]

        logger.info("Final database counts: %d WIND actual records, %d forecast records.", act_cnt, fc_cnt)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
