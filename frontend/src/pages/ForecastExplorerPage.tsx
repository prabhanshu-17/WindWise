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
  ChevronRight
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

export const ForecastExplorerPage: React.FC = () => {
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
  const pageSize = 12;

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-wind-border">
        <div>
          <h1 className="text-2xl font-extrabold text-wind-textPrimary tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-wind-accent" />
            Forecast Explorer
          </h1>
          <p className="text-xs text-wind-textSecondary mt-1">
            Explore available wind generation forecasts by delivery interval and publication time.
          </p>
        </div>

        <a
          href={getExportUrl('forecasts', '2026-01')}
          download="windwise_forecasts_2026-01.csv"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-xs font-semibold text-wind-textPrimary transition-all shadow-sm self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-wind-accent" />
          <span>Export Forecasts CSV</span>
        </a>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-4 rounded-2xl bg-wind-card border border-wind-border shadow-card flex flex-wrap items-center gap-4">
        {/* Delivery Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-wind-accent" />
          <span className="text-xs font-semibold text-wind-textSecondary">Delivery Date:</span>
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-wind-sidebar border border-wind-border text-xs font-mono text-wind-textPrimary focus:outline-none focus:border-wind-accent"
          />
        </div>

        {/* Vintage Selector */}
        {data && data.availableVintages && data.availableVintages.length > 0 && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-wind-accentBlue" />
            <span className="text-xs font-semibold text-wind-textSecondary">Forecast Vintage:</span>
            <select
              value={selectedVintage}
              onChange={(e) => {
                setSelectedVintage(e.target.value);
                setCutoffTime(''); // Reset custom cutoff
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-wind-sidebar border border-wind-border text-xs font-mono text-wind-textPrimary focus:outline-none focus:border-wind-accent max-w-xs"
            >
              <option value="">Latest Eligible Vintage</option>
              {data.availableVintages.map((v) => (
                <option key={v} value={v}>
                  {v.replace('T', ' ').replace('Z', ' UTC')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Day Presets */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-wind-textSecondary mr-1">Presets:</span>
          {['2026-01-05', '2026-01-10', '2026-01-15', '2026-01-20', '2026-01-25'].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDeliveryDate(d);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                deliveryDate === d
                  ? 'bg-wind-accent/20 text-wind-accent border border-wind-accent/40 font-bold'
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
        <div className="p-5 rounded-2xl bg-gradient-to-r from-wind-card to-wind-cardSecondary border border-wind-border shadow-card grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase text-wind-textSecondary">Publication Time</span>
            <p className="text-sm font-bold font-mono text-wind-accent mt-0.5 truncate">
              {data.vintageStats.selectedVintageLocal || 'Latest Available Run'}
            </p>
            <span className="text-[10px] text-wind-textSecondary/70 font-mono">
              {data.vintageStats.selectedVintage || 'System Default'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-wind-textSecondary">Target Delivery</span>
            <p className="text-sm font-bold font-mono text-wind-textPrimary mt-0.5">
              {data.selectedDeliveryDate}
            </p>
            <span className="text-[10px] text-wind-textSecondary">24 Delivery Hours</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-wind-textSecondary">Peak Forecast</span>
            <p className="text-sm font-bold font-mono text-sky-400 mt-0.5">
              {data.vintageStats.maxForecastMW ? `${Math.round(data.vintageStats.maxForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Maximum generation</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-wind-textSecondary">Mean Forecast</span>
            <p className="text-sm font-bold font-mono text-wind-textPrimary mt-0.5">
              {data.vintageStats.avgForecastMW ? `${Math.round(data.vintageStats.avgForecastMW).toLocaleString()} MW` : '—'}
            </p>
            <span className="text-[10px] text-wind-textSecondary">Day average</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-wind-textSecondary">Data Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                {data.vintageStats.availabilityStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHART: Forecast Profile across Selected Delivery Day */}
      {data && (
        <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-wind-textPrimary">
                Wind Generation Forecast: {data.selectedDeliveryDate}
              </h3>
              <p className="text-xs text-wind-textSecondary">
                Eligible forecast generation trajectory across 24 delivery hours (MW)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-wind-accentBlue">
                <span className="w-3 h-0.5 bg-wind-accentBlue rounded-full" />
                Selected Forecast (WINDFOR)
              </span>
              <span className="flex items-center gap-1.5 text-wind-accent">
                <span className="w-3 h-0.5 bg-wind-accent rounded-full" />
                Actual Delivery (FUELHH)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
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
                margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
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
                        <div className="p-3 rounded-xl bg-wind-card border border-wind-border shadow-2xl text-xs space-y-1 min-w-[200px]">
                          <p className="font-bold text-wind-textPrimary border-b border-wind-border/60 pb-1">
                            Delivery Interval: {label}
                          </p>
                          <div className="text-wind-accentBlue flex justify-between">
                            <span>Forecast MW:</span>
                            <span className="font-mono font-bold">{item.forecast ? `${Math.round(item.forecast).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          <div className="text-wind-accent flex justify-between">
                            <span>Actual MW:</span>
                            <span className="font-mono font-bold">{item.actual ? `${Math.round(item.actual).toLocaleString()} MW` : 'N/A'}</span>
                          </div>
                          {item.error !== null && (
                            <div className="text-amber-400 flex justify-between font-bold pt-1 border-t border-wind-border/40">
                              <span>Error:</span>
                              <span className="font-mono">{item.error > 0 ? `+${Math.round(item.error)}` : Math.round(item.error)} MW</span>
                            </div>
                          )}
                          <div className="text-[10px] text-wind-textSecondary pt-1">
                            Published: {item.publishTimeLocal || '—'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#35D399"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#35D399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DETAILED FORECAST INTERVALS TABLE */}
      <div className="p-6 rounded-2xl bg-wind-card border border-wind-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-wind-textPrimary">Delivery Interval Forecast Audit</h3>
            <p className="text-xs text-wind-textSecondary">
              Detailed breakdown of delivery time versus publication time and forecast age
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-wind-textSecondary absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search interval or vintage..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-wind-sidebar border border-wind-border text-xs text-wind-textPrimary placeholder:text-wind-textSecondary/50 focus:outline-none focus:border-wind-accent w-56"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-wind-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-wind-sidebar/90 text-wind-textSecondary uppercase text-[10px] tracking-wider border-b border-wind-border font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('startTime')}
                  className="py-3 px-4 cursor-pointer hover:text-wind-textPrimary transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Delivery Date & Time</span>
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
                    <span>Forecast Generation (MW)</span>
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
                  <tr key={row.startTime} className="hover:bg-wind-cardSecondary/40 transition-colors">
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
        <div className="flex items-center justify-between text-xs text-wind-textSecondary pt-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredIntervals.length)} of {filteredIntervals.length} intervals
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

