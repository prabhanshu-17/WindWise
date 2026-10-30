import pytest
import math
from app.data_processor import calculate_accuracy_metrics

def test_accuracy_metrics_calculation():
    """
    Tests MAE, RMSE, Bias (MBE), WAPE, and Coverage calculations.
    """
    records = [
        # actual=1000, forecast=1200 -> error = +200, abs = 200
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": True, "actualGeneration": 1000.0, "forecastGeneration": 1200.0, "error": 200.0, "absoluteError": 200.0},
        # actual=2000, forecast=1900 -> error = -100, abs = 100
        {"startTime": "2026-01-01T01:00:00Z", "isMatched": True, "actualGeneration": 2000.0, "forecastGeneration": 1900.0, "error": -100.0, "absoluteError": 100.0},
        # actual=3000, forecast=3300 -> error = +300, abs = 300
        {"startTime": "2026-01-01T02:00:00Z", "isMatched": True, "actualGeneration": 3000.0, "forecastGeneration": 3300.0, "error": 300.0, "absoluteError": 300.0},
        # Unmatched interval (should be ignored in calculation)
        {"startTime": "2026-01-01T03:00:00Z", "isMatched": False, "actualGeneration": 1500.0, "forecastGeneration": None, "error": None, "absoluteError": None},
    ]

    # Expected:
    # matched count = 3
    # errors = [+200, -100, +300] -> sum = 400 -> MBE = 400 / 3 = 133.33 MW (positive: overforecast)
    # abs_errors = [200, 100, 300] -> sum = 600 -> MAE = 600 / 3 = 200.0 MW
    # squared_errors = [40000, 10000, 90000] -> sum = 140000 -> MSE = 140000 / 3 = 46666.67 -> RMSE = 216.02 MW
    # sum actuals = 1000 + 2000 + 3000 = 6000 MW
    # WAPE = 600 / 6000 * 100 = 10.0%
    # coverage for expected_intervals=4 -> 3 / 4 * 100 = 75.0%

    metrics = calculate_accuracy_metrics(records, expected_intervals=4)

    assert metrics["matchedIntervals"] == 3
    assert metrics["mae"] == 200.0
    assert metrics["rmse"] == round(math.sqrt(140000 / 3), 2)
    assert metrics["mbe"] == round(400 / 3, 2)
    assert metrics["wape"] == 10.0
    assert metrics["coverage"] == 75.0
    assert metrics["avgActualGeneration"] == 2000.0
    assert metrics["avgForecastGeneration"] == round((1200 + 1900 + 3300) / 3, 2)

def test_zero_matched_intervals():
    """
    Tests edge case where no intervals are matched.
    Must return None for error metrics, not division by zero.
    """
    records = [
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": False, "actualGeneration": 1000.0, "forecastGeneration": None, "error": None, "absoluteError": None}
    ]
    metrics = calculate_accuracy_metrics(records, expected_intervals=24)
    assert metrics["matchedIntervals"] == 0
    assert metrics["mae"] is None
    assert metrics["rmse"] is None
    assert metrics["mbe"] is None
    assert metrics["wape"] is None
    assert metrics["coverage"] == 0.0

def test_bias_direction():
    """
    Test positive vs negative bias logic.
    """
    overforecast_records = [
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": True, "actualGeneration": 1000.0, "forecastGeneration": 1500.0, "error": 500.0, "absoluteError": 500.0}
    ]
    underforecast_records = [
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": True, "actualGeneration": 1500.0, "forecastGeneration": 1000.0, "error": -500.0, "absoluteError": 500.0}
    ]

    m_over = calculate_accuracy_metrics(overforecast_records, 1)
    m_under = calculate_accuracy_metrics(underforecast_records, 1)

    assert m_over["mbe"] > 0
    assert m_under["mbe"] < 0
