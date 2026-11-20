import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Info, Wind } from 'lucide-react';
import { Insight } from '../types';

interface InsightCardProps {
  insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'highest_error':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'max_wind':
        return <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'min_wind':
        return <TrendingDown className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'bias':
        return <Wind className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'freshness':
      case 'coverage':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (insight.severity) {
      case 'danger':
        return 'border-l-4 border-l-rose-500 bg-rose-500/5';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-500/5';
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-emerald-500/5';
      case 'info':
      default:
        return 'border-l-4 border-l-sky-500 bg-sky-500/5';
    }
  };

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl bg-wind-card border border-wind-border ${getBorderColor()} shadow-sm hover:border-wind-borderLight transition-all`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="text-xs sm:text-sm font-semibold text-wind-textPrimary">{insight.title}</h4>
        </div>
        <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-wind-cardSecondary border border-wind-border text-wind-textPrimary">
          {insight.metricValue}
        </span>
      </div>
      <p className="text-xs text-wind-textSecondary leading-relaxed pl-6">
        {insight.description}
      </p>
    </div>
  );
};
