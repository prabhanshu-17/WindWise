import pytest
from datetime import datetime, timezone
from app.data_processor import (
    filter_wind_actuals,
    normalize_timestamp,
    to_uk_local_str,
    select_latest_eligible_forecast,
    match_forecast_and_actuals,
    validate_record
)
from tests.fixtures import MOCK_FUELHH_RECORDS, MOCK_WINDFOR_RECORDS

def test_actual_generation_filtering():
    """
    Test 1: Actual generation filtering.
    Must filter fuelType = WIND only and drop thermal/nuclear/biomass.
    """
    wind_only = filter_wind_actuals(MOCK_FUELHH_RECORDS)
    assert len(wind_only) == 5  # 4 original WIND + 1 duplicate WIND
    for r in wind_only:
        assert r["fuelType"].upper() == "WIND"

def test_timestamp_normalization():
    """
    Test 2: Timestamp normalization.
    Must convert various formats into standardized UTC ISO-8601 strings.
    """
    assert normalize_timestamp("2026-01-01T00:00:00Z") == "2026-01-01T00:00:00Z"
    assert normalize_timestamp("2026-01-01 00:00:00") == "2026-01-01T00:00:00Z"
    assert normalize_timestamp(datetime(2026, 1, 1, 12, 30, tzinfo=timezone.utc)) == "2026-01-01T12:30:00Z"
    assert normalize_timestamp(None) is None
    assert normalize_timestamp("invalid-date-string") is None

def test_uk_timezone_handling():
    """
    Test 3: UK timezone handling.
    Checks GMT/BST conversion. January is GMT (UTC+0).
    """
    utc_time = "2026-01-15T14:30:00Z"
    uk_local = to_uk_local_str(utc_time)
    assert uk_local == "2026-01-15 14:30"

    # In summer (BST), UTC 14:00 is 15:00 UK local
    summer_utc = "2026-07-15T14:00:00Z"
    summer_local = to_uk_local_str(summer_utc)
    assert summer_local == "2026-07-15 15:00"

def test_forecast_publication_cutoff_and_lookahead_prevention():
    """
    Test 4: Forecast publication cutoff.
    Strictly forbids forecasts published after the decision cutoff.
    """
    forecasts = [
        {"publishTime": "2025-12-31T09:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 9000.0},
        {"publishTime": "2025-12-31T14:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 9500.0},
        {"publishTime": "2025-12-31T22:00:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 10500.0},
    ]

    # Cutoff at 10:00 -> should only pick 09:00
    fc_10 = select_latest_eligible_forecast(forecasts, "2025-12-31T10:00:00Z")
    assert fc_10 is not None
    assert fc_10["publishTime"] == "2025-12-31T09:00:00Z"
    assert fc_10["generation"] == 9000.0

    # Cutoff at 15:00 -> should pick 14:00
    fc_15 = select_latest_eligible_forecast(forecasts, "2025-12-31T15:00:00Z")
    assert fc_15 is not None
    assert fc_15["publishTime"] == "2025-12-31T14:00:00Z"
    assert fc_15["generation"] == 9500.0

    # Cutoff at 08:00 -> before all publications -> None
    fc_08 = select_latest_eligible_forecast(forecasts, "2025-12-31T08:00:00Z")
    assert fc_08 is None

def test_latest_eligible_forecast_selection():
    """
    Test 5: Latest eligible forecast selection.
    When multiple vintages are eligible, always picks the latest one.
    """
    forecasts = [
        {"publishTime": "2025-12-31T06:00:00Z", "startTime": "2026-01-01T12:00:00Z", "generation": 8000.0},
        {"publishTime": "2025-12-31T18:00:00Z", "startTime": "2026-01-01T12:00:00Z", "generation": 8500.0},
        {"publishTime": "2025-12-31T12:00:00Z", "startTime": "2026-01-01T12:00:00Z", "generation": 8200.0},
    ]
    latest = select_latest_eligible_forecast(forecasts, "2025-12-31T20:00:00Z")
    assert latest["publishTime"] == "2025-12-31T18:00:00Z"
    assert latest["generation"] == 8500.0

def test_matching_forecast_and_actual_intervals():
    """
    Test 6: Matching forecast and actual intervals on normalized startTime.
    """
    wind_actuals = filter_wind_actuals(MOCK_FUELHH_RECORDS)
    matched = match_forecast_and_actuals(wind_actuals, MOCK_WINDFOR_RECORDS, decision_cutoff="2025-12-31T23:59:59Z")
    
    # 00:00 interval should be matched
    interval_00 = next(r for r in matched if r["startTime"] == "2026-01-01T00:00:00Z")
    assert interval_00["isMatched"] is True
    assert interval_00["actualGeneration"] == 10000.0
    assert interval_00["forecastGeneration"] == 10500.0
    assert interval_00["error"] == 500.0
    assert interval_00["absoluteError"] == 500.0

def test_missing_data_handling():
    """
    Test 7: Missing data handling.
    Ensure missing actuals or forecasts are NOT silently converted to zero.
    """
    wind_actuals = filter_wind_actuals(MOCK_FUELHH_RECORDS)
    matched = match_forecast_and_actuals(wind_actuals, MOCK_WINDFOR_RECORDS, decision_cutoff="2025-12-31T23:59:59Z")

    # Interval 03:00 has actual (15000) but no forecast in MOCK_WINDFOR
    interval_03 = next(r for r in matched if r["startTime"] == "2026-01-01T03:00:00Z")
    assert interval_03["isMatched"] is False
    assert interval_03["actualGeneration"] == 15000.0
    assert interval_03["forecastGeneration"] is None
    assert interval_03["error"] is None  # Must NOT be zero!
    assert interval_03["status"] == "actual_only"

    # Interval 04:00 has forecast (6000) but no actual in MOCK_FUELHH
    interval_04 = next(r for r in matched if r["startTime"] == "2026-01-01T04:00:00Z")
    assert interval_04["isMatched"] is False
    assert interval_04["forecastGeneration"] == 6000.0
    assert interval_04["actualGeneration"] is None
    assert interval_04["error"] is None  # Must NOT be zero!
    assert interval_04["status"] == "forecast_only"

def test_record_validation():
    """
    Test 8: Validation of records.
    Rejects invalid timestamps or negative generations.
    """
    assert validate_record({"startTime": "2026-01-01T00:00:00Z", "fuelType": "WIND", "generation": 500.0}, "FUELHH") is True
    assert validate_record({"startTime": "2026-01-01T00:00:00Z", "fuelType": "COAL", "generation": 500.0}, "FUELHH") is False
    assert validate_record({"startTime": "2026-01-01T00:00:00Z", "fuelType": "WIND", "generation": -10.0}, "FUELHH") is False
    assert validate_record({"startTime": "invalid", "fuelType": "WIND", "generation": 500.0}, "FUELHH") is False
