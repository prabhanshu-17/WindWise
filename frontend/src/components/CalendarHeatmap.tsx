import React from 'react';
import { CoverageDay } from '../types';
import { Calendar, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CalendarHeatmapProps {
  coverageDays: CoverageDay[];
  onSelectDay?: (date: string) => void;
  selectedDay?: string;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  coverageDays,
  onSelectDay,
  selectedDay
}) => {
  const selectedDayData = coverageDays.find((d) => d.date === selectedDay);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-wind-textPrimary flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-wind-accent" />
            January 2026 Forecast Availability
          </h3>
          <p className="text-xs text-wind-textSecondary">
            Matched delivery interval coverage across all 31 days (Tap day to filter)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-[11px] text-wind-textSecondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" />
            <span>100% Matched (24/24)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/80" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-700" />
            <span>No Data</span>
          </div>
        </div>
      </div>

      {/* Grid of days 1 to 31 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-[9px] sm:text-[10px] font-semibold text-wind-textSecondary/70 py-0.5 sm:py-1">
            {day}
          </div>
        ))}

        {/* January 1, 2026 was a Thursday, so 3 empty padding slots (Mon, Tue, Wed) */}
        <div className="h-11 sm:h-14 rounded-lg bg-wind-cardSecondary/20 border border-wind-border/20" />
        <div className="h-11 sm:h-14 rounded-lg bg-wind-cardSecondary/20 border border-wind-border/20" />
        <div className="h-11 sm:h-14 rounded-lg bg-wind-cardSecondary/20 border border-wind-border/20" />

        {coverageDays.map((day) => {
          const dayNum = parseInt(day.date.split('-')[2], 10);
          const isSelected = selectedDay === day.date;
          const isFull = day.coveragePercent >= 95;
          const isPartial = day.coveragePercent > 0 && day.coveragePercent < 95;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay && onSelectDay(day.date)}
              className={`h-11 sm:h-14 p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left active:scale-95 ${
                isSelected
                  ? 'border-wind-accent bg-wind-accent/25 ring-2 ring-wind-accent shadow-glow-green'
                  : isFull
                  ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/15'
                  : isPartial
                  ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-400'
                  : 'border-wind-border bg-wind-cardSecondary/50 text-wind-textSecondary/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-wind-textPrimary">
                  {dayNum}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isFull ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                />
              </div>
              <div className="hidden sm:block text-[10px] font-mono text-wind-textSecondary truncate">
                {day.matched}/24 hrs
              </div>
              <div className="text-[8px] sm:text-[9px] font-mono text-wind-accent truncate font-semibold">
                {day.avgGeneration
                  ? `${(day.avgGeneration / 1000).toFixed(1)}k MW`
                  : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Interactive Quick Action Card */}
      {selectedDayData && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-wind-cardSecondary border border-wind-accent/40 shadow-lg animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-wind-textPrimary">
                Selected: {new Date(selectedDayData.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium font-mono">
                {selectedDayData.matched}/24 Intervals
              </span>
            </div>
            <p className="text-[11px] text-wind-textSecondary">
              Mean Outturn: <span className="font-mono text-wind-accent font-bold">{selectedDayData.avgGeneration !== null ? `${Math.round(selectedDayData.avgGeneration).toLocaleString()} MW` : '—'}</span> • Overview charts are currently filtered to this day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/forecast-explorer`}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-wind-sidebar hover:bg-wind-card border border-wind-border text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Explore Forecasts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to={`/decision-replay`}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-wind-sidebar hover:bg-wind-card border border-wind-border text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Replay Day</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => onSelectDay && onSelectDay(selectedDayData.date)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
