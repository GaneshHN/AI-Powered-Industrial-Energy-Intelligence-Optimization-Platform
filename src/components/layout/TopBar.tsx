import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Building2,
  Calendar,
  Clock,
  RefreshCw,
  Bell,
  User,
  ChevronDown,
  Check,
  AlertTriangle,
  ExternalLink,
  LogOut,
  Radio
} from 'lucide-react';
import { useFactory, DateRange, AppRoute } from '../../context/FactoryContext';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  collapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu, collapsed }) => {
  const {
    factories,
    selectedFactoryId,
    setSelectedFactoryId,
    currentFactory,
    dateRange,
    setDateRange,
    selectedShift,
    setSelectedShift,
    isLiveTelemetry,
    setIsLiveTelemetry,
    lastTelemetryTimestamp,
    triggerManualRefresh,
    alerts,
    userSession,
    setCurrentRoute,
    logoutUser
  } = useFactory();

  const [factoryMenuOpen, setFactoryMenuOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [shiftMenuOpen, setShiftMenuOpen] = useState(false);
  const [alertsMenuOpen, setAlertsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const factoryRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (factoryRef.current && !factoryRef.current.contains(e.target as Node)) {
        setFactoryMenuOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateMenuOpen(false);
      }
      if (shiftRef.current && !shiftRef.current.contains(e.target as Node)) {
        setShiftMenuOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const dateOptions: { id: DateRange; label: string }[] = [
    { id: 'today', label: 'Today (Live)' },
    { id: 'yesterday', label: 'Yesterday (Audit)' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'monthToDate', label: 'Month-to-Date (Billing)' }
  ];

  const shiftOptions = [
    { id: 'all', label: 'All Shifts (24h)' },
    { id: 'SHIFT-A', label: 'Shift A (06:00 - 14:00)' },
    { id: 'SHIFT-B', label: 'Shift B (14:00 - 22:00)' },
    { id: 'SHIFT-C', label: 'Shift C (22:00 - 06:00)' }
  ];

  const activeAlerts = alerts.filter(a => !a.isResolved);

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#EDF1F4] bg-white px-4 transition-all duration-200 ${
        collapsed ? 'lg:pl-22' : 'lg:pl-68'
      }`}
    >
      {/* Left Zone: Hamburger + Factory Context Dropdown */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Factory Selector */}
        <div className="relative" ref={factoryRef}>
          <button
            onClick={() => setFactoryMenuOpen(!factoryMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-[#14283F] bg-[#F4F6F8] hover:bg-[#EDF1F4] border border-slate-200 rounded-xs transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-[#2563A6] shrink-0" />
            <span className="max-w-[200px] sm:max-w-[280px] truncate text-left">
              {currentFactory.name}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-white px-1 border border-slate-200 rounded-xs">
              {currentFactory.code}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
          </button>

          {factoryMenuOpen && (
            <div className="absolute left-0 mt-1 w-80 bg-white border border-slate-200 shadow-md rounded-xs py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Select Manufacturing Facility
              </div>
              {factories.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => {
                    setSelectedFactoryId(fac.id);
                    setFactoryMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F4F6F8] transition-colors ${
                    fac.id === selectedFactoryId ? 'bg-blue-50/60 font-semibold text-[#2563A6]' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate font-medium">{fac.name}</div>
                    <div className="text-[11px] text-slate-500">{fac.location}</div>
                  </div>
                  {fac.id === selectedFactoryId && (
                    <Check className="h-3.5 w-3.5 text-[#2563A6] shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center / Context Filters Zone (Desktop) */}
      <div className="hidden md:flex items-center gap-2">
        {/* Date Filter */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setDateMenuOpen(!dateMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-[#F4F6F8] border border-slate-200 rounded-xs transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>{dateOptions.find(d => d.id === dateRange)?.label}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-md rounded-xs py-1 z-50">
              {dateOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setDateRange(option.id);
                    setDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F4F6F8] ${
                    dateRange === option.id ? 'font-semibold text-[#2563A6] bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {dateRange === option.id && <Check className="h-3.5 w-3.5 text-[#2563A6]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shift Filter */}
        <div className="relative" ref={shiftRef}>
          <button
            onClick={() => setShiftMenuOpen(!shiftMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-[#F4F6F8] border border-slate-200 rounded-xs transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{shiftOptions.find(s => s.id === selectedShift)?.label}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {shiftMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 shadow-md rounded-xs py-1 z-50">
              {shiftOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedShift(option.id);
                    setShiftMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F4F6F8] ${
                    selectedShift === option.id ? 'font-semibold text-[#2563A6] bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {selectedShift === option.id && <Check className="h-3.5 w-3.5 text-[#2563A6]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Zone: System Telemetry Indicator + Notifications + User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Telemetry Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${
                isLiveTelemetry ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden xl:inline">SYNC:</span>
            <span className="text-slate-700 font-medium tabular-nums">{lastTelemetryTimestamp}</span>
          </div>
          <button
            onClick={triggerManualRefresh}
            title="Poll metering nodes"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xs transition-colors"
            aria-label="Refresh telemetry data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setAlertsMenuOpen(!alertsMenuOpen)}
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-[#F4F6F8] rounded-xs transition-colors"
            aria-label="View system alerts"
          >
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
            )}
          </button>

          {alertsMenuOpen && (
            <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white border border-slate-200 shadow-lg rounded-xs py-2 z-50">
              <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-800">
                  Active Alerts ({activeAlerts.length})
                </div>
                <button
                  onClick={() => {
                    setCurrentRoute('alerts');
                    setAlertsMenuOpen(false);
                  }}
                  className="text-[11px] font-medium text-[#2563A6] hover:underline"
                >
                  Alert Center
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {activeAlerts.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-500">
                    No unresolved alerts. Operating within nominal thresholds.
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setCurrentRoute('alerts');
                        setAlertsMenuOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-[#F4F6F8] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <AlertTriangle
                            className={`h-3 w-3 ${
                              alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-500'
                            }`}
                          />
                          {alert.machineId}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-700 hover:text-slate-900"
          >
            <div className="h-7 w-7 rounded-full bg-[#14283F] text-white flex items-center justify-center font-bold text-xs">
              {userSession.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-[#1C2834] leading-tight truncate max-w-[130px]">
                {userSession.name}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[130px]">
                {userSession.role}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 shadow-md rounded-xs py-2 z-50">
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900">{userSession.name}</div>
                <div className="text-[11px] text-slate-500">{userSession.email}</div>
                <div className="text-[10px] font-mono text-[#2563A6] mt-0.5">{userSession.role}</div>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setCurrentRoute('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F4F6F8] flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Profile & Threshold Settings</span>
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logoutUser();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
