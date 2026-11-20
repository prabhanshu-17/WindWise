import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BiasIndicator } from '../types';

interface BiasGaugeProps {
  bias: BiasIndicator;
}

export const BiasGauge: React.FC<BiasGaugeProps> = ({ bias }) => {
  const isOver = bias.direction === 'overforecast';
  const isUnder = bias.direction === 'underforecast';

  return (
    <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Forecast Bias (MBE)
          </h3>
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
              isOver
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : isUnder
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isOver ? '+ OVERFORECAST' : isUnder ? '- UNDERFORECAST' : 'CALIBRATED'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Mean Bias Error across all matched settlement delivery hours
        </p>

        {/* Big Monospace Figure */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0C1017] border border-[#1E2638]">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              isOver
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}
          >
            {isOver ? (
              <TrendingUp className="w-4 h-4" />
            ) : isUnder ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
              {bias.mbe > 0 ? `+${bias.mbe.toLocaleString()} MW` : `${bias.mbe.toLocaleString()} MW`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {isOver
                ? 'Model predicted higher than delivered outturn'
                : 'Delivered outturn exceeded model prediction'}
            </div>
          </div>
        </div>

        {/* Direction Ratio Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-amber-400 font-medium">{bias.overforecastPercent}% Over ({bias.overforecastCount}h)</span>
            <span className="text-sky-400 font-medium">{bias.underforecastPercent}% Under ({bias.underforecastCount}h)</span>
          </div>
          <div className="w-full h-2 rounded bg-[#161D2A] overflow-hidden flex">
            <div
              style={{ width: `${bias.overforecastPercent}%` }}
              className="bg-amber-500/80"
              title={`Overforecast: ${bias.overforecastCount} intervals (${bias.overforecastPercent}%)`}
            />
            <div
              style={{ width: `${bias.underforecastPercent}%` }}
              className="bg-sky-500/80"
              title={`Underforecast: ${bias.underforecastCount} intervals (${bias.underforecastPercent}%)`}
            />
          </div>
        </div>
      </div>

      {/* Desk note */}
      <div className="pt-2.5 border-t border-[#1E2638] text-[11px] text-slate-400 leading-relaxed font-mono">
        <span className="text-slate-300 font-semibold">Desk Implication: </span>
        {isOver
          ? 'Positive bias creates risk of short positions at Day-Ahead gate closure, requiring system cash-out topups.'
          : 'Negative bias creates spill risk or discounted liquidation at System Sell Prices.'}
      </div>
    </div>
  );
};
