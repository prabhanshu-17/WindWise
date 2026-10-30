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
    <div className="p-5 rounded-2xl bg-wind-card border border-wind-border shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-wind-textPrimary">Systematic Forecast Bias</h3>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isOver
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : isUnder
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isOver ? 'Overforecasting' : isUnder ? 'Underforecasting' : 'Neutral'}
          </span>
        </div>
        <p className="text-xs text-wind-textSecondary mb-4">
          Mean Bias Error across all matched settlement intervals
        </p>

        {/* Big Number */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isOver
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
            }`}
          >
            {isOver ? (
              <TrendingUp className="w-6 h-6" />
            ) : isUnder ? (
              <TrendingDown className="w-6 h-6" />
            ) : (
              <Minus className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-wind-textPrimary">
              {bias.mbe > 0 ? `+${bias.mbe.toLocaleString()} MW` : `${bias.mbe.toLocaleString()} MW`}
            </div>
            <div className="text-[11px] text-wind-textSecondary">
              {isOver
                ? 'Forecast exceeds actual delivery on average'
                : 'Actual generation exceeds forecast on average'}
            </div>
          </div>
        </div>

        {/* Progress Bar Split */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-wind-textSecondary">
            <span className="text-amber-400 font-semibold">{bias.overforecastPercent}% Overforecast</span>
            <span className="text-sky-400 font-semibold">{bias.underforecastPercent}% Underforecast</span>
          </div>
          <div className="w-full h-3 rounded-full bg-wind-cardSecondary overflow-hidden flex">
            <div
              style={{ width: `${bias.overforecastPercent}%` }}
              className="bg-amber-500/80 transition-all duration-500"
              title={`Overforecast: ${bias.overforecastCount} intervals (${bias.overforecastPercent}%)`}
            />
            <div
              style={{ width: `${bias.underforecastPercent}%` }}
              className="bg-sky-500/80 transition-all duration-500"
              title={`Underforecast: ${bias.underforecastCount} intervals (${bias.underforecastPercent}%)`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-wind-textSecondary/70 font-mono">
            <span>{bias.overforecastCount} intervals</span>
            <span>{bias.underforecastCount} intervals</span>
          </div>
        </div>
      </div>

      {/* Trading Desk Interpretation Pill */}
      <div className="mt-4 pt-3 border-t border-wind-border/60 text-xs text-wind-textSecondary">
        <span className="text-wind-textPrimary font-semibold">Procurement Impact: </span>
        {isOver
          ? 'Risk of under-procuring wholesale power at day-ahead gate, requiring balancing market top-ups.'
          : 'Risk of over-procuring conventional power, creating spill or curtailment exposure.'}
      </div>
    </div>
  );
};

