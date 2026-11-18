import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Cpu,
  TrendingUp,
  AlertTriangle,
  SearchCode,
  Layers,
  CalendarClock,
  Sparkles,
  CheckCircle,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useFactory, AppRoute } from '../../context/FactoryContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentRoute, setCurrentRoute, alerts, recommendations } = useFactory();

  const activeAlertsCount = alerts.filter(a => !a.isResolved).length;
  const pendingRecsCount = recommendations.filter(r => r.status === 'new').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'energy', label: 'Energy Intelligence', icon: Zap },
    { id: 'machines', label: 'Machine Monitoring', icon: Cpu },
    { id: 'forecast', label: 'Energy Forecast', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: activeAlertsCount },
    { id: 'root-cause', label: 'Root Cause Analysis', icon: SearchCode },
    { id: 'digital-twin', label: 'Digital Twin', icon: Layers },
    { id: 'optimization', label: 'Production Optimization', icon: CalendarClock },
    { id: 'copilot', label: 'AI Energy Copilot', icon: Sparkles },
    { id: 'recommendations', label: 'Recommendations', icon: CheckCircle, badge: pendingRecsCount },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (route: AppRoute) => {
    setCurrentRoute(route);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#14283F]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#14283F] text-slate-300 transition-all duration-200 ease-in-out border-r border-[#202B36] ${
          collapsed ? 'w-18' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Geometric industrial logo glyph */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#2563A6] text-white shadow-xs font-mono font-bold text-sm tracking-wider">
              EP
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-white tracking-tight leading-tight truncate">
                  EnerPilot
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase truncate">
                  Industrial OS
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors text-left group ${
                  isActive
                    ? 'bg-[#2563A6] text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-[#202B36] hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 tracking-normal">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'anomalies' || item.id === 'alerts'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="sr-only">({item.badge} notifications)</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Industrial Pilot Badge / Status Footer */}
        <div className="p-3 border-t border-slate-700/60 bg-[#0F1E30] shrink-0 text-slate-400 text-[11px]">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">EDGE GATEWAY</span>
                <span className="text-emerald-400 font-semibold">NOMINAL</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Yuva Yodha Energy Tech 2026
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="Edge Gateway: Nominal">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
