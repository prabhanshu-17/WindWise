export interface AccuracyMetrics {
  mae: number | null;
  rmse: number | null;
  mbe: number | null;
  wape: number | null;
  coverage: number;
  matchedIntervals: number;
  expectedIntervals: number;
  totalActualIntervals: number;
  totalForecastIntervals: number;
  totalActualGenerationMWh: number | null;
  totalForecastGenerationMWh: number | null;
  avgActualGeneration: number | null;
  avgForecastGeneration: number | null;
}

export interface DailyMetric {
  date: string;
  dayOfWeek: string;
  avgActual: number | null;
  avgForecast: number | null;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  wape: number | null;
  coverage: number;
  matchedCount: number;
  expectedCount: number;
}

export interface ErrorBin {
  binStart: number;
  binEnd: number;
  binLabel: string;
  count: number;
  percentage: number;
}

export interface CoverageDay {
  date: string;
  matched: number;
  expected: number;
  coveragePercent: number;
  avgGeneration: number | null;
  status: 'complete' | 'partial' | 'empty';
}

export interface Insight {
  id: string;
  type: 'highest_error' | 'max_wind' | 'min_wind' | 'bias' | 'freshness' | 'coverage';
  title: string;
  description: string;
  metricValue: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  timestamp?: string;
}

export interface TimeSeriesInterval {
  startTime: string;
  deliveryTimeLocal: string;
  actualGeneration: number | null;
  forecastGeneration: number | null;
  publishTime: string | null;
  publishTimeLocal: string | null;
  selectedPublishTime?: string | null;
  selectedPublishTimeLocal?: string | null;
  forecastAgeHours: number | null;
  error: number | null;
  absoluteError: number | null;
  percentageError: number | null;
  isMatched: boolean;
  status: 'matched' | 'actual_only' | 'forecast_only' | 'unmatched';
  retrospectivePublishTime?: string | null;
  retrospectiveForecast?: number | null;
  retrospectiveError?: number | null;
}

export interface BiasIndicator {
  mbe: number;
  direction: 'overforecast' | 'underforecast' | 'neutral';
  overforecastCount: number;
  underforecastCount: number;
  neutralCount: number;
  overforecastPercent: number;
  underforecastPercent: number;
}

export interface OverviewData {
  kpis: AccuracyMetrics;
  dailyData: DailyMetric[];
  errorDistribution: ErrorBin[];
  biasIndicator: BiasIndicator;
  coverageHeatmap: CoverageDay[];
  timeSeries: TimeSeriesInterval[];
  insights: Insight[];
  lastSync: string | null;
  dataSourceStatus: string;
}

export interface VintageStats {
  deliveryDate: string;
  selectedVintage: string | null;
  selectedVintageLocal: string | null;
  intervalCount: number;
  minForecastMW: number | null;
  maxForecastMW: number | null;
  avgForecastMW: number | null;
  availabilityStatus: string;
}

export interface ForecastExplorerData {
  selectedDeliveryDate: string;
  totalIntervals: number;
  selectedVintageTime: string | null;
  vintageStats: VintageStats;
  intervals: TimeSeriesInterval[];
  availableVintages: string[];
}

export interface DiurnalProfilePoint {
  hour: string;
  meanError: number;
  mae: number;
  count: number;
}

export interface AccuracyAnalysisData {
  metrics: AccuracyMetrics;
  dailyMetrics: DailyMetric[];
  errorDistribution: ErrorBin[];
  diurnalProfile: DiurnalProfilePoint[];
  matchedRecords: TimeSeriesInterval[];
}

export interface TimelinePoint {
  label: string;
  cutoffTimestamp: string;
  cutoffLocal: string;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  matchedCount: number;
  isTarget: boolean;
}

export interface DecisionReplayData {
  deliveryDate: string;
  decisionCutoff: string;
  decisionCutoffLocal: string;
  metrics: AccuracyMetrics;
  intervals: TimeSeriesInterval[];
  timeline: TimelinePoint[];
}

export interface DataQualityData {
  totalActualRecords: number;
  totalForecastRecords: number;
  windActualRecords: number;
  nonWindActualRecordsFiltered: number;
  duplicateRecordsRemoved: number;
  missingValuesCount: number;
  invalidValuesCount: number;
  matchedIntervals: number;
  expectedIntervals: number;
  coveragePercent: number;
  lastSyncTimestamp: string | null;
  dateRangeActuals: { from: string | null; to: string | null };
  dateRangeForecasts: { from: string | null; to: string | null };
  tableSummaries: Record<string, string>;
}

export interface ActualRecord {
  publishTime: string;
  startTime: string;
  settlementDate?: string;
  settlementPeriod?: number;
  fuelType: string;
  generation: number;
}

export interface ForecastRecord {
  publishTime: string;
  startTime: string;
  generation: number;
}
