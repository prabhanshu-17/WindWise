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
  CheckCircle2,
  Lock
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

export const DecisionReplayPage: React.FC = () => {
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-01-15');
  // Default cutoff: Day-ahead 10:00 UK time (2026-01-14T10:00:00Z)
  const [cutoffTimestamp, setCutoffTimestamp] = useState<string>('2026-01-14T10:00:00Z');
  const [data, setData] = useState<DecisionReplayData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-wind-accent" />
            Historical Decision Replay
          </h1>
          <p className="text-xs text-wind-textSecondary mt-1">
            Reconstruct the exact information available to the procurement desk at the historical day-ahead decision cutoff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Look-Ahead Bias Prevention</span>
          </div>
        </div>
      </div>

      {/* DECISION CONFIGURATION & PRESETS PANEL */}
      <div className="p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-wind-accent" />
              <span className="text-xs font-semibold text-wind-textSecondary">Delivery Date:</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={deliveryDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDeliveryDate(newDate);
                  // Update default cutoff to D-1 10:00 of new delivery date
                  const dt = new Date(newDate + 'T00:00:00Z');
                  const dMinus1 = new Date(dt.getTime() - 86400000).toISOString().split('T')[0];
                  setCutoffTimestamp(`${dMinus1}T10:00:00Z`);
                }}
                className="px-3 py-1.5 rounded-lg bg-wind-sidebar border border-wind-border text-xs font-mono text-wind-textPrimary focus:outline-none focus:border-wind-accent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-wind-accentBlue" />
              <span className="text-xs font-semibold text-wind-textSecondary">Decision Cutoff:</span>
              <input
                type="text"
                value={cutoffTimestamp}
                onChange={(e) => setCutoffTimestamp(e.target.value)}
                placeholder="YYYY-MM-DDTHH:MM:SSZ"
                className="px-3 py-1.5 rounded-lg bg-wind-sidebar border border-wind-border text-xs font-mono text-wind-textPrimary focus:outline-none focus:border-wind-accent w-48"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-wind-textSecondary">Trading Milestones:</span>
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => setCutoffTimestamp(p.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  cutoffTimestamp === p.value
                    ? 'bg-wind-accent text-slate-900 font-bold shadow-glow-green'
                    : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Horizon Callout */}
        <div className="p-3 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-wind-textPrimary">
            <ShieldCheck className="w-4 h-4 text-wind-accent" />
            <span>
              Evaluating forecasts published strictly at or before:{' '}
              <span className="font-mono font-bold text-wind-accent">
                {data?.decisionCutoffLocal || cutoffTimestamp} UK Local
              </span>{' '}
              ({cutoffTimestamp} UTC)
            </span>
          </div>
          <span className="text-[11px] text-wind-textSecondary font-mono">
            All subsequent WINDFOR revisions are excluded
          </span>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS FOR SELECTED CUTOFF */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-wind-textPrimary">Decision Horizon Progression</h3>
              <p className="text-xs text-wind-textSecondary">
                Observe how forecasting accuracy improves as the procurement desk nears delivery
              </p>
            </div>
            <span className="text-[11px] font-mono text-wind-textSecondary bg-wind-sidebar px-2 py-0.5 rounded border border-wind-border">
              Horizon Audit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {data.timeline.map((point) => (
              <div
                key={point.label}
                onClick={() => setCutoffTimestamp(point.cutoffTimestamp)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  cutoffTimestamp === point.cutoffTimestamp
                    ? 'border-wind-accent bg-wind-accent/10 shadow-glow-green ring-1 ring-wind-accent'
                    : 'border-wind-border bg-wind-cardSecondary/40 hover:border-wind-borderLight'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-wind-textSecondary">
                    <span className="truncate">{point.label}</span>
                    {cutoffTimestamp === point.cutoffTimestamp && (
                      <span className="w-1.5 h-1.5 rounded-full bg-wind-accent animate-ping" />
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CHART: Cutoff Forecast vs Retrospective Latest Forecast vs Actual */}
      {data && (
        <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-wind-textPrimary">
                Decision Forecast vs Retrospective Latest vs Actual Delivery
              </h3>
              <p className="text-xs text-wind-textSecondary">
                Solid blue line represents information genuinely available at cutoff. Amber dashed line shows retrospective revisions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-wind-accentBlue font-bold">
                <span className="w-3 h-1 bg-wind-accentBlue rounded-full" />
                Available at Cutoff (Decision Basis)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-1 bg-amber-400 rounded-full" />
                Latest Retrospective (Post-Cutoff)
              </span>
              <span className="flex items-center gap-1.5 text-wind-accent">
                <span className="w-3 h-1 bg-wind-accent rounded-full" />
                Actual Delivery (Outturn)
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
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
                        <div className="p-3 rounded-xl bg-wind-card border border-wind-border shadow-2xl text-xs space-y-1.5 min-w-[240px]">
                          <p className="font-bold text-wind-textPrimary border-b border-wind-border/60 pb-1">
                            Interval: {label} (Delivery: {deliveryDate})
                          </p>
                          <div className="text-wind-accentBlue flex justify-between font-bold">
                            <span>Available at Cutoff:</span>
                            <span className="font-mono">{item.cutoffForecast ? `${Math.round(item.cutoffForecast).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          <div className="text-amber-400 flex justify-between">
                            <span>Retrospective Latest:</span>
                            <span className="font-mono">{item.retroForecast ? `${Math.round(item.retroForecast).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          <div className="text-wind-accent flex justify-between font-semibold">
                            <span>Actual Delivered:</span>
                            <span className="font-mono">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          {item.error !== null && (
                            <div className="text-rose-400 flex justify-between font-bold pt-1 border-t border-wind-border/40">
                              <span>Cutoff Error:</span>
                              <span className="font-mono">{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
                          <div className="text-[10px] text-wind-textSecondary pt-1">
                            Cutoff Vintage: {item.cutoffPub || '—'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cutoffForecast"
                  name="Available at Cutoff"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38BDF8' }}
                />
                <Line
                  type="monotone"
                  dataKey="retroForecast"
                  name="Latest Retrospective"
                  stroke="#FBBF24"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: '#FBBF24' }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Delivered"
                  stroke="#35D399"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#35D399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* REPLAY INTERVALS TABLE */}
      {data && (
        <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-wind-textPrimary">Settlement Interval Replay Audit</h3>
            <p className="text-xs text-wind-textSecondary">
              Each delivery interval matched with the latest eligible forecast published at or before the decision cutoff
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-wind-border/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Delivery Interval</th>
                  <th className="py-3 px-4">Selected Publish Time</th>
                  <th className="py-3 px-4 text-right">Forecast (MW)</th>
                  <th className="py-3 px-4 text-right">Actual (MW)</th>
                  <th className="py-3 px-4 text-right">Error (MW)</th>
                  <th className="py-3 px-4 text-right">Forecast Age</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {data.intervals.map((row) => (
                  <tr key={row.startTime} className="hover:bg-wind-cardSecondary/40 transition-colors">
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
                        Valid Replay
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

