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
  const navSections = [
    {
      label: 'Analytics & Desk',
      items: [
        { name: 'Executive Overview', path: '/', icon: LayoutDashboard },
        { name: 'Forecast Explorer', path: '/forecast-explorer', icon: Compass },
        { name: 'Forecast Accuracy', path: '/accuracy', icon: Activity },
        { name: 'Decision Replay', path: '/decision-replay', icon: History },
      ],
    },
    {
      label: 'Audit & Transparency',
      items: [
        { name: 'Data Explorer', path: '/data-explorer', icon: Database },
        { name: 'Methodology & Math', path: '/methodology', icon: BookOpen },
      ],
    },
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
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-[#0C1017] border-r border-[#1E2638] flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#161D2A] border border-[#2A364E] flex items-center justify-center text-teal-400">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white font-mono">
                  WINDWISE
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                  GB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Power Forecast Intelligence</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            aria-label="Close Navigation Menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] lg:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Market Context Pill */}
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-[#111620] border border-[#1E2638] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-slate-300">UK Day-Ahead</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">JAN 2026</span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                {section.label}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#182130] text-white border-l-2 border-teal-400 font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-teal-400' : 'text-slate-500'
                          }`}
                        />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Status & Desk Info */}
        <div className="p-3 border-t border-[#1E2638] space-y-2.5 bg-[#0A0D13]">
          {/* Elexon Data Status */}
          <div className="p-2 rounded-lg bg-[#111620] border border-[#1E2638] text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                Elexon BMRS Stream
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {dataSourceStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              FUELHH (WIND) & WINDFOR
            </p>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#161D2A] border border-[#2A364E] flex items-center justify-center text-slate-300">
                <User className="w-3 h-3" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-medium text-slate-300 leading-none">UK Power Desk</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Procurement Analyst</p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-500 bg-[#111620] px-1.5 py-0.5 rounded border border-[#1E2638]">
              v1.2
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
