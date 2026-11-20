import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, Wind } from 'lucide-react';
import { Insight } from '../types';

interface InsightCardProps {
  insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'highest_error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'max_wind':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'min_wind':
        return <TrendingDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'bias':
        return <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'freshness':
      case 'coverage':
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  const getBorderBadge = () => {
    switch (insight.severity) {
      case 'danger':
        return 'border-rose-500/30 text-rose-300 bg-rose-500/10';
      case 'warning':
        return 'border-amber-500/30 text-amber-300 bg-amber-500/10';
      case 'success':
        return 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10';
      case 'info':
      default:
        return 'border-sky-500/30 text-sky-300 bg-sky-500/10';
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card hover:border-[#2A364E] transition-colors space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getIcon()}
          <h4 className="text-xs font-semibold text-slate-200 truncate">{insight.title}</h4>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${getBorderBadge()}`}>
          {insight.metricValue}
        </span>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
        {insight.description}
      </p>
    </div>
  );
};
