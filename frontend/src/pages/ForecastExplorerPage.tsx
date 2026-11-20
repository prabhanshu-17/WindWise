import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Clock,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
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
  Legend,
  ReferenceLine
} from 'recharts';
import { fetchForecastExplorer, getExportUrl } from '../services/api';
import { ForecastExplorerData, TimeSeriesInterval } from '../types';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/LoadingSkeleton';
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

  // Filter and sort intervals for table
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
    showToast(`Loaded forecasts for ${d}`, 'info');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <Compass className="w-5 sm:w-6 h-5 sm:h-6 text-wind-accent" />
            Forecast Explorer
          </h1>
          <p className="text-xs text-wind-textSecondary mt-0.5 sm:mt-1">
            Explore available wind generation forecasts by delivery interval and publication time.
          </p>
        </div>

        <a
          href={getExportUrl('forecasts', '2026-01')}
          download="windwise_forecasts_2026-01.csv"
          onClick={() => showToast('Downloading forecasts CSV export...', 'info')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-xs font-semibold text-wind-textPrimary transition-all shadow-sm self-start sm:self-auto active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-wind-accent" />
          <span>Export Forecasts CSV</span>
        </a>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-wind-card border border-wind-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date & Vintage Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Delivery Date Picker */}
          <div className="flex items-center gap-2 bg-wind-sidebar px-3 py-1.5 rounded-xl border border-wind-border">
            <Calendar className="w-3.5 h-3.5 text-wind-accent shrink-0" />
            <span className="text-xs font-semibold text-wind-textSecondary">Date:</span>
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
              className="bg-transparent text-xs font-mono text-wind-textPrimary focus:outline-none cursor-pointer"
            />
          </div>

          {/* Vintage Selector */}
          {data && data.availableVintages && data.availableVintages.length > 0 && (
            <div className="flex items-center gap-2 bg-wind-sidebar px-3 py-1.5 rounded-xl border border-wind-border max-w-full">
              <Layers className="w-3.5 h-3.5 text-wind-accentBlue shrink-0" />
              <span className="text-xs font-semibold text-wind-textSecondary shrink-0">Run:</span>
              <select
                value={selectedVintage}
                onChange={(e) => {
                  setSelectedVintage(e.target.value);
                  setCutoffTime('');
                  setCurrentPage(1);
                  showToast('Updated forecast vintage run', 'info');
                }}
                className="bg-transparent text-xs font-mono text-wind-textPrimary focus:outline-none max-w-[200px] truncate cursor-pointer"
              >
                <option value="" className="bg-[#101827]">Latest Eligible Vintage</option>
                {data.availableVintages.map((v) => (
                  <option key={v} value={v} className="bg-[#101827]">
                    {v.replace('T', ' ').replace('Z', ' UTC')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Day Presets with horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
          <span className="text-[11px] text-wind-textSecondary mr-1 shrink-0">Presets:</span>
          {['2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25'].map((d) => (
            <button
              key={d}
              onClick={() => handleDatePreset(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 active:scale-95 ${
                deliveryDate === d
                  ? 'bg-wind-accent/20 text-wind-accent border border-wind-accent/40 font-bold shadow-sm'
                  : 'bg-wind-sidebar border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary'
              }`}
            >
              Jan {d.split('-')[2]}
            </button>
          ))}
        </div>
      </div>

      {/* PROMINENT CARD: Selected Forecast Vintage */}
      {data && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-wind-card to-wind-cardSecondary border border-wind-border shadow-card grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-wind-textSecondary">Publication Time</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-wind-accent mt-0.5 truncate">
              {data.vintageStats.selectedVintageLocal || 'Latest Run'}
            </p>
            <span className="text-[10px] text-wind-textSecondary/70 font-mono truncate block">
              {data.vintageStats.selectedVintage || 'System Default'}
            </span>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-wind-textSecondary">Target Delivery</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-wind-textPrimary mt-0.5">
              {data.selectedDeliveryDate}
            </p>
            <span className="text-[10px] text-wind-textSecondary">24 Delivery Hours</span>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-wind-textSecondary">Peak Forecast</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-sky-400 mt-0.5">
              {data.vintageStats.maxForecastMW ? `${Math.round(data.vintageStats.maxForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Maximum generation</span>
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-wind-textSecondary">Mean Forecast</span>
            <p className="text-xs sm:text-sm font-bold font-mono text-wind-textPrimary mt-0.5">
              {data.vintageStats.avgForecastMW ? `${Math.round(data.vintageStats.avgForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Day average</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase text-wind-textSecondary">Data Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                {data.vintageStats.availabilityStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHART: Forecast Profile across Selected Delivery Day */}
      {data && (
        <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary">
                Wind Generation Forecast: {data.selectedDeliveryDate}
              </h3>
              <p className="text-xs text-wind-textSecondary">
                Eligible forecast generation trajectory across 24 delivery hours (MW)
              </p>
            </div>

            {/* Line Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForecastLine(!showForecastLine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  showForecastLine
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-wind-textSecondary opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Forecast</span>
                {showForecastLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setShowActualLine(!showActualLine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  showActualLine
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-wind-textSecondary opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
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
                        <div className="p-3 rounded-xl bg-wind-card border border-wind-border shadow-2xl text-xs space-y-1 min-w-[190px]">
                          <p className="font-bold text-wind-textPrimary border-b border-wind-border/60 pb-1">
                            Delivery Hour: {label}
                          </p>
                          {showForecastLine && (
                            <div className="text-wind-accentBlue flex justify-between">
                              <span>Forecast MW:</span>
                              <span className="font-mono font-bold">{item.forecast ? `${Math.round(item.forecast).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {showActualLine && (
                            <div className="text-wind-accent flex justify-between">
                              <span>Actual MW:</span>
                              <span className="font-mono font-bold">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                            </div>
                          )}
                          {item.error !== null && (
                            <div className="text-amber-400 flex justify-between font-bold pt-1 border-t border-wind-border/40">
                              <span>Error:</span>
                              <span className="font-mono">{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
                          <div className="text-[10px] text-wind-textSecondary pt-0.5">
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
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#38BDF8' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Outturn (FUELHH)"
                    stroke="#35D399"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 2, fill: '#35D399' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DETAILED FORECAST INTERVALS TABLE */}
      <div className="p-4 sm:p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-wind-textPrimary">Delivery Interval Forecast Audit</h3>
            <p className="text-xs text-wind-textSecondary">
              Breakdown of delivery time vs publication time (Tap row for full details)
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-wind-textSecondary absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search intervals..."
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

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden text-[11px] text-wind-textSecondary flex items-center justify-between px-1">
          <span>Tap row to inspect</span>
          <span className="font-mono text-wind-accent">Swipe left/right →</span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-wind-border/80">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('startTime')}
                  className="py-3 px-4 cursor-pointer hover:text-wind-textPrimary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Delivery Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('publishTime')}
                  className="py-3 px-4 cursor-pointer hover:text-wind-textPrimary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Publish Time (Vintage)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('forecastGeneration')}
                  className="py-3 px-4 cursor-pointer hover:text-wind-textPrimary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Forecast (MW)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('forecastAgeHours')}
                  className="py-3 px-4 cursor-pointer hover:text-wind-textPrimary transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Forecast Age</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wind-border/60">
              {paginatedIntervals.length > 0 ? (
                paginatedIntervals.map((row) => (
                  <tr
                    key={row.startTime}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-wind-cardSecondary/60 transition-colors cursor-pointer active:bg-wind-accent/10"
                  >
                    <td className="py-2.5 px-4 font-mono font-medium text-wind-textPrimary">
                      {row.deliveryTimeLocal}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-wind-textSecondary">
                      {row.publishTimeLocal || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-400">
                      {row.forecastGeneration ? `${Math.round(row.forecastGeneration).toLocaleString()} MW` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-wind-textSecondary">
                      {row.forecastAgeHours !== null ? `${row.forecastAgeHours.toFixed(1)} hrs` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Eligible
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-wind-textSecondary">
                    No forecast intervals matched the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-wind-textSecondary pt-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredIntervals.length)} of {filteredIntervals.length} intervals
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

      {/* Row Inspection Modal / Popover on tap */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-wind-card border border-wind-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-wind-border">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-wind-accent" />
                <h4 className="text-sm font-bold text-wind-textPrimary">Interval Inspection</h4>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded-lg text-wind-textSecondary hover:text-wind-textPrimary hover:bg-wind-cardSecondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Delivery Time (Local):</span>
                <span className="font-mono font-bold text-wind-textPrimary">{selectedRow.deliveryTimeLocal}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Publish Vintage (Local):</span>
                <span className="font-mono text-wind-accent">{selectedRow.publishTimeLocal || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Forecast Generation:</span>
                <span className="font-mono font-bold text-sky-400">
                  {selectedRow.forecastGeneration ? `${Math.round(selectedRow.forecastGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-wind-border/40">
                <span className="text-wind-textSecondary">Actual Outturn:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedRow.actualGeneration ? `${Math.round(selectedRow.actualGeneration).toLocaleString()} MW` : '—'}
                </span>
              </div>
              {selectedRow.error !== null && (
                <div className="flex justify-between py-1 border-b border-wind-border/40">
                  <span className="text-wind-textSecondary">Deviation / Error:</span>
                  <span className={`font-mono font-bold ${selectedRow.error > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {selectedRow.error > 0 ? `+${Math.round(selectedRow.error)}` : Math.round(selectedRow.error)} MW
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-wind-textSecondary">Forecast Lead Age:</span>
                <span className="font-mono text-wind-textPrimary">
                  {selectedRow.forecastAgeHours !== null ? `${selectedRow.forecastAgeHours.toFixed(1)} hours before delivery` : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRow(null)}
              className="w-full py-2 rounded-xl bg-wind-accent text-slate-900 font-bold text-xs hover:bg-wind-accent/90 transition-colors shadow-glow-green"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
