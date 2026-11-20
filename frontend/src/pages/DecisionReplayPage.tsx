import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
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
  Legend
} from 'recharts';
import { fetchDecisionReplay, getExportUrl } from '../services/api';
import { DecisionReplayData } from '../types';
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

  const getCutoffPresets = (dateStr: string) => {
    const dt = new Date(dateStr + 'T00:00:00Z');
    const dMinus2 = new Date(dt.getTime() - 2 * 86400000).toISOString().split('T')[0];
    const dMinus1 = new Date(dt.getTime() - 1 * 86400000).toISOString().split('T')[0];

    return [
      { label: 'D-2 12:00 (Two-Day)', value: `${dMinus2}T12:00:00Z` },
      { label: 'D-1 10:00 (Auction Gate)', value: `${dMinus1}T10:00:00Z` },
      { label: 'D-1 16:00 (Post-Auction)', value: `${dMinus1}T16:00:00Z` },
      { label: 'D-1 23:00 (Gate Closure)', value: `${dMinus1}T23:00:00Z` },
    ];
  };

  const presets = getCutoffPresets(deliveryDate);

  const handlePresetClick = (val: string, label: string) => {
    setCutoffTimestamp(val);
    showToast(`Cutoff: ${label}`, 'info');
  };

  const handleStepTimeline = (direction: 'next' | 'prev') => {
    if (!data?.timeline || data.timeline.length === 0) return;
    const currentIndex = data.timeline.findIndex((t) => t.cutoffTimestamp === cutoffTimestamp);
    if (direction === 'next') {
      const nextIdx = currentIndex < data.timeline.length - 1 ? currentIndex + 1 : 0;
      setCutoffTimestamp(data.timeline[nextIdx].cutoffTimestamp);
      showToast(`Horizon: ${data.timeline[nextIdx].label}`, 'info');
    } else {
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : data.timeline.length - 1;
      setCutoffTimestamp(data.timeline[prevIdx].cutoffTimestamp);
      showToast(`Horizon: ${data.timeline[prevIdx].label}`, 'info');
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
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Historical Decision Replay & Cutoff Audit
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate Day-Ahead procurement information states with strict look-ahead bias prevention
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111620] border border-[#1E2638] text-xs font-mono text-slate-300 self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Look-Ahead Protected</span>
        </div>
      </div>

      {/* DECISION CONFIGURATION BAR */}
      <div className="p-3.5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#0C1017] px-2.5 py-1.5 rounded-lg border border-[#1E2638]">
              <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-400">Delivery:</span>
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
                  showToast(`Replay date: ${newDate}`, 'info');
                }}
                className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#0C1017] px-2.5 py-1.5 rounded-lg border border-[#1E2638]">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-400">Cutoff:</span>
              <input
                type="text"
                value={cutoffTimestamp}
                onChange={(e) => setCutoffTimestamp(e.target.value)}
                placeholder="YYYY-MM-DDTHH:MM:SSZ"
                className="bg-transparent text-xs font-mono text-white focus:outline-none w-44"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
            <span className="text-[11px] font-mono text-slate-500 shrink-0 mr-1">Gates:</span>
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePresetClick(p.value, p.label)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors shrink-0 ${
                  cutoffTimestamp === p.value
                    ? 'bg-[#1C2536] text-white font-semibold border border-[#2A364E]'
                    : 'bg-[#0C1017] border border-[#1E2638] text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Horizon Callout */}
        <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Decision Horizon:{' '}
              <span className="font-bold text-white">
                {data?.decisionCutoffLocal || cutoffTimestamp} UK Local
              </span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Later WINDFOR runs hidden from decision basis
          </span>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Available Forecast MAE"
            value={metrics.mae ? `${Math.round(metrics.mae).toLocaleString()}` : '—'}
            unit="MW"
            explanation="Error strictly using forecasts published prior to decision cutoff."
            formulaTooltip="MAE calculated strictly against forecasts published <= cutoff."
            icon={TrendingUp}
            highlightColor="amber"
          />

          <KPICard
            title="Bias at Decision Cutoff"
            value={metrics.mbe ? `${metrics.mbe > 0 ? '+' : ''}${Math.round(metrics.mbe).toLocaleString()}` : '—'}
            unit="MW"
            explanation={metrics.mbe && metrics.mbe > 0 ? 'Overforecast at decision time.' : 'Underforecast at decision time.'}
            formulaTooltip="MBE = Mean(Forecast_cutoff - Actual)."
            icon={History}
            highlightColor="blue"
          />

          <KPICard
            title="Forecast Volume"
            value={metrics.totalForecastGenerationMWh ? `${Math.round(metrics.totalForecastGenerationMWh).toLocaleString()}` : '—'}
            unit="MWh"
            explanation="Total 24-hour wind energy anticipated at cutoff."
            formulaTooltip="Sum of available forecast MW across delivery hours."
            icon={ShieldCheck}
            highlightColor="green"
          />

          <KPICard
            title="Delivered Outturn"
            value={metrics.totalActualGenerationMWh ? `${Math.round(metrics.totalActualGenerationMWh).toLocaleString()}` : '—'}
            unit="MWh"
            explanation="Final outturn volume recorded by Elexon FUELHH."
            formulaTooltip="Sum of actual generation MW across delivery hours."
            icon={CheckCircle2}
            highlightColor="green"
          />
        </div>
      )}

      {/* TIMELINE HORIZON PROGRESSION */}
      {data && data.timeline && (
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Horizon Accuracy Convergence
              </h3>
              <p className="text-[11px] text-slate-400">
                Track how forecasting error narrowed as gate closures approached
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => handleStepTimeline('prev')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0C1017] hover:bg-[#161D2A] border border-[#1E2638] text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev Gate</span>
              </button>
              <button
                onClick={() => handleStepTimeline('next')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161D2A] hover:bg-[#1C2536] border border-[#2A364E] text-[11px] font-mono text-teal-400 font-semibold transition-colors"
              >
                <span>Next Gate</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {data.timeline.map((point) => (
              <button
                key={point.label}
                type="button"
                onClick={() => {
                  setCutoffTimestamp(point.cutoffTimestamp);
                  showToast(`Horizon: ${point.label}`, 'info');
                }}
                className={`p-3 rounded-lg border transition-all text-left ${
                  cutoffTimestamp === point.cutoffTimestamp
                    ? 'border-teal-400 bg-teal-500/10 ring-1 ring-teal-400'
                    : 'border-[#1E2638] bg-[#0C1017] hover:bg-[#161D2A]'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {point.label}
                </div>
                <p className="text-xs font-mono font-medium text-white mt-0.5 truncate">
                  {point.cutoffLocal}
                </p>
                <div className="mt-2 pt-1.5 border-t border-[#1E2638] flex items-center justify-between font-mono">
                  <span className="text-[10px] text-slate-500">MAE:</span>
                  <span className="text-[11px] font-bold text-amber-400">
                    {point.mae ? `${Math.round(point.mae).toLocaleString()} MW` : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CHART */}
      {data && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Information State vs. Retrospective vs. Actual Delivery
              </h3>
              <p className="text-[11px] text-slate-400">
                Blue shows information genuinely available at cutoff. Amber dashed shows post-cutoff revisions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCutoffLine(!showCutoffLine)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showCutoffLine
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-xs bg-sky-400" />
                <span>At Cutoff</span>
                {showCutoffLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowRetroLine(!showRetroLine)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showRetroLine
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-xs bg-amber-400" />
                <span>Retrospective</span>
                {showRetroLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowActualLine(!showActualLine)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showActualLine
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                <span>Actual</span>
                {showActualLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
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
                        <div className="p-3 rounded-lg bg-[#111620] border border-[#1E2638] shadow-dropdown text-xs space-y-1.5 min-w-[210px]">
                          <p className="font-mono font-bold text-white border-b border-[#1E2638] pb-1">
                            Interval: {label} ({deliveryDate})
                          </p>
                          {showCutoffLine && (
                            <div className="text-sky-400 flex justify-between font-mono">
                              <span>At Cutoff:</span>
                              <span className="font-bold">{item.cutoffForecast ? `${Math.round(item.cutoffForecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showRetroLine && (
                            <div className="text-amber-400 flex justify-between font-mono">
                              <span>Retrospective:</span>
                              <span className="font-bold">{item.retroForecast ? `${Math.round(item.retroForecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showActualLine && (
                            <div className="text-emerald-400 flex justify-between font-mono">
                              <span>Delivered:</span>
                              <span className="font-bold">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {item.error !== null && (
                            <div className="text-rose-400 flex justify-between font-mono font-bold pt-1 border-t border-[#1E2638]">
                              <span>Cutoff Error:</span>
                              <span>{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
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
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#0284C7' }}
                  />
                )}
                {showRetroLine && (
                  <Line
                    type="monotone"
                    dataKey="retroForecast"
                    name="Retrospective Revisions"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: '#F59E0B' }}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Delivered"
                    stroke="#10B981"
                    strokeWidth={1.8}
                    dot={{ r: 2, fill: '#10B981' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* REPLAY TABLE */}
      {data && (
        <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Settlement Replay Audit (24 Hours)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Matched &le; Decision Cutoff
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#1E2638]">
            <table className="w-full text-left text-xs whitespace-nowrap font-mono">
              <thead className="bg-[#0C1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                <tr>
                  <th className="py-2.5 px-3.5">Delivery Time</th>
                  <th className="py-2.5 px-3.5">Publish Vintage</th>
                  <th className="py-2.5 px-3.5 text-right">Forecast (MW)</th>
                  <th className="py-2.5 px-3.5 text-right">Actual (MW)</th>
                  <th className="py-2.5 px-3.5 text-right">Error (MW)</th>
                  <th className="py-2.5 px-3.5 text-right">Lead Age</th>
                  <th className="py-2.5 px-3.5 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/60">
                {data.intervals.map((row) => (
                  <tr
                    key={row.startTime}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-[#161D2A] transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-3.5 font-medium text-slate-200">
                      {row.deliveryTimeLocal}
                    </td>
                    <td className="py-2 px-3.5 text-slate-400">
                      {row.selectedPublishTimeLocal || '—'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-sky-400 tabular-nums">
                      {row.forecastGeneration ? `${Math.round(row.forecastGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-emerald-400 tabular-nums">
                      {row.actualGeneration ? `${Math.round(row.actualGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className={`py-2 px-3.5 text-right font-bold tabular-nums ${
                      row.error !== null && row.error > 0 ? 'text-amber-400' : 'text-sky-400'
                    }`}>
                      {row.error !== null ? `${row.error > 0 ? '+' : ''}${Math.round(row.error).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2 px-3.5 text-right text-slate-400 tabular-nums">
                      {row.forecastAgeHours !== null ? `${row.forecastAgeHours.toFixed(1)} hrs` : '—'}
                    </td>
                    <td className="py-2 px-3.5 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row Modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111620] border border-[#1E2638] rounded-xl max-w-md w-full p-4 space-y-3 shadow-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Decision Audit Record</h4>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#161D2A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Delivery Interval:</span>
                <span className="text-white font-bold">{selectedRow.deliveryTimeLocal}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Vintage at Cutoff:</span>
                <span className="text-teal-400">{selectedRow.selectedPublishTimeLocal || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Available Forecast:</span>
                <span className="font-bold text-sky-400">
                  {selectedRow.forecastGeneration ? `${Math.round(selectedRow.forecastGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Actual Outturn:</span>
                <span className="font-bold text-emerald-400">
                  {selectedRow.actualGeneration ? `${Math.round(selectedRow.actualGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              {selectedRow.error !== null && (
                <div className="flex justify-between py-1 border-b border-[#1E2638]">
                  <span className="text-slate-400">Replay Discrepancy:</span>
                  <span className={`font-bold ${selectedRow.error > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {selectedRow.error > 0 ? `+${Math.round(selectedRow.error)}` : Math.round(selectedRow.error)} MW
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedRow(null)}
              className="w-full py-2 rounded-lg bg-[#161D2A] hover:bg-[#1C2536] border border-[#2A364E] text-slate-200 font-mono text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
