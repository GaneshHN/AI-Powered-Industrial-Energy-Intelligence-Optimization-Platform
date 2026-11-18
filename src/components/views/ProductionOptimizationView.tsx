import React, { useState } from 'react';
import {
  CalendarClock,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Layers,
  Zap,
  Sliders,
  RotateCcw,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';
import { PRODUCTION_SCHEDULE } from '../../data/mockIndustrialData';
import { ProductionScheduleItem } from '../../types';

export const ProductionOptimizationView: React.FC = () => {
  const {
    productionSchedule,
    applyOptimizedSchedule,
    showNotification,
    currentFactory
  } = useFactory();

  const [isSolving, setIsSolving] = useState(false);
  const [solverResultReady, setSolverResultReady] = useState(true);
  const [scheduleView, setScheduleView] = useState<'both' | 'current' | 'optimized'>('both');

  const currentTasks = productionSchedule.filter(s => !s.isOptimized);
  const optimizedTasks = productionSchedule.filter(s => s.isOptimized);

  const handleRunOptimizer = () => {
    setIsSolving(true);
    setTimeout(() => {
      setIsSolving(false);
      setSolverResultReady(true);
      showNotification('Mixed-Integer Linear Programming (MILP) solver found optimal schedule in 1.4s.');
    }, 1200);
  };

  const handleApplyToMes = () => {
    applyOptimizedSchedule();
  };

  // 24-hour visual block helper
  const hourBlocks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Production Scheduling & Energy-Aware Optimization"
        subtitle="Mixed-Integer Linear Programming (MILP) solver optimizing equipment dispatch against Time-of-Use tariffs"
        metaInfo={[
          `Solver: CBC / HiGHS Linear Optimizer`,
          `Constraint State: 100% Target Feasible`,
          `Peak Avoidance Window: 18:00 - 22:00 IST`,
          `Status: Optimal Solution Found`
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              disabled={isSolving}
              onClick={handleRunOptimizer}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Play className="h-3.5 w-3.5 text-[#2563A6] fill-current" />
              <span>{isSolving ? 'Solving Constraints...' : 'Run MILP Optimizer'}</span>
            </button>
            <button
              onClick={handleApplyToMes}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#24845A] hover:bg-[#1E6B48] rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Deploy Schedule to Plant MES</span>
            </button>
          </div>
        }
      />

      {/* Optimization Impact Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Projected Daily Energy Saving"
          value="1,330"
          unit="kWh"
          comparison={{
            value: "-7.2%",
            trend: "down",
            isFavorable: true,
            periodLabel: "vs Current Dispatch"
          }}
          sublabel="Idle loss & thermal efficiency"
        />

        <MetricCard
          label="Peak Demand Reduction"
          value="240"
          unit="kW"
          comparison={{
            value: "1,140 kW",
            trend: "down",
            isFavorable: true,
            periodLabel: "Safe inside 1,250 kW Limit"
          }}
          sublabel="Zero contract penalty breach"
        />

        <MetricCard
          label="Estimated Tariff Cost Savings"
          value="₹28,760"
          unit="INR / Day"
          comparison={{
            value: "₹8.62 Lakhs/mo",
            trend: "down",
            isFavorable: true,
            periodLabel: "Annual: ₹1.03 Cr"
          }}
          sublabel="MSEDCL ToU Peak Arbitrage"
        />

        <MetricCard
          label="Production Target Status"
          value="1,200 / 1,200"
          unit="Units"
          comparison={{
            value: "100%",
            trend: "neutral",
            isFavorable: true,
            periodLabel: "Zero Delivery Delay"
          }}
          sublabel="Takt Time & Buffer Maintained"
        />
      </div>

      {/* Schedule Mode Switcher */}
      <div className="flex items-center justify-between p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#14283F]">Schedule Timeline View:</span>
          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            <button
              onClick={() => setScheduleView('both')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                scheduleView === 'both' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Side-by-Side Comparison
            </button>
            <button
              onClick={() => setScheduleView('current')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                scheduleView === 'current' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              As-Is Current Dispatch
            </button>
            <button
              onClick={() => setScheduleView('optimized')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                scheduleView === 'optimized' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Recommended Optimized Plan
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 bg-blue-500 rounded-xs" /> Normal Tariff (₹8.40)
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 bg-amber-500 rounded-xs" /> Peak Tariff (₹11.40)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-xs" /> Off-Peak Night (₹5.60)
          </span>
        </div>
      </div>

      {/* Gantt Timeline Visualizer across 24h Window */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              24-Hour Production Dispatch Gantt Chart
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Highlighted Shaded Band (18:00 - 22:00) represents high-cost peak window to be avoided.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Horizon: 06:00 (Today) → 06:00 (Tomorrow)
          </span>
        </div>

        {/* Hour Header Bar */}
        <div className="grid grid-cols-24 gap-0 text-center font-mono text-[10px] text-slate-400 border-b border-slate-200 pb-1">
          {hourBlocks.map((h) => {
            const isPeak = h >= 18 && h < 22;
            return (
              <div
                key={h}
                className={`py-0.5 truncate ${
                  isPeak ? 'bg-amber-100/70 text-amber-900 font-bold' : ''
                }`}
              >
                {h.toString().padStart(2, '0')}
              </div>
            );
          })}
        </div>

        {/* Task Rows */}
        <div className="space-y-3 pt-1">
          {/* Section: As-Is Schedule */}
          {(scheduleView === 'both' || scheduleView === 'current') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-[#F4F6F8] px-3 py-1.5 rounded-xs">
                <span>Current Schedule (Suboptimal Peak Exposure)</span>
                <span className="text-rose-600 font-mono text-[11px]">Incurs ₹38,400 Peak Surcharges</span>
              </div>

              {currentTasks.map((task) => {
                const startHour = parseInt(task.startTime.split(':')[0]);
                const duration = task.durationHours;
                const leftPct = (startHour / 24) * 100;
                const widthPct = (duration / 24) * 100;

                return (
                  <div key={task.id} className="relative h-9 bg-slate-50 border border-slate-200 rounded-xs overflow-hidden flex items-center">
                    {/* Peak background watermark */}
                    <div className="absolute top-0 bottom-0 left-[75%] w-[16.66%] bg-amber-50/70 border-x border-amber-200 pointer-events-none" />

                    <div
                      className={`absolute h-7 rounded-xs px-2 flex items-center justify-between text-[11px] font-mono shadow-xs truncate cursor-pointer transition-all ${
                        task.tariffZone === 'Peak'
                          ? 'bg-[#C94A45] text-white hover:brightness-110'
                          : 'bg-[#14283F] text-slate-100 hover:brightness-110'
                      }`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${task.machineName}: ${task.taskName} (${task.startTime} - ${task.endTime})`}
                    >
                      <span className="truncate font-semibold">{task.machineId}: {task.taskName}</span>
                      <span className="text-[10px] opacity-90 hidden sm:inline ml-2">{task.avgPowerKw}kW</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Optimized Schedule */}
          {(scheduleView === 'both' || scheduleView === 'optimized') && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#24845A] bg-emerald-50 px-3 py-1.5 rounded-xs border border-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Recommended Optimized Schedule (Peak Shaved to Off-Peak Window)
                </span>
                <span className="font-mono text-[11px] text-[#24845A]">Save ₹28,760 / Day</span>
              </div>

              {optimizedTasks.map((task) => {
                const startHour = parseInt(task.startTime.split(':')[0]);
                const duration = task.durationHours;
                const leftPct = (startHour / 24) * 100;
                const widthPct = (duration / 24) * 100;

                return (
                  <div key={task.id} className="relative h-9 bg-slate-50 border border-emerald-200 rounded-xs overflow-hidden flex items-center">
                    {/* Peak background watermark */}
                    <div className="absolute top-0 bottom-0 left-[75%] w-[16.66%] bg-amber-50/70 border-x border-amber-200 pointer-events-none" />

                    <div
                      className="absolute h-7 bg-[#24845A] text-white rounded-xs px-2 flex items-center justify-between text-[11px] font-mono shadow-xs truncate hover:brightness-110 transition-all"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${task.machineName}: ${task.taskName} (${task.startTime} - ${task.endTime})`}
                    >
                      <span className="truncate font-semibold">{task.machineId}: {task.taskName}</span>
                      <span className="text-[10px] opacity-90 hidden sm:inline ml-2">{task.tariffZone} (₹5.60)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Structured Schedule Task Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Production Schedule & Tariff Allocation Details
            </h3>
            <p className="text-[11px] text-slate-500">
              Shift times, power demands, and tariff zone mapping per production job
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Active Jobs: {productionSchedule.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">Job ID</th>
                <th className="py-2 px-3 font-semibold">Machine / Line</th>
                <th className="py-2 px-3 font-semibold">Production Job Description</th>
                <th className="py-2 px-3 font-semibold">Time Window</th>
                <th className="py-2 px-3 font-semibold text-right">Avg Power</th>
                <th className="py-2 px-3 font-semibold text-right">Total Energy</th>
                <th className="py-2 px-3 font-semibold">Tariff Zone</th>
                <th className="py-2 px-3 font-semibold text-right">Optimization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {productionSchedule.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-900">{item.id}</td>
                  <td className="py-2 px-3 font-sans text-slate-800">
                    <div>{item.machineId}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.line}</div>
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">
                    {item.taskName}
                  </td>
                  <td className="py-2 px-3 text-slate-700">
                    {item.startTime} - {item.endTime} ({item.durationHours}h)
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-900 font-semibold">
                    {item.avgPowerKw} kW
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-900 font-bold">
                    {item.totalEnergyKwh.toLocaleString()} kWh
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-xs ${
                        item.tariffZone === 'Peak'
                          ? 'bg-rose-100 text-rose-800'
                          : item.tariffZone === 'Off-Peak'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.tariffZone}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-sans">
                    {item.isOptimized ? (
                      <span className="text-[#24845A] font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Optimized
                      </span>
                    ) : (
                      <span className="text-slate-500">Current As-Is</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
