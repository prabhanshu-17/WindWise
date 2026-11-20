import React from 'react';
import { CoverageDay } from '../types';
import { Calendar, ArrowRight, X } from 'lucide-react';
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
    <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            January 2026 Interval Coverage Matrix
          </h3>
          <p className="text-[11px] text-slate-400">
            Matched settlement delivery hours across Great Britain (31 days evaluated)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-emerald-500" />
            <span>24/24 Matched</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-700" />
            <span>Unmatched</span>
          </div>
        </div>
      </div>

      {/* Grid of days 1 to 31 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
          <div key={day} className="text-center text-[9px] font-mono font-semibold text-slate-500 py-0.5">
            {day}
          </div>
        ))}

        {/* Jan 1, 2026 was a Thursday: 3 empty slots (Mon, Tue, Wed) */}
        <div className="h-10 sm:h-12 rounded bg-[#0D121A]/50 border border-[#1E2638]/40" />
        <div className="h-10 sm:h-12 rounded bg-[#0D121A]/50 border border-[#1E2638]/40" />
        <div className="h-10 sm:h-12 rounded bg-[#0D121A]/50 border border-[#1E2638]/40" />

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
              className={`h-10 sm:h-12 p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between text-left ${
                isSelected
                  ? 'border-teal-400 bg-teal-500/15 ring-1 ring-teal-400'
                  : isFull
                  ? 'border-[#1E2638] bg-[#141B26] hover:border-slate-600 hover:bg-[#182130]'
                  : isPartial
                  ? 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400'
                  : 'border-[#1E2638] bg-[#0E131C] text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono font-semibold text-slate-300">
                  {dayNum}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isFull ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                />
              </div>
              <div className="text-[9px] font-mono text-slate-400 truncate">
                {day.avgGeneration
                  ? `${Math.round(day.avgGeneration / 1000)}k MW`
                  : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Quick Inspector */}
      {selectedDayData && (
        <div className="p-3 rounded-lg bg-[#161D2A] border border-[#2A364E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">
                {new Date(selectedDayData.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedDayData.matched}/24 Hours Matched
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Mean Outturn: <span className="font-mono text-emerald-400 font-semibold">{selectedDayData.avgGeneration !== null ? `${Math.round(selectedDayData.avgGeneration).toLocaleString()} MW` : '—'}</span> • Main chart filtered to this date.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/forecast-explorer"
              className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#111620] hover:bg-[#1C2536] border border-[#1E2638] text-sky-400 flex items-center gap-1 transition-colors"
            >
              <span>Vintages</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/decision-replay"
              className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#111620] hover:bg-[#1C2536] border border-[#1E2638] text-amber-400 flex items-center gap-1 transition-colors"
            >
              <span>Replay</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => onSelectDay && onSelectDay(selectedDayData.date)}
              className="text-[11px] font-medium px-2 py-1 rounded bg-[#111620] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#1E2638] flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
