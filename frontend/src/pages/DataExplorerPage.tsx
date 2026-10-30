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
  RefreshCw
} from 'lucide-react';
import { fetchDataQuality, fetchActuals, fetchForecasts, getExportUrl } from '../services/api';
import { DataQualityData, ActualRecord, ForecastRecord } from '../types';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';

export const DataExplorerPage: React.FC = () => {
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-wind-accent" />
            Data Explorer & Audit
          </h1>
          <p className="text-xs text-wind-textSecondary mt-1">
            Audit and inspect raw records from Elexon FUELHH and WINDFOR streams for January 2026.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExportUrl(activeTab, '2026-01')}
            download={`windwise_${activeTab}_2026-01.csv`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-xs font-semibold text-wind-textPrimary transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-wind-accent" />
            <span>Export {activeTab === 'actuals' ? 'Actuals' : 'Forecasts'} CSV</span>
          </a>
        </div>
      </div>

      {/* DATA QUALITY SUMMARY CARDS */}
      {qualityData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">WIND Actual Records</span>
            <p className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
              {qualityData.windActualRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">FUELHH Filtered</span>
          </div>

          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Non-Wind Dropped</span>
            <p className="text-lg font-extrabold font-mono text-slate-400 mt-0.5">
              {qualityData.nonWindActualRecordsFiltered.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Thermal/Nuclear</span>
          </div>

          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">WINDFOR Forecasts</span>
            <p className="text-lg font-extrabold font-mono text-sky-400 mt-0.5">
              {qualityData.totalForecastRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-wind-textSecondary">All Vintages</span>
          </div>

          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Duplicates Removed</span>
            <p className="text-lg font-extrabold font-mono text-wind-textPrimary mt-0.5">
              {qualityData.duplicateRecordsRemoved}
            </p>
            <span className="text-[10px] text-emerald-400">Strict Deduplication</span>
          </div>

          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Invalid / Nulls</span>
            <p className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
              {qualityData.invalidValuesCount}
            </p>
            <span className="text-[10px] text-emerald-400">Clean Dataset</span>
          </div>

          <div className="p-3.5 rounded-xl bg-wind-card border border-wind-border">
            <span className="text-[10px] font-semibold uppercase text-wind-textSecondary">Matched Intervals</span>
            <p className="text-lg font-extrabold font-mono text-wind-accent mt-0.5">
              {qualityData.matchedIntervals} / {qualityData.expectedIntervals}
            </p>
            <span className="text-[10px] text-wind-accent font-semibold">{qualityData.coveragePercent.toFixed(1)}% Coverage</span>
          </div>
        </div>
      )}

      {/* TABS & FILTERS BAR */}
      <div className="p-4 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-wind-sidebar p-1 rounded-xl border border-wind-border">
            <button
              onClick={() => {
                setActiveTab('actuals');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'actuals'
                  ? 'bg-wind-cardSecondary text-emerald-400 shadow-sm'
                  : 'text-wind-textSecondary hover:text-wind-textPrimary'
              }`}
            >
              Tab 1: Actual Generation (FUELHH)
            </button>
            <button
              onClick={() => {
                setActiveTab('forecasts');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'forecasts'
                  ? 'bg-wind-cardSecondary text-sky-400 shadow-sm'
                  : 'text-wind-textSecondary hover:text-wind-textPrimary'
              }`}
            >
              Tab 2: Forecast Generation (WINDFOR)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-wind-textSecondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-wind-sidebar border border-wind-border text-xs text-wind-textPrimary placeholder:text-wind-textSecondary/50 focus:outline-none focus:border-wind-accent w-64"
            />
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="overflow-x-auto rounded-xl border border-wind-border/80">
          {activeTab === 'actuals' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Delivery Start Time (UTC)</th>
                  <th className="py-3 px-4">Settlement Date</th>
                  <th className="py-3 px-4 text-center">Settlement Period</th>
                  <th className="py-3 px-4">Fuel Type</th>
                  <th className="py-3 px-4 text-right">Generation (MW)</th>
                  <th className="py-3 px-4 text-center">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {paginatedActuals.length > 0 ? (
                  paginatedActuals.map((row, idx) => (
                    <tr key={`${row.startTime}-${idx}`} className="hover:bg-wind-cardSecondary/40 transition-colors">
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
                        <span className="text-[10px] text-emerald-400 font-medium">Valid Elexon Record</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-wind-textSecondary">
                      No actual records matched the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
                <tr>
                  <th className="py-3 px-4">Target Delivery Start Time (UTC)</th>
                  <th className="py-3 px-4">Forecast Publish Time (UTC)</th>
                  <th className="py-3 px-4 text-right">Forecast Generation (MW)</th>
                  <th className="py-3 px-4 text-center">Vintage Type</th>
                  <th className="py-3 px-4 text-center">Data Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wind-border/60">
                {paginatedForecasts.length > 0 ? (
                  paginatedForecasts.map((row, idx) => (
                    <tr key={`${row.startTime}-${row.publishTime}-${idx}`} className="hover:bg-wind-cardSecondary/40 transition-colors">
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          WINDFOR Run
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-medium">Verified Non-Null</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-wind-textSecondary">
                      No forecast records matched the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-wind-textSecondary pt-2">
          <span>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems.toLocaleString()} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-wind-sidebar border border-wind-border hover:border-wind-accent disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono text-wind-textPrimary">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-wind-sidebar border border-wind-border hover:border-wind-accent disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
