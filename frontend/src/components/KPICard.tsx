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

  const accentBorder = {
    green: 'border-t-emerald-500/80',
    blue: 'border-t-sky-500/80',
    amber: 'border-t-amber-500/80',
    rose: 'border-t-rose-500/80',
  }[highlightColor];

  const iconColor = {
    green: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-sky-400 bg-sky-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  }[highlightColor];

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
      showToast(`Copied: ${textToCopy}`, 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl bg-[#111620] border border-[#1E2638] border-t-2 ${accentBorder} shadow-card hover:border-[#2A364E] transition-all group`}
    >
      {/* Header: Title and Metric Type Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase font-mono">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
              {badge.label}
            </span>
          )}

          {/* Formula Tooltip Trigger */}
          <div className="relative" ref={tooltipRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
              aria-label="Metric calculation details"
              title="Metric calculation details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {showTooltip && (
              <div className="absolute right-0 top-6 w-64 max-w-[calc(100vw-3rem)] p-3 rounded-xl bg-[#161D2A] border border-[#2A364E] text-xs text-slate-200 shadow-dropdown z-40 animate-fadeIn">
                <div className="flex items-center justify-between font-mono text-[11px] text-teal-400 mb-1.5 pb-1 border-b border-[#1E2638]">
                  <span>{title}</span>
                  <span className="text-slate-500 text-[10px]">ELEXON BMRS</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 mb-2 font-mono">
                  {formulaTooltip}
                </p>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-[#1E2638]">
                  Target: January 1–31, 2026
                </div>
              </div>
            )}
          </div>

          <div className={`p-1.5 rounded-md ${iconColor}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Primary Metric Value */}
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-white font-mono tabular-nums">
            {value !== null && value !== undefined ? value : '—'}
          </span>
          {unit && (
            <span className="text-xs font-mono font-medium text-slate-400">
              {unit}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          title="Copy metric value"
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#161D2A] text-slate-400 hover:text-teal-400 transition-opacity"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Subtext */}
      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
        {explanation}
      </p>
    </div>
  );
};
