import axios from 'axios';
import {
  OverviewData,
  ForecastExplorerData,
  AccuracyAnalysisData,
  DecisionReplayData,
  DataQualityData,
  ActualRecord,
  ForecastRecord
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

export const fetchOverview = async (month: string = '2026-01', cutoff?: string): Promise<OverviewData> => {
  const params: Record<string, string> = { month };
  if (cutoff) params.cutoff = cutoff;
  const res = await api.get<OverviewData>('/overview', { params });
  return res.data;
};

export const fetchForecastExplorer = async (
  deliveryDate: string = '2026-01-15',
  cutoff?: string,
  vintage?: string
): Promise<ForecastExplorerData> => {
  const params: Record<string, string> = { delivery_date: deliveryDate };
  if (cutoff) params.cutoff = cutoff;
  if (vintage) params.vintage = vintage;
  const res = await api.get<ForecastExplorerData>('/forecasts/explorer', { params });
  return res.data;
};

export const fetchAccuracy = async (month: string = '2026-01', cutoff?: string): Promise<AccuracyAnalysisData> => {
  const params: Record<string, string> = { month };
  if (cutoff) params.cutoff = cutoff;
  const res = await api.get<AccuracyAnalysisData>('/accuracy', { params });
  return res.data;
};

export const fetchDecisionReplay = async (
  deliveryDate: string = '2026-01-15',
  cutoff: string = '2026-01-14T10:00:00Z'
): Promise<DecisionReplayData> => {
  const res = await api.get<DecisionReplayData>('/decision-replay', {
    params: { delivery_date: deliveryDate, cutoff }
  });
  return res.data;
};

export const fetchDataQuality = async (month: string = '2026-01'): Promise<DataQualityData> => {
  const res = await api.get<DataQualityData>('/data-quality', { params: { month } });
  return res.data;
};

export const fetchActuals = async (startDate?: string, endDate?: string): Promise<ActualRecord[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await api.get<ActualRecord[]>('/actuals', { params });
  return res.data;
};

export const fetchForecasts = async (startDate?: string, endDate?: string, cutoff?: string): Promise<ForecastRecord[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (cutoff) params.cutoff = cutoff;
  const res = await api.get<ForecastRecord[]>('/forecasts', { params });
  return res.data;
};

export const triggerSync = async (): Promise<{ status: string; message: string }> => {
  const res = await api.post('/sync');
  return res.data;
};

export const getExportUrl = (dataset: string = 'accuracy', month: string = '2026-01', cutoff?: string): string => {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  let url = `${base}/export?dataset=${dataset}&month=${month}`;
  if (cutoff) url += `&cutoff=${encodeURIComponent(cutoff)}`;
  return url;
};

export default api;
