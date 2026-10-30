"""
Deterministic fixture dataset for automated tests.
Independent of live Elexon API.
"""

MOCK_FUELHH_RECORDS = [
    # Normal WIND records
    {"dataset": "FUELHH", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "fuelType": "WIND", "generation": 10000.0},
    {"dataset": "FUELHH", "publishTime": "2026-01-01T02:00:00Z", "startTime": "2026-01-01T01:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 3, "fuelType": "WIND", "generation": 12000.0},
    {"dataset": "FUELHH", "publishTime": "2026-01-01T03:00:00Z", "startTime": "2026-01-01T02:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 5, "fuelType": "WIND", "generation": 8000.0},
    {"dataset": "FUELHH", "publishTime": "2026-01-01T04:00:00Z", "startTime": "2026-01-01T03:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 7, "fuelType": "WIND", "generation": 15000.0},
    
    # Non-WIND records to be filtered out
    {"dataset": "FUELHH", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "fuelType": "NUCLEAR", "generation": 5000.0},
    {"dataset": "FUELHH", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "fuelType": "CCGT", "generation": 18000.0},
    {"dataset": "FUELHH", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "fuelType": "BIOMASS", "generation": 2000.0},

    # Duplicate WIND record
    {"dataset": "FUELHH", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T00:00:00Z", "settlementDate": "2026-01-01", "settlementPeriod": 1, "fuelType": "WIND", "generation": 10000.0},
]

MOCK_WINDFOR_RECORDS = [
    # Interval 00:00: Multiple vintages
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T09:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 9000.0},
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T14:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 9500.0},
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T22:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 10500.0},

    # Interval 01:00: Multiple vintages
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T10:00:00Z", "startTime": "2026-01-01T01:00:00Z", "generation": 11000.0},
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T18:00:00Z", "startTime": "2026-01-01T01:00:00Z", "generation": 11500.0},

    # Interval 02:00: Vintage published after Day-Ahead cutoff
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T08:00:00Z", "startTime": "2026-01-01T02:00:00Z", "generation": 7500.0},
    {"dataset": "WINDFOR", "publishTime": "2026-01-01T01:00:00Z", "startTime": "2026-01-01T02:00:00Z", "generation": 8200.0},

    # Interval 04:00: Forecast only (no matching actual)
    {"dataset": "WINDFOR", "publishTime": "2025-12-31T10:00:00Z", "startTime": "2026-01-01T04:00:00Z", "generation": 6000.0},
]
