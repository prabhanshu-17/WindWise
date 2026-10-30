import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database
DB_PATH = os.getenv("WINDWISE_DB_PATH", str(DATA_DIR / "windwise.db"))

# Elexon API Configuration
ELEXON_BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
ELEXON_TIMEOUT_SECONDS = float(os.getenv("ELEXON_TIMEOUT", "30.0"))
MAX_RETRIES = int(os.getenv("ELEXON_MAX_RETRIES", "3"))

# Analysis Period
DEFAULT_MONTH = "2026-01"
DEFAULT_START_TIME = "2026-01-01T00:00:00Z"
DEFAULT_END_TIME = "2026-01-31T23:59:59Z"

# Expected settlement periods in UK January (31 days * 48 half-hour settlement periods)
EXPECTED_JANUARY_HALF_HOURS = 31 * 48  # 1488 half-hourly intervals
EXPECTED_JANUARY_HOURS = 31 * 24       # 744 hourly intervals

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*").split(",")

