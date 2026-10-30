import React from 'react';
import {
  BookOpen,
  Database,
  Calculator,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      {/* Page Header */}
      <div className="pb-2 border-b border-wind-border">
        <h1 className="text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-wind-accent" />
          Methodology & Data Transparency
        </h1>
        <p className="text-xs text-wind-textSecondary mt-1">
          Technical specifications, data integrity protocols, mathematical definitions, and architectural limitations.
        </p>
      </div>

      {/* SECTION 1: DATA SOURCES */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-wind-accent" />
          <h2 className="text-base font-bold text-wind-textPrimary">1. Elexon BMRS Data Sources</h2>
        </div>
        <p className="text-xs text-wind-textSecondary leading-relaxed">
          In strict compliance with project specifications, WINDWISE utilizes exclusively two verified primary data feeds from Elexon BMRS (Balancing Mechanism Reporting Service), with no external third-party generation, market pricing, thermal, or weather feeds:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-wind-accent">Actual Outturn Generation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FUELHH Stream
              </span>
            </div>
            <p className="text-xs text-wind-textSecondary leading-relaxed">
              Provides half-hourly generation by fuel type across Great Britain. Filtered strictly where <code className="text-wind-accent font-mono bg-wind-sidebar px-1 py-0.5 rounded">fuelType == 'WIND'</code>. Records provide outturn megawatt (MW) delivery per settlement interval.
            </p>
            <div className="text-[10px] text-wind-textSecondary/70 font-mono">
              Endpoint: /datasets/FUELHH/stream
            </div>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-wind-accentBlue">Forecast Generation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                WINDFOR Stream
              </span>
            </div>
            <p className="text-xs text-wind-textSecondary leading-relaxed">
              Provides National Grid ESO wind power forecast runs published at multiple vintages prior to delivery. Each record specifies delivery interval (<code className="text-wind-accentBlue font-mono bg-wind-sidebar px-1 py-0.5 rounded">startTime</code>), publication timestamp (<code className="text-wind-accentBlue font-mono bg-wind-sidebar px-1 py-0.5 rounded">publishTime</code>), and forecasted MW.
            </p>
            <div className="text-[10px] text-wind-textSecondary/70 font-mono">
              Endpoint: /datasets/WINDFOR/stream
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TIME RESOLUTION & EVALUATION PERIOD */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-wind-accentBlue" />
          <h2 className="text-base font-bold text-wind-textPrimary">2. Time Resolution & January 2026 Horizon</h2>
        </div>
        <p className="text-xs text-wind-textSecondary leading-relaxed">
          The evaluation period strictly covers <span className="text-wind-textPrimary font-semibold">January 1–31, 2026</span> (31 delivery days).
        </p>

        <div className="p-4 rounded-xl bg-wind-cardSecondary/40 border border-wind-border/60 space-y-3 text-xs text-wind-textSecondary leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-wind-card border border-wind-border/60">
              <span className="font-semibold text-wind-textPrimary block mb-1">Settlement Intervals (FUELHH)</span>
              48 half-hourly settlement periods per day × 31 days = <span className="font-mono text-wind-accent font-bold">1,488 half-hour settlement periods</span>.
            </div>
            <div className="p-3 rounded-lg bg-wind-card border border-wind-border/60">
              <span className="font-semibold text-wind-textPrimary block mb-1">Forecast Intervals (WINDFOR)</span>
              24 hourly intervals per day (:00 timestamps) × 31 days = <span className="font-mono text-sky-400 font-bold">744 hourly forecast intervals</span>.
            </div>
          </div>
          <p>
            <span className="font-semibold text-wind-textPrimary">Timestamp Normalization: </span>
            All timestamps are converted to timezone-aware UTC ISO-8601 strings (<code className="font-mono text-wind-accent">YYYY-MM-DDTHH:MM:SSZ</code>) for database indexing and analytical processing. User-facing delivery intervals and publication times are rendered in UK local clock time (accounting for GMT in January).
          </p>
        </div>
      </div>

      {/* SECTION 3: FORECAST SELECTION & LOOK-AHEAD BIAS PREVENTION */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-wind-textPrimary">3. Forecast Selection & Look-Ahead Bias Prevention</h2>
        </div>
        <p className="text-xs text-wind-textSecondary leading-relaxed">
          Energy procurement decisions in the UK Day-Ahead wholesale market occur under strict temporal boundaries (e.g., 10:00 UK local time on D-1 for the EPEX SPOT / Nord Pool auction gate closure). To prevent analytical look-ahead bias, forecast selection strictly adheres to the following algorithm:
        </p>

        <div className="p-4 rounded-xl bg-wind-sidebar border border-wind-border font-mono text-xs text-wind-textPrimary space-y-2">
          <p className="text-wind-accent font-semibold">// Forecast Selection Rule for Delivery Interval (T_delivery) and Cutoff (T_cutoff):</p>
          <p>1. Identify all forecast records where: <span className="text-sky-400">startTime == T_delivery</span></p>
          <p>2. Filter candidate forecasts where: <span className="text-amber-400">publishTime &lt;= T_cutoff</span></p>
          <p>3. Select the candidate vintage with: <span className="text-wind-accent">max(publishTime)</span></p>
          <p>4. If no vintage satisfies publishTime &lt;= T_cutoff: <span className="text-rose-400">Interval marked UNMATCHED</span></p>
        </div>

        <p className="text-xs text-wind-textSecondary leading-relaxed">
          <span className="text-amber-400 font-semibold">Important Rule: </span>
          A forecast published after the selected decision cutoff is never permitted to evaluate a historical procurement decision. Retrospective forecasts are displayed only as an explicit audit baseline and are never conflated with available day-ahead intelligence.
        </p>
      </div>

      {/* SECTION 4: MATHEMATICAL ACCURACY FORMULAS */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-wind-accent" />
          <h2 className="text-base font-bold text-wind-textPrimary">4. Statistical Accuracy Formulas</h2>
        </div>
        <p className="text-xs text-wind-textSecondary leading-relaxed">
          All performance metrics are calculated strictly over matched intervals where both valid actual generation and eligible forecasts co-exist. Missing intervals are excluded and never silently coerced to zero:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Forecast Error & Absolute Error</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              e_i = Forecast_i - Actual_i<br />
              |e_i| = |Forecast_i - Actual_i|
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Positive error indicates overforecasting; negative indicates underforecasting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Mean Absolute Error (MAE)</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              MAE = (1 / N) * Σ |Forecast_i - Actual_i|
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Average dispersion in megawatts without directional bias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Root Mean Squared Error (RMSE)</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              RMSE = sqrt((1 / N) * Σ (Forecast_i - Actual_i)^2)
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Quadratic scoring that heavily penalizes large ramp discrepancies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Mean Bias Error (MBE)</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              MBE = (1 / N) * Σ (Forecast_i - Actual_i)
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Direct indicator of systemic overforecasting (&gt;0) or underforecasting (&lt;0).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Weighted Absolute Percentage Error (WAPE)</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              WAPE = (Σ |e_i| / Σ Actual_i) * 100
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Preferred over MAPE to prevent mathematical division-by-zero during low wind periods.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-wind-cardSecondary/60 border border-wind-border/60 space-y-1.5">
            <span className="font-bold text-wind-textPrimary">Forecast Coverage Ratio</span>
            <div className="font-mono text-wind-accent bg-wind-sidebar p-2 rounded border border-wind-border">
              Coverage = (N_matched / N_expected) * 100
            </div>
            <p className="text-wind-textSecondary text-[11px]">
              Percentage of expected settlement periods successfully matched.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: DATA LIMITATIONS & WHOLESALE RISK CONTEXT */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-wind-textPrimary">5. Operational Limitations & Scope Restrictions</h2>
        </div>
        <p className="text-xs text-wind-textSecondary leading-relaxed">
          WINDWISE is intentionally focused on renewable forecast intelligence derived from National Grid ESO operational data. In adherence with project boundary conditions:
        </p>

        <ul className="space-y-2 text-xs text-wind-textSecondary">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-wind-accent mt-0.5 shrink-0" />
            <span><strong className="text-wind-textPrimary">National Wind Generation Only: </strong>Aggregates national transmission-connected wind farms; does not include embedded solar or local micro-generation.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-wind-accent mt-0.5 shrink-0" />
            <span><strong className="text-wind-textPrimary">No Consumer Demand Data: </strong>Platform evaluates wind supply accuracy, not net utility imbalance position.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-wind-accent mt-0.5 shrink-0" />
            <span><strong className="text-wind-textPrimary">No Market Price Data: </strong>Imbalance cash-out prices and day-ahead auction clears are out of scope.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-wind-accent mt-0.5 shrink-0" />
            <span><strong className="text-wind-textPrimary">Procurement Sizing Disclaimer: </strong>Forecast accuracy alone does not automatically dictate the exact volume of commercial power to procure; utility portfolio hedging strategies, consumer shape risk, and tolerance thresholds must be applied by trading personnel.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
