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
      title: 'BMRS Stream Verified',
      message: '744 hourly forecasts validated for Jan 1–31, 2026.',
      time: 'Just now',
      unread: true,
      type: 'success',
    },
    {
      id: '2',
      title: 'Look-Ahead Filter Active',
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
    showToast('Alerts marked as read', 'info');
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      showToast('Syncing with Elexon BMRS stream...', 'info');
      onRefresh();
    }
  };

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
    : 'Live Sync';

  return (
    <header className="h-14 bg-[#0C1017]/95 backdrop-blur-md border-b border-[#1E2638] fixed top-0 right-0 left-0 lg:left-64 z-20 px-3.5 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Menu"
          className="p-1.5 -ml-1 rounded-lg bg-[#111620] hover:bg-[#161D2A] border border-[#1E2638] text-slate-400 hover:text-white lg:hidden transition-colors"
        >
          <Menu className="w-4 h-4 text-teal-400" />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <span className="hidden md:inline text-xs font-mono text-slate-500">WINDWISE /</span>
          <h2 className="text-sm font-semibold text-white tracking-tight truncate">
            {pageTitle}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-[#111620] px-2 py-0.5 rounded border border-[#1E2638]">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Jan 2026</span>
          </span>
        </div>
      </div>

      {/* Right: Desk Controls & Status */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Market Stream Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#111620] border border-[#1E2638] text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-slate-400">BMRS Stream:</span>
          <span className="text-[11px] font-mono font-medium text-slate-200">Active</span>
        </div>

        {/* Last Sync */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111620]/60 border border-[#1E2638] text-[11px] text-slate-400">
          <Database className="w-3 h-3 text-slate-500" />
          <span>Synced:</span>
          <span className="font-mono text-slate-300 font-medium">{formattedRefresh}</span>
        </div>

        {/* Sync Button */}
        {onRefresh && (
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Refresh Elexon data feed"
            aria-label="Refresh Elexon data feed"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161D2A] hover:bg-[#1E2638] border border-[#2A364E] text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="System Alerts"
            aria-label="System Alerts"
            className="relative p-1.5 rounded-lg bg-[#111620] hover:bg-[#161D2A] border border-[#1E2638] text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-400" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 p-3 rounded-xl bg-[#111620] border border-[#1E2638] shadow-dropdown z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E2638]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">Desk Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-teal-500/10 text-teal-400 font-mono">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-teal-400 hover:underline font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border text-xs ${
                      item.unread
                        ? 'bg-[#161D2A] border-[#2A364E]'
                        : 'bg-[#0D121A] border-[#1E2638] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {item.type === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : item.type === 'warning' ? (
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-3 h-3 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed pl-4.5">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desk ID Pill */}
        <div className="px-2 py-1 rounded bg-[#111620] border border-[#1E2638] flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>GB-DESK-01</span>
        </div>
      </div>
    </header>
  );
};
