import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Calculator,
  ShieldAlert,
  Clock,
  Lock,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const [calcForecast, setCalcForecast] = useState<number>(14500);
  const [calcActual, setCalcActual] = useState<number>(12800);

  const calcError = calcForecast - calcActual;
  const calcAbsError = Math.abs(calcError);
  const calcPct = calcActual > 0 ? ((calcError / calcActual) * 100).toFixed(1) : '—';
  const isOver = calcError > 0;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl animate-fadeIn font-sans">
      {/* Header */}
      <div className="pb-3 border-b border-[#1E2638]">
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-400" />
          Methodology, Mathematical Formulations & Governance
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Elexon BMRS ingestion specifications, temporal resolution, look-ahead bias prevention algorithms, and statistical definitions.
        </p>
      </div>

      {/* INTERACTIVE FORMULA TESTER */}
      <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1E2638]">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-teal-400" />
              Interactive Statistical Formula Calculator
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live mathematical test bench for error, absolute error, and directional bias evaluation
            </p>
          </div>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            TEST BENCH
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Input 1 */}
          <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-500">
              Forecast MW
            </label>
            <input
              type="number"
              value={calcForecast}
              onChange={(e) => setCalcForecast(Number(e.target.value) || 0)}
              className="w-full bg-transparent font-mono font-bold text-sky-400 text-sm focus:outline-none"
            />
          </div>

          {/* Input 2 */}
          <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-500">
              Actual Outturn MW
            </label>
            <input
              type="number"
              value={calcActual}
              onChange={(e) => setCalcActual(Number(e.target.value) || 0)}
              className="w-full bg-transparent font-mono font-bold text-emerald-400 text-sm focus:outline-none"
            />
          </div>

          {/* Result 1 */}
          <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Raw Error (Forecast &minus; Actual)
            </span>
            <div className={`font-mono font-bold text-sm ${isOver ? 'text-amber-400' : 'text-sky-400'}`}>
              {calcError > 0 ? `+${calcError.toLocaleString()}` : calcError.toLocaleString()} MW
            </div>
          </div>

          {/* Result 2 */}
          <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Absolute Deviation (|e|)
            </span>
            <div className="font-mono font-bold text-sm text-teal-400">
              {calcAbsError.toLocaleString()} MW ({calcPct}%)
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono p-2 rounded bg-[#0C1017] border border-[#1E2638] text-slate-400 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            {isOver
              ? 'Overforecasting by ' + calcError.toLocaleString() + ' MW: Desk faces short position exposure in wholesale settlement.'
              : 'Underforecasting by ' + Math.abs(calcError).toLocaleString() + ' MW: Desk risks spill or discounted surplus liquidation.'}
          </span>
        </div>
      </div>

      {/* SECTION 1: DATA SOURCES */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2638]">
          <Database className="w-4 h-4 text-teal-400 shrink-0" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">1. Primary Elexon BMRS Feeds</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          WINDWISE strictly connects to two official primary data streams from Elexon BMRS (Balancing Mechanism Reporting Service), with zero external weather, market pricing, or third-party proprietary generation proxies:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">FUELHH Stream</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Outturn Delivery
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Provides half-hourly generation by fuel type. Strictly filtered where <code className="text-emerald-400 bg-[#161D2A] px-1 py-0.2 rounded">fuelType == 'WIND'</code>. Records provide outturn megawatt delivery per settlement period.
            </p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E2638]">
              Endpoint: /datasets/FUELHH/stream
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">WINDFOR Stream</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Forecast Runs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              National Grid ESO wind power forecast vintages. Records specify delivery interval (<code className="text-sky-400 bg-[#161D2A] px-1 py-0.2 rounded">startTime</code>), publication timestamp (<code className="text-sky-400 bg-[#161D2A] px-1 py-0.2 rounded">publishTime</code>), and forecasted MW.
            </p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E2638]">
              Endpoint: /datasets/WINDFOR/stream
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LOOK-AHEAD BIAS PREVENTION */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2638]">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">2. Look-Ahead Bias Prevention</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          UK electricity wholesale procurement decisions take place under strict gate closures (e.g. 10:00 UK local time on D-1 for EPEX SPOT / Nord Pool auction clearing). To prevent mathematical look-ahead bias, forecast selection strictly adheres to the following algorithm:
        </p>

        <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
          <p className="text-teal-400 font-semibold">// Forecast Selection Rule:</p>
          <p>1. Find records where: <span className="text-sky-400">startTime == Target_Delivery_Hour</span></p>
          <p>2. Filter where: <span className="text-amber-400">publishTime &le; Decision_Cutoff</span></p>
          <p>3. Select latest eligible run: <span className="text-teal-400">max(publishTime)</span></p>
          <p>4. If no vintage published prior to cutoff: <span className="text-rose-400">Mark UNMATCHED</span></p>
        </div>
      </div>

      {/* SECTION 3: MATHEMATICAL ACCURACY FORMULAS */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2638]">
          <Calculator className="w-4 h-4 text-teal-400 shrink-0" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">3. Mathematical Accuracy Formulations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="font-semibold text-white">Mean Absolute Error (MAE)</span>
            <div className="text-teal-400 bg-[#161D2A] p-2 rounded border border-[#1E2638]">
              MAE = (1 / N) * &Sigma; |Forecast_i &minus; Actual_i|
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Evaluates average dispersion in megawatts without directional cancelation.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="font-semibold text-white">Root Mean Squared Error (RMSE)</span>
            <div className="text-teal-400 bg-[#161D2A] p-2 rounded border border-[#1E2638]">
              RMSE = sqrt((1 / N) * &Sigma; (Forecast_i &minus; Actual_i)^2)
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Quadratic scoring that heavily penalizes large ramp discrepancies.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="font-semibold text-white">Mean Bias Error (MBE)</span>
            <div className="text-teal-400 bg-[#161D2A] p-2 rounded border border-[#1E2638]">
              MBE = (1 / N) * &Sigma; (Forecast_i &minus; Actual_i)
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Measures directional skew: positive indicates overforecasting; negative indicates underforecasting.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2638] space-y-1">
            <span className="font-semibold text-white">Volume Weighted Error (WAPE)</span>
            <div className="text-teal-400 bg-[#161D2A] p-2 rounded border border-[#1E2638]">
              WAPE = (&Sigma; |e_i| / &Sigma; Actual_i) * 100
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Preferred over MAPE to avoid numerical explosion when actual generation approaches zero.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: OPERATIONAL LIMITATIONS */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2638]">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">4. Scope & System Boundaries</h2>
        </div>

        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
            <span><strong className="text-slate-200">Transmission Grid Wind Only: </strong>Aggregates national high-voltage connected wind farms; embedded micro-generation is out of scope.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
            <span><strong className="text-slate-200">No Consumer Demand Data: </strong>Platform evaluates wind supply accuracy, not total retail demand or net utility imbalance.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
            <span><strong className="text-slate-200">No Market Price Feeds: </strong>Balancing cash-out prices (SBP/SSP) and day-ahead auction clears are out of scope.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
