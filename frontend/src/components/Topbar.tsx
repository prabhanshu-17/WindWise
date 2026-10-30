import React from 'react';
import { RefreshCw, Calendar, Bell, Database, Radio } from 'lucide-react';

interface TopbarProps {
  pageTitle: string;
  lastRefresh?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  lastRefresh,
  onRefresh,
  isRefreshing = false
}) => {
  const formattedRefresh = lastRefresh
    ? new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live SQLite Sync';

  return (
    <header className="h-16 bg-wind-sidebar/95 backdrop-blur border-b border-wind-border fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between">
      {/* Title & Context */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-wind-textPrimary tracking-tight">{pageTitle}</h2>
          <div className="flex items-center gap-2 text-xs text-wind-textSecondary">
            <span>GB Electricity Wholesale</span>
            <span>•</span>
            <span className="text-wind-accent flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3" />
              January 1 – 31, 2026
            </span>
          </div>
        </div>
      </div>

      {/* Topbar Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Connection Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-wind-card border border-wind-border text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wind-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-wind-accent"></span>
          </span>
          <span className="text-wind-textSecondary">BMRS Feed:</span>
          <span className="font-medium text-wind-textPrimary">Stream Synced</span>
        </div>

        {/* Last Refresh Timestamp */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wind-card/50 border border-wind-border/60 text-xs text-wind-textSecondary">
          <Database className="w-3.5 h-3.5 text-wind-accentBlue" />
          <span>Last Sync:</span>
          <span className="font-mono text-wind-textPrimary font-medium">{formattedRefresh}</span>
        </div>

        {/* Refresh Action Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Elexon data feed"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-wind-card hover:bg-wind-cardSecondary border border-wind-border hover:border-wind-accent/40 text-xs font-medium text-wind-textPrimary transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-wind-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          title="Platform Alerts"
          className="relative p-2 rounded-lg bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-wind-accent" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-wind-accent to-wind-accentBlue p-[1.5px] cursor-pointer">
          <div className="w-full h-full rounded-full bg-wind-sidebar flex items-center justify-center text-xs font-bold text-wind-accent">
            WW
          </div>
        </div>
      </div>
    </header>
  );
};
