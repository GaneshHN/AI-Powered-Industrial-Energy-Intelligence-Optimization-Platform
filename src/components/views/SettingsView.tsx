import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Sliders,
  Bell,
  Monitor,
  Info,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  KeyRound
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';

export const SettingsView: React.FC = () => {
  const { currentFactory, userSession, isLiveTelemetry, setIsLiveTelemetry, showNotification } = useFactory();

  // Settings form state
  const [tariffPeak, setTariffPeak] = useState(currentFactory.tariffPeakInr.toString());
  const [tariffNormal, setTariffNormal] = useState(currentFactory.tariffNormalInr.toString());
  const [tariffOffPeak, setTariffOffPeak] = useState(currentFactory.tariffOffPeakInr.toString());
  const [peakDemandLimit, setPeakDemandLimit] = useState(currentFactory.peakDemandLimitKw.toString());
  const [baselineIntensity, setBaselineIntensity] = useState(currentFactory.baselineEnergyIntensity.toString());
  const [powerFactorFloor, setPowerFactorFloor] = useState('0.90');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCriticalOnly, setSmsCriticalOnly] = useState(true);
  const [scadaWebhook, setScadaWebhook] = useState(true);
  const [pollInterval, setPollInterval] = useState('4');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Industrial telemetry thresholds and tariff models successfully updated.');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Industrial Configuration & Energy Governance"
        subtitle="Manage factory tariff rates, peak demand thresholds, sub-meter polling cadence, and user permissions"
        metaInfo={[
          `Selected Facility: ${currentFactory.name}`,
          `Tariff Schedule: Maharashtra MSEDCL HT-I`,
          `Edge Telemetry: 14 Nodes Connected`
        ]}
      />

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Section 1: Factory Tariff & Time-of-Use Rates */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="h-4 w-4 text-[#2563A6]" />
            <h3 className="text-xs font-bold text-[#14283F] uppercase tracking-wide">
              Tariff & Utility Rate Structure (INR / kWh)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Peak Window Tariff Rate (18:00 - 22:00)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  step="0.05"
                  value={tariffPeak}
                  onChange={(e) => setTariffPeak(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">MSEDCL HT-I Peak Charge</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Normal Operational Tariff (06:00 - 18:00)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  step="0.05"
                  value={tariffNormal}
                  onChange={(e) => setTariffNormal(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Standard Day Window</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Off-Peak Night Tariff (22:00 - 06:00)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  step="0.05"
                  value={tariffOffPeak}
                  onChange={(e) => setTariffOffPeak(e.target.value)}
                  className="w-full pl-6 pr-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Discounted Night Window</span>
            </div>
          </div>
        </div>

        {/* Section 2: Operational Limits & Alert Thresholds */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="h-4 w-4 text-[#2563A6]" />
            <h3 className="text-xs font-bold text-[#14283F] uppercase tracking-wide">
              Contract Limits & Anomaly Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Contract Max Demand Limit (kW)
              </label>
              <input
                type="number"
                value={peakDemandLimit}
                onChange={(e) => setPeakDemandLimit(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Warning triggers at 90% load</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Baseline Intensity Target (kWh / unit)
              </label>
              <input
                type="number"
                step="0.1"
                value={baselineIntensity}
                onChange={(e) => setBaselineIntensity(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Plant benchmark efficiency</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Power Factor Floor (cos φ)
              </label>
              <input
                type="number"
                step="0.01"
                value={powerFactorFloor}
                onChange={(e) => setPowerFactorFloor(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono text-slate-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Penalty if PF &lt; 0.90</span>
            </div>
          </div>
        </div>

        {/* Section 3: Telemetry Stream & Notification Settings */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Bell className="h-4 w-4 text-[#2563A6]" />
            <h3 className="text-xs font-bold text-[#14283F] uppercase tracking-wide">
              Telemetry Polling & Alert Dispatch
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F4F6F8] cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Live Edge Gateway Polling</span>
                <span className="text-[11px] text-slate-500">Actively jitter and refresh real-time sensor packets.</span>
              </div>
              <input
                type="checkbox"
                checked={isLiveTelemetry}
                onChange={(e) => setIsLiveTelemetry(e.target.checked)}
                className="accent-[#2563A6] h-4 w-4 rounded-xs"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F4F6F8] cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">SCADA & MES Webhook Synchronization</span>
                <span className="text-[11px] text-slate-500">Relay schedule optimizations directly to PLC bus.</span>
              </div>
              <input
                type="checkbox"
                checked={scadaWebhook}
                onChange={(e) => setScadaWebhook(e.target.checked)}
                className="accent-[#2563A6] h-4 w-4 rounded-xs"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F4F6F8] cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Critical Peak Load SMS Alerting</span>
                <span className="text-[11px] text-slate-500">Notify plant duty engineer when demand reaches 92% of limit.</span>
              </div>
              <input
                type="checkbox"
                checked={smsCriticalOnly}
                onChange={(e) => setSmsCriticalOnly(e.target.checked)}
                className="accent-[#2563A6] h-4 w-4 rounded-xs"
              />
            </label>
          </div>
        </div>

        {/* Section 4: System Information */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-2 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-bold text-[#14283F] uppercase tracking-wide">
              Platform & Hackathon Environment Details
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
            <div className="p-2 bg-[#F4F6F8] rounded-xs">
              <span className="text-slate-400 block text-[10px] font-sans">Project</span>
              <span className="font-bold text-slate-800 font-sans">EnerPilot OS</span>
            </div>
            <div className="p-2 bg-[#F4F6F8] rounded-xs">
              <span className="text-slate-400 block text-[10px] font-sans">Hackathon Track</span>
              <span className="font-bold text-slate-800 font-sans">Smart Manufacturing 2026</span>
            </div>
            <div className="p-2 bg-[#F4F6F8] rounded-xs">
              <span className="text-slate-400 block text-[10px] font-sans">Software Version</span>
              <span className="font-semibold text-slate-700">v4.2.0-PROD</span>
            </div>
            <div className="p-2 bg-[#F4F6F8] rounded-xs">
              <span className="text-slate-400 block text-[10px] font-sans">Telemetry Nodes</span>
              <span className="font-semibold text-emerald-700">14 Modbus RTU</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#2563A6] hover:bg-[#1E528B] text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
