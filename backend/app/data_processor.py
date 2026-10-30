import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import dateutil.parser
import pytz

logger = logging.getLogger(__name__)

LONDON_TZ = pytz.timezone("Europe/London")

def normalize_timestamp(ts: Any) -> Optional[str]:
    """
    Normalizes any timestamp string or datetime object into UTC ISO8601 string:
    e.g. '2026-01-01T00:00:00Z'.
    """
    if ts is None:
        return None
    try:
        if isinstance(ts, datetime):
            dt = ts
        else:
            dt = dateutil.parser.isoparse(str(ts))

        if dt.tzinfo is None:
            # Assume UTC if naive
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)

        # Standardize format to YYYY-MM-DDTHH:MM:SSZ
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception as e:
        logger.warning("Failed to normalize timestamp '%s': %s", ts, e)
        return None

def to_uk_local_str(ts_utc: str) -> str:
    """
    Converts a UTC ISO timestamp to a formatted UK local time string:
    'YYYY-MM-DD HH:MM' (accounts for GMT/BST).
    """
    if not ts_utc:
        return ""
    try:
        dt = dateutil.parser.isoparse(ts_utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt_local = dt.astimezone(LONDON_TZ)
        return dt_local.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return str(ts_utc)

def filter_wind_actuals(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Filters actual generation records strictly for fuelType == 'WIND'.
    """
    filtered = []
    for r in records:
        fuel = str(r.get("fuelType", "")).strip().upper()
        if fuel == "WIND":
            filtered.append(r)
    return filtered

def validate_record(record: Dict[str, Any], dataset_type: str) -> bool:
    """
    Validates record structure, valid numeric generation, and timestamp integrity.
    """
    start_time = record.get("startTime")
    if not start_time or normalize_timestamp(start_time) is None:
        return False

    gen = record.get("generation")
    if gen is None:
        return False
    try:
        val = float(gen)
        if math.isnan(val) or math.isinf(val) or val < 0:
            return False
    except (ValueError, TypeError):
        return False

    if dataset_type == "FUELHH":
        fuel = str(record.get("fuelType", "")).upper()
        if fuel != "WIND":
            return False
    elif dataset_type == "WINDFOR":
        pub = record.get("publishTime")
        if not pub or normalize_timestamp(pub) is None:
            return False

    return True

def select_latest_eligible_forecast(
    forecasts_for_interval: List[Dict[str, Any]],
    decision_cutoff_utc: str
) -> Optional[Dict[str, Any]]:
    """
    Selects the most recent forecast published at or before the decision cutoff:
    publishTime <= decision_cutoff
    Prevents look-ahead bias.
    """
    eligible = []
    cutoff_norm = normalize_timestamp(decision_cutoff_utc)
    if not cutoff_norm:
        return None

    for f in forecasts_for_interval:
        pub_norm = normalize_timestamp(f.get("publishTime"))
        if pub_norm and pub_norm <= cutoff_norm:
            eligible.append((pub_norm, f))

    if not eligible:
        return None

    # Sort by publish_time ascending, pick last (latest)
    eligible.sort(key=lambda x: x[0])
    return eligible[-1][1]

def match_forecast_and_actuals(
    actuals: List[Dict[str, Any]],
    forecasts: List[Dict[str, Any]],
    decision_cutoff: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Matches forecasts and actuals strictly on normalized startTime.
    If decision_cutoff is provided:
      selects latest forecast with publishTime <= decision_cutoff.
    If decision_cutoff is None:
      selects the latest forecast published prior to delivery start time (publishTime <= startTime).
    """
    # Group forecasts by normalized startTime
    forecasts_by_start: Dict[str, List[Dict[str, Any]]] = {}
    for f in forecasts:
        st = normalize_timestamp(f.get("startTime"))
        if st:
            forecasts_by_start.setdefault(st, []).append(f)

    # Index actuals by normalized startTime
    actuals_by_start: Dict[str, Dict[str, Any]] = {}
    for a in actuals:
        st = normalize_timestamp(a.get("startTime"))
        if st:
            actuals_by_start[st] = a

    # Get union of all start times
    all_start_times = sorted(list(set(list(forecasts_by_start.keys()) + list(actuals_by_start.keys()))))

    matched_records = []
    for st in all_start_times:
        act_rec = actuals_by_start.get(st)
        act_gen = float(act_rec["generation"]) if act_rec and act_rec.get("generation") is not None else None

        # Select forecast
        fc_candidates = forecasts_by_start.get(st, [])
        cutoff_to_use = decision_cutoff if decision_cutoff else st
        selected_fc = select_latest_eligible_forecast(fc_candidates, cutoff_to_use)

        fc_gen = float(selected_fc["generation"]) if selected_fc and selected_fc.get("generation") is not None else None
        pub_time = normalize_timestamp(selected_fc.get("publishTime")) if selected_fc else None

        # Forecast age in hours
        forecast_age_hours = None
        if pub_time and cutoff_to_use:
            try:
                dt_pub = dateutil.parser.isoparse(pub_time)
                dt_cut = dateutil.parser.isoparse(cutoff_to_use)
                forecast_age_hours = round(max(0.0, (dt_cut - dt_pub).total_seconds() / 3600.0), 2)
            except Exception:
                pass

        # Error calculations
        is_matched = (act_gen is not None) and (fc_gen is not None)
        error = None
        abs_error = None
        pct_error = None
        status = "unmatched"

        if is_matched:
            error = round(fc_gen - act_gen, 2)
            abs_error = round(abs(error), 2)
            if act_gen > 0:
                pct_error = round((abs_error / act_gen) * 100.0, 2)
            status = "matched"
        elif act_gen is not None:
            status = "actual_only"
        elif fc_gen is not None:
            status = "forecast_only"

        # Also get retrospective latest forecast in entire dataset for this interval
        retro_fc = None
        retro_gen = None
        retro_pub = None
        retro_error = None
        if fc_candidates:
            sorted_candidates = sorted(fc_candidates, key=lambda x: normalize_timestamp(x.get("publishTime")) or "")
            retro_fc = sorted_candidates[-1]
            retro_gen = float(retro_fc["generation"])
            retro_pub = normalize_timestamp(retro_fc.get("publishTime"))
            if act_gen is not None:
                retro_error = round(retro_gen - act_gen, 2)

        matched_records.append({
            "startTime": st,
            "deliveryTimeLocal": to_uk_local_str(st),
            "actualGeneration": act_gen,
            "forecastGeneration": fc_gen,
            "publishTime": pub_time,
            "publishTimeLocal": to_uk_local_str(pub_time) if pub_time else None,
            "forecastAgeHours": forecast_age_hours,
            "error": error,
            "absoluteError": abs_error,
            "percentageError": pct_error,
            "isMatched": is_matched,
            "status": status,
            "retrospectivePublishTime": retro_pub,
            "retrospectiveForecast": retro_gen,
            "retrospectiveError": retro_error
        })

    return matched_records

def calculate_accuracy_metrics(
    records: List[Dict[str, Any]],
    expected_intervals: int = 744
) -> Dict[str, Any]:
    """
    Computes standard wind procurement forecasting accuracy metrics:
    MAE, RMSE, MBE (Mean Bias Error), WAPE (%), and Coverage (%).
    Strict rule: Only use matched intervals for error calculations!
    Never treat missing values as zero.
    """
    valid_pairs = [
        r for r in records
        if r.get("isMatched") and r.get("actualGeneration") is not None and r.get("forecastGeneration") is not None
    ]

    matched_count = len(valid_pairs)
    total_actuals = len([r for r in records if r.get("actualGeneration") is not None])
    total_forecasts = len([r for r in records if r.get("forecastGeneration") is not None])

    coverage = round((matched_count / expected_intervals * 100.0), 2) if expected_intervals > 0 else 0.0

    if matched_count == 0:
        return {
            "mae": None,
            "rmse": None,
            "mbe": None,
            "wape": None,
            "coverage": coverage,
            "matchedIntervals": 0,
            "expectedIntervals": expected_intervals,
            "totalActualIntervals": total_actuals,
            "totalForecastIntervals": total_forecasts,
            "totalActualGenerationMWh": None,
            "totalForecastGenerationMWh": None,
            "avgActualGeneration": None,
            "avgForecastGeneration": None
        }

    errors = [r["error"] for r in valid_pairs]
    abs_errors = [r["absoluteError"] for r in valid_pairs]
    actuals = [r["actualGeneration"] for r in valid_pairs]
    forecasts = [r["forecastGeneration"] for r in valid_pairs]

    mae = round(sum(abs_errors) / matched_count, 2)
    mse = sum(e ** 2 for e in errors) / matched_count
    rmse = round(math.sqrt(mse), 2)
    mbe = round(sum(errors) / matched_count, 2)

    sum_actual = sum(actuals)
    sum_abs_err = sum(abs_errors)
    wape = round((sum_abs_err / sum_actual * 100.0), 2) if sum_actual > 0 else None

    # MWh for 1-hour intervals is equal to sum of MW * 1h
    total_actual_mwh = round(sum_actual, 1)
    total_forecast_mwh = round(sum(forecasts), 1)
    avg_actual = round(sum_actual / matched_count, 2)
    avg_forecast = round(sum(forecasts) / matched_count, 2)

    return {
        "mae": mae,
        "rmse": rmse,
        "mbe": mbe,
        "wape": wape,
        "coverage": coverage,
        "matchedIntervals": matched_count,
        "expectedIntervals": expected_intervals,
        "totalActualIntervals": total_actuals,
        "totalForecastIntervals": total_forecasts,
        "totalActualGenerationMWh": total_actual_mwh,
        "totalForecastGenerationMWh": total_forecast_mwh,
        "avgActualGeneration": avg_actual,
        "avgForecastGeneration": avg_forecast
    }

def calculate_daily_metrics(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregates matched intervals by delivery day (YYYY-MM-DD).
    Expected intervals per day = 24.
    """
    days: Dict[str, List[Dict[str, Any]]] = {}
    for r in records:
        st = r["startTime"]
        date_str = st[:10]
        days.setdefault(date_str, []).append(r)

    daily_results = []
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for d in sorted(days.keys()):
        day_records = days[d]
        metrics = calculate_accuracy_metrics(day_records, expected_intervals=24)
        try:
            dt = datetime.strptime(d, "%Y-%m-%d")
            dow = days_of_week[dt.weekday()]
        except Exception:
            dow = ""

        daily_results.append({
            "date": d,
            "dayOfWeek": dow,
            "avgActual": metrics["avgActualGeneration"],
            "avgForecast": metrics["avgForecastGeneration"],
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "bias": metrics["mbe"],
            "wape": metrics["wape"],
            "coverage": metrics["coverage"],
            "matchedCount": metrics["matchedIntervals"],
            "expectedCount": 24
        })

    return daily_results

def calculate_error_distribution(records: List[Dict[str, Any]], num_bins: int = 10) -> List[Dict[str, Any]]:
    """
    Constructs an error distribution histogram from valid error values.
    """
    errors = [r["error"] for r in records if r.get("isMatched") and r.get("error") is not None]
    if not errors:
        return []

    min_err = min(errors)
    max_err = max(errors)

    if min_err == max_err:
        return [{
            "binStart": round(min_err, 1),
            "binEnd": round(max_err, 1),
            "binLabel": f"{round(min_err, 0)} MW",
            "count": len(errors),
            "percentage": 100.0
        }]

    bin_width = (max_err - min_err) / num_bins
    bins = [min_err + i * bin_width for i in range(num_bins + 1)]
    counts = [0] * num_bins

    for e in errors:
        idx = int((e - min_err) / bin_width)
        if idx >= num_bins:
            idx = num_bins - 1
        counts[idx] += 1

    total = len(errors)
    distribution = []
    for i in range(num_bins):
        b_start = round(bins[i], 1)
        b_end = round(bins[i+1], 1)
        cnt = counts[i]
        pct = round((cnt / total * 100.0), 1)
        distribution.append({
            "binStart": b_start,
            "binEnd": b_end,
            "binLabel": f"{int(b_start)} to {int(b_end)}",
            "count": cnt,
            "percentage": pct
        })

    return distribution

def generate_insights(
    records: List[Dict[str, Any]],
    daily_metrics: List[Dict[str, Any]],
    overall_metrics: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Dynamically generates procurement intelligence insights from actual data.
    Never hardcoded!
    """
    insights = []
    matched = [r for r in records if r.get("isMatched") and r.get("error") is not None]
    if not matched:
        return [
            {
                "id": "no_data",
                "type": "coverage",
                "title": "Awaiting Data Ingestion",
                "description": "No matched intervals found for the selected evaluation period.",
                "metricValue": "0%",
                "severity": "warning",
                "timestamp": None
            }
        ]

    # 1. Highest Absolute Forecast Error
    max_err_record = max(matched, key=lambda x: x["absoluteError"])
    err_sign = "+" if max_err_record["error"] > 0 else ""
    insights.append({
        "id": "highest_error_interval",
        "type": "highest_error",
        "title": "Peak Forecast Discrepancy",
        "description": f"Highest absolute forecasting error occurred at delivery interval {max_err_record['deliveryTimeLocal']} (UK local). Forecast was {max_err_record['forecastGeneration']:,.0f} MW vs actual {max_err_record['actualGeneration']:,.0f} MW ({err_sign}{max_err_record['error']:,.0f} MW).",
        "metricValue": f"{max_err_record['absoluteError']:,.0f} MW",
        "severity": "danger",
        "timestamp": max_err_record["startTime"]
    })

    # 2. Maximum Wind Generation Day
    valid_daily = [d for d in daily_metrics if d.get("avgActual") is not None]
    if valid_daily:
        max_wind_day = max(valid_daily, key=lambda x: x["avgActual"])
        insights.append({
            "id": "max_wind_day",
            "type": "max_wind",
            "title": "Highest Wind Generation Day",
            "description": f"{max_wind_day['date']} ({max_wind_day['dayOfWeek']}) recorded the maximum daily average wind generation at {max_wind_day['avgActual']:,.0f} MW, with forecast MAE of {max_wind_day['mae']:,.0f} MW.",
            "metricValue": f"{max_wind_day['avgActual']:,.0f} MW",
            "severity": "success",
            "timestamp": max_wind_day["date"]
        })

        # 3. Lowest Wind Generation Day (Dunkelflaute / calm conditions)
        min_wind_day = min(valid_daily, key=lambda x: x["avgActual"])
        insights.append({
            "id": "min_wind_day",
            "type": "min_wind",
            "title": "Lowest Wind Generation Day",
            "description": f"{min_wind_day['date']} ({min_wind_day['dayOfWeek']}) experienced the lowest wind generation of the month at {min_wind_day['avgActual']:,.0f} MW. Grid required substantial flexible backup.",
            "metricValue": f"{min_wind_day['avgActual']:,.0f} MW",
            "severity": "info",
            "timestamp": min_wind_day["date"]
        })

    # 4. Systematic Bias Assessment
    mbe = overall_metrics.get("mbe", 0) or 0
    over_count = len([r for r in matched if r["error"] > 0])
    under_count = len([r for r in matched if r["error"] < 0])
    total_count = len(matched)
    over_pct = round((over_count / total_count) * 100.0, 1) if total_count > 0 else 0

    if mbe > 50:
        insights.append({
            "id": "systematic_overforecasting",
            "type": "bias",
            "title": "Systematic Overforecasting Observed",
            "description": f"Mean Bias Error is +{mbe:,.0f} MW. Forecasts exceeded actual generation across {over_pct}% of evaluated intervals, indicating procurement teams may have under-procured backup electricity.",
            "metricValue": f"+{mbe:,.0f} MW",
            "severity": "warning",
            "timestamp": None
        })
    elif mbe < -50:
        insights.append({
            "id": "systematic_underforecasting",
            "type": "bias",
            "title": "Systematic Underforecasting Observed",
            "description": f"Mean Bias Error is {mbe:,.0f} MW. Actual generation surpassed forecasts across {100 - over_pct}% of intervals, potentially causing unnecessary day-ahead power purchases.",
            "metricValue": f"{mbe:,.0f} MW",
            "severity": "info",
            "timestamp": None
        })
    else:
        insights.append({
            "id": "balanced_bias",
            "type": "bias",
            "title": "Balanced Forecast Distribution",
            "description": f"Mean Bias Error is well centered at {mbe:+,.1f} MW. Approximately {over_pct}% of intervals were overforecast and {100 - over_pct}% underforecast.",
            "metricValue": f"{mbe:+,.1f} MW",
            "severity": "success",
            "timestamp": None
        })

    # 5. Publication Freshness & Coverage
    cov = overall_metrics.get("coverage", 0)
    wape = overall_metrics.get("wape")
    wape_str = f"{wape:.1f}%" if wape is not None else "N/A"
    insights.append({
        "id": "forecast_coverage_freshness",
        "type": "freshness",
        "title": "Settlement Interval Coverage & WAPE",
        "description": f"Evaluation achieved {cov:.1f}% interval matching ({overall_metrics.get('matchedIntervals', 0)} intervals). Weighted Absolute Percentage Error (WAPE) stands at {wape_str}.",
        "metricValue": f"{cov:.1f}% Coverage",
        "severity": "info",
        "timestamp": None
    })

    return insights
