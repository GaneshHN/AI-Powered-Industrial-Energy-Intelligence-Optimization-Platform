import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  Cpu,
  AlertTriangle,
  Clock,
  Zap,
  Wrench,
  Activity,
  Layers,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { Machine, MachineStatus } from '../../types';

export const MachineMonitoringView: React.FC = () => {
  const {
    machines,
    selectedMachineId,
    setSelectedMachineId,
    updateMachineStatus,
    anomalies,
    setCurrentRoute,
    setSelectedAnomalyId
  } = useFactory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Machine>('currentPowerKw');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Machine for Detail Drawer
  const activeMachine = useMemo(() => {
    return machines.find(m => m.id === selectedMachineId) || null;
  }, [machines, selectedMachineId]);

  // Associated anomalies for the selected machine
  const machineAnomalies = useMemo(() => {
    if (!activeMachine) return [];
    return anomalies.filter(a => a.machineId === activeMachine.id);
  }, [activeMachine, anomalies]);

  // Unique production lines
  const uniqueLines = useMemo(() => {
    return Array.from(new Set(machines.map(m => m.line)));
  }, [machines]);

  // Filtered & Sorted Machines
  const filteredMachines = useMemo(() => {
    return machines
      .filter(m => {
        const matchesSearch =
          m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.line.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        const matchesLine = lineFilter === 'all' || m.line === lineFilter;
        return matchesSearch && matchesStatus && matchesLine;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [machines, searchQuery, statusFilter, lineFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage);
  const paginatedMachines = filteredMachines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof Machine) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Machine Fleet & Asset Telemetry"
        subtitle="Individual equipment power draws, utilization metrics, thermal health, and runtime audits"
        metaInfo={[
          `Total Monitored Nodes: ${machines.length}`,
          `Running: ${machines.filter(m => m.status === 'running').length}`,
          `Warning: ${machines.filter(m => m.status === 'warning').length}`,
          `Offline: ${machines.filter(m => m.status === 'down').length}`
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Machine ID, Name, or Production Line..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-[#F4F6F8] border border-slate-200 rounded-xs focus:outline-hidden focus:border-[#2563A6] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'running', 'idle', 'warning', 'down'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#14283F] text-white font-semibold'
                    : 'bg-[#F4F6F8] text-slate-600 hover:bg-[#EDF1F4]'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Line Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[#687684] shrink-0 font-medium">Production Line:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => {
                setLineFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 text-[11px] rounded-xs font-medium ${
                lineFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Lines
            </button>
            {uniqueLines.map(line => (
              <button
                key={line}
                onClick={() => {
                  setLineFilter(line);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 text-[11px] rounded-xs font-medium ${
                  lineFilter === line
                    ? 'bg-[#2563A6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {line.split('—')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Machine Fleet Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Machine ID</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900"
                >
                  Equipment Name
                </th>
                <th className="py-2.5 px-3 font-semibold">Production Line</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th
                  onClick={() => handleSort('currentPowerKw')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Current Power</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('energyTodayKwh')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Energy (24h)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('utilizationPct')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Utilization</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-right">Runtime / Idle</th>
                <th className="py-2.5 px-3 font-semibold">Maintenance</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMachines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                    No machine matches the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    onClick={() => setSelectedMachineId(machine.id)}
                    className={`hover:bg-[#F4F6F8] cursor-pointer transition-colors ${
                      selectedMachineId === machine.id ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {machine.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {machine.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                      {machine.line}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={machine.status} />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-900 font-semibold">
                      {machine.currentPowerKw.toFixed(1)} kW
                      <span className="block text-[10px] text-slate-400">
                        Rated: {machine.ratedPowerKw} kW
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-900 font-semibold">
                      {machine.energyTodayKwh.toLocaleString()} kWh
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-700">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{machine.utilizationPct}%</span>
                        <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              machine.utilizationPct > 80 ? 'bg-[#24845A]' : 'bg-[#D99125]'
                            }`}
                            style={{ width: `${machine.utilizationPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right tabular-nums text-slate-600 text-[11px]">
                      {machine.runtimeHours}h / {machine.idleHours}h
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      <span
                        className={
                          machine.maintenanceStatus === 'overdue'
                            ? 'text-rose-600 font-bold'
                            : machine.maintenanceStatus === 'in_progress'
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-600'
                        }
                      >
                        {machine.maintenanceStatus === 'overdue'
                          ? `Overdue (${Math.abs(machine.daysToNextMaintenance)}d)`
                          : machine.maintenanceStatus === 'in_progress'
                          ? 'In Progress'
                          : `Due in ${machine.daysToNextMaintenance}d`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMachineId(machine.id);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#2563A6] hover:bg-blue-50 rounded-xs transition-colors"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-[#F4F6F8] text-xs text-[#687684]">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredMachines.length)} of{' '}
            {filteredMachines.length} machines
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2 py-1 bg-white border border-slate-200 rounded-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-[11px]">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2 py-1 bg-white border border-slate-200 rounded-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Machine Detail Modal / Drawer */}
      {activeMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14283F]/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xs shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#14283F] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-[#2563A6] text-white rounded-xs flex items-center justify-center font-mono font-bold text-xs">
                  {activeMachine.id.split('-')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white font-mono">
                      {activeMachine.id}
                    </h2>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-200">{activeMachine.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    {activeMachine.line}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMachineId(null)}
                className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Telemetry Gauge Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Active Power</span>
                  <div className="text-lg font-bold text-[#1C2834] font-mono tabular-nums">
                    {activeMachine.currentPowerKw.toFixed(1)} <span className="text-xs text-slate-500">kW</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Rated: {activeMachine.ratedPowerKw} kW
                  </span>
                </div>

                <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Power Factor</span>
                  <div className="text-lg font-bold text-[#1C2834] font-mono tabular-nums">
                    {activeMachine.powerFactor.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    cos φ (Goal: 0.95)
                  </span>
                </div>

                <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Temperature</span>
                  <div className="text-lg font-bold text-[#1C2834] font-mono tabular-nums">
                    {activeMachine.temperatureC.toFixed(1)} <span className="text-xs text-slate-500">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max Safe: 70°C
                  </span>
                </div>

                <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Vibration Peak</span>
                  <div className="text-lg font-bold text-[#1C2834] font-mono tabular-nums">
                    {activeMachine.vibrationMmS.toFixed(1)} <span className="text-xs text-slate-500">mm/s</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ISO 10816 Zone B
                  </span>
                </div>
              </div>

              {/* Operational & Production Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#F4F6F8] rounded-xs border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1">
                    Operational Status & Duty Cycle
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current State:</span>
                      <StatusBadge status={activeMachine.status} />
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Utilization:</span>
                      <span className="font-bold text-slate-900">{activeMachine.utilizationPct}%</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Runtime Today:</span>
                      <span>{activeMachine.runtimeHours} hrs</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Idle Time Today:</span>
                      <span className="text-amber-700 font-bold">{activeMachine.idleHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F4F6F8] rounded-xs border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1">
                    Production & Energy Intensity
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Today's Cumulative Energy:</span>
                      <span className="font-bold text-slate-900">{activeMachine.energyTodayKwh.toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Hourly Throughput:</span>
                      <span>{activeMachine.hourlyOutputUnits} units/hr</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Specific Energy Intensity:</span>
                      <span className="font-bold text-[#2563A6]">{activeMachine.specificEnergyKwhPerUnit} kWh/unit</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500 font-sans">Maintenance Cycle:</span>
                      <span>{activeMachine.daysToNextMaintenance} days remaining</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Associated Anomalies */}
              <div className="p-3 bg-white border border-slate-200 rounded-xs space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs flex items-center justify-between">
                  <span>Associated Telemetry Anomalies ({machineAnomalies.length})</span>
                  {activeMachine.lastAnomaly && (
                    <span className="text-[11px] font-mono text-rose-600 font-medium">
                      Latest: {activeMachine.lastAnomaly}
                    </span>
                  )}
                </h4>

                {machineAnomalies.length === 0 ? (
                  <div className="p-3 bg-[#F4F6F8] text-slate-500 text-center rounded-xs text-[11px]">
                    No open anomaly alarms detected on this equipment. Operating within nominal tolerance.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {machineAnomalies.map(anom => (
                      <div
                        key={anom.id}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xs flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                            <span className="text-rose-600">{anom.id}</span>
                            <span>·</span>
                            <span className="font-sans font-medium">{anom.category}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{anom.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAnomalyId(anom.id);
                            setSelectedMachineId(null);
                            setCurrentRoute('anomalies');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#2563A6] hover:bg-blue-50 border border-[#2563A6]/20 rounded-xs shrink-0 ml-3"
                        >
                          Investigate RCA →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Operational Status Override for Operators */}
              <div className="p-3 bg-slate-100 rounded-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Manual Machine State Command:
                </span>
                <div className="flex items-center gap-1">
                  {(['running', 'idle', 'warning', 'down'] as MachineStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateMachineStatus(activeMachine.id, st)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-xs capitalize transition-colors ${
                        activeMachine.status === st
                          ? 'bg-[#14283F] text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#F4F6F8] border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Telemetry Node ID: MODBUS-TCP-PORT-502-LINE-{activeMachine.id}
              </span>
              <button
                onClick={() => setSelectedMachineId(null)}
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
