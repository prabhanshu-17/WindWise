import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, Info, Copy, Check } from 'lucide-react';
import { useToast } from './Toast';

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
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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

  // Handle outside click to close tooltip on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTooltip]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value !== null && value !== undefined) {
      const textToCopy = `${value} ${unit || ''}`.trim();
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast(`Copied ${title}: ${textToCopy}`, 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative p-4 sm:p-5 rounded-2xl bg-wind-card border border-wind-border hover:border-wind-borderLight transition-all duration-200 shadow-card group hover:shadow-lg">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-wind-textSecondary truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles}`}>
              {badge.label}
            </span>
          )}

          {/* Interactive Info Icon / Touch Popover */}
          <div className="relative" ref={tooltipRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-wind-textSecondary hover:text-wind-textPrimary p-1 rounded-lg transition-colors active:scale-95"
              aria-label="Metric explanation"
              title="Click or tap for calculation formula"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {showTooltip && (
              <div className="absolute right-0 top-7 w-64 sm:w-72 max-w-[calc(100vw-3rem)] p-3.5 rounded-xl bg-wind-cardSecondary border border-wind-border text-xs text-wind-textPrimary shadow-2xl z-40 animate-fadeIn">
                <div className="flex items-center justify-between font-semibold text-wind-accent mb-1 pb-1 border-b border-wind-border/60">
                  <span>{title}</span>
                  <span className="text-[10px] font-mono text-wind-textSecondary">Formula</span>
                </div>
                <p className="text-[11px] leading-relaxed text-wind-textSecondary mb-2 font-sans">
                  {formulaTooltip}
                </p>
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

      {/* Main KPI Value with quick copy interaction */}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-wind-textPrimary font-mono truncate">
            {value !== null && value !== undefined ? value : '—'}
          </span>
          {unit && (
            <span className="text-xs font-bold text-wind-textSecondary uppercase font-mono shrink-0">
              {unit}
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copy metric value"
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-wind-cardSecondary text-wind-textSecondary hover:text-wind-accent transition-all text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Short explanation */}
      <p className="text-[11px] sm:text-xs text-wind-textSecondary leading-normal">
        {explanation}
      </p>
    </div>
  );
};
