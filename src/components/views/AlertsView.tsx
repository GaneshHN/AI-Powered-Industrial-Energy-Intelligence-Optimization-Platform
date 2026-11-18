import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ShieldAlert,
  Clock,
  ArrowRight,
  Check,
  FileSearch,
  Cpu
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { AlertItem } from '../../types';

export const AlertsView: React.FC = () => {
  const {
    alerts,
    resolveAlert,
    setSelectedAnomalyId,
    setCurrentRoute,
    setSelectedMachineId,
    showNotification
  } = useFactory();

  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(a => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'active'
        ? !a.isResolved
        : a.isResolved;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesSearch =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSeverity && matchesSearch;
  });

  const activeCount = alerts.filter(a => !a.isResolved).length;
  const resolvedCount = alerts.filter(a => a.isResolved).length;

  const handleEscalateToRca = (alert: AlertItem) => {
    if (alert.machineId === 'COMP-AIR-01') {
      setSelectedAnomalyId('ANOM-2026-0412');
    } else {
      setSelectedAnomalyId('ANOM-2026-0410');
    }
    setCurrentRoute('anomalies');
    showNotification(`Escalated alert ${alert.id} to Anomaly & RCA investigation matrix.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Industrial Alert Center & Fault Management"
        subtitle="Centralized operational triage for electrical anomalies, peak demand breaches, and telemetry drift"
        metaInfo={[
          `Unresolved Alarms: ${activeCount}`,
          `Resolved Alarms: ${resolvedCount}`,
          `Notification Protocol: Push via Edge Broker & SCADA`
        ]}
      />

      {/* Tabs and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs">
        {/* Active vs Resolved Tabs */}
        <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Alarms ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'resolved'
                ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved Log ({resolvedCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Historical ({alerts.length})
          </button>
        </div>

        {/* Severity Filter + Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F4F6F8] border border-slate-200 rounded-xs focus:outline-hidden focus:border-[#2563A6] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            {['all', 'critical', 'warning', 'info'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 text-[11px] font-medium rounded-xs capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Structured Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Alert ID</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold">Equipment Node</th>
                <th className="py-2.5 px-3 font-semibold">Alert Category</th>
                <th className="py-2.5 px-3 font-semibold">Description & Impact</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Status / Sign-off</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    No alerts in this view. Factory operating within nominal envelope.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {alert.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={alert.severity} type="severity" />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <div
                        onClick={() => {
                          setSelectedMachineId(alert.machineId);
                          setCurrentRoute('machines');
                        }}
                        className="font-mono font-semibold text-[#2563A6] hover:underline cursor-pointer"
                      >
                        {alert.machineId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{alert.machineName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {alert.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md leading-relaxed text-[11px]">
                      {alert.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {alert.timestamp}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {alert.isResolved ? (
                        <div className="text-emerald-700 font-medium">
                          <span>Resolved</span>
                          {alert.acknowledgedBy && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              By {alert.acknowledgedBy}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-bold font-mono">
                          ACTIVE UNRESOLVED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEscalateToRca(alert)}
                          className="px-2 py-1 text-[11px] font-semibold text-[#2563A6] hover:bg-blue-50 border border-slate-200 rounded-xs transition-colors"
                        >
                          RCA →
                        </button>
                        {!alert.isResolved && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xs transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
