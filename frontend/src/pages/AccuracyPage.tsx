import React, { useState, useEffect } from 'react';
import {
  Activity,
  Gauge,
  Percent,
  TrendingUp,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  Filter
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

  // Filter scatter data
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

  const scatterData = filteredScatter.slice(0, 350).map((r) => ({
    actual: r.actualGeneration,
    forecast: r.forecastGeneration,
    error: r.error,
    time: r.deliveryTimeLocal,
  }));

  const handleFilterClick = (mode: 'all' | 'high_wind' | 'low_wind' | 'peak_hours', label: string) => {
    setFilterMode(mode);
    showToast(`Filter: ${label}`, 'info');
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Forecast Accuracy & Quantitative Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating Day-Ahead WINDFOR error metrics (MAE, RMSE, MBE, WAPE) against FUELHH outturn records
          </p>
        </div>

        <a
          href={getExportUrl('accuracy', '2026-01')}
          download="windwise_accuracy_metrics_2026-01.csv"
          onClick={() => showToast('Exporting accuracy metrics CSV...', 'info')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161D2A] hover:bg-[#1E2638] border border-[#2A364E] text-xs font-medium text-slate-200 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Export Metrics CSV</span>
        </a>
      </div>

      {/* TOP 5 ACCURACY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard
          title="MAE (Dispersion)"
          value={metrics.mae ? Math.round(metrics.mae).toLocaleString() : '—'}
          unit="MW"
          explanation="Mean absolute magnitude of forecast deviations across matched intervals."
          formulaTooltip="MAE = (1/N) * Σ |Forecast_i - Actual_i|."
          icon={Activity}
          highlightColor="amber"
          badge={{ label: 'MAE', variant: 'neutral' }}
        />

        <KPICard
          title="Root Mean Squared Error"
          value={metrics.rmse ? Math.round(metrics.rmse).toLocaleString() : '—'}
          unit="MW"
          explanation="Penalizes large tail errors via quadratic scoring during ramps."
          formulaTooltip="RMSE = sqrt((1/N) * Σ (Forecast_i - Actual_i)^2)."
          icon={TrendingUp}
          highlightColor="rose"
          badge={{ label: 'RMSE', variant: 'negative' }}
        />

        <KPICard
          title="Mean Bias Error (MBE)"
          value={mbe > 0 ? `+${Math.round(mbe).toLocaleString()}` : Math.round(mbe).toLocaleString()}
          unit="MW"
          explanation={isOverforecast ? 'Model systematically overpredicted generation on average.' : 'Model systematically underpredicted generation on average.'}
          formulaTooltip="MBE = (1/N) * Σ (Forecast_i - Actual_i)."
          icon={Gauge}
          highlightColor={isOverforecast ? 'amber' : 'blue'}
          badge={{
            label: isOverforecast ? '+ Bias' : '- Bias',
            variant: isOverforecast ? 'negative' : 'accent'
          }}
        />

        <KPICard
          title="Volume Weighted (WAPE)"
          value={metrics.wape ? `${metrics.wape.toFixed(1)}` : '—'}
          unit="%"
          explanation="Scale-normalized error relative to total January delivered wind energy."
          formulaTooltip="WAPE = (Σ |Forecast - Actual| / Σ Actual) * 100."
          icon={Percent}
          highlightColor="blue"
          badge={{ label: 'WAPE', variant: 'accent' }}
        />

        <KPICard
          title="Interval Coverage"
          value={metrics.coverage ? `${metrics.coverage.toFixed(1)}` : '0.0'}
          unit="%"
          explanation={`${metrics.matchedIntervals} of ${metrics.expectedIntervals} intervals matched.`}
          formulaTooltip="(Matched / 744) * 100."
          icon={CheckCircle2}
          highlightColor="green"
          badge={{ label: '744/744', variant: 'positive' }}
        />
      </div>

      {/* SLICE FILTER BAR */}
      <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="text-xs font-mono font-semibold text-slate-300">Operational Slice:</span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            Filter scatter analysis by operational condition
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          {[
            { key: 'all', label: 'All Matched (744)' },
            { key: 'high_wind', label: 'High Wind (≥12 GW)' },
            { key: 'low_wind', label: 'Low Wind (<8 GW)' },
            { key: 'peak_hours', label: 'Peak Hours (07–19h)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterClick(tab.key as any, tab.label)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors shrink-0 ${
                filterMode === tab.key
                  ? 'bg-[#1C2536] text-white font-semibold border border-[#2A364E]'
                  : 'text-slate-400 hover:text-slate-200 bg-[#0C1017] border border-[#1E2638]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Scatter Plot */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Parity Scatter (Forecast vs. Actual MW)
              </h3>
              <p className="text-[11px] text-slate-400">
                1:1 correlation line (y = x). Sample: {scatterData.length} intervals.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              Parity: y = x
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" />
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
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MW`, name]}
                />
                <Scatter name="Delivery Intervals" data={scatterData} fill="#0284C7" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Error Histogram */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Error Distribution Histogram
              </h3>
              <p className="text-[11px] text-slate-400">
                Percentage of delivery intervals across forecast error brackets
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              Zero Center
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.count} intervals (${val}%)`,
                    `Range: ${item.payload.binLabel} MW`
                  ]}
                />
                <Bar dataKey="percentage" name="% Frequency" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Daily MAE */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Daily Mean Absolute Error (MAE)
              </h3>
              <p className="text-[11px] text-slate-400">Day-by-day forecast dispersion in megawatts</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              Daily MAE
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, 'MAE']}
                />
                <Bar dataKey="mae" name="Daily MAE (MW)" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Daily Bias */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Daily Mean Bias Error (MBE)
              </h3>
              <p className="text-[11px] text-slate-400">
                Amber = Overforecast (&gt;0) | Sky Blue = Underforecast (&lt;0)
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              Daily Bias
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, 'Bias']}
                />
                <ReferenceLine y={0} stroke="#64748B" />
                <Bar dataKey="bias" name="Mean Bias Error (MW)">
                  {dailyMetrics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.bias || 0) >= 0 ? '#F59E0B' : '#0284C7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Actual vs Forecast Trajectory */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Daily Mean Volume Comparison (MW)
              </h3>
              <p className="text-[11px] text-slate-400">Total daily aggregate outturn vs forecast comparison</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} unit=" MW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  labelFormatter={(l) => `Date: ${l}`}
                  formatter={(val: any) => [`${Math.round(val).toLocaleString()} MW`, '']}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px', fontFamily: 'JetBrains Mono' }} />
                <Line type="monotone" dataKey="avgActual" name="Actual (MW)" stroke="#10B981" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="avgForecast" name="Forecast (MW)" stroke="#0284C7" strokeWidth={1.8} strokeDasharray="3 3" dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Diurnal Profile */}
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Diurnal Error Profile (Hour of Day)
              </h3>
              <p className="text-[11px] text-slate-400">
                Mean error and MAE by clock hour (00:00 to 23:00 UK local)
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-[#0C1017] px-2 py-0.5 rounded border border-[#1E2638]">
              24-Hour Cycle
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diurnalProfile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit=" MW" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111620', borderColor: '#1E2638', borderRadius: '8px' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MW`, name]}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '6px', fontFamily: 'JetBrains Mono' }} />
                <ReferenceLine y={0} stroke="#64748B" />
                <Line type="monotone" dataKey="meanError" name="Mean Bias (MW)" stroke="#0284C7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mae" name="MAE (MW)" stroke="#F59E0B" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trader Guidance Section */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2638]">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Analytical Guidance & Trading Operations Context
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400 leading-relaxed font-sans">
          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Forecast Bias (MBE: {metrics.mbe ? `${metrics.mbe > 0 ? '+' : ''}${Math.round(metrics.mbe).toLocaleString()} MW` : '—'})
            </div>
            <p>
              {isOverforecast
                ? 'Systemic positive bias indicates wind generation was overforecast on average. Desks relying solely on Day-Ahead models faced persistent deficit positions, necessitating balancing mechanism power top-ups at cash-out premiums.'
                : 'Systemic negative bias indicates wind generation was underforecast on average. Hedging desks over-purchased conventional contracts, creating surplus liquidation exposures at System Sell Prices.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Dispersion (MAE: {metrics.mae ? `${Math.round(metrics.mae).toLocaleString()} MW` : '—'} vs. RMSE: {metrics.rmse ? `${Math.round(metrics.rmse).toLocaleString()} MW` : '—'})
            </div>
            <p>
              MAE measures typical absolute spread. The spread delta (RMSE &minus; MAE = {metrics.rmse && metrics.mae ? Math.round(metrics.rmse - metrics.mae).toLocaleString() : '—'} MW) quantifies tail risk driven by sudden atmospheric front transitions and timing ramp discrepancies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
