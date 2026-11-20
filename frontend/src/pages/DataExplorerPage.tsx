import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
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
    showToast(`Dataset: ${tab === 'actuals' ? 'FUELHH Actuals' : 'WINDFOR Forecasts'}`, 'info');
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            Elexon BMRS Stream Audit & Quality Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit raw half-hourly FUELHH outturn records and multi-vintage WINDFOR stream feeds (January 2026)
          </p>
        </div>

        <a
          href={getExportUrl(activeTab, '2026-01')}
          download={`windwise_${activeTab}_2026-01.csv`}
          onClick={() => showToast(`Exporting ${activeTab === 'actuals' ? 'actuals' : 'forecasts'} CSV...`, 'info')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161D2A] hover:bg-[#1E2638] border border-[#2A364E] text-xs font-medium text-slate-200 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Export {activeTab === 'actuals' ? 'Actuals' : 'Forecasts'} CSV</span>
        </a>
      </div>

      {/* DATA QUALITY SUMMARY CARDS */}
      {qualityData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638]">
            <span className="text-[10px] font-mono uppercase text-slate-500">WIND Actual Records</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
              {qualityData.windActualRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">FUELHH Stream</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638]">
            <span className="text-[10px] font-mono uppercase text-slate-500">Non-Wind Dropped</span>
            <p className="text-base font-bold font-mono text-slate-400 mt-0.5 tabular-nums">
              {qualityData.nonWindActualRecordsFiltered.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Thermal/Nuclear</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638]">
            <span className="text-[10px] font-mono uppercase text-slate-500">WINDFOR Records</span>
            <p className="text-base font-bold font-mono text-sky-400 mt-0.5 tabular-nums">
              {qualityData.totalForecastRecords.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">All Vintages</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638]">
            <span className="text-[10px] font-mono uppercase text-slate-500">Duplicates Filtered</span>
            <p className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
              {qualityData.duplicateRecordsRemoved}
            </p>
            <span className="text-[10px] text-emerald-400 font-mono">Deduplicated</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638]">
            <span className="text-[10px] font-mono uppercase text-slate-500">Invalid / Nulls</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
              {qualityData.invalidValuesCount}
            </p>
            <span className="text-[10px] text-emerald-400 font-mono">Zero Nulls</span>
          </div>

          <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638] col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Matched Coverage</span>
            <p className="text-base font-bold font-mono text-teal-400 mt-0.5 tabular-nums">
              {qualityData.matchedIntervals} / {qualityData.expectedIntervals}
            </p>
            <span className="text-[10px] text-teal-400 font-mono font-semibold">{qualityData.coveragePercent.toFixed(1)}% Complete</span>
          </div>
        </div>
      )}

      {/* TABS & SEARCH BAR */}
      <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-lg border border-[#1E2638] max-w-full">
          <button
            onClick={() => handleTabSwitch('actuals')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
              activeTab === 'actuals'
                ? 'bg-[#1C2536] text-emerald-400 border border-[#2A364E]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Actuals (FUELHH)
          </button>
          <button
            onClick={() => handleTabSwitch('forecasts')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
              activeTab === 'forecasts'
                ? 'bg-[#1C2536] text-sky-400 border border-[#2A364E]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forecasts (WINDFOR)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0C1017] border border-[#1E2638] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3">
        <div className="overflow-x-auto rounded-lg border border-[#1E2638]">
          {activeTab === 'actuals' ? (
            <table className="w-full text-left text-xs whitespace-nowrap font-mono">
              <thead className="bg-[#0C1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                <tr>
                  <th className="py-2.5 px-3.5">Delivery Start (UTC)</th>
                  <th className="py-2.5 px-3.5">Settlement Date</th>
                  <th className="py-2.5 px-3.5 text-center">Period</th>
                  <th className="py-2.5 px-3.5">Fuel Type</th>
                  <th className="py-2.5 px-3.5 text-right">Generation (MW)</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/60">
                {paginatedActuals.length > 0 ? (
                  paginatedActuals.map((row, idx) => (
                    <tr
                      key={`${row.startTime}-${idx}`}
                      onClick={() => setSelectedItem({ type: 'actual', ...row })}
                      className="hover:bg-[#161D2A] transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3.5 font-medium text-slate-200">
                        {row.startTime}
                      </td>
                      <td className="py-2 px-3.5 text-slate-400">
                        {row.settlementDate || '—'}
                      </td>
                      <td className="py-2 px-3.5 text-center text-slate-400">
                        {row.settlementPeriod || '—'}
                      </td>
                      <td className="py-2 px-3.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {row.fuelType}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-right font-bold text-emerald-400 tabular-nums">
                        {Math.round(row.generation).toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <span className="text-[10px] text-emerald-400">Valid</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No records matched the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap font-mono">
              <thead className="bg-[#0C1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                <tr>
                  <th className="py-2.5 px-3.5">Delivery Start (UTC)</th>
                  <th className="py-2.5 px-3.5">Publish Vintage</th>
                  <th className="py-2.5 px-3.5 text-right">Forecast MW</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/60">
                {paginatedForecasts.length > 0 ? (
                  paginatedForecasts.map((row, idx) => (
                    <tr
                      key={`${row.startTime}-${row.publishTime}-${idx}`}
                      onClick={() => setSelectedItem({ type: 'forecast', ...row })}
                      className="hover:bg-[#161D2A] transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3.5 font-medium text-slate-200">
                        {row.startTime}
                      </td>
                      <td className="py-2 px-3.5 text-sky-400">
                        {row.publishTime}
                      </td>
                      <td className="py-2 px-3.5 text-right font-bold text-sky-400 tabular-nums">
                        {Math.round(row.generation).toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3.5 text-center">
                        <span className="text-[10px] text-sky-400">Valid</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No records matched the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-400 pt-1 font-mono">
          <span>
            {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems} records
          </span>
          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#0C1017] border border-[#1E2638] hover:border-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-0.5 text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#0C1017] border border-[#1E2638] hover:border-slate-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111620] border border-[#1E2638] rounded-xl max-w-md w-full p-4 space-y-3 shadow-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">BMRS Stream Record</h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#161D2A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Stream Dataset:</span>
                <span className="text-teal-400 font-bold">
                  {selectedItem.type === 'actual' ? 'Elexon FUELHH (WIND)' : 'Elexon WINDFOR'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Start Time (UTC):</span>
                <span className="text-white">{selectedItem.startTime}</span>
              </div>
              {selectedItem.publishTime && (
                <div className="flex justify-between py-1 border-b border-[#1E2638]">
                  <span className="text-slate-400">Publish Vintage:</span>
                  <span className="text-sky-400">{selectedItem.publishTime}</span>
                </div>
              )}
              {selectedItem.settlementPeriod && (
                <div className="flex justify-between py-1 border-b border-[#1E2638]">
                  <span className="text-slate-400">Settlement Period:</span>
                  <span className="text-slate-200">Period {selectedItem.settlementPeriod}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Generation Volume:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(selectedItem.generation).toLocaleString()} MW
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 rounded-lg bg-[#161D2A] hover:bg-[#1C2536] border border-[#2A364E] text-slate-200 font-mono text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
