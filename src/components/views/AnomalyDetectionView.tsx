import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  X,
  Clock,
  Zap,
  CheckCircle2,
  FileSearch,
  ChevronRight,
  ShieldAlert,
  Flame,
  Activity
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { Anomaly, AnomalySeverity, AnomalyStatus } from '../../types';

export const AnomalyDetectionView: React.FC = () => {
  const {
    anomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    updateAnomalyStatus,
    setSelectedRcaId,
    setCurrentRoute
  } = useFactory();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeAnomaly = anomalies.find(a => a.id === selectedAnomalyId) || null;

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleOpenRca = (anomaly: Anomaly) => {
    // Map anomaly to RCA case
    if (anomaly.id === 'ANOM-2026-0412') {
      setSelectedRcaId('RCA-2026-009');
    } else {
      setSelectedRcaId('RCA-2026-008');
    }
    setCurrentRoute('root-cause');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Industrial Anomaly Detection & Telemetry Deviations"
        subtitle="Automated statistical baseline divergence, idle runaway detection, and motor overheating alarms"
        metaInfo={[
          `Total Anomalies: ${anomalies.length}`,
          `Critical / High: ${anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length}`,
          `Unresolved: ${anomalies.filter(a => a.status === 'open' || a.status === 'investigating').length}`,
          `Engine: Isolation Forest + Dynamic Exponential Moving Average`
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search anomalies by ID, machine, or fault category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-[#F4F6F8] border border-slate-200 rounded-xs focus:outline-hidden focus:border-[#2563A6] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-xs capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            {['all', 'open', 'investigating', 'resolved'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-xs capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Anomaly Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Anomaly ID</th>
                <th className="py-2.5 px-3 font-semibold">Machine Node</th>
                <th className="py-2.5 px-3 font-semibold">Detection Time</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold text-right">Expected</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actual Measured</th>
                <th className="py-2.5 px-3 font-semibold text-right">Deviation</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                    No anomalies found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAnomalies.map((anomaly) => (
                  <tr
                    key={anomaly.id}
                    onClick={() => setSelectedAnomalyId(anomaly.id)}
                    className={`hover:bg-[#F4F6F8] cursor-pointer transition-colors ${
                      selectedAnomalyId === anomaly.id ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {anomaly.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <div>{anomaly.machineId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{anomaly.line}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {anomaly.detectedAt}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {anomaly.category}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-500">
                      {anomaly.expectedKw.toFixed(1)} kW
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-900 font-bold">
                      {anomaly.actualKw.toFixed(1)} kW
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums font-bold">
                      <span className={anomaly.deviationPct > 50 ? 'text-[#C94A45]' : 'text-[#D99125]'}>
                        +{anomaly.deviationPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={anomaly.severity} type="severity" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={anomaly.status} type="lifecycle" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnomalyId(anomaly.id);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#2563A6] hover:bg-blue-50 rounded-xs transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Anomaly Drawer / Modal */}
      {activeAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14283F]/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xs shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#14283F] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-[#C94A45] text-white rounded-xs flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white font-mono">
                      {activeAnomaly.id}
                    </h2>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-200 font-semibold">{activeAnomaly.category}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    Detected on {activeAnomaly.machineId} ({activeAnomaly.machineName})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAnomalyId(null)}
                className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Divergence Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F4F6F8] rounded-xs border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-sans">Baseline Expected</span>
                  <div className="text-base font-bold text-slate-700 tabular-nums">
                    {activeAnomaly.expectedKw.toFixed(1)} kW
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-sans">Actual Telemetry</span>
                  <div className="text-base font-bold text-rose-600 tabular-nums">
                    {activeAnomaly.actualKw.toFixed(1)} kW
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-sans">Surge Variance</span>
                  <div className="text-base font-bold text-rose-700 tabular-nums">
                    +{activeAnomaly.deviationPct}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block font-sans">Detection Stamp</span>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {activeAnomaly.detectedAt}
                  </div>
                </div>
              </div>

              {/* Description & Operating Conditions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs">
                  Anomaly Signature & Context
                </h4>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs text-slate-700 text-xs leading-relaxed">
                  {activeAnomaly.description}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  <span className="font-semibold text-slate-700 font-sans">Operating Conditions:</span>{' '}
                  {activeAnomaly.operatingConditions}
                </div>
              </div>

              {/* Multi-Sensor Evidence Matrix */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs flex items-center justify-between">
                  <span>Available Physical & Electrical Evidence</span>
                  <span className="text-[10px] font-mono text-slate-400">SENSOR VALIDATED</span>
                </h4>

                <div className="border border-slate-200 rounded-xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F6F8] text-[#687684] text-[10px] font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Telemetry Parameter</th>
                        <th className="py-1.5 px-3">Measured Reading</th>
                        <th className="py-1.5 px-3">Nominal Threshold</th>
                        <th className="py-1.5 px-3">Evidence Nature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {activeAnomaly.evidence.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800 font-sans">
                            {ev.label}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {ev.value}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {ev.threshold}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded-xs ${
                                ev.nature === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ev.nature === 'Observed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ev.nature}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Investigation Status Triage Control */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Triage Status:</span>
                  <div className="flex items-center gap-1">
                    {(['open', 'investigating', 'resolved', 'dismissed'] as AnomalyStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateAnomalyStatus(activeAnomaly.id, st)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-xs capitalize transition-colors ${
                          activeAnomaly.status === st
                            ? 'bg-[#14283F] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action: Direct Bridge to Root Cause Analysis */}
                <button
                  onClick={() => handleOpenRca(activeAnomaly)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563A6] hover:bg-[#1E528B] rounded-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  <span>Open Deep Root Cause Investigation (RCA) →</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#F4F6F8] border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Assigned Anomaly Hash: SHA256-ANOM-{activeAnomaly.id}
              </span>
              <button
                onClick={() => setSelectedAnomalyId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
