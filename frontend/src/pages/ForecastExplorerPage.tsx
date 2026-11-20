import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Layers,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { fetchForecastExplorer, getExportUrl } from '../services/api';
import { ForecastExplorerData, TimeSeriesInterval } from '../types';
import { LoadingSkeleton, ErrorState } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const ForecastExplorerPage: React.FC = () => {
  const { showToast } = useToast();
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-01-15');
  const [selectedVintage, setSelectedVintage] = useState<string>('');
  const [cutoffTime, setCutoffTime] = useState<string>('');
  const [data, setData] = useState<ForecastExplorerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Table State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof TimeSeriesInterval>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRow, setSelectedRow] = useState<TimeSeriesInterval | null>(null);
  const pageSize = 12;

  // Chart line visibility
  const [showForecastLine, setShowForecastLine] = useState(true);
  const [showActualLine, setShowActualLine] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchForecastExplorer(
        deliveryDate,
        cutoffTime ? cutoffTime : undefined,
        selectedVintage ? selectedVintage : undefined
      );
      setData(res);
      if (!selectedVintage && res.selectedVintageTime) {
        setSelectedVintage(res.selectedVintageTime);
      }
    } catch (err: any) {
      console.error('Error fetching forecast explorer:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deliveryDate, cutoffTime, selectedVintage]);

  if (loading && !data) return <LoadingSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={loadData} />;

  const intervals = data ? data.intervals : [];
  const filteredIntervals = intervals.filter((row) => {
    const timeStr = row.deliveryTimeLocal.toLowerCase();
    const pubStr = (row.publishTimeLocal || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return timeStr.includes(query) || pubStr.includes(query);
  });

  filteredIntervals.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === null || valA === undefined) return sortOrder === 'asc' ? 1 : -1;
    if (valB === null || valB === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredIntervals.length / pageSize) || 1;
  const paginatedIntervals = filteredIntervals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof TimeSeriesInterval) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDatePreset = (d: string) => {
    setDeliveryDate(d);
    setSelectedVintage('');
    setCurrentPage(1);
    showToast(`Loaded ${d}`, 'info');
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            Forecast Explorer & Vintage Run Audit
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit available wind generation forecast vintages across National Grid ESO publication runs
          </p>
        </div>

        <a
          href={getExportUrl('forecasts', '2026-01')}
          download="windwise_forecasts_2026-01.csv"
          onClick={() => showToast('Exporting forecasts CSV...', 'info')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161D2A] hover:bg-[#1E2638] border border-[#2A364E] text-xs font-medium text-slate-200 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Export Forecasts CSV</span>
        </a>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-3 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date & Vintage Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Delivery Date Picker */}
          <div className="flex items-center gap-2 bg-[#0C1017] px-2.5 py-1.5 rounded-lg border border-[#1E2638]">
            <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400">Date:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                setSelectedVintage('');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Vintage Selector */}
          {data && data.availableVintages && data.availableVintages.length > 0 && (
            <div className="flex items-center gap-2 bg-[#0C1017] px-2.5 py-1.5 rounded-lg border border-[#1E2638] max-w-full">
              <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-400 shrink-0">Vintage:</span>
              <select
                value={selectedVintage}
                onChange={(e) => {
                  setSelectedVintage(e.target.value);
                  setCutoffTime('');
                  setCurrentPage(1);
                  showToast('Vintage run updated', 'info');
                }}
                className="bg-transparent text-xs font-mono text-white focus:outline-none max-w-[210px] truncate cursor-pointer"
              >
                <option value="" className="bg-[#0C1017]">Latest Eligible Run</option>
                {data.availableVintages.map((v) => (
                  <option key={v} value={v} className="bg-[#0C1017]">
                    {v.replace('T', ' ').replace('Z', ' UTC')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
          <span className="text-[11px] font-mono text-slate-500 mr-1 shrink-0">Presets:</span>
          {['2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25'].map((d) => (
            <button
              key={d}
              onClick={() => handleDatePreset(d)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors shrink-0 ${
                deliveryDate === d
                  ? 'bg-[#1C2536] text-white font-semibold border border-[#2A364E]'
                  : 'bg-[#0C1017] border border-[#1E2638] text-slate-400 hover:text-white'
              }`}
            >
              Jan {d.split('-')[2]}
            </button>
          ))}
        </div>
      </div>

      {/* SELECTED VINTAGE SUMMARY CARD */}
      {data && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-500">Publication Vintage</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-teal-400 truncate">
              {data.vintageStats.selectedVintageLocal || 'Latest Available'}
            </p>
            <span className="text-[10px] text-slate-500 font-mono truncate block">
              {data.vintageStats.selectedVintage || 'System Run'}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-500">Target Delivery Day</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-white">
              {data.selectedDeliveryDate}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">24 Delivery Hours</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-500">Peak Forecast</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-sky-400">
              {data.vintageStats.maxForecastMW ? `${Math.round(data.vintageStats.maxForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Day Maximum</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-500">Mean Forecast</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-white">
              {data.vintageStats.avgForecastMW ? `${Math.round(data.vintageStats.avgForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Day Mean Volume</span>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-500">Verification</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono font-medium text-emerald-400">
                {data.vintageStats.availabilityStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FORECAST TRAJECTORY CHART */}
      {data && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Wind Generation Forecast: {data.selectedDeliveryDate}
              </h3>
              <p className="text-[11px] text-slate-400">
                Selected model run forecast profile across 24 delivery hours (MW)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForecastLine(!showForecastLine)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showForecastLine
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-xs bg-sky-400" />
                <span>Forecast</span>
                {showForecastLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowActualLine(!showActualLine)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showActualLine
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                <span>Actual</span>
                {showActualLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.intervals.map((i) => ({
                  time: i.deliveryTimeLocal.split(' ')[1] || i.deliveryTimeLocal,
                  forecast: i.forecastGeneration,
                  actual: i.actualGeneration,
                  error: i.error,
                  age: i.forecastAgeHours,
                  publishTimeLocal: i.publishTimeLocal,
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2333" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg bg-[#111620] border border-[#1E2638] shadow-dropdown text-xs space-y-1 min-w-[190px]">
                          <p className="font-mono font-bold text-white border-b border-[#1E2638] pb-1">
                            Delivery Hour: {label}
                          </p>
                          {showForecastLine && (
                            <div className="text-sky-400 flex justify-between">
                              <span>Forecast MW:</span>
                              <span className="font-mono font-bold">{item.forecast ? `${Math.round(item.forecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showActualLine && (
                            <div className="text-emerald-400 flex justify-between">
                              <span>Actual MW:</span>
                              <span className="font-mono font-bold">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {item.error !== null && (
                            <div className="text-amber-400 flex justify-between font-bold pt-1 border-t border-[#1E2638]">
                              <span>Error:</span>
                              <span className="font-mono">{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                            Published: {item.publishTimeLocal || '—'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showForecastLine && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Selected Forecast (WINDFOR)"
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#0284C7' }}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Outturn (FUELHH)"
                    stroke="#10B981"
                    strokeWidth={1.8}
                    strokeDasharray="3 3"
                    dot={{ r: 2, fill: '#10B981' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLE AUDIT */}
      <div className="p-4 rounded-xl bg-[#111620] border border-[#1E2638] shadow-card space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Delivery Hour Audit Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">
              Detailed intervals for {deliveryDate} (Click row to inspect record details)
            </p>
          </div>

          <div className="w-full sm:w-60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search interval..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0C1017] border border-[#1E2638] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#1E2638]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0C1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2638] font-mono">
              <tr>
                <th
                  onClick={() => handleSort('startTime')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Delivery Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('publishTime')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Publish Vintage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('forecastGeneration')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Forecast (MW)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('forecastAgeHours')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-white transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Lead Age</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/60 font-mono">
              {paginatedIntervals.length > 0 ? (
                paginatedIntervals.map((row) => (
                  <tr
                    key={row.startTime}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-[#161D2A] transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-3.5 font-medium text-slate-200">
                      {row.deliveryTimeLocal}
                    </td>
                    <td className="py-2 px-3.5 text-slate-400">
                      {row.publishTimeLocal || '—'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-sky-400 tabular-nums">
                      {row.forecastGeneration ? `${Math.round(row.forecastGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2 px-3.5 text-right text-slate-400 tabular-nums">
                      {row.forecastAgeHours !== null ? `${row.forecastAgeHours.toFixed(1)} hrs` : '—'}
                    </td>
                    <td className="py-2 px-3.5 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Eligible
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No forecast records match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-400 pt-1 font-mono">
          <span>
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredIntervals.length)} of {filteredIntervals.length} intervals
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
      {selectedRow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111620] border border-[#1E2638] rounded-xl max-w-md w-full p-4 space-y-3.5 shadow-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Interval Audit Record</h4>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#161D2A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Delivery Interval:</span>
                <span className="text-white font-bold">{selectedRow.deliveryTimeLocal}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Publication Time:</span>
                <span className="text-teal-400">{selectedRow.publishTimeLocal || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Forecast MW:</span>
                <span className="font-bold text-sky-400">
                  {selectedRow.forecastGeneration ? `${Math.round(selectedRow.forecastGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1E2638]">
                <span className="text-slate-400">Actual Outturn:</span>
                <span className="font-bold text-emerald-400">
                  {selectedRow.actualGeneration ? `${Math.round(selectedRow.actualGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              {selectedRow.error !== null && (
                <div className="flex justify-between py-1 border-b border-[#1E2638]">
                  <span className="text-slate-400">Forecast Error:</span>
                  <span className={`font-bold ${selectedRow.error > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {selectedRow.error > 0 ? `+${Math.round(selectedRow.error)}` : Math.round(selectedRow.error)} MW
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Forecast Lead Age:</span>
                <span className="text-slate-200">
                  {selectedRow.forecastAgeHours !== null ? `${selectedRow.forecastAgeHours.toFixed(1)} hours before delivery` : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRow(null)}
              className="w-full py-2 rounded-lg bg-[#161D2A] hover:bg-[#1C2536] border border-[#2A364E] text-slate-200 font-mono text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
