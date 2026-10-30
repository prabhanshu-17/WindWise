import React, { useState } from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  explanation: string;
  formulaTooltip: string;
  icon: LucideIcon;
  badge?: {
    label: string;
    variant: 'positive' | 'negative' | 'neutral' | 'accent';
  };
  highlightColor?: 'green' | 'blue' | 'amber' | 'rose';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  explanation,
  formulaTooltip,
  icon: Icon,
  badge,
  highlightColor = 'green'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const colorStyles = {
    green: 'border-l-wind-accent text-wind-accent bg-wind-accent/10',
    blue: 'border-l-wind-accentBlue text-wind-accentBlue bg-wind-accentBlue/10',
    amber: 'border-l-wind-warning text-wind-warning bg-wind-warning/10',
    rose: 'border-l-wind-danger text-wind-danger bg-wind-danger/10',
  }[highlightColor];

  const badgeStyles = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    accent: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  }[badge?.variant || 'neutral'];

  return (
    <div className="relative p-5 rounded-2xl bg-wind-card border border-wind-border hover:border-wind-borderLight transition-all duration-200 shadow-card group">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-wind-textSecondary">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles}`}>
              {badge.label}
            </span>
          )}
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              type="button"
              className="text-wind-textSecondary hover:text-wind-textPrimary p-0.5 rounded transition-colors"
              title="Metric explanation"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 w-64 p-3 rounded-xl bg-wind-cardSecondary border border-wind-border text-xs text-wind-textPrimary shadow-2xl z-30 pointer-events-none animate-fadeIn">
                <p className="font-semibold text-wind-accent mb-1">{title}</p>
                <p className="text-[11px] leading-relaxed text-wind-textSecondary mb-2">{formulaTooltip}</p>
                <div className="pt-1.5 border-t border-wind-border/60 text-[10px] text-wind-textSecondary/80 font-mono">
                  Calculated dynamically from January 2026 Elexon data
                </div>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-xl ${colorStyles} transition-transform duration-200 group-hover:scale-105`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main KPI Value */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-wind-textPrimary font-mono">
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && (
          <span className="text-xs font-bold text-wind-textSecondary uppercase font-mono">
            {unit}
          </span>
        )}
      </div>

      {/* Short explanation */}
      <p className="text-xs text-wind-textSecondary leading-normal">
        {explanation}
      </p>
    </div>
  );
};
