import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { fetchDataQuality, fetchActuals, fetchForecasts, getExportUrl } from '../services/api';
import { DataQualityData, ActualRecord, ForecastRecord } from '../types';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const DataExplorerPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'actuals' | 'forecasts'>('actuals');
  const [qualityData, setQualityData] = useState<DataQualityData | null>(null);
  const [actuals, setActuals] = useState<ActualRecord[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const pageSize = 15;

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [qData, acts, fcs] = await Promise.all([
        fetchDataQuality('2026-01'),
        fetchActuals(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`),
        fetchForecasts(`${startDate}T00:00:00Z`, `${endDate}T23:59:59Z`),
      ]);
      setQualityData(qData);
      setActuals(acts);
      setForecasts(fcs);
    } catch (err: any) {
      console.error('Error fetching data explorer records:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load data explorer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [startDate, endDate]);

  if (loading && !qualityData) return <LoadingSkeleton />;
  if (error && !qualityData) return <ErrorState message={error} onRetry={loadAll} />;

  // Filter tab data
  const filteredActuals = actuals.filter((r) => {
    const q = searchTerm.toLowerCase();
    return r.startTime.toLowerCase().includes(q) || (r.settlementDate && r.settlementDate.includes(q));
  });

  const filteredForecasts = forecasts.filter((r) => {
    const q = searchTerm.toLowerCase();
    return r.startTime.toLowerCase().includes(q) || r.publishTime.toLowerCase().includes(q);
  });

  const totalItems = activeTab === 'actuals' ? filteredActuals.length : filteredForecasts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedActuals = filteredActuals.slice(startIndex, startIndex + pageSize);
  const paginatedForecasts = filteredForecasts.slice(startIndex, startIndex + pageSize);

  const handleTabSwitch = (tab: 'actuals' | 'forecasts') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    showToast(`Switched to ${tab === 'actuals' ? 'Actuals (FUELHH)' : 'Forecasts (WINDFOR)'}`, 'info');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <Database className="w-5 sm:w-6 h-5 sm:h-6 text-wind-accent" />
            Data Explorer & Audit
          </h1>
          <p className="text-xs text-wind-textSecondary mt-0.5 sm:mt-1">
            Audit and inspect raw records from Elexon FUELHH and WINDFOR streams for January 2026.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={getExportUrl(activeTab, '2026-01')}
            download={`windwise_${activeTab}_2026-01.csv`}
            onClick={() => showToast(`Exporting ${activeTab === 'actuals' ? 'actuals' : 'forecasts'} CSV...`, 'info')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-xs font-semibold text-wind-textPrimary transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-wind-accent" />
            <span>Export {activeTab === 'actuals' ? 'Actuals' : 'Forecasts'} CSV</span>
          </a>
        </div>
      </div>

      {/* DATA QUALITY SUMMARY CARDS */}
      {qualityData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">WIND Actual Records</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
              {qualityData.windActualRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">FUELHH Filtered</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Non-Wind Dropped</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-slate-400 mt-0.5">
              {qualityData.nonWindActualRecordsFiltered.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Thermal/Nuclear</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">WINDFOR Records</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-sky-400 mt-0.5">
              {qualityData.totalForecastRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">All Vintages</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Duplicates Removed</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-wind-textPrimary mt-0.5">
              {qualityData.duplicateRecordsRemoved}
            </p>
            <span className="text-[10px] text-emerald-400">Strict Deduplication</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Invalid / Nulls</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
              {qualityData.invalidValuesCount}
            </p>
            <span className="text-[10px] text-emerald-400">Clean Dataset</span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-wind-card border border-wind-border col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Matched Coverage</span>
            <p className="text-base sm:text-lg font-extrabold font-mono text-wind-accent mt-0.5">
              {qualityData.matchedIntervals} / {qualityData.expectedIntervals}
            </p>
            <span className="text-[10px] text-wind-accent font-semibold">{qualityData.coveragePercent.toFixed(1)}% Complete</span>
          </div>
        </div>
      )}

      {/* TABS & FILTERS BAR */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-wind-sidebar p-1 rounded-xl border border-wind-border max-w-full">
            <button
              onClick={() => handleTabSwitch('actuals')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 text-center ${
                activeTab === 'actuals'
                  ? 'bg-wind-cardSecondary text-emerald-400 shadow-sm'
                  : 'text-wind-textSecondary hover:text-wind-textPrimary'
              }`}
            >
              Actuals (FUELHH)
            </button>
            <button
              onClick={() => handleTabSwitch('forecasts')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 text-center ${
                activeTab === 'forecasts'
                  ? 'bg-wind-cardSecondary text-sky-400 shadow-sm'
                  : 'text-wind-textSecondary hover:text-wind-textPrimary'
              }`}
            >
              Forecasts (WINDFOR)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-wind-textSecondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-wind-sidebar border border-wind-border text-xs text-wind-textPrimary placeholder:text-wind-textSecondary/50 focus:outline-none focus:border-wind-accent"
            />
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        {/* Mobile Swipe Hint */}
        <div className="sm:hidden text-[11px] text-wind-textSecondary flex items-center justify-between px-1">
          <span>Tap row to inspect</span>
          <span className="font-mono text-wind-accent">Swipe left/right →</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-wind-border/80">
          {activeTab === 'actuals' ? (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Start Time (UTC)</th>
                  <th className="py-3 px-4">Settlement Date</th>
                  <th className="py-3 px-4 text-center">Period</th>
                  <th className="py-3 px-4">Fuel Type</th>
                  <th className="py-3 px-4 text-right">Generation (MW)</th>
                  <th className="py-3 px-4 text-center">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {paginatedActuals.length > 0 ? (
                  paginatedActuals.map((row, idx) => (
                    <tr
                      key={`${row.startTime}-${idx}`}
                      onClick={() => setSelectedItem({ type: 'actual', ...row })}
                      className="hover:bg-wind-cardSecondary/60 transition-colors cursor-pointer active:bg-wind-accent/10"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-wind-textPrimary">
                        {row.startTime}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-wind-textSecondary">
                        {row.settlementDate || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-wind-textSecondary">
                        {row.settlementPeriod || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {row.fuelType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {Math.round(row.generation).toLocaleString()} MW
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-medium">Valid</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-wind-textSecondary">
                      No actual generation records matched your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Delivery Start (UTC)</th>
                  <th className="py-3 px-4">Publish Time (Vintage)</th>
                  <th className="py-3 px-4 text-right">Forecast MW</th>
                  <th className="py-3 px-4 text-center">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {paginatedForecasts.length > 0 ? (
                  paginatedForecasts.map((row, idx) => (
                    <tr
                      key={`${row.startTime}-${row.publishTime}-${idx}`}
                      onClick={() => setSelectedItem({ type: 'forecast', ...row })}
                      className="hover:bg-wind-cardSecondary/60 transition-colors cursor-pointer active:bg-wind-accent/10"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-wind-textPrimary">
                        {row.startTime}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-wind-accentBlue">
                        {row.publishTime}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-400">
                        {Math.round(row.generation).toLocaleString()} MW
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] text-sky-400 font-medium">Valid WINDFOR</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-wind-textSecondary">
                      No forecast records matched your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-wind-textSecondary pt-2">
          <span>
            Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems} records
          </span>
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-wind-sidebar border border-wind-border hover:border-wind-accent disabled:opacity-40 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono text-wind-textPrimary font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-wind-sidebar border border-wind-border hover:border-wind-accent disabled:opacity-40 transition-colors active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row Modal on Tap */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wind-card border border-wind-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-wind-border">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-wind-accent" />
                <h4 className="text-sm font-bold text-wind-textPrimary">Record Inspection</h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-wind-textSecondary hover:text-wind-textPrimary hover:bg-wind-cardSecondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Stream Dataset:</span>
                <span className="font-mono font-bold text-wind-accent">
                  {selectedItem.type === 'actual' ? 'Elexon FUELHH' : 'Elexon WINDFOR'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Start Time (UTC):</span>
                <span className="font-mono text-wind-textPrimary">{selectedItem.startTime}</span>
              </div>
              {selectedItem.publishTime && (
                <div className="flex justify-between py-1 border-b border-wind-border/40">
                  <span className="text-wind-textSecondary">Publish Vintage:</span>
                  <span className="font-mono text-sky-400">{selectedItem.publishTime}</span>
                </div>
              )}
              {selectedItem.settlementPeriod && (
                <div className="flex justify-between py-1 border-b border-wind-border/40">
                  <span className="text-wind-textSecondary">Settlement Period:</span>
                  <span className="font-mono text-wind-textPrimary">Period {selectedItem.settlementPeriod}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-wind-textSecondary">Generation Value:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {Math.round(selectedItem.generation).toLocaleString()} MW
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 rounded-xl bg-wind-accent text-slate-900 font-bold text-xs hover:bg-wind-accent/90 transition-colors shadow-glow-green"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
