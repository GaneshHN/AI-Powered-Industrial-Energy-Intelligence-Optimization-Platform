import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import {
  Filter,
  Download,
  Calendar,
  Layers,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';
import { LINE_CONTRIBUTIONS, SHIFT_PERFORMANCES } from '../../data/mockIndustrialData';

export const EnergyIntelligenceView: React.FC = () => {
  const { currentFactory, hourlySeries, showNotification } = useFactory();

  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [selectedMetricView, setSelectedMetricView] = useState<'consumption' | 'intensity' | 'cost'>('consumption');

  const filteredLines = selectedLineFilter === 'all'
    ? LINE_CONTRIBUTIONS
    : LINE_CONTRIBUTIONS.filter(l => l.lineId === selectedLineFilter);

  // Daily comparison dummy data for enterprise reporting
  const dailyComparisonData = [
    { day: 'Mon', actualKwh: 18120, baselineKwh: 17900, costInr: 154000 },
    { day: 'Tue', actualKwh: 18450, baselineKwh: 18000, costInr: 159000 },
    { day: 'Wed', actualKwh: 17980, baselineKwh: 17800, costInr: 151000 },
    { day: 'Thu', actualKwh: 19100, baselineKwh: 18100, costInr: 169000 },
    { day: 'Fri (Today)', actualKwh: 18450, baselineKwh: 17900, costInr: 168240 },
    { day: 'Sat (Plan)', actualKwh: 14200, baselineKwh: 14000, costInr: 118000 },
    { day: 'Sun (Plan)', actualKwh: 9800, baselineKwh: 9600, costInr: 78000 }
  ];

  // Specific energy intensity curve
  const intensityData = hourlySeries.map(h => ({
    time: h.time,
    intensity: Number((h.actualKwh / Math.max(1, h.productionUnits)).toFixed(2)),
    target: 14.2
  }));

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Hour,ActualKwh,BaselineKwh,PeakKw,ProductionUnits,CostINR\n"
      + hourlySeries.map(e => `${e.time},${e.actualKwh},${e.baselineKwh},${e.peakKw},${e.productionUnits},${e.costInr}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `enerpilot_energy_audit_${currentFactory.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Energy intelligence audit dataset exported to CSV.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Energy Intelligence & Analytics"
        subtitle="Granular verification of consumption patterns, line intensities, shift variances, and ToU tariff impact"
        metaInfo={[
          `Tariff Model: Maharashtra HT-I Two-Part`,
          `Peak Rate: ₹${currentFactory.tariffPeakInr.toFixed(2)}/kWh`,
          `Normal: ₹${currentFactory.tariffNormalInr.toFixed(2)}/kWh`,
          `Off-Peak: ₹${currentFactory.tariffOffPeakInr.toFixed(2)}/kWh`
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-[#EDF1F4] rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Audit Data (CSV)</span>
            </button>
          </div>
        }
      />

      {/* Primary Analytical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Total Energy Consumption"
          value={currentFactory.todayEnergyKwh}
          unit="kWh"
          comparison={{ value: "-2.4%", trend: "down", isFavorable: true, periodLabel: "vs Prev Day" }}
        />
        <MetricCard
          label="Energy Intensity"
          value={currentFactory.currentEnergyIntensity}
          unit="kWh / u"
          comparison={{ value: "+1.2 kWh", trend: "up", isFavorable: false, periodLabel: "Target: 14.2" }}
        />
        <MetricCard
          label="Peak Load Demand"
          value={currentFactory.currentDemandKw}
          unit="kW"
          comparison={{ value: "1128 kW", trend: "up", isFavorable: false, periodLabel: "90% of Contract" }}
        />
        <MetricCard
          label="Estimated Emissions"
          value={(currentFactory.todayCo2eKg / 1000).toFixed(2)}
          unit="t CO₂e"
          comparison={{ value: "-1.8%", trend: "down", isFavorable: true, periodLabel: "0.72 kg/kWh" }}
        />
        <MetricCard
          label="Total Energy Cost"
          value={`₹${(currentFactory.todayCostInr / 1000).toFixed(1)}k`}
          unit="INR"
          comparison={{ value: "+3.2%", trend: "up", isFavorable: false, periodLabel: "Due to Peak Load" }}
        />
        <MetricCard
          label="Power Factor (Plant Average)"
          value="0.91"
          unit="cos φ"
          comparison={{ value: "Floor: 0.90", trend: "neutral", isFavorable: true, periodLabel: "Target: 0.98" }}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Line Filter:
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedLineFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                selectedLineFilter === 'all'
                  ? 'bg-[#14283F] text-white font-semibold'
                  : 'bg-[#F4F6F8] text-slate-700 hover:bg-[#EDF1F4]'
              }`}
            >
              All Lines ({LINE_CONTRIBUTIONS.length})
            </button>
            {LINE_CONTRIBUTIONS.map(line => (
              <button
                key={line.lineId}
                onClick={() => setSelectedLineFilter(line.lineId)}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                  selectedLineFilter === line.lineId
                    ? 'bg-[#2563A6] text-white font-semibold'
                    : 'bg-[#F4F6F8] text-slate-700 hover:bg-[#EDF1F4]'
                }`}
              >
                {line.name.split('—')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Metric View Switcher */}
        <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
          <button
            onClick={() => setSelectedMetricView('consumption')}
            className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
              selectedMetricView === 'consumption'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consumption (kWh)
          </button>
          <button
            onClick={() => setSelectedMetricView('intensity')}
            className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
              selectedMetricView === 'intensity'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Specific Intensity (kWh/u)
          </button>
          <button
            onClick={() => setSelectedMetricView('cost')}
            className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
              selectedMetricView === 'cost'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tariff Cost (₹)
          </button>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Energy Intensity Trend vs Baseline Target */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-[#14283F]">
                Specific Energy Intensity Trend (kWh / Unit)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Target: 14.2 kWh/u · Spikes indicate unworked idle draw
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs">
              Lunch Idle Spike: 16.0 kWh/u
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={intensityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} />
                <XAxis dataKey="time" stroke="#687684" fontSize={11} tickLine={false} />
                <YAxis stroke="#687684" fontSize={11} tickLine={false} domain={[10, 20]} unit=" u" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-[#14283F] text-white p-2 rounded-xs shadow-md text-xs font-mono">
                        <div>Time: {label}</div>
                        <div className="text-amber-300 font-bold">Intensity: {payload[0].value} kWh/unit</div>
                        <div className="text-slate-400">Target Baseline: 14.20 kWh/unit</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  name="Observed Intensity (kWh/u)"
                  stroke="#2563A6"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Plant Target (14.2 kWh/u)"
                  stroke="#24845A"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Energy Comparison & Cost */}
        <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-[#14283F]">
                Daily Consumption & Baseline Variance
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                7-Day Operational Horizon · Normalized to Production Run
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600">
              Avg: 18,240 kWh/day
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} />
                <XAxis dataKey="day" stroke="#687684" fontSize={11} tickLine={false} />
                <YAxis stroke="#687684" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-[#14283F] text-white p-2 rounded-xs shadow-md text-xs font-mono">
                        <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">{label}</div>
                        <div className="text-blue-300">Actual: {payload[0]?.value?.toLocaleString()} kWh</div>
                        <div className="text-slate-400">Target: {payload[1]?.value?.toLocaleString()} kWh</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="actualKwh" name="Actual Consumption" fill="#2563A6" barSize={16} radius={[2, 2, 0, 0]} />
                <Bar dataKey="baselineKwh" name="Baseline Target" fill="#94A3B8" barSize={16} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Production-Line Breakdown Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Production-Line Energy Breakdown & Active Intensity
            </h3>
            <p className="text-[11px] text-slate-500">
              Contribution analysis sorted by total energy absorption across active manufacturing cells
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total Metered: 18,450 kWh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-y border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">Line ID</th>
                <th className="py-2 px-3 font-semibold">Production Process</th>
                <th className="py-2 px-3 font-semibold text-right">Equipment Count</th>
                <th className="py-2 px-3 font-semibold text-right">Active Demand</th>
                <th className="py-2 px-3 font-semibold text-right">Daily Energy (kWh)</th>
                <th className="py-2 px-3 font-semibold text-right">Share (%)</th>
                <th className="py-2 px-3 font-semibold text-right">Specific Intensity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLines.map(line => (
                <tr key={line.lineId} className="hover:bg-[#F4F6F8] transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    {line.lineId}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {line.name}
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-600">
                    {line.machineCount} units
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-900 font-semibold">
                    {line.activePowerKw.toFixed(1)} kW
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-900 font-semibold">
                    {line.energyKwh.toLocaleString()} kWh
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-600">
                    <span className="inline-block w-12">{line.sharePct}%</span>
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-800 font-bold">
                    {line.energyIntensityKwhPerUnit.toFixed(1)} kWh/u
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Comparison Table */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Shift Energy & Tariff Variance Audit
            </h3>
            <p className="text-[11px] text-slate-500">
              Shift B covers the Maharashtra ToU Peak Tariff window (18:00–22:00 IST), driving elevated specific costs.
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs font-semibold">
            Shift B Specific Cost: ₹10.25 / kWh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#687684] text-[11px] font-mono border-y border-slate-200">
              <tr>
                <th className="py-2 px-3 font-semibold">Shift Name</th>
                <th className="py-2 px-3 font-semibold">Operational Window</th>
                <th className="py-2 px-3 font-semibold text-right">Energy (kWh)</th>
                <th className="py-2 px-3 font-semibold text-right">Production (Units)</th>
                <th className="py-2 px-3 font-semibold text-right">Specific Intensity</th>
                <th className="py-2 px-3 font-semibold text-right">Cost (INR)</th>
                <th className="py-2 px-3 font-semibold">Lead Supervisor</th>
                <th className="py-2 px-3 font-semibold text-right">Dispatch Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SHIFT_PERFORMANCES.map(shift => (
                <tr key={shift.shiftId} className="hover:bg-[#F4F6F8] transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {shift.name}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                    {shift.hours} IST
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-900 font-bold">
                    {shift.energyKwh.toLocaleString()} kWh
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-700 font-semibold">
                    {shift.unitsProduced}
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-800">
                    {shift.energyIntensity.toFixed(2)} kWh/u
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums text-slate-900 font-bold">
                    ₹{shift.costInr.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {shift.leadOperator}
                  </td>
                  <td className="py-2 px-3 font-mono text-right tabular-nums">
                    <span className={shift.compliancePct < 85 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {shift.compliancePct}%
                    </span>
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
