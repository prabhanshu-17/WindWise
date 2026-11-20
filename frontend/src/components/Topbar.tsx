import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Calendar, Bell, Database, Menu, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from './Toast';

interface TopbarProps {
  pageTitle: string;
  lastRefresh?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'warning';
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  lastRefresh,
  onRefresh,
  isRefreshing = false,
  onToggleMobileMenu
}) => {
  const { showToast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'BMRS WINDFOR Synced',
      message: '744 hourly forecasts validated for January 1–31, 2026.',
      time: 'Just now',
      unread: true,
      type: 'success',
    },
    {
      id: '2',
      title: 'Look-Ahead Bias Protected',
      message: 'Day-ahead cutoffs strictly enforced against future data leak.',
      time: '12m ago',
      unread: true,
      type: 'info',
    },
    {
      id: '3',
      title: 'FUELHH Settlement Audit',
      message: '1,488 half-hour settlement periods verified with 0 nulls.',
      time: '1h ago',
      unread: false,
      type: 'info',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read', 'info');
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      showToast('Initiating Elexon BMRS data sync...', 'info');
      onRefresh();
    }
  };

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const formattedRefresh = lastRefresh
    ? new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live SQLite Sync';

  return (
    <header className="h-16 bg-wind-sidebar/95 backdrop-blur-md border-b border-wind-border fixed top-0 right-0 left-0 lg:left-64 z-20 px-3.5 sm:px-6 md:px-8 flex items-center justify-between transition-all duration-300">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Menu"
          className="p-2 -ml-1 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary lg:hidden transition-colors active:scale-95"
        >
          <Menu className="w-4 h-4 text-wind-accent" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-wind-textPrimary tracking-tight truncate">
            {pageTitle}
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-wind-textSecondary">
            <span className="hidden sm:inline">GB Wholesale</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-wind-accent flex items-center gap-1 font-medium truncate">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Jan 1 – 31, 2026</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Connection Status Badge (Tablet / Desktop) */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-wind-card border border-wind-border text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wind-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-wind-accent"></span>
          </span>
          <span className="text-wind-textSecondary">BMRS:</span>
          <span className="font-medium text-wind-textPrimary">Live</span>
        </div>

        {/* Last Refresh Timestamp (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-wind-card/50 border border-wind-border/60 text-xs text-wind-textSecondary">
          <Database className="w-3.5 h-3.5 text-wind-accentBlue" />
          <span>Last Sync:</span>
          <span className="font-mono text-wind-textPrimary font-medium">{formattedRefresh}</span>
        </div>

        {/* Refresh Action Button */}
        {onRefresh && (
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Refresh Elexon data feed"
            aria-label="Refresh Elexon data feed"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border hover:border-wind-accent/40 text-xs font-semibold text-wind-textPrimary transition-all duration-200 disabled:opacity-50 active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-wind-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        )}

        {/* Interactive Notification Bell & Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Platform Alerts"
            aria-label="Platform Alerts"
            className="relative p-2 rounded-xl bg-wind-card hover:bg-wind-cardSecondary border border-wind-border text-wind-textSecondary hover:text-wind-textPrimary transition-colors active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wind-accent ring-2 ring-wind-sidebar" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-88 p-3 rounded-2xl bg-wind-card border border-wind-border shadow-2xl z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-wind-border/70">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-wind-textPrimary">Platform Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-wind-accent/20 text-wind-accent font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-wind-accent hover:underline font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-xs transition-colors ${
                      item.unread
                        ? 'bg-wind-cardSecondary border-wind-accent/30'
                        : 'bg-wind-sidebar/50 border-wind-border/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-wind-textPrimary">
                        {item.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : item.type === 'warning' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-wind-textSecondary shrink-0 font-mono">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-wind-textSecondary mt-1 leading-relaxed pl-5">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Desk Avatar */}
        <div
          title="UK Power Desk – Procurement Analyst"
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-wind-accent to-wind-accentBlue p-[1.5px] cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-[10px] bg-wind-sidebar flex items-center justify-center text-xs font-bold text-wind-accent">
            WW
          </div>
        </div>
      </div>
    </header>
  );
};
