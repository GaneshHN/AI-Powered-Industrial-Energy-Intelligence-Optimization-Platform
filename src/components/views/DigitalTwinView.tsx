import React, { useState } from 'react';
import {
  Layers,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Coins,
  Zap,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';
import { LINE_CONTRIBUTIONS } from '../../data/mockIndustrialData';
import { DigitalTwinScenario } from '../../types';

export const DigitalTwinView: React.FC = () => {
  const {
    digitalTwinScenarios,
    activeScenarioId,
    setActiveScenarioId,
    runScenarioSimulation,
    setCurrentRoute
  } = useFactory();

  // Selected scenario
  const activeScenario = digitalTwinScenarios.find(s => s.id === activeScenarioId) || digitalTwinScenarios[0];
  const baselineScenario = digitalTwinScenarios.find(s => s.id === 'SCENARIO-BASELINE') || digitalTwinScenarios[0];

  // Interactive Simulation Controls
  const [targetUnits, setTargetUnits] = useState<number>(1200);
  const [shiftHours, setShiftHours] = useState<number>(24);
  const [peakShaving, setPeakShaving] = useState<boolean>(true);
  const [furnaceNightShift, setFurnaceNightShift] = useState<boolean>(true);
  const [compressorFix, setCompressorFix] = useState<boolean>(true);
  const [pressThrottling, setPressThrottling] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      runScenarioSimulation({
        name: `Interactive Sim (${targetUnits} Units, ${peakShaving ? 'Peak-Shaved' : 'Standard'})`,
        description: `Simulated with target ${targetUnits} units, peak shaving ${peakShaving ? 'ENABLED' : 'DISABLED'}, and compressor repair ${compressorFix ? 'ACTIVE' : 'PENDING'}.`,
        productionTargetUnits: targetUnits,
        shiftHours,
        peakShavingEnabled: peakShaving
      });
      setIsSimulating(false);
    }, 600);
  };

  const handleReset = () => {
    setTargetUnits(1200);
    setShiftHours(24);
    setPeakShaving(true);
    setFurnaceNightShift(true);
    setCompressorFix(true);
    setPressThrottling(true);
    setActiveScenarioId('SCENARIO-BASELINE');
  };

  const deltaCost = activeScenario.simulatedCostInr - baselineScenario.simulatedCostInr;
  const deltaEnergy = activeScenario.simulatedEnergyKwh - baselineScenario.simulatedEnergyKwh;
  const deltaPeak = activeScenario.simulatedPeakKw - baselineScenario.simulatedPeakKw;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Digital Twin — Virtual Factory Simulation Workspace"
        subtitle="Software-based operational sandbox to simulate production dispatch, peak tariff shaving, and equipment availability"
        metaInfo={[
          `Simulation Engine: Deterministic Energy Physics Model`,
          `Active Scenario: ${activeScenario.name}`,
          `Baseline Target: 1,200 Units / 24h`,
          `Tariff Model: Maharashtra HT-I Two-Part`
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Baseline</span>
            </button>
            <button
              disabled={isSimulating}
              onClick={handleRunSimulation}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2563A6] hover:bg-[#1E528B] disabled:opacity-60 rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isSimulating ? 'Solving Simulation...' : 'Execute Simulation Run'}</span>
            </button>
          </div>
        }
      />

      {/* Preset Scenario Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">Pre-configured Scenarios:</span>
        {digitalTwinScenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => setActiveScenarioId(sc.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 ${
              activeScenarioId === sc.id
                ? 'bg-[#14283F] text-white font-semibold shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#F4F6F8]'
            }`}
          >
            {sc.name}
          </button>
        ))}
      </div>

      {/* Main Simulation Layout: Left Controls + Right Real-Time Results & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Scenario Configuration Workspace (1 Col) */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-[#2563A6]" />
              Simulation Controls & Parameters
            </h3>
            <span className="text-[10px] font-mono text-slate-400">INPUT DISPATCH</span>
          </div>

          {/* Slider 1: Production Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800">Production Target Units</label>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-xs">
                {targetUnits} units
              </span>
            </div>
            <input
              type="range"
              min={800}
              max={1600}
              step={20}
              value={targetUnits}
              onChange={(e) => setTargetUnits(Number(e.target.value))}
              className="w-full accent-[#2563A6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>800 u (Light)</span>
              <span>1200 u (Nominal)</span>
              <span>1600 u (Max Surge)</span>
            </div>
          </div>

          {/* Slider 2: Shift Operating Hours */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-800">Plant Operating Window</label>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-xs">
                {shiftHours} hours
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={24}
              step={8}
              value={shiftHours}
              onChange={(e) => setShiftHours(Number(e.target.value))}
              className="w-full accent-[#2563A6] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>8h (1 Shift)</span>
              <span>16h (2 Shifts)</span>
              <span>24h (3 Shifts)</span>
            </div>
          </div>

          {/* Toggle Switches for Industrial Optimization Strategies */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block font-mono">
              Operational Optimization Levers
            </span>

            <label className="flex items-start gap-2.5 text-xs cursor-pointer p-2 rounded-xs hover:bg-[#F4F6F8] transition-colors">
              <input
                type="checkbox"
                checked={peakShaving}
                onChange={(e) => setPeakShaving(e.target.checked)}
                className="mt-0.5 accent-[#2563A6] rounded-xs h-4 w-4"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  ToU Peak Tariff Shaving Mode
                </span>
                <span className="text-[11px] text-slate-500 leading-snug block">
                  Automatically throttles non-continuous stamping loads during the 18:00–22:00 window (₹11.40/kWh).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs cursor-pointer p-2 rounded-xs hover:bg-[#F4F6F8] transition-colors">
              <input
                type="checkbox"
                checked={furnaceNightShift}
                onChange={(e) => setFurnaceNightShift(e.target.checked)}
                className="mt-0.5 accent-[#2563A6] rounded-xs h-4 w-4"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Reschedule Carburizing Furnace to Night Shift C
                </span>
                <span className="text-[11px] text-slate-500 leading-snug block">
                  Moves 245kW heat soak to 22:00–06:00 (₹5.60/kWh off-peak rate).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs cursor-pointer p-2 rounded-xs hover:bg-[#F4F6F8] transition-colors">
              <input
                type="checkbox"
                checked={compressorFix}
                onChange={(e) => setCompressorFix(e.target.checked)}
                className="mt-0.5 accent-[#2563A6] rounded-xs h-4 w-4"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Simulate Compressor 01 Unloader Repair
                </span>
                <span className="text-[11px] text-slate-500 leading-snug block">
                  Eliminates 50.2 kW idle poppet leakage during unworked factory pauses.
                </span>
              </div>
            </label>
          </div>

          <button
            onClick={handleRunSimulation}
            className="w-full py-2 text-xs font-semibold text-white bg-[#14283F] hover:bg-[#202B36] rounded-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Recalculate Scenario Results</span>
          </button>
        </div>

        {/* Right Column: Simulation Results & As-Is vs Simulated Comparison (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comparison Scorecard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Total Energy Consumption</span>
                <span className="font-mono text-emerald-700 font-bold text-[11px]">
                  {activeScenario.deltaEnergyPct < 0 ? `${activeScenario.deltaEnergyPct}%` : `+${activeScenario.deltaEnergyPct}%`}
                </span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {activeScenario.simulatedEnergyKwh.toLocaleString()} <span className="text-xs text-slate-500 font-sans">kWh</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Baseline: 18,450 kWh</span>
                <span className={deltaEnergy <= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>
                  {deltaEnergy <= 0 ? `${deltaEnergy} kWh` : `+${deltaEnergy} kWh`}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Daily Operating Cost</span>
                <span className="font-mono text-emerald-700 font-bold text-[11px]">
                  {deltaCost <= 0 ? `Save ₹${Math.abs(deltaCost).toLocaleString()}` : `+₹${deltaCost.toLocaleString()}`}
                </span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                ₹{activeScenario.simulatedCostInr.toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Baseline: ₹1,68,240</span>
                <span className="text-emerald-700 font-semibold">
                  ₹{(Math.abs(deltaCost) * 30 / 100000).toFixed(2)} Lakhs/mo
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Peak Load Demand</span>
                <span className="font-mono text-emerald-700 font-bold text-[11px]">
                  {deltaPeak <= 0 ? `${deltaPeak} kW` : `+${deltaPeak} kW`}
                </span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {activeScenario.simulatedPeakKw} <span className="text-xs text-slate-500 font-sans">kW</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Contract Max: 1,250 kW</span>
                <span className="text-emerald-700 font-semibold">
                  {((activeScenario.simulatedPeakKw / 1250) * 100).toFixed(1)}% Load
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side As-Is vs Simulated Comparison Table */}
          <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-[#14283F]">
                  Scenario Metric Variance Table (Current vs. Simulated)
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Evaluating {activeScenario.name}
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs">
                Constraint: Target Satisfied (100%)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Key Performance Parameter</th>
                    <th className="py-2.5 px-3 font-semibold text-right">As-Is Current Baseline</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Simulated Scenario</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Delta / Variance</th>
                    <th className="py-2.5 px-3 font-semibold">Engineering Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      Daily Energy Consumption
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      18,450 kWh
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {activeScenario.simulatedEnergyKwh.toLocaleString()} kWh
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {activeScenario.deltaEnergyPct}%
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      Reduced idle dissipation & furnace soaking losses
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      Peak Instantaneous Demand
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600">
                      1,380 kW (Penalty zone)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {activeScenario.simulatedPeakKw} kW
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {deltaPeak} kW
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      Operates within 1,250 kW contract demand limit
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      Energy Intensity (Specific Consumption)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      15.38 kWh / unit
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {(activeScenario.simulatedEnergyKwh / activeScenario.productionTargetUnits).toFixed(2)} kWh / unit
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      -{(15.38 - (activeScenario.simulatedEnergyKwh / activeScenario.productionTargetUnits)).toFixed(2)} kWh
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      Closer to world-class benchmark (14.2 kWh/u)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      Daily Energy Expenditure
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ₹1,68,240
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{activeScenario.simulatedCostInr.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      -₹{Math.abs(deltaCost).toLocaleString()} / day
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      Arbitrage between Peak ₹11.40 & Off-Peak ₹5.60
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      Scope 2 Carbon Footprint
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      13,284 kg CO₂e
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {activeScenario.simulatedCo2eKg.toLocaleString()} kg CO₂e
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      -{(13284 - activeScenario.simulatedCo2eKg)} kg
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                      Annual avoidance of ~340 tonnes CO₂ equivalent
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: Dynamic Thermal & Motor Power Balance Equation
              </span>
              <button
                onClick={() => setCurrentRoute('optimization')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563A6] hover:bg-[#1E528B] rounded-xs transition-colors flex items-center gap-1.5"
              >
                <span>Commit to Production Optimization Scheduler →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
