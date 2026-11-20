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
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);

  // Line visibility toggles
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

  // Filter series based on selectedRange or selectedDay
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
    showToast(`Window: ${rangeLabels[range] || range}`, 'info');
  };

  const handleDaySelect = (day: string) => {
    if (selectedDay === day) {
      setSelectedDay(undefined);
      showToast('Cleared date slice', 'info');
    } else {
      setSelectedDay(day);
      showToast(`Selected ${day}`, 'info');
      const chartEl = document.getElementById('main-generation-chart');
      if (chartEl) {
        chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              UK Wind Generation & Day-Ahead Reliability
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-slate-400 border border-white/[0.08]">
              ELEXON BMRS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            National Grid ESO wind forecasts vs. outturn generation delivery across Great Britain (January 1–31, 2026)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Target Month Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111620] border border-[#1E2638] text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Target:</span>
            <span className="font-semibold text-slate-200">JAN 2026</span>
          </div>

          {/* Export CSV */}
          <a
            href={getExportUrl('accuracy', '2026-01')}
            download="windwise_accuracy_2026-01.csv"
            onClick={() => showToast('Exporting accuracy data...', 'info')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161D2A] hover:bg-[#1E2638] border border-[#2A364E] text-xs font-medium text-slate-200 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* TOP 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard
          title="Avg Actual"
          value={data.kpis.avgActualGeneration ? Math.round(data.kpis.avgActualGeneration).toLocaleString() : '—'}
          unit="MW"
          explanation="Mean outturn wind generation across evaluated settlement hours."
          formulaTooltip="Sum(Actual Generation MW) / Matched Intervals from Elexon FUELHH (WIND)."
          icon={Zap}
          highlightColor="green"
          badge={{ label: 'FUELHH', variant: 'positive' }}
        />

        <KPICard
          title="Avg Forecast"
          value={data.kpis.avgForecastGeneration ? Math.round(data.kpis.avgForecastGeneration).toLocaleString() : '—'}
          unit="MW"
          explanation="Mean Day-Ahead forecast across evaluated settlement hours."
          formulaTooltip="Sum(Selected Forecast MW) / Matched Intervals from Elexon WINDFOR."
          icon={Wind}
          highlightColor="blue"
          badge={{ label: 'WINDFOR', variant: 'accent' }}
        />

        <KPICard
          title="Mean Absolute Error"
          value={data.kpis.mae ? Math.round(data.kpis.mae).toLocaleString() : '—'}
          unit="MW"
          explanation="Average forecast deviation magnitude across delivery periods."
          formulaTooltip="MAE = (1/N) * Σ |Forecast - Actual|. Standard dispersion metric."
          icon={Activity}
          highlightColor="amber"
          badge={{ label: 'MAE', variant: 'neutral' }}
        />

        <KPICard
          title="Forecast Bias (MBE)"
          value={mbe > 0 ? `+${Math.round(mbe).toLocaleString()}` : Math.round(mbe).toLocaleString()}
          unit="MW"
          explanation={isOverforecast ? 'Positive bias: Generation was overforecast on average.' : 'Negative bias: Generation was underforecast on average.'}
          formulaTooltip="Mean Bias Error = (1/N) * Σ (Forecast - Actual). Positive = Overforecast, Negative = Underforecast."
          icon={Gauge}
          highlightColor={isOverforecast ? 'amber' : 'blue'}
          badge={{
            label: isOverforecast ? '+ Bias' : '- Bias',
            variant: isOverforecast ? 'negative' : 'accent'
          }}
        />

        <KPICard
          title="Interval Coverage"
          value={data.kpis.coverage ? data.kpis.coverage.toFixed(1) : '0.0'}
          unit="%"
          explanation={`${data.kpis.matchedIntervals} of ${data.kpis.expectedIntervals} expected settlement hours matched.`}
          formulaTooltip="(Matched Intervals / 744 Expected Intervals) * 100. 100% complete dataset."
          icon={Percent}
          highlightColor="green"
          badge={{ label: '744/744', variant: 'positive' }}
        />
      </div>

      {/* MAIN CHART: Wind Generation: Forecast vs Actual */}
      <div id="main-generation-chart" className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                GB Wind Generation: Outturn vs. Day-Ahead Forecast Trajectory
              </h2>
              {selectedDay && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" />
                  <span>Filtered: {selectedDay}</span>
                  <button
                    onClick={() => setSelectedDay(undefined)}
                    className="hover:text-white p-0.5 rounded"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hourly delivery periods comparing outturn (FUELHH) against Day-Ahead forecast runs (WINDFOR) in MW
            </p>
          </div>

          {/* Controls Container */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Series Toggles */}
            <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-lg border border-[#1E2638] text-xs">
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showActual
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
                title="Toggle Actual Line"
              >
                <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                <span>Actual</span>
                {showActual ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowForecast(!showForecast)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showForecast
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
                title="Toggle Forecast Line"
              >
                <span className="w-2 h-2 rounded-xs bg-sky-400" />
                <span>Forecast</span>
                {showForecast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-lg border border-[#1E2638] text-xs overflow-x-auto max-w-full">
              {[
                { key: 'all', label: 'Full Month' },
                { key: 'w1', label: 'Jan 1–7' },
                { key: 'w2', label: 'Jan 8–14' },
                { key: 'w3', label: 'Jan 15–21' },
                { key: 'w4', label: 'Jan 22–31' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleRangeChange(tab.key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
                    selectedRange === tab.key && !selectedDay
                      ? 'bg-[#1C2536] text-white font-semibold border border-[#2A364E]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts Main Time Series */}
        <div className="h-72 sm:h-88 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                minTickGap={30}
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
                      <div className="p-3 rounded-lg bg-[#111620] border border-[#1E2638] shadow-dropdown text-xs space-y-1.5 min-w-[200px]">
                        <p className="font-mono font-bold text-white pb-1 border-b border-[#1E2638]">
                          {label} (UK Local)
                        </p>
                        {showActual && (
                          <div className="flex items-center justify-between text-emerald-400 font-medium">
                            <span>Actual Generation:</span>
                            <span className="font-mono">{dataPoint.actual ? `${Math.round(dataPoint.actual).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                        )}
                        {showForecast && (
                          <div className="flex items-center justify-between text-sky-400 font-medium">
                            <span>Forecast (WINDFOR):</span>
                            <span className="font-mono">{dataPoint.forecast ? `${Math.round(dataPoint.forecast).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                        )}
                        {err !== null && (
                          <div className={`flex items-center justify-between font-bold pt-1 border-t border-[#1E2638] ${
                            err > 0 ? 'text-amber-400' : 'text-sky-400'
                          }`}>
                            <span>Forecast Error:</span>
                            <span className="font-mono">{errSign}{Math.round(err).toLocaleString()} MW</span>
                          </div>
                        )}
                        {dataPoint.age !== null && (
                          <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                            Vintage: {dataPoint.pubLocal || '—'} ({dataPoint.age}h lead)
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
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                iconType="plainline"
              />
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual (FUELHH)"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981' }}
                />
              )}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast (WINDFOR)"
                  stroke="#0284C7"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#0284C7' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A. Daily Wind Generation Bar Chart */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Daily Mean Generation (Actual vs. Forecast MW)
              </h3>
              <p className="text-[11px] text-slate-400">Comparing daily 24-hour mean volumes across January</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              31 Days
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, '']}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="avgActual" name="Actual (Avg MW)" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="avgForecast" name="Forecast (Avg MW)" fill="#0284C7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. Forecast Error Distribution Histogram */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Forecast Error Distribution (MW Bins)
              </h3>
              <p className="text-[11px] text-slate-400">Frequency distribution of discrepancies (Forecast - Actual)</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              {data.errorDistribution.length} Bins
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.count} intervals (${val}%)`,
                    `Range: ${item.payload.binLabel} MW`
                  ]}
                />
                <ReferenceLine x={0} stroke="#64748B" strokeDasharray="3 3" />
                <Bar dataKey="percentage" name="% Frequency" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bias Gauge & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <BiasGauge bias={data.biasIndicator} />
        </div>

        <div className="lg:col-span-2">
          <CalendarHeatmap
            coverageDays={data.coverageHeatmap}
            selectedDay={selectedDay}
            onSelectDay={handleDaySelect}
          />
        </div>
      </div>

      {/* Operational Summary & Desk Notes */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#1E2638]">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              Operational Desk Insights & Outturn Summary
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Key statistical highlights computed directly across January 2026 Elexon settlement intervals
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638] self-start sm:self-auto">
            744 Settlement Hours Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {data.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
};
