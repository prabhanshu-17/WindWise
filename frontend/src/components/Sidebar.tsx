import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Activity,
  History,
  Database,
  BookOpen,
  Wind,
  ShieldCheck,
  User,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  dataSourceStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  dataSourceStatus = 'Connected'
}) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Forecast Explorer', path: '/forecast-explorer', icon: Compass },
    { name: 'Forecast Accuracy', path: '/accuracy', icon: Activity },
    { name: 'Decision Replay', path: '/decision-replay', icon: History },
    { name: 'Data Explorer', path: '/data-explorer', icon: Database },
    { name: 'Methodology', path: '/methodology', icon: BookOpen },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-wind-sidebar border-r border-wind-border flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-wind-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wind-accent/20 to-wind-accentBlue/20 border border-wind-accent/40 flex items-center justify-center text-wind-accent shadow-glow-green">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-wind-textPrimary flex items-center gap-1.5">
                WINDWISE
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-wind-accent/15 text-wind-accent border border-wind-accent/30">
                  PRO
                </span>
              </h1>
              <p className="text-xs text-wind-textSecondary">Renewable Intelligence</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Close Navigation Menu"
            className="p-2 rounded-lg text-wind-textSecondary hover:text-wind-textPrimary hover:bg-wind-card lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Evaluation Period Banner */}
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-wind-card border border-wind-border/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-wind-textSecondary">
            <span className="w-2 h-2 rounded-full bg-wind-accent animate-ping" />
            <span className="font-medium text-wind-textPrimary">UK Wholesale Day-Ahead</span>
          </div>
          <span className="text-[11px] font-mono text-wind-accent font-semibold">JAN 2026</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-wind-textSecondary/70">
            Analytics & Trading
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group active:scale-[0.98] ${
                    isActive
                      ? 'bg-gradient-to-r from-wind-accent/15 to-transparent text-wind-accent border-l-2 border-wind-accent font-semibold shadow-sm'
                      : 'text-wind-textSecondary hover:text-wind-textPrimary hover:bg-wind-card/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-wind-accent' : 'text-wind-textSecondary group-hover:text-wind-textPrimary'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Status & User Panel */}
        <div className="p-4 border-t border-wind-border space-y-3 bg-wind-sidebar/60">
          {/* Data Source Status */}
          <div className="p-2.5 rounded-lg bg-wind-card/80 border border-wind-border text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-wind-textSecondary text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-wind-accent" />
                Elexon BMRS Stream
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {dataSourceStatus}
              </span>
            </div>
            <p className="text-[11px] text-wind-textSecondary/80 font-mono truncate">
              FUELHH (WIND) & WINDFOR
            </p>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-wind-cardSecondary border border-wind-border flex items-center justify-center text-wind-accent">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-wind-textPrimary leading-none">UK Power Desk</p>
                <p className="text-[10px] text-wind-textSecondary mt-0.5">Procurement Analyst</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-wind-textSecondary bg-wind-card px-1.5 py-0.5 rounded border border-wind-border">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
