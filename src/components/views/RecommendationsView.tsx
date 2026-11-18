import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Coins,
  Leaf,
  Clock,
  Play,
  Check,
  X,
  FileSearch,
  Filter,
  ShieldAlert,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { Recommendation } from '../../types';

export const RecommendationsView: React.FC = () => {
  const {
    recommendations,
    updateRecommendationStatus,
    setSelectedMachineId,
    setCurrentRoute,
    setActiveScenarioId,
    showNotification
  } = useFactory();

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecModal, setSelectedRecModal] = useState<Recommendation | null>(null);

  const filteredRecs = recommendations.filter(r => {
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  const totalMonthlySavings = recommendations
    .filter(r => r.status !== 'dismissed')
    .reduce((sum, r) => sum + r.monthlySavingsInr, 0);

  const totalCo2Avoided = recommendations
    .filter(r => r.status !== 'dismissed')
    .reduce((sum, r) => sum + r.co2AvoidedKgMonthly, 0);

  const handleSimulateInDigitalTwin = (rec: Recommendation) => {
    if (rec.id === 'REC-2026-101') {
      setActiveScenarioId('SCENARIO-PEAK-SHAVED');
    } else {
      setActiveScenarioId('SCENARIO-ECO-THROTTLE');
    }
    setCurrentRoute('digital-twin');
    showNotification(`Transferred recommendation parameters for ${rec.machineId} into Digital Twin sandbox.`);
  };

  const handleAccept = (rec: Recommendation) => {
    updateRecommendationStatus(rec.id, 'applied');
  };

  const handleDismiss = (rec: Recommendation) => {
    updateRecommendationStatus(rec.id, 'dismissed');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Industrial Energy Optimization Recommendations"
        subtitle="Ranked engineering interventions to reduce specific energy consumption, eliminate parasitic losses, and optimize ToU tariffs"
        metaInfo={[
          `Total Actionable Interventions: ${recommendations.length}`,
          `Total Potential Savings: ₹${(totalMonthlySavings / 100000).toFixed(2)} Lakhs / Month`,
          `Avoided Carbon: ${(totalCo2Avoided / 1000).toFixed(1)} Tonnes CO₂e / Month`
        ]}
      />

      {/* Financial & Environmental ROI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Total Monthly Cost Reduction</span>
          <div className="text-xl font-bold font-mono text-[#24845A] mt-1 tabular-nums">
            ₹{(totalMonthlySavings / 100000).toFixed(2)} Lakhs <span className="text-xs text-slate-500 font-sans">/ mo</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Annual: ₹{((totalMonthlySavings * 12) / 10000000).toFixed(2)} Crores
          </span>
        </div>

        <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Avoided Electrical Energy</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            24,420 <span className="text-xs text-slate-500 font-sans">kWh / mo</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Parasitic idle leakage elimination
          </span>
        </div>

        <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Scope 2 Carbon Offset</span>
          <div className="text-xl font-bold font-mono text-[#2563A6] mt-1 tabular-nums">
            {(totalCo2Avoided / 1000).toFixed(1)} <span className="text-xs text-slate-500 font-sans">t CO₂e / mo</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Grounded on 0.72 kg CO₂e / kWh grid factor
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Priority:</span>
          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            {['all', 'urgent', 'high', 'medium', 'low'].map(pr => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-xs capitalize transition-colors ${
                  priorityFilter === pr
                    ? 'bg-white text-[#14283F] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Status:</span>
          <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
            {['all', 'new', 'reviewed', 'applied', 'dismissed'].map(st => (
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

      {/* Recommendations Cards Grid */}
      <div className="space-y-3">
        {filteredRecs.map((rec) => (
          <div
            key={rec.id}
            className={`p-4 bg-white border rounded-xs shadow-2xs transition-all space-y-3 ${
              rec.priority === 'urgent'
                ? 'border-l-4 border-l-[#C94A45] border-slate-200'
                : rec.priority === 'high'
                ? 'border-l-4 border-l-[#D99125] border-slate-200'
                : 'border-slate-200'
            }`}
          >
            {/* Header: Title + Machine Reference + Priority */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800">
                  {rec.id}
                </span>
                <span className="text-slate-300">·</span>
                <h3 className="text-sm font-bold text-[#14283F]">
                  {rec.title}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs shrink-0">
                <span
                  onClick={() => {
                    setSelectedMachineId(rec.machineId);
                    setCurrentRoute('machines');
                  }}
                  className="font-mono font-semibold text-[#2563A6] hover:underline cursor-pointer"
                >
                  {rec.machineId}
                </span>
                <StatusBadge status={rec.priority} type="severity" />
                <StatusBadge status={rec.status} type="lifecycle" />
              </div>
            </div>

            {/* Engineering Issue & Recommended Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono mb-1">
                  Identified Operational Inefficiency
                </span>
                <p className="text-slate-700 leading-relaxed font-sans">
                  {rec.issue}
                </p>
              </div>

              <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200">
                <span className="text-[10px] font-bold text-[#2563A6] uppercase tracking-wider block font-mono mb-1">
                  Engineering Action Protocol
                </span>
                <p className="text-slate-800 font-medium leading-relaxed font-sans">
                  {rec.recommendedAction}
                </p>
              </div>
            </div>

            {/* Engineering Rationale */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xs border border-slate-200">
              <strong className="text-slate-800 font-semibold font-sans">Engineering Rationale:</strong>{' '}
              {rec.engineeringReason}
            </div>

            {/* Impact Strip & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-sans">Monthly Savings:</span>
                  <span className="font-bold text-[#24845A]">₹{rec.monthlySavingsInr.toLocaleString()}</span>
                </div>
                {rec.kwhReductionMonthly > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-sans">Energy Avoidance:</span>
                    <span className="font-bold text-slate-800">{rec.kwhReductionMonthly.toLocaleString()} kWh/mo</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-sans">Simple Payback:</span>
                  <span className="font-semibold text-slate-700">{rec.paybackPeriodDays === 0 ? 'Immediate / Zero Cost' : `${rec.paybackPeriodDays} Days`}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSimulateInDigitalTwin(rec)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xs transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Play className="h-3 w-3" />
                  <span>Simulate in Digital Twin</span>
                </button>

                {rec.status !== 'applied' && (
                  <button
                    onClick={() => handleAccept(rec)}
                    className="px-3 py-1 text-[11px] font-semibold text-white bg-[#24845A] hover:bg-[#1E6B48] rounded-xs transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="h-3 w-3" />
                    <span>Accept Action</span>
                  </button>
                )}

                {rec.status !== 'dismissed' && (
                  <button
                    onClick={() => handleDismiss(rec)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xs transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
