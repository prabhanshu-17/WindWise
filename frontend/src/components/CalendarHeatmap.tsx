import React from 'react';
import { CoverageDay } from '../types';

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
  return (
    <div className="p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-wind-textPrimary">January 2026 Forecast Availability</h3>
          <p className="text-xs text-wind-textSecondary">Matched delivery interval coverage across all 31 days</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-wind-textSecondary">
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
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-wind-textSecondary/60 py-1">
            {day}
          </div>
        ))}

        {/* January 1, 2026 was a Thursday, so 3 empty padding slots (Mon, Tue, Wed) */}
        <div className="h-14 rounded-lg bg-wind-cardSecondary/30 border border-wind-border/20" />
        <div className="h-14 rounded-lg bg-wind-cardSecondary/30 border border-wind-border/20" />
        <div className="h-14 rounded-lg bg-wind-cardSecondary/30 border border-wind-border/20" />

        {coverageDays.map((day) => {
          const dayNum = parseInt(day.date.split('-')[2], 10);
          const isSelected = selectedDay === day.date;
          const isFull = day.coveragePercent >= 95;
          const isPartial = day.coveragePercent > 0 && day.coveragePercent < 95;

          return (
            <div
              key={day.date}
              onClick={() => onSelectDay && onSelectDay(day.date)}
              className={`h-14 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-wind-accent bg-wind-accent/20 ring-1 ring-wind-accent'
                  : isFull
                  ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/15'
                  : isPartial
                  ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-400'
                  : 'border-wind-border bg-wind-cardSecondary/50 text-wind-textSecondary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-wind-textPrimary">Jan {dayNum}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFull ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                />
              </div>
              <div className="text-[10px] font-mono text-wind-textSecondary truncate">
                {day.matched}/24 hrs
              </div>
              <div className="text-[9px] font-mono text-wind-accent truncate">
                {day.avgGeneration ? `${Math.round(day.avgGeneration).toLocaleString()} MW` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
