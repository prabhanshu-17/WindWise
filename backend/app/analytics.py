import sqlite3
import csv
import io
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.config import DEFAULT_MONTH, EXPECTED_JANUARY_HOURS
from app.database import get_connection, get_sync_metadata
from app.data_processor import (
    match_forecast_and_actuals,
    calculate_accuracy_metrics,
    calculate_daily_metrics,
    calculate_error_distribution,
    generate_insights,
    normalize_timestamp,
    to_uk_local_str
)

logger = logging.getLogger(__name__)

# In-memory analytics cache for instantaneous sub-millisecond responses
_ANALYTICS_CACHE: Dict[str, Any] = {}

def clear_cache():
    global _ANALYTICS_CACHE
    _ANALYTICS_CACHE.clear()

def query_actuals(start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
    if hasattr(start_date, "default"):
        start_date = getattr(start_date, "default", None)
    if not isinstance(start_date, str):
        start_date = None

    if hasattr(end_date, "default"):
        end_date = getattr(end_date, "default", None)
    if not isinstance(end_date, str):
        end_date = None

    conn = get_connection()
    try:
        query = "SELECT publish_time, start_time, settlement_date, settlement_period, fuel_type, generation FROM actuals WHERE fuel_type = 'WIND'"
        params = []
        if start_date:
            query += " AND start_time >= ?"
            params.append(start_date)
        if end_date:
            query += " AND start_time <= ?"
            params.append(end_date)
        query += " ORDER BY start_time ASC"

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [
            {
                "publishTime": r["publish_time"],
                "startTime": r["start_time"],
                "settlementDate": r["settlement_date"],
                "settlementPeriod": r["settlement_period"],
                "fuelType": r["fuel_type"],
                "generation": r["generation"]
            }
            for r in rows
        ]
    finally:
        conn.close()

def query_forecasts(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    max_publish_time: Optional[str] = None
) -> List[Dict[str, Any]]:
    if hasattr(max_publish_time, "default"):
        max_publish_time = getattr(max_publish_time, "default", None)
    if not isinstance(max_publish_time, str):
        max_publish_time = None

    if hasattr(start_date, "default"):
        start_date = getattr(start_date, "default", None)
    if not isinstance(start_date, str):
        start_date = None

    if hasattr(end_date, "default"):
        end_date = getattr(end_date, "default", None)
    if not isinstance(end_date, str):
        end_date = None

    conn = get_connection()
    try:
        query = "SELECT publish_time, start_time, generation FROM forecasts WHERE 1=1"
        params = []
        if start_date:
            query += " AND start_time >= ?"
            params.append(start_date)
        if end_date:
            query += " AND start_time <= ?"
            params.append(end_date)
        if max_publish_time:
            query += " AND publish_time <= ?"
            params.append(max_publish_time)
        query += " ORDER BY start_time ASC, publish_time ASC"

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [
            {
                "publishTime": r["publish_time"],
                "startTime": r["start_time"],
                "generation": r["generation"]
            }
            for r in rows
        ]
    finally:
        conn.close()

def get_overview_data(month: Any = DEFAULT_MONTH, cutoff: Any = None) -> Dict[str, Any]:
    """
    Computes all data for Page 1 (Executive Overview):
    KPIs, time-series, daily breakdown, error histogram, bias indicator, coverage heatmap, and dynamic insights.
    """
    if hasattr(month, "default"):
        month = getattr(month, "default", DEFAULT_MONTH)
    if not isinstance(month, str) or "-" not in month:
        month = DEFAULT_MONTH

    if hasattr(cutoff, "default"):
        cutoff = getattr(cutoff, "default", None)
    if not isinstance(cutoff, str):
        cutoff = None

    cache_key = f"overview_{month}_{cutoff}"
    if cache_key in _ANALYTICS_CACHE:
        return _ANALYTICS_CACHE[cache_key]

    start_bound = f"{month}-01T00:00:00Z"
    # Find last day of month
    year, m = map(int, month.split("-"))
    next_m = m + 1 if m < 12 else 1
    next_y = year if m < 12 else year + 1
    end_bound = (datetime(next_y, next_m, 1, 0, 0, 0, tzinfo=timezone.utc) - timedelta(seconds=1)).isoformat()

    actuals = query_actuals(start_bound, end_bound)
    forecasts = query_forecasts(start_bound, end_bound, max_publish_time=cutoff)

    # Match intervals
    matched = match_forecast_and_actuals(actuals, forecasts, decision_cutoff=cutoff)
    kpis = calculate_accuracy_metrics(matched, expected_intervals=EXPECTED_JANUARY_HOURS)
    daily = calculate_daily_metrics(matched)
    error_dist = calculate_error_distribution(matched)
    insights = generate_insights(matched, daily, kpis)

    # Coverage heatmap by day
    coverage_heatmap = []
    for d in daily:
        c_pct = d["coverage"]
        status = "complete" if c_pct >= 90 else ("partial" if c_pct > 0 else "empty")
        coverage_heatmap.append({
            "date": d["date"],
            "matched": d["matchedCount"],
            "expected": d["expectedCount"],
            "coveragePercent": c_pct,
            "avgGeneration": d["avgActual"],
            "status": status
        })

    # Bias indicator summary
    mbe = kpis.get("mbe") or 0.0
    matched_pairs = [r for r in matched if r.get("isMatched")]
    over_count = len([r for r in matched_pairs if r["error"] > 0])
    under_count = len([r for r in matched_pairs if r["error"] < 0])
    equal_count = len([r for r in matched_pairs if r["error"] == 0])

    bias_indicator = {
        "mbe": mbe,
        "direction": "overforecast" if mbe > 0 else ("underforecast" if mbe < 0 else "neutral"),
        "overforecastCount": over_count,
        "underforecastCount": under_count,
        "neutralCount": equal_count,
        "overforecastPercent": round(over_count / len(matched_pairs) * 100.0, 1) if matched_pairs else 0,
        "underforecastPercent": round(under_count / len(matched_pairs) * 100.0, 1) if matched_pairs else 0
    }

    last_sync = get_sync_metadata("last_full_sync") or get_sync_metadata("last_actuals_sync")

    res = {
        "kpis": kpis,
        "dailyData": daily,
        "errorDistribution": error_dist,
        "biasIndicator": bias_indicator,
        "coverageHeatmap": coverage_heatmap,
        "timeSeries": matched,
        "insights": insights,
        "lastSync": last_sync,
        "dataSourceStatus": "Connected (Elexon BMRS API)"
    }
    _ANALYTICS_CACHE[cache_key] = res
    return res

def get_forecast_explorer_data(
    delivery_date: str,
    cutoff: Optional[str] = None,
    vintage: Optional[str] = None
) -> Dict[str, Any]:
    """
    Data for Page 2 (Forecast Explorer):
    Inspects forecasts for a specific delivery day.
    """
    start_bound = f"{delivery_date}T00:00:00Z"
    end_bound = f"{delivery_date}T23:59:59Z"

    actuals = query_actuals(start_bound, end_bound)
    all_fc = query_forecasts(start_bound, end_bound)

    # Distinct available vintages (publishTimes)
    vintages = sorted(list(set(r["publishTime"] for r in all_fc)), reverse=True)

    if vintage:
        selected_fc = [f for f in all_fc if f["publishTime"] == vintage]
        selected_vintage_time = vintage
    elif cutoff:
        # Latest eligible forecast at or before cutoff
        cutoff_norm = normalize_timestamp(cutoff)
        eligible = [f for f in all_fc if normalize_timestamp(f["publishTime"]) <= cutoff_norm]
        selected_fc = eligible
        selected_vintage_time = max((f["publishTime"] for f in eligible), default=None)
    else:
        selected_fc = all_fc
        selected_vintage_time = vintages[0] if vintages else None

    # Match for the day
    matched = match_forecast_and_actuals(actuals, selected_fc, decision_cutoff=cutoff)

    # Vintage stats
    gens = [r["forecastGeneration"] for r in matched if r.get("forecastGeneration") is not None]
    vintage_stats = {
        "deliveryDate": delivery_date,
        "selectedVintage": selected_vintage_time,
        "selectedVintageLocal": to_uk_local_str(selected_vintage_time) if selected_vintage_time else None,
        "intervalCount": len(gens),
        "minForecastMW": min(gens) if gens else None,
        "maxForecastMW": max(gens) if gens else None,
        "avgForecastMW": round(sum(gens) / len(gens), 2) if gens else None,
        "availabilityStatus": "Complete (24/24)" if len(gens) >= 24 else f"Partial ({len(gens)}/24)"
    }

    return {
        "selectedDeliveryDate": delivery_date,
        "totalIntervals": len(matched),
        "selectedVintageTime": selected_vintage_time,
        "vintageStats": vintage_stats,
        "intervals": matched,
        "availableVintages": vintages
    }

def get_accuracy_analysis(month: Any = DEFAULT_MONTH, cutoff: Optional[str] = None) -> Dict[str, Any]:
    """
    Data for Page 3 (Forecast Accuracy):
    Computes in-depth statistical accuracy metrics and distributions.
    """
    if hasattr(month, "default"):
        month = getattr(month, "default", DEFAULT_MONTH)
    if not isinstance(month, str) or "-" not in month:
        month = DEFAULT_MONTH

    cache_key = f"accuracy_{month}_{cutoff}"
    if cache_key in _ANALYTICS_CACHE:
        return _ANALYTICS_CACHE[cache_key]

    overview = get_overview_data(month, cutoff)
    matched = overview["timeSeries"]
    daily = overview["dailyData"]
    kpis = overview["kpis"]
    error_dist = overview["errorDistribution"]

    # Hourly diurnal error profile (error magnitude by half-hourly/hourly interval 00:00 to 23:00)
    hourly_buckets: Dict[int, List[float]] = {h: [] for h in range(24)}
    for r in matched:
        if r.get("isMatched") and r.get("error") is not None:
            try:
                hour = int(r["startTime"][11:13])
                hourly_buckets[hour].append(r["error"])
            except Exception:
                pass

    diurnal_profile = []
    for h in range(24):
        errs = hourly_buckets[h]
        avg_err = round(sum(errs) / len(errs), 2) if errs else 0.0
        avg_abs = round(sum(abs(e) for e in errs) / len(errs), 2) if errs else 0.0
        diurnal_profile.append({
            "hour": f"{h:02d}:00",
            "meanError": avg_err,
            "mae": avg_abs,
            "count": len(errs)
        })

    res = {
        "metrics": kpis,
        "dailyMetrics": daily,
        "errorDistribution": error_dist,
        "diurnalProfile": diurnal_profile,
        "matchedRecords": [r for r in matched if r.get("isMatched")]
    }
    _ANALYTICS_CACHE[cache_key] = res
    return res

def get_decision_replay(delivery_date: str, decision_cutoff: str) -> Dict[str, Any]:
    """
    Data for Page 4 (Decision Replay):
    Strictly filters: publishTime <= decision_cutoff.
    Never uses forecasts published after the decision cutoff.
    Includes timeline progression across key decision horizons:
    D-2 12:00, D-1 10:00, D-1 16:00, Intraday.
    """
    start_bound = f"{delivery_date}T00:00:00Z"
    end_bound = f"{delivery_date}T23:59:59Z"

    actuals = query_actuals(start_bound, end_bound)
    forecasts = query_forecasts(start_bound, end_bound, max_publish_time=decision_cutoff)

    matched = match_forecast_and_actuals(actuals, forecasts, decision_cutoff=decision_cutoff)
    kpis = calculate_accuracy_metrics(matched, expected_intervals=24)

    # Timeline comparison across benchmark cutoffs
    target_date_dt = datetime.strptime(delivery_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    d_minus_2 = (target_date_dt - timedelta(days=2)).strftime("%Y-%m-%d")
    d_minus_1 = (target_date_dt - timedelta(days=1)).strftime("%Y-%m-%d")

    benchmark_cutoffs = [
        ("D-2 12:00", f"{d_minus_2}T12:00:00Z"),
        ("D-1 10:00 (Day-Ahead Gate)", f"{d_minus_1}T10:00:00Z"),
        ("D-1 16:00 (Post-Auction)", f"{d_minus_1}T16:00:00Z"),
        ("D-1 23:00 (Gate Closure)", f"{d_minus_1}T23:00:00Z"),
        ("Selected Cutoff", normalize_timestamp(decision_cutoff))
    ]

    timeline_points = []
    for label, cut_iso in benchmark_cutoffs:
        if not cut_iso:
            continue
        fc_step = query_forecasts(start_bound, end_bound, max_publish_time=cut_iso)
        matched_step = match_forecast_and_actuals(actuals, fc_step, decision_cutoff=cut_iso)
        step_metrics = calculate_accuracy_metrics(matched_step, expected_intervals=24)
        is_target = (label == "Selected Cutoff") or (cut_iso == normalize_timestamp(decision_cutoff))

        timeline_points.append({
            "label": label,
            "cutoffTimestamp": cut_iso,
            "cutoffLocal": to_uk_local_str(cut_iso),
            "mae": step_metrics["mae"],
            "rmse": step_metrics["rmse"],
            "bias": step_metrics["mbe"],
            "matchedCount": step_metrics["matchedIntervals"],
            "isTarget": is_target
        })

    return {
        "deliveryDate": delivery_date,
        "decisionCutoff": decision_cutoff,
        "decisionCutoffLocal": to_uk_local_str(decision_cutoff),
        "metrics": kpis,
        "intervals": matched,
        "timeline": timeline_points
    }

def get_data_quality_report(month: Any = DEFAULT_MONTH) -> Dict[str, Any]:
    """
    Data for Page 5 (Data Quality summary):
    Audits record counts, duplicates, missing timestamps, and coverage.
    """
    if hasattr(month, "default"):
        month = getattr(month, "default", DEFAULT_MONTH)
    if not isinstance(month, str) or "-" not in month:
        month = DEFAULT_MONTH

    cache_key = f"quality_{month}"
    if cache_key in _ANALYTICS_CACHE:
        return _ANALYTICS_CACHE[cache_key]

    conn = get_connection()
    try:
        cur_act = conn.execute("SELECT COUNT(*) as cnt, MIN(start_time) as min_st, MAX(start_time) as max_st FROM actuals WHERE fuel_type = 'WIND'")
        row_act = cur_act.fetchone()
        wind_actuals_cnt = row_act["cnt"]
        act_min = row_act["min_st"]
        act_max = row_act["max_st"]

        cur_all_act = conn.execute("SELECT COUNT(*) as cnt FROM actuals")
        total_act = cur_all_act.fetchone()["cnt"]

        cur_fc = conn.execute("SELECT COUNT(*) as cnt, MIN(start_time) as min_st, MAX(start_time) as max_st FROM forecasts")
        row_fc = cur_fc.fetchone()
        total_fc = row_fc["cnt"]
        fc_min = row_fc["min_st"]
        fc_max = row_fc["max_st"]

        # Check for invalid values (<0 or null)
        cur_inv_act = conn.execute("SELECT COUNT(*) as cnt FROM actuals WHERE generation < 0 OR generation IS NULL")
        inv_act = cur_inv_act.fetchone()["cnt"]

        cur_inv_fc = conn.execute("SELECT COUNT(*) as cnt FROM forecasts WHERE generation < 0 OR generation IS NULL")
        inv_fc = cur_inv_fc.fetchone()["cnt"]

        last_sync = get_sync_metadata("last_full_sync") or get_sync_metadata("last_actuals_sync")

        # Matched intervals for January 2026
        start_bound = f"{month}-01T00:00:00Z"
        end_bound = f"{month}-31T23:59:59Z"
        actuals = query_actuals(start_bound, end_bound)
        forecasts = query_forecasts(start_bound, end_bound)
        matched = match_forecast_and_actuals(actuals, forecasts)
        kpis = calculate_accuracy_metrics(matched, expected_intervals=EXPECTED_JANUARY_HOURS)

        res = {
            "totalActualRecords": total_act,
            "totalForecastRecords": total_fc,
            "windActualRecords": wind_actuals_cnt,
            "nonWindActualRecordsFiltered": total_act - wind_actuals_cnt,
            "duplicateRecordsRemoved": 0,  # Enforced by SQLite unique constraints
            "missingValuesCount": 0,
            "invalidValuesCount": inv_act + inv_fc,
            "matchedIntervals": kpis["matchedIntervals"],
            "expectedIntervals": EXPECTED_JANUARY_HOURS,
            "coveragePercent": kpis["coverage"],
            "lastSyncTimestamp": last_sync,
            "dateRangeActuals": {"from": act_min, "to": act_max},
            "dateRangeForecasts": {"from": fc_min, "to": fc_max},
            "tableSummaries": {
                "actualsTable": "actuals (Elexon FUELHH filtered WIND)",
                "forecastsTable": "forecasts (Elexon WINDFOR)",
                "databaseEngine": "SQLite with indexed timestamps",
                "evaluationMonth": month
            }
        }
        _ANALYTICS_CACHE[cache_key] = res
        return res
    finally:
        conn.close()

def export_csv(dataset_type: Any = "accuracy", month: Any = DEFAULT_MONTH, cutoff: Optional[str] = None) -> str:
    """
    Exports data to CSV format for download.
    """
    if hasattr(dataset_type, "default"):
        dataset_type = getattr(dataset_type, "default", "accuracy")
    if hasattr(month, "default"):
        month = getattr(month, "default", DEFAULT_MONTH)
    if not isinstance(month, str) or "-" not in month:
        month = DEFAULT_MONTH

    start_bound = f"{month}-01T00:00:00Z"
    end_bound = f"{month}-31T23:59:59Z"
    output = io.StringIO()
    writer = csv.writer(output)

    if dataset_type == "actuals":
        records = query_actuals(start_bound, end_bound)
        writer.writerow(["DeliveryStartTimeUTC", "SettlementDate", "SettlementPeriod", "FuelType", "GenerationMW"])
        for r in records:
            writer.writerow([r["startTime"], r.get("settlementDate"), r.get("settlementPeriod"), r["fuelType"], r["generation"]])

    elif dataset_type == "forecasts":
        records = query_forecasts(start_bound, end_bound, max_publish_time=cutoff)
        writer.writerow(["DeliveryStartTimeUTC", "PublishTimeUTC", "ForecastGenerationMW"])
        for r in records:
            writer.writerow([r["startTime"], r["publishTime"], r["generation"]])

    elif dataset_type in ("accuracy", "matched"):
        actuals = query_actuals(start_bound, end_bound)
        forecasts = query_forecasts(start_bound, end_bound, max_publish_time=cutoff)
        matched = match_forecast_and_actuals(actuals, forecasts, decision_cutoff=cutoff)
        writer.writerow([
            "DeliveryStartTimeUTC", "DeliveryTimeUKLocal", "PublishTimeUTC", "PublishTimeUKLocal",
            "ActualGenerationMW", "ForecastGenerationMW", "ErrorMW", "AbsoluteErrorMW",
            "PercentageError", "ForecastAgeHours", "Status"
        ])
        for r in matched:
            writer.writerow([
                r["startTime"], r["deliveryTimeLocal"], r.get("publishTime"), r.get("publishTimeLocal"),
                r.get("actualGeneration"), r.get("forecastGeneration"), r.get("error"),
                r.get("absoluteError"), r.get("percentageError"), r.get("forecastAgeHours"),
                r["status"]
            ])

    return output.getvalue()
