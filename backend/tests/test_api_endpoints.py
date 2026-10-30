import pytest
from app.routers.health import get_health
from app.routers.overview import get_overview
from app.routers.forecasts import get_forecasts, get_forecast_explorer
from app.routers.accuracy import get_accuracy
from app.routers.decision_replay import get_replay
from app.routers.data_quality import get_data_quality
from app.routers.export import export_dataset

def test_api_health_endpoint():
    res = get_health()
    assert res.status == "healthy"
    assert res.version == "1.0.0"
    assert res.total_actuals_cached > 0
    assert res.total_forecasts_cached > 0

def test_api_overview_endpoint():
    res = get_overview()
    assert res.kpis.coverage == 100.0
    assert res.kpis.mae is not None
    assert len(res.dailyData) == 31  # 31 days in January
    assert len(res.insights) >= 4
    assert len(res.coverageHeatmap) == 31

def test_api_forecast_explorer_endpoint():
    res = get_forecast_explorer(delivery_date="2026-01-15")
    assert res.selectedDeliveryDate == "2026-01-15"
    assert res.totalIntervals > 0
    assert len(res.intervals) > 0
    assert len(res.availableVintages) > 0

def test_api_accuracy_endpoint():
    res = get_accuracy()
    assert "metrics" in res
    assert res["metrics"]["mae"] > 0
    assert len(res["dailyMetrics"]) == 31
    assert len(res["diurnalProfile"]) == 24

def test_api_decision_replay_endpoint():
    res = get_replay(delivery_date="2026-01-15", cutoff="2026-01-14T10:00:00Z")
    assert res.deliveryDate == "2026-01-15"
    assert len(res.intervals) > 0
    assert len(res.timeline) >= 4
    # Ensure all selected forecasts have publishTime <= cutoff
    for interval in res.intervals:
        if interval.selectedPublishTime:
            assert interval.selectedPublishTime <= "2026-01-14T10:00:00Z"

def test_api_data_quality_endpoint():
    res = get_data_quality()
    assert res.windActualRecords > 0
    assert res.totalForecastRecords > 0
    assert res.coveragePercent == 100.0

def test_api_export_endpoint():
    res = export_dataset(dataset="accuracy", month="2026-01")
    assert res.status_code == 200
    assert b"DeliveryStartTimeUTC" in res.body
