import React, { useState } from 'react';
import {
  SearchCode,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  FileCheck,
  ShieldCheck,
  Activity,
  SlidersHorizontal,
  Flame,
  Zap
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { RootCauseInvestigation } from '../../types';

export const RootCauseView: React.FC = () => {
  const { rcaCases, selectedRcaId, setSelectedRcaId, setCurrentRoute } = useFactory();

  const activeCase = rcaCases.find(c => c.id === selectedRcaId) || rcaCases[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Root Cause Analysis (RCA) & Forensic Engineering"
        subtitle="Multi-sensor correlation, mechanical fault signatures, and causal verification audit"
        metaInfo={[
          `Active Case: ${activeCase.id}`,
          `Evidence Strength: ${activeCase.evidenceStrength} Rigor`,
          `Target Node: ${activeCase.machineId}`,
          `Methodology: Ishikawa & Kepner-Tregoe Diagnostic Matrix`
        ]}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Select Case:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xs p-0.5 shadow-2xs">
              {rcaCases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedRcaId(c.id)}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-xs transition-colors ${
                    activeCase.id === c.id
                      ? 'bg-[#14283F] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {c.id}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Investigation Summary Banner */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#2563A6] font-mono text-xs font-bold rounded-xs">
              {activeCase.id}
            </span>
            <h2 className="text-sm font-bold text-[#14283F]">
              {activeCase.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Target Node:</span>
            <span className="font-semibold text-slate-800">{activeCase.machineId}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">Confidence:</span>
            <span className="font-semibold text-[#24845A]">{activeCase.evidenceStrength} (Verified)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F4F6F8] rounded-xs border border-slate-200">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1 font-semibold">
              Detected Operational Anomaly
            </span>
            <p className="font-medium text-slate-800 leading-relaxed">
              {activeCase.detectedIssue}
            </p>
          </div>

          <div className="p-3 bg-[#F4F6F8] rounded-xs border border-slate-200">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1 font-semibold">
              Forensic Synthesis & Mechanism
            </span>
            <p className="text-slate-600 leading-relaxed">
              {activeCase.investigationSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Structured Evidence Matrix: Observed, Correlated, Potential Contributor, Confirmed */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Structured Causal Evidence & Telemetry Findings
            </h3>
            <p className="text-[11px] text-slate-500">
              Rigorous separation between observed sensor data, statistical correlations, and confirmed physical root causes
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Observed
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Correlated
            </span>
            <span className="flex items-center gap-1 text-purple-700">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Contributor
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed Root Cause
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeCase.findings.map((item, idx) => {
            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            let borderAccent = 'border-slate-200';

            if (item.category === 'Confirmed') {
              badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
              borderAccent = 'border-emerald-300 bg-emerald-50/20';
            } else if (item.category === 'Observed') {
              badgeBg = 'bg-blue-50 text-blue-800 border-blue-200';
              borderAccent = 'border-blue-200';
            } else if (item.category === 'Correlated') {
              badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
              borderAccent = 'border-amber-200';
            } else if (item.category === 'Potential Contributor') {
              badgeBg = 'bg-purple-50 text-purple-800 border-purple-200';
              borderAccent = 'border-purple-200';
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-xs border ${borderAccent} space-y-2 text-xs bg-white shadow-2xs`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-xs border ${badgeBg}`}>
                    {item.category.toUpperCase()}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 font-medium">
                    Evidence Item #{idx + 1}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 text-sm">
                  {item.parameter}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 bg-[#F4F6F8] rounded-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Observed Telemetry:</span>
                    <span className="font-bold text-slate-900">{item.reading}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Expected Design Spec:</span>
                    <span className="text-slate-600">{item.expectedRange}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-700 leading-relaxed pt-1">
                  <span className="font-semibold text-slate-900">Engineering Impact:</span> {item.impact}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Evolution Timeline & Corrective Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incident Timeline */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              Event Timeline & Telemetry Evolution
            </h3>
            <span className="text-[10px] font-mono text-slate-400">CHRONOLOGICAL LOG</span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
            {activeCase.timeline.map((event, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-6 text-xs">
                <span
                  className={`absolute left-1.5 top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    event.severity === 'critical'
                      ? 'bg-[#C94A45]'
                      : event.severity === 'high'
                      ? 'bg-[#D99125]'
                      : 'bg-[#2563A6]'
                  }`}
                />
                <div className="flex-1">
                  <span className="font-mono text-[11px] font-bold text-slate-800 block">
                    {event.time}
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    {event.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions Protocol */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-[#2563A6]" />
                Recommended Corrective Maintenance Protocol
              </h3>
              <span className="text-[10px] font-mono text-slate-400">ACTION ITEMS</span>
            </div>

            <div className="space-y-2.5">
              {activeCase.recommendedActions.map((act) => (
                <div
                  key={act.step}
                  className="p-2.5 bg-[#F4F6F8] border border-slate-200 rounded-xs text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      Step 0{act.step}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-xs font-mono ${
                        act.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium text-[11px] leading-relaxed">
                    {act.action}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                    <span>Assigned: {act.owner}</span>
                    <span>Saving: +{act.expectedSavingKwh} kWh/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentRoute('recommendations')}
              className="text-xs font-semibold text-[#2563A6] hover:underline flex items-center gap-1"
            >
              <span>Synchronize with Recommendations Engine</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentRoute('digital-twin')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#14283F] hover:bg-[#202B36] rounded-xs transition-colors"
            >
              Simulate Repair in Digital Twin →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
