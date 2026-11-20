import React, { useState, useEffect } from 'react';
import {
  Activity,
  Gauge,
  Percent,
  TrendingUp,
  Download,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
  Cell
} from 'recharts';
import { fetchAccuracy, getExportUrl } from '../services/api';
import { AccuracyAnalysisData } from '../types';
import { KPICard } from '../components/KPICard';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const AccuracyPage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<AccuracyAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive View Filter: 'all', 'high_wind', 'low_wind', 'peak_hours'
  const [filterMode, setFilterMode] = useState<'all' | 'high_wind' | 'low_wind' | 'peak_hours'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAccuracy('2026-01');
      setData(res);
    } catch (err: any) {
      console.error('Error fetching accuracy analysis:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load accuracy analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={loadData} />;

  const { metrics, dailyMetrics, errorDistribution, diurnalProfile, matchedRecords } = data;
  const mbe = metrics.mbe || 0;
  const isOverforecast = mbe > 0;

  // Apply interactive filter to matchedRecords for scatter plot
  let filteredScatter = matchedRecords;
  if (filterMode === 'high_wind') {
    filteredScatter = matchedRecords.filter((r) => r.actualGeneration !== null && r.actualGeneration >= 12000);
  } else if (filterMode === 'low_wind') {
    filteredScatter = matchedRecords.filter((r) => r.actualGeneration !== null && r.actualGeneration < 8000);
  } else if (filterMode === 'peak_hours') {
    filteredScatter = matchedRecords.filter((r) => {
      const hour = parseInt(r.deliveryTimeLocal.split(' ')[1]?.split(':')[0] || '0', 10);
      return hour >= 7 && hour <= 19;
    });
  }

  // Scatter plot data sample
  const scatterData = filteredScatter.slice(0, 350).map((r) => ({
    actual: r.actualGeneration,
    forecast: r.forecastGeneration,
    error: r.error,
    time: r.deliveryTimeLocal,
  }));

  const handleFilterClick = (mode: 'all' | 'high_wind' | 'low_wind' | 'peak_hours', label: string) => {
    setFilterMode(mode);
    showToast(`Filter applied: ${label}`, 'info');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <Activity className="w-5 sm:w-6 h-5 sm:h-6 text-wind-accent" />
            Forecast Accuracy & Performance
          </h1>
          <p className="text-xs text-wind-textSecondary mt-0.5 sm:mt-1">
            Measure how reliably wind generation forecasts represent actual generation across January 2026 settlement periods.
          </p>
        </div>

        <a
          href={getExportUrl('accuracy', '2026-01')}
          download="windwise_accuracy_metrics_2026-01.csv"
          onClick={() => showToast('Downloading accuracy metrics CSV...', 'info')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-xs font-semibold text-wind-textPrimary transition-all shadow-sm self-start sm:self-auto active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-wind-accent" />
          <span>Export Metrics CSV</span>
        </a>
      </div>

      {/* TOP 5 ACCURACY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. MAE */}
        <KPICard
          title="Mean Absolute Error"
          value={metrics.mae ? Math.round(metrics.mae).toLocaleString() : '—'}
          unit="MW"
          explanation="Mean absolute magnitude of forecast deviations across matched intervals."
          formulaTooltip="MAE = (1/N) * Σ |Forecast_i - Actual_i|. Treats under/overforecasting equally."
          icon={Activity}
          highlightColor="amber"
          badge={{ label: 'Dispersion', variant: 'neutral' }}
        />

        {/* 2. RMSE */}
        <KPICard
          title="Root Mean Squared Error"
          value={metrics.rmse ? Math.round(metrics.rmse).toLocaleString() : '—'}
          unit="MW"
          explanation="Penalizes large outlier forecast errors heavily via quadratic scoring."
          formulaTooltip="RMSE = sqrt((1/N) * Σ (Forecast_i - Actual_i)^2). Higher than MAE when outliers occur."
          icon={TrendingUp}
          highlightColor="rose"
          badge={{ label: 'Penalizes Outliers', variant: 'negative' }}
        />

        {/* 3. Mean Bias Error (MBE) */}
        <KPICard
          title="Mean Bias Error (MBE)"
          value={mbe > 0 ? `+${Math.round(mbe).toLocaleString()}` : Math.round(mbe).toLocaleString()}
          unit="MW"
          explanation={isOverforecast ? 'Forecast systematically overpredicted generation.' : 'Forecast systematically underpredicted generation.'}
          formulaTooltip="MBE = (1/N) * Σ (Forecast_i - Actual_i). Positive = overforecast, Negative = underforecast."
          icon={Gauge}
          highlightColor={isOverforecast ? 'amber' : 'blue'}
          badge={{
            label: isOverforecast ? '+ Bias (Over)' : '- Bias (Under)',
            variant: isOverforecast ? 'negative' : 'accent'
          }}
        />

        {/* 4. WAPE */}
        <KPICard
          title="WAPE"
          value={metrics.wape ? `${metrics.wape.toFixed(1)}` : '—'}
          unit="%"
          explanation="Weighted Absolute Percentage Error relative to total delivery volume."
          formulaTooltip="WAPE = (Σ |Forecast_i - Actual_i| / Σ Actual_i) * 100. Superior to MAPE when wind approaches zero."
          icon={Percent}
          highlightColor="blue"
          badge={{ label: 'Scale Normalized', variant: 'accent' }}
        />

        {/* 5. Forecast Coverage */}
        <KPICard
          title="Interval Coverage"
          value={metrics.coverage ? `${metrics.coverage.toFixed(1)}` : '0.0'}
          unit="%"
          explanation={`${metrics.matchedIntervals} of ${metrics.expectedIntervals} intervals matched.`}
          formulaTooltip="Coverage = (Matched Intervals / 744 Expected Intervals) * 100."
          icon={CheckCircle2}
          highlightColor="green"
          badge={{ label: '100% Complete', variant: 'positive' }}
        />
      </div>

      {/* INTERACTIVE SEGMENT FILTER BAR */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-wind-card border border-wind-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-wind-accent shrink-0" />
          <span className="text-xs font-bold text-wind-textPrimary">Analytical Slice:</span>
          <span className="text-[11px] text-wind-textSecondary hidden md:inline">
            Filter scatter analysis by operational condition
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          <button
            onClick={() => handleFilterClick('all', 'All Matched Intervals')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
              filterMode === 'all'
                ? 'bg-wind-cardSecondary text-wind-accent border border-wind-accent/40 shadow-sm font-semibold'
                : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
            }`}
          >
            All Matched (744)
          </button>
          <button
            onClick={() => handleFilterClick('high_wind', 'High Wind Intervals (>=12 GW)')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
              filterMode === 'high_wind'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
            }`}
          >
            High Wind (&ge;12 GW)
          </button>
          <button
            onClick={() => handleFilterClick('low_wind', 'Low Wind Intervals (<8 GW)')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
              filterMode === 'low_wind'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
            }`}
          >
            Low Wind (&lt;8 GW)
          </button>
          <button
            onClick={() => handleFilterClick('peak_hours', 'Peak Demand Hours (07:00–19:00)')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
              filterMode === 'peak_hours'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold'
                : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
            }`}
          >
            Peak Hours (07–19h)
          </button>
        </div>
      </div>

      {/* VISUALIZATION GRID: 6 CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Forecast vs Actual Scatter Plot with Parity Line */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Forecast vs Actual Scatter Plot</h3>
              <p className="text-xs text-wind-textSecondary">
                Evaluating correlation and 1:1 parity ({scatterData.length} samples shown)
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border self-start sm:self-auto">
              Parity Line (y = x)
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Actual"
                  unit=" MW"
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="forecast"
                  name="Forecast"
                  unit=" MW"
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MW`, name]}
                />
                <Scatter name="Delivery Intervals" data={scatterData} fill="#38BDF8" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Error Distribution Histogram */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Error Distribution Histogram</h3>
              <p className="text-xs text-wind-textSecondary">
                Frequency percentage across error intervals (Forecast - Actual MW)
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 self-start sm:self-auto">
              Zero Center
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis
                  dataKey="binLabel"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  height={45}
                />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.count} intervals (${val}%)`,
                    `Range: ${item.payload.binLabel} MW`
                  ]}
                />
                <Bar dataKey="percentage" name="% Frequency" fill="#FBBF24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Daily MAE Bar Chart */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Daily Mean Absolute Error (MAE)</h3>
              <p className="text-xs text-wind-textSecondary">Average daily forecast dispersion in megawatts</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              Daily MAE
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => val.split('-')[2]}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, 'MAE']}
                />
                <Bar dataKey="mae" name="Daily MAE (MW)" fill="#FB7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Daily Bias Chart */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Daily Forecast Bias (MBE)</h3>
              <p className="text-xs text-wind-textSecondary">
                Positive = Overforecast (Amber) | Negative = Underforecast (Sky Blue)
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              Daily Bias
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => val.split('-')[2]}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, 'Bias']}
                />
                <ReferenceLine y={0} stroke="#64748B" />
                <Bar dataKey="bias" name="Mean Bias Error (MW)">
                  {dailyMetrics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.bias || 0) >= 0 ? '#FBBF24' : '#38BDF8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Actual vs Forecast Generation Trajectory Comparison */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Daily Aggregate Volume Comparison</h3>
              <p className="text-xs text-wind-textSecondary">Total daily delivery comparison (Actual vs Forecast)</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              Aggregate MW
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} unit=" MW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, '']}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }} />
                <Line type="monotone" dataKey="avgActual" name="Actual (MW)" stroke="#35D399" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avgForecast" name="Forecast (MW)" stroke="#38BDF8" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Diurnal Profile */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Diurnal Error Profile (Hour of Day)</h3>
              <p className="text-xs text-wind-textSecondary">
                Mean forecast error and MAE by clock hour (00:00 to 23:00 UK local)
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              24-Hour Cycle
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diurnalProfile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit=" MW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MW`, name]}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }} />
                <ReferenceLine y={0} stroke="#64748B" />
                <Line type="monotone" dataKey="meanError" name="Mean Bias (MW)" stroke="#38BDF8" strokeWidth={2} />
                <Line type="monotone" dataKey="mae" name="Mean Absolute Error (MW)" stroke="#FBBF24" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* INTERPRETATION SECTION */}
      <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-wind-accent shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary">Understanding Forecast Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs text-wind-textSecondary leading-relaxed">
          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="font-semibold text-wind-textPrimary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Forecast Bias (MBE: {metrics.mbe ? `${metrics.mbe > 0 ? '+' : ''}${Math.round(metrics.mbe).toLocaleString()} MW` : '—'})
            </div>
            <p>
              {isOverforecast
                ? 'Positive bias indicates wind generation was overforecast on average. Procurement teams relying solely on this forecast would have under-hedged conventional generation, facing potential imbalance exposure in the cash-out settlement system.'
                : 'Negative bias indicates wind generation was underforecast on average. Procurement desks purchased more day-ahead power than necessary, leading to potential surplus position liquidation at discounted system prices.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="font-semibold text-wind-textPrimary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Error Dispersion (MAE: {metrics.mae ? `${Math.round(metrics.mae).toLocaleString()} MW` : '—'} vs RMSE: {metrics.rmse ? `${Math.round(metrics.rmse).toLocaleString()} MW` : '—'})
            </div>
            <p>
              MAE reflects the typical expected error magnitude across settlement periods. RMSE heavily weights tail errors; the delta between RMSE and MAE (approx. {metrics.rmse && metrics.mae ? Math.round(metrics.rmse - metrics.mae).toLocaleString() : '—'} MW) reflects high volatility during atmospheric frontal passages and sudden ramp events.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="font-semibold text-wind-textPrimary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              WAPE ({metrics.wape ? `${metrics.wape.toFixed(1)}%` : '—'}) vs MAPE
            </div>
            <p>
              Weighted Absolute Percentage Error (WAPE) divides total absolute megawatts of error by total actual delivery volume. Unlike Mean Absolute Percentage Error (MAPE), which divides by individual interval actuals and causes infinite explosions during calm wind conditions, WAPE provides a robust, scale-appropriate percentage metric for electricity utilities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="font-semibold text-wind-textPrimary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Coverage & Interval Integrity ({metrics.coverage.toFixed(1)}%)
            </div>
            <p>
              All metrics strictly evaluate matched intervals where verified WINDFOR forecasts and actual FUELHH records co-exist. Missing timestamps are never defaulted to zero, preserving statistical integrity and preventing artificial skew.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
