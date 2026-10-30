from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    version: str
    api_connectivity: str
    database_connected: bool
    total_actuals_cached: int
    total_forecasts_cached: int
    last_sync_timestamp: Optional[str] = None
    evaluation_period: str = "January 1-31, 2026"

class ActualRecord(BaseModel):
    dataset: str = "FUELHH"
    publishTime: str
    startTime: str
    settlementDate: Optional[str] = None
    settlementPeriod: Optional[int] = None
    fuelType: str = "WIND"
    generation: float

class ForecastRecord(BaseModel):
    dataset: str = "WINDFOR"
    publishTime: str
    startTime: str
    generation: float

class MatchedInterval(BaseModel):
    startTime: str
    deliveryTimeLocal: str
    actualGeneration: Optional[float] = None
    forecastGeneration: Optional[float] = None
    publishTime: Optional[str] = None
    publishTimeLocal: Optional[str] = None
    forecastAgeHours: Optional[float] = None
    error: Optional[float] = None
    absoluteError: Optional[float] = None
    percentageError: Optional[float] = None
    isMatched: bool = False
    status: str = "matched"  # 'matched', 'actual_only', 'forecast_only'

class AccuracyMetrics(BaseModel):
    mae: Optional[float] = Field(None, description="Mean Absolute Error (MW)")
    rmse: Optional[float] = Field(None, description="Root Mean Squared Error (MW)")
    mbe: Optional[float] = Field(None, description="Mean Bias Error (MW) - positive=overforecast, negative=underforecast")
    wape: Optional[float] = Field(None, description="Weighted Absolute Percentage Error (%)")
    coverage: float = Field(0.0, description="Percentage of intervals matched vs expected (%)")
    matchedIntervals: int = Field(0, description="Number of successfully matched intervals")
    expectedIntervals: int = Field(744, description="Expected intervals in target range")
    totalActualIntervals: int = 0
    totalForecastIntervals: int = 0
    totalActualGenerationMWh: Optional[float] = None
    totalForecastGenerationMWh: Optional[float] = None
    avgActualGeneration: Optional[float] = None
    avgForecastGeneration: Optional[float] = None

class DailyMetric(BaseModel):
    date: str
    dayOfWeek: str
    avgActual: Optional[float] = None
    avgForecast: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    bias: Optional[float] = None
    wape: Optional[float] = None
    coverage: float = 0.0
    matchedCount: int = 0
    expectedCount: int = 24

class ErrorBin(BaseModel):
    binStart: float
    binEnd: float
    binLabel: str
    count: int
    percentage: float

class CoverageDay(BaseModel):
    date: str
    matched: int
    expected: int
    coveragePercent: float
    avgGeneration: Optional[float] = None
    status: str  # 'complete', 'partial', 'empty'

class Insight(BaseModel):
    id: str
    type: str  # 'highest_error', 'max_wind', 'min_wind', 'bias', 'freshness', 'coverage'
    title: str
    description: str
    metricValue: str
    severity: str  # 'info', 'success', 'warning', 'danger'
    timestamp: Optional[str] = None

class OverviewResponse(BaseModel):
    kpis: AccuracyMetrics
    dailyData: List[DailyMetric]
    errorDistribution: List[ErrorBin]
    biasIndicator: Dict[str, Any]
    coverageHeatmap: List[CoverageDay]
    timeSeries: List[Dict[str, Any]]
    insights: List[Insight]
    lastSync: Optional[str] = None
    dataSourceStatus: str = "Connected (Elexon BMRS API)"

class ForecastExplorerResponse(BaseModel):
    selectedDeliveryDate: str
    totalIntervals: int
    selectedVintageTime: Optional[str] = None
    vintageStats: Dict[str, Any]
    intervals: List[Dict[str, Any]]
    availableVintages: List[str]

class DecisionReplayInterval(BaseModel):
    startTime: str
    deliveryTimeLocal: str
    selectedPublishTime: Optional[str] = None
    selectedPublishTimeLocal: Optional[str] = None
    forecastGeneration: Optional[float] = None
    actualGeneration: Optional[float] = None
    error: Optional[float] = None
    absoluteError: Optional[float] = None
    forecastAgeHours: Optional[float] = None
    status: str
    retrospectivePublishTime: Optional[str] = None
    retrospectiveForecast: Optional[float] = None
    retrospectiveError: Optional[float] = None

class TimelinePoint(BaseModel):
    label: str
    cutoffTimestamp: str
    cutoffLocal: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    bias: Optional[float] = None
    matchedCount: int = 0
    isTarget: bool = False

class DecisionReplayResponse(BaseModel):
    deliveryDate: str
    decisionCutoff: str
    decisionCutoffLocal: str
    metrics: AccuracyMetrics
    intervals: List[DecisionReplayInterval]
    timeline: List[TimelinePoint]

class DataQualityResponse(BaseModel):
    totalActualRecords: int
    totalForecastRecords: int
    windActualRecords: int
    nonWindActualRecordsFiltered: int
    duplicateRecordsRemoved: int
    missingValuesCount: int
    invalidValuesCount: int
    matchedIntervals: int
    expectedIntervals: int
    coveragePercent: float
    lastSyncTimestamp: Optional[str] = None
    dateRangeActuals: Dict[str, Optional[str]]
    dateRangeForecasts: Dict[str, Optional[str]]
    tableSummaries: Dict[str, Any]

