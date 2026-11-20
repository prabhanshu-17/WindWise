import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Download,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { fetchDecisionReplay, getExportUrl } from '../services/api';
import { DecisionReplayData, TimelinePoint } from '../types';
import { KPICard } from '../components/KPICard';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const DecisionReplayPage: React.FC = () => {
  const { showToast } = useToast();
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-01-15');
  const [cutoffTimestamp, setCutoffTimestamp] = useState<string>('2026-01-14T10:00:00Z');
  const [data, setData] = useState<DecisionReplayData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Line toggles
  const [showCutoffLine, setShowCutoffLine] = useState(true);
  const [showRetroLine, setShowRetroLine] = useState(true);
  const [showActualLine, setShowActualLine] = useState(true);

  // Selected row inspection
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadReplay = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDecisionReplay(deliveryDate, cutoffTimestamp);
      setData(res);
    } catch (err: any) {
      console.error('Error fetching decision replay:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load historical decision replay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReplay();
  }, [deliveryDate, cutoffTimestamp]);

  // Compute preset cutoffs based on selected deliveryDate
  const getCutoffPresets = (dateStr: string) => {
    const dt = new Date(dateStr + 'T00:00:00Z');
    const dMinus2 = new Date(dt.getTime() - 2 * 86400000).toISOString().split('T')[0];
    const dMinus1 = new Date(dt.getTime() - 1 * 86400000).toISOString().split('T')[0];

    return [
      { label: 'D-2 12:00 (Two-Day Ahead)', value: `${dMinus2}T12:00:00Z` },
      { label: 'D-1 10:00 (Day-Ahead Gate)', value: `${dMinus1}T10:00:00Z` },
      { label: 'D-1 16:00 (Post-Auction)', value: `${dMinus1}T16:00:00Z` },
      { label: 'D-1 23:00 (Gate Closure)', value: `${dMinus1}T23:00:00Z` },
    ];
  };

  const presets = getCutoffPresets(deliveryDate);

  const handlePresetClick = (val: string, label: string) => {
    setCutoffTimestamp(val);
    showToast(`Cutoff set to ${label}`, 'info');
  };

  // Step through timeline points
  const handleStepTimeline = (direction: 'next' | 'prev') => {
    if (!data?.timeline || data.timeline.length === 0) return;
    const currentIndex = data.timeline.findIndex((t) => t.cutoffTimestamp === cutoffTimestamp);
    if (direction === 'next') {
      const nextIdx = currentIndex < data.timeline.length - 1 ? currentIndex + 1 : 0;
      setCutoffTimestamp(data.timeline[nextIdx].cutoffTimestamp);
      showToast(`Stepped to: ${data.timeline[nextIdx].label}`, 'info');
    } else {
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : data.timeline.length - 1;
      setCutoffTimestamp(data.timeline[prevIdx].cutoffTimestamp);
      showToast(`Stepped to: ${data.timeline[prevIdx].label}`, 'info');
    }
  };

  if (loading && !data) return <LoadingSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={loadReplay} />;

  const chartPoints = (data?.intervals || []).map((i) => ({
    time: i.deliveryTimeLocal.split(' ')[1] || i.deliveryTimeLocal,
    actual: i.actualGeneration,
    cutoffForecast: i.forecastGeneration,
    retroForecast: i.retrospectiveForecast,
    error: i.error,
    cutoffPub: i.selectedPublishTimeLocal,
    retroPub: i.retrospectivePublishTime ? i.retrospectivePublishTime.replace('T', ' ').substring(0, 16) : '—',
    age: i.forecastAgeHours,
  }));

  const metrics = data?.metrics;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <History className="w-5 sm:w-6 h-5 sm:h-6 text-wind-accent" />
            Historical Decision Replay
          </h1>
          <p className="text-xs text-wind-textSecondary mt-0.5 sm:mt-1">
            Reconstruct the exact information available to the procurement desk at the historical day-ahead decision cutoff.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Look-Ahead Protected</span>
          </div>
        </div>
      </div>

      {/* DECISION CONFIGURATION & PRESETS PANEL */}
      <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-wind-sidebar px-3 py-1.5 rounded-xl border border-wind-border">
              <Calendar className="w-3.5 h-3.5 text-wind-accent shrink-0" />
              <span className="text-xs font-semibold text-wind-textSecondary">Delivery:</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={deliveryDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDeliveryDate(newDate);
                  const dt = new Date(newDate + 'T00:00:00Z');
                  const dMinus1 = new Date(dt.getTime() - 86400000).toISOString().split('T')[0];
                  setCutoffTimestamp(`${dMinus1}T10:00:00Z`);
                  showToast(`Switched replay date to ${newDate}`, 'info');
                }}
                className="bg-transparent text-xs font-mono text-wind-textPrimary focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-wind-sidebar px-3 py-1.5 rounded-xl border border-wind-border">
              <Clock className="w-3.5 h-3.5 text-wind-accentBlue shrink-0" />
              <span className="text-xs font-semibold text-wind-textSecondary">Cutoff (UTC):</span>
              <input
                type="text"
                value={cutoffTimestamp}
                onChange={(e) => setCutoffTimestamp(e.target.value)}
                placeholder="YYYY-MM-DDTHH:MM:SSZ"
                className="bg-transparent text-xs font-mono text-wind-textPrimary focus:outline-none w-44"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
            <span className="text-[11px] font-semibold text-wind-textSecondary shrink-0 mr-1">Milestones:</span>
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePresetClick(p.value, p.label)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
                  cutoffTimestamp === p.value
                    ? 'bg-wind-accent text-slate-900 font-bold shadow-glow-green'
                    : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                {p.label.split(' ')[0]} {p.label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Horizon Callout */}
        <div className="p-3.5 rounded-xl bg-wind-cardSecondary/70 border border-wind-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-wind-textPrimary">
            <ShieldCheck className="w-4 h-4 text-wind-accent shrink-0" />
            <span className="leading-relaxed">
              Evaluating forecasts published strictly at or before:{' '}
              <span className="font-mono font-bold text-wind-accent">
                {data?.decisionCutoffLocal || cutoffTimestamp} UK Local
              </span>
            </span>
          </div>
          <span className="text-[11px] text-wind-textSecondary font-mono shrink-0">
            All later WINDFOR runs excluded
          </span>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS FOR SELECTED CUTOFF */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Available Forecast MAE"
            value={metrics.mae ? `${Math.round(metrics.mae).toLocaleString()}` : '—'}
            unit="MW"
            explanation="Forecasting error based solely on information available at decision time."
            formulaTooltip="MAE calculated strictly against forecasts published <= cutoff."
            icon={TrendingUp}
            highlightColor="amber"
          />

          <KPICard
            title="Forecast Bias at Cutoff"
            value={metrics.mbe ? `${metrics.mbe > 0 ? '+' : ''}${Math.round(metrics.mbe).toLocaleString()}` : '—'}
            unit="MW"
            explanation={metrics.mbe && metrics.mbe > 0 ? 'Overforecast at decision time.' : 'Underforecast at decision time.'}
            formulaTooltip="MBE = Mean(Forecast_cutoff - Actual)."
            icon={History}
            highlightColor="blue"
          />

          <KPICard
            title="Available Day Volume"
            value={metrics.totalForecastGenerationMWh ? `${Math.round(metrics.totalForecastGenerationMWh).toLocaleString()}` : '—'}
            unit="MWh"
            explanation="Total wind volume anticipated for the delivery day at decision time."
            formulaTooltip="Sum of forecast MW for the 24 hours of delivery."
            icon={ShieldCheck}
            highlightColor="green"
          />

          <KPICard
            title="Actual Delivered Volume"
            value={metrics.totalActualGenerationMWh ? `${Math.round(metrics.totalActualGenerationMWh).toLocaleString()}` : '—'}
            unit="MWh"
            explanation="Final outturn wind generation recorded by Elexon FUELHH."
            formulaTooltip="Sum of actual generation MW across delivery day."
            icon={CheckCircle2}
            highlightColor="green"
          />
        </div>
      )}

      {/* INTERACTIVE TIMELINE: Accuracy Progression Across Decision Horizons */}
      {data && data.timeline && (
        <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Decision Horizon Progression</h3>
              <p className="text-xs text-wind-textSecondary">
                Observe how forecasting accuracy improves as the procurement desk nears delivery
              </p>
            </div>

            {/* Step Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => handleStepTimeline('prev')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-wind-sidebar hover:bg-wind-card border border-wind-border text-xs text-wind-textSecondary hover:text-wind-textPrimary transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Horizon</span>
              </button>
              <button
                onClick={() => handleStepTimeline('next')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-wind-sidebar hover:bg-wind-card border border-wind-border text-xs text-wind-accent hover:text-wind-accent/80 font-semibold transition-all active:scale-95"
              >
                <span>Next Horizon</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {data.timeline.map((point) => (
              <button
                key={point.label}
                type="button"
                onClick={() => {
                  setCutoffTimestamp(point.cutoffTimestamp);
                  showToast(`Auditing: ${point.label}`, 'info');
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left active:scale-95 ${
                  cutoffTimestamp === point.cutoffTimestamp
                    ? 'border-wind-accent bg-wind-accent/10 shadow-glow-green ring-2 ring-wind-accent'
                    : 'border-wind-border bg-wind-cardSecondary/40 hover:border-wind-borderLight'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-wind-textSecondary">
                    <span className="truncate">{point.label}</span>
                    {cutoffTimestamp === point.cutoffTimestamp && (
                      <span className="w-2 h-2 rounded-full bg-wind-accent animate-ping" />
                    )}
                  </div>
                  <p className="text-xs font-mono font-medium text-wind-textPrimary mt-1 truncate">
                    {point.cutoffLocal}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-wind-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-wind-textSecondary">MAE:</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {point.mae ? `${Math.round(point.mae).toLocaleString()} MW` : 'N/A'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CHART: Cutoff Forecast vs Retrospective Latest Forecast vs Actual */}
      {data && (
        <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary">
                Decision Forecast vs Retrospective Latest vs Actual Delivery
              </h3>
              <p className="text-xs text-wind-textSecondary">
                Solid blue shows available information at cutoff. Dashed amber shows retrospective revisions.
              </p>
            </div>

            {/* Line Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCutoffLine(!showCutoffLine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  showCutoffLine
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-wind-textSecondary opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Decision Cutoff</span>
                {showCutoffLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowRetroLine(!showRetroLine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  showRetroLine
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-wind-textSecondary opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Retrospective</span>
                {showRetroLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowActualLine(!showActualLine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  showActualLine
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-wind-textSecondary opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Actual Outturn</span>
                {showActualLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
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
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-wind-card border border-wind-border shadow-2xl text-xs space-y-1.5 min-w-[220px]">
                          <p className="font-bold text-wind-textPrimary border-b border-wind-border/60 pb-1">
                            Interval: {label} (Delivery: {deliveryDate})
                          </p>
                          {showCutoffLine && (
                            <div className="text-wind-accentBlue flex justify-between font-bold">
                              <span>At Cutoff:</span>
                              <span className="font-mono">{item.cutoffForecast ? `${Math.round(item.cutoffForecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showRetroLine && (
                            <div className="text-amber-400 flex justify-between">
                              <span>Retrospective:</span>
                              <span className="font-mono">{item.retroForecast ? `${Math.round(item.retroForecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showActualLine && (
                            <div className="text-wind-accent flex justify-between font-semibold">
                              <span>Delivered Outturn:</span>
                              <span className="font-mono">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {item.error !== null && (
                            <div className="text-rose-400 flex justify-between font-bold pt-1 border-t border-wind-border/40">
                              <span>Cutoff Error:</span>
                              <span className="font-mono">{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
                          <div className="text-[10px] text-wind-textSecondary pt-0.5">
                            Cutoff Vintage: {item.cutoffPub || '—'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showCutoffLine && (
                  <Line
                    type="monotone"
                    dataKey="cutoffForecast"
                    name="Available at Cutoff"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#38BDF8' }}
                  />
                )}
                {showRetroLine && (
                  <Line
                    type="monotone"
                    dataKey="retroForecast"
                    name="Latest Retrospective"
                    stroke="#FBBF24"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: '#FBBF24' }}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Delivered"
                    stroke="#35D399"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#35D399' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* REPLAY INTERVALS TABLE */}
      {data && (
        <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary">Settlement Interval Replay Audit</h3>
              <p className="text-xs text-wind-textSecondary">
                Each delivery interval matched with latest eligible forecast published &le; decision cutoff (Tap row to inspect)
              </p>
            </div>
            <span className="text-[11px] text-wind-textSecondary font-mono hidden sm:inline">
              24 Settlement Hours
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-wind-border/80">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Delivery Interval</th>
                  <th className="py-3 px-4">Publish Vintage</th>
                  <th className="py-3 px-4 text-right">Forecast (MW)</th>
                  <th className="py-3 px-4 text-right">Actual (MW)</th>
                  <th className="py-3 px-4 text-right">Error (MW)</th>
                  <th className="py-3 px-4 text-right">Forecast Age</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {data.intervals.map((row) => (
                  <tr
                    key={row.startTime}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-wind-cardSecondary/60 transition-colors cursor-pointer active:bg-wind-accent/10"
                  >
                    <td className="py-2.5 px-4 font-mono font-medium text-wind-textPrimary">
                      {row.deliveryTimeLocal}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-wind-textSecondary">
                      {row.selectedPublishTimeLocal || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-400">
                      {row.forecastGeneration ? `${Math.round(row.forecastGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {row.actualGeneration ? `${Math.round(row.actualGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                      row.error !== null && row.error > 0 ? 'text-amber-400' : 'text-sky-400'
                    }`}>
                      {row.error !== null ? `${row.error > 0 ? '+' : ''}${Math.round(row.error).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-wind-textSecondary">
                      {row.forecastAgeHours !== null ? `${row.forecastAgeHours.toFixed(1)} hrs` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row Inspection Modal on tap */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wind-card border border-wind-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-wind-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-wind-accent" />
                <h4 className="text-sm font-bold text-wind-textPrimary">Decision Audit Record</h4>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded-lg text-wind-textSecondary hover:text-wind-textPrimary hover:bg-wind-cardSecondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Delivery Time:</span>
                <span className="font-mono font-bold text-wind-textPrimary">{selectedRow.deliveryTimeLocal}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Publish Vintage at Cutoff:</span>
                <span className="font-mono text-wind-accent">{selectedRow.selectedPublishTimeLocal || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Available Forecast:</span>
                <span className="font-mono font-bold text-sky-400">
                  {selectedRow.forecastGeneration ? `${Math.round(selectedRow.forecastGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Actual Delivered:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedRow.actualGeneration ? `${Math.round(selectedRow.actualGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              {selectedRow.error !== null && (
                <div className="flex justify-between py-1 border-b border-wind-border/40">
                  <span className="text-wind-textSecondary">Replay Error:</span>
                  <span className={`font-mono font-bold ${selectedRow.error > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {selectedRow.error > 0 ? `+${Math.round(selectedRow.error)}` : Math.round(selectedRow.error)} MW
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-wind-textSecondary">Forecast Age at Cutoff:</span>
                <span className="font-mono text-wind-textPrimary">
                  {selectedRow.forecastAgeHours !== null ? `${selectedRow.forecastAgeHours.toFixed(1)} hours before delivery` : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRow(null)}
              className="w-full py-2 rounded-xl bg-wind-accent text-slate-900 font-bold text-xs hover:bg-wind-accent/90 transition-colors shadow-glow-green"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
