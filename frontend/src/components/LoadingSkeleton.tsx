import React from 'react';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-wind-card border border-wind-border p-4 space-y-3">
            <div className="h-4 bg-wind-cardSecondary rounded w-2/3" />
            <div className="h-8 bg-wind-cardSecondary rounded w-1/2" />
            <div className="h-3 bg-wind-cardSecondary rounded w-4/5" />
          </div>
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <div className="h-96 rounded-2xl bg-wind-card border border-wind-border p-6 space-y-4">
        <div className="h-5 bg-wind-cardSecondary rounded w-1/4" />
        <div className="h-full bg-wind-cardSecondary/50 rounded-xl" />
      </div>

      {/* Secondary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-wind-card border border-wind-border p-4" />
        <div className="h-64 rounded-2xl bg-wind-card border border-wind-border p-4" />
      </div>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Failed to Load Intelligence Data',
  message = 'Unable to connect to the backend API or Elexon data service. Please verify server connectivity and retry.',
  onRetry
}) => {
  return (
    <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center max-w-lg mx-auto my-12 shadow-card">
      <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-wind-textPrimary mb-2">{title}</h3>
      <p className="text-xs text-wind-textSecondary leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wind-card border border-wind-border hover:border-wind-accent text-xs font-semibold text-wind-textPrimary transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-wind-accent" />
          Retry Connection
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
}> = ({
  title = 'No Records Found',
  message = 'No forecast or actual generation data matched the selected filter criteria.'
}) => {
  return (
    <div className="p-10 rounded-2xl bg-wind-card border border-wind-border text-center max-w-md mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-wind-cardSecondary border border-wind-border text-wind-textSecondary flex items-center justify-center mx-auto mb-4">
        <Database className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-wind-textPrimary mb-1">{title}</h3>
      <p className="text-xs text-wind-textSecondary">{message}</p>
    </div>
  );
};
