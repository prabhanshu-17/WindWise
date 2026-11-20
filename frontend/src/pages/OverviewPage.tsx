import React, { useState, useEffect } from 'react';
import {
  Wind,
  Zap,
  Activity,
  Gauge,
  Percent,
  Calendar,
  Download,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Filter,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { fetchOverview, getExportUrl } from '../services/api';
import { OverviewData } from '../types';
import { KPICard } from '../components/KPICard';
import { InsightCard } from '../components/InsightCard';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { BiasGauge } from '../components/BiasGauge';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const OverviewPage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('all'); // 'all', 'w1', 'w2', 'w3', 'w4'
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);

  // Interactive Series Visibility Toggles
  const [showActual, setShowActual] = useState<boolean>(true);
  const [showForecast, setShowForecast] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOverview('2026-01');
      setData(res);
    } catch (err: any) {
      console.error('Error fetching overview:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState message={error || undefined} onRetry={loadData} />;

  // Filter timeSeries based on selectedRange or selectedDay
  let displaySeries = data.timeSeries;
  if (selectedDay) {
    displaySeries = data.timeSeries.filter((d) => d.startTime.startsWith(selectedDay));
  } else if (selectedRange === 'w1') {
    displaySeries = data.timeSeries.filter((d) => d.startTime >= '2026-01-01' && d.startTime <= '2026-01-08T00:00:00Z');
  } else if (selectedRange === 'w2') {
    displaySeries = data.timeSeries.filter((d) => d.startTime >= '2026-01-08' && d.startTime <= '2026-01-15T00:00:00Z');
  } else if (selectedRange === 'w3') {
    displaySeries = data.timeSeries.filter((d) => d.startTime >= '2026-01-15' && d.startTime <= '2026-01-22T00:00:00Z');
  } else if (selectedRange === 'w4') {
    displaySeries = data.timeSeries.filter((d) => d.startTime >= '2026-01-22' && d.startTime <= '2026-02-01T00:00:00Z');
  }

  // Format series for chart
  const chartData = displaySeries.map((item) => ({
    time: item.deliveryTimeLocal.replace('2026-01-', 'Jan ').replace('2026-02-01', 'Feb 1'),
    actual: item.actualGeneration,
    forecast: item.forecastGeneration,
    error: item.error,
    absError: item.absoluteError,
    age: item.forecastAgeHours,
    pubLocal: item.publishTimeLocal,
  }));

  const mbe = data.kpis.mbe || 0;
  const isOverforecast = mbe > 0;

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setSelectedDay(undefined);
    const rangeLabels: Record<string, string> = {
      all: 'Full Month (Jan 1–31)',
      w1: 'Week 1 (Jan 1–7)',
      w2: 'Week 2 (Jan 8–14)',
      w3: 'Week 3 (Jan 15–21)',
      w4: 'Week 4 (Jan 22–31)',
    };
    showToast(`Filtered to ${rangeLabels[range] || range}`, 'info');
  };

  const handleDaySelect = (day: string) => {
    if (selectedDay === day) {
      setSelectedDay(undefined);
      showToast('Cleared day filter', 'info');
    } else {
      setSelectedDay(day);
      showToast(`Zoomed chart to ${day}`, 'info');
      // Smooth scroll towards the main chart
      const chartEl = document.getElementById('main-generation-chart');
      if (chartEl) {
        chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-wind-textPrimary tracking-tight">
            Wind Intelligence Overview
          </h1>
          <p className="text-xs text-wind-textSecondary mt-0.5 sm:mt-1">
            Monitor renewable generation forecasts and understand forecast reliability for UK electricity procurement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Month Pill */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-wind-card border border-wind-border text-xs">
            <Calendar className="w-3.5 h-3.5 text-wind-accent shrink-0" />
            <span className="text-wind-textSecondary hidden sm:inline">Target:</span>
            <span className="font-semibold text-wind-textPrimary font-mono">January 2026</span>
          </div>

          {/* CSV Export Button */}
          <a
            href={getExportUrl('accuracy', '2026-01')}
            download="windwise_accuracy_2026-01.csv"
            onClick={() => showToast('Downloading January 2026 accuracy CSV...', 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border hover:border-wind-accent/40 text-xs font-semibold text-wind-textPrimary transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-wind-accent" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* TOP 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Average Actual Wind Generation */}
        <KPICard
          title="Avg Actual Generation"
          value={data.kpis.avgActualGeneration ? Math.round(data.kpis.avgActualGeneration).toLocaleString() : '—'}
          unit="MW"
          explanation="Average actual wind generation across all evaluated intervals."
          formulaTooltip="Calculated as Sum(Actual Generation MW) / Matched Intervals from Elexon FUELHH (fuelType=WIND)."
          icon={Zap}
          highlightColor="green"
          badge={{ label: 'Actuals', variant: 'positive' }}
        />

        {/* 2. Average Forecast Generation */}
        <KPICard
          title="Avg Forecast Generation"
          value={data.kpis.avgForecastGeneration ? Math.round(data.kpis.avgForecastGeneration).toLocaleString() : '—'}
          unit="MW"
          explanation="Average selected wind generation forecast across all evaluated intervals."
          formulaTooltip="Calculated as Sum(Selected Forecast MW) / Matched Intervals from Elexon WINDFOR dataset."
          icon={Wind}
          highlightColor="blue"
          badge={{ label: 'WINDFOR', variant: 'accent' }}
        />

        {/* 3. Mean Absolute Error (MAE) */}
        <KPICard
          title="Mean Absolute Error"
          value={data.kpis.mae ? Math.round(data.kpis.mae).toLocaleString() : '—'}
          unit="MW"
          explanation="Average magnitude of forecasting errors irrespective of direction."
          formulaTooltip="MAE = Mean(|Forecast - Actual|). Measures average forecast dispersion in megawatts."
          icon={Activity}
          highlightColor="amber"
          badge={{ label: 'Dispersion', variant: 'neutral' }}
        />

        {/* 4. Forecast Bias (MBE) */}
        <KPICard
          title="Forecast Bias"
          value={mbe > 0 ? `+${Math.round(mbe).toLocaleString()}` : Math.round(mbe).toLocaleString()}
          unit="MW"
          explanation={isOverforecast ? 'Positive bias: Generation was overforecast on average.' : 'Negative bias: Generation was underforecast on average.'}
          formulaTooltip="Mean Bias Error (MBE) = Mean(Forecast - Actual). Positive indicates systemic overforecasting; negative indicates underforecasting."
          icon={Gauge}
          highlightColor={isOverforecast ? 'amber' : 'blue'}
          badge={{
            label: isOverforecast ? 'Overforecasting' : 'Underforecasting',
            variant: isOverforecast ? 'negative' : 'accent'
          }}
        />

        {/* 5. Forecast Coverage */}
        <KPICard
          title="Forecast Coverage"
          value={data.kpis.coverage ? data.kpis.coverage.toFixed(1) : '0.0'}
          unit="%"
          explanation={`${data.kpis.matchedIntervals} of ${data.kpis.expectedIntervals} expected settlement hours matched.`}
          formulaTooltip="Coverage = (Matched Intervals / Expected 744 January Hours) × 100. Evaluates data completeness."
          icon={Percent}
          highlightColor="green"
          badge={{ label: '744/744 Hrs', variant: 'positive' }}
        />
      </div>

      {/* MAIN CHART: Wind Generation: Forecast vs Actual */}
      <div id="main-generation-chart" className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        {/* Controls and Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-wind-textPrimary">
                Wind Generation: Forecast vs Actual
              </h2>
              {selectedDay && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-wind-accent/15 text-wind-accent border border-wind-accent/30 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" />
                  <span>Filtered: {selectedDay}</span>
                  <button
                    onClick={() => setSelectedDay(undefined)}
                    className="hover:text-white font-bold ml-1 p-0.5 rounded hover:bg-wind-cardSecondary"
                    title="Clear day filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-wind-textSecondary mt-0.5">
              Interactive half-hourly/hourly generation trajectory comparison across UK delivery periods (MW)
            </p>
          </div>

          {/* Interactive Series & Zoom Controls Container */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Series Visibility Toggles */}
            <div className="flex items-center gap-1.5 bg-wind-sidebar p-1 rounded-xl border border-wind-border text-xs">
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all active:scale-95 ${
                  showActual
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary opacity-60'
                }`}
                title="Toggle Actual Line"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Actual</span>
                {showActual ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowForecast(!showForecast)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all active:scale-95 ${
                  showForecast
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary opacity-60'
                }`}
                title="Toggle Forecast Line"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Forecast</span>
                {showForecast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>

            {/* Time Zoom Controls with horizontal mobile scrolling */}
            <div className="flex items-center gap-1 bg-wind-sidebar p-1 rounded-xl border border-wind-border text-xs overflow-x-auto max-w-full">
              <button
                onClick={() => handleRangeChange('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  selectedRange === 'all' && !selectedDay
                    ? 'bg-wind-cardSecondary text-wind-accent shadow-sm border border-wind-accent/30 font-semibold'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                Full Month
              </button>
              <button
                onClick={() => handleRangeChange('w1')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  selectedRange === 'w1'
                    ? 'bg-wind-cardSecondary text-wind-accent shadow-sm border border-wind-accent/30 font-semibold'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                Jan 1–7
              </button>
              <button
                onClick={() => handleRangeChange('w2')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  selectedRange === 'w2'
                    ? 'bg-wind-cardSecondary text-wind-accent shadow-sm border border-wind-accent/30 font-semibold'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                Jan 8–14
              </button>
              <button
                onClick={() => handleRangeChange('w3')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  selectedRange === 'w3'
                    ? 'bg-wind-cardSecondary text-wind-accent shadow-sm border border-wind-accent/30 font-semibold'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                Jan 15–21
              </button>
              <button
                onClick={() => handleRangeChange('w4')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  selectedRange === 'w4'
                    ? 'bg-wind-cardSecondary text-wind-accent shadow-sm border border-wind-accent/30 font-semibold'
                    : 'text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                Jan 22–31
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Main Time Series */}
        <div className="h-72 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                minTickGap={25}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    const err = dataPoint.error;
                    const errSign = err !== null && err > 0 ? '+' : '';
                    return (
                      <div className="p-3 rounded-xl bg-wind-card border border-wind-border shadow-2xl text-xs space-y-1.5 min-w-[200px] max-w-[calc(100vw-3rem)]">
                        <p className="font-bold text-wind-textPrimary pb-1 border-b border-wind-border/60">
                          {label} (UK Local)
                        </p>
                        {showActual && (
                          <div className="flex items-center justify-between text-wind-accent font-semibold">
                            <span>Actual Generation:</span>
                            <span className="font-mono">{dataPoint.actual ? `${Math.round(dataPoint.actual).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                        )}
                        {showForecast && (
                          <div className="flex items-center justify-between text-wind-accentBlue font-semibold">
                            <span>Forecast (WINDFOR):</span>
                            <span className="font-mono">{dataPoint.forecast ? `${Math.round(dataPoint.forecast).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                        )}
                        {err !== null && (
                          <div className={`flex items-center justify-between font-bold pt-1 border-t border-wind-border/40 ${
                            err > 0 ? 'text-amber-400' : 'text-sky-400'
                          }`}>
                            <span>Forecast Error:</span>
                            <span className="font-mono">{errSign}{Math.round(err).toLocaleString()} MW</span>
                          </div>
                        )}
                        {dataPoint.age !== null && (
                          <div className="text-[10px] text-wind-textSecondary pt-0.5">
                            Vintage: {dataPoint.pubLocal || 'N/A'} ({dataPoint.age}h lead)
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                iconType="circle"
              />
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Wind Generation (FUELHH)"
                  stroke="#35D399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#35D399' }}
                />
              )}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast Generation (WINDFOR)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5, fill: '#38BDF8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* A. Daily Wind Generation Bar Chart */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Daily Wind Generation (Avg MW)</h3>
              <p className="text-xs text-wind-textSecondary">Comparing daily mean actual vs forecast delivery</p>
            </div>
            <span className="text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              31 Days
            </span>
          </div>
          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  labelFormatter={(lbl) => `Delivery Day: ${lbl}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, '']}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                <Bar dataKey="avgActual" name="Actual (Avg MW)" fill="#35D399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgForecast" name="Forecast (Avg MW)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. Forecast Error Distribution Histogram */}
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Forecast Error Distribution</h3>
              <p className="text-xs text-wind-textSecondary">Histogram of forecast errors (Forecast - Actual MW)</p>
            </div>
            <span className="text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              {data.errorDistribution.length} Bins
            </span>
          </div>
          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis
                  dataKey="binLabel"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151F30', borderColor: '#263449', borderRadius: '10px' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.count} intervals (${val}%)`,
                    `Range ${item.payload.binLabel} MW`
                  ]}
                />
                <ReferenceLine x={0} stroke="#64748B" strokeDasharray="3 3" />
                <Bar dataKey="percentage" name="% Frequency" fill="#FBBF24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* C & D: Forecast Bias Indicator & Calendar Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* C. Bias Gauge */}
        <div className="lg:col-span-1">
          <BiasGauge bias={data.biasIndicator} />
        </div>

        {/* D. Calendar Heatmap */}
        <div className="lg:col-span-2">
          <CalendarHeatmap
            coverageDays={data.coverageHeatmap}
            selectedDay={selectedDay}
            onSelectDay={handleDaySelect}
          />
        </div>
      </div>

      {/* BOTTOM SECTION: Procurement Intelligence */}
      <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-wind-accent" />
              Procurement Intelligence
            </h3>
            <p className="text-xs text-wind-textSecondary">
              Algorithmic insights derived dynamically from January 2026 Elexon settlement intervals
            </p>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold self-start sm:self-auto">
            Dynamic Analytical Synthesis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
          {data.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
};
