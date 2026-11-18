import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';

export const EnergyForecastView: React.FC = () => {
  const { currentFactory, hourlySeries } = useFactory();
  const [forecastHorizon, setForecastHorizon] = useState<'24h' | '48h' | '7d'>('24h');
  const [selectedModel, setSelectedModel] = useState<'ensemble' | 'physics_lstm'>('ensemble');

  // Generate extended 24h forecast curve with uncertainty upper/lower bounds
  const forecastSeries = [
    // Past hours
    { time: '14:00', actual: 1230, forecast: 1220, lower: 1190, upper: 1250, isHistorical: true },
    { time: '16:00', actual: 1280, forecast: 1270, lower: 1240, upper: 1300, isHistorical: true },
    { time: '18:00', actual: 1340, forecast: 1320, lower: 1280, upper: 1360, isHistorical: true },
    { time: '20:00', actual: 1290, forecast: 1280, lower: 1230, upper: 1320, isHistorical: true },
    { time: '22:00', actual: 860, forecast: 850, lower: 810, upper: 890, isHistorical: true },
    // Future Horizon (Predictions)
    { time: '00:00 (Tom)', actual: null, forecast: 610, lower: 570, upper: 650, isHistorical: false },
    { time: '02:00 (Tom)', actual: null, forecast: 590, lower: 550, upper: 630, isHistorical: false },
    { time: '04:00 (Tom)', actual: null, forecast: 640, lower: 600, upper: 680, isHistorical: false },
    { time: '06:00 (Tom)', actual: null, forecast: 980, lower: 920, upper: 1040, isHistorical: false },
    { time: '08:00 (Tom)', actual: null, forecast: 1190, lower: 1120, upper: 1260, isHistorical: false },
    { time: '10:00 (Tom)', actual: null, forecast: 1250, lower: 1180, upper: 1320, isHistorical: false },
    { time: '12:00 (Tom)', actual: null, forecast: 890, lower: 830, upper: 950, isHistorical: false }, // Lunch
    { time: '14:00 (Tom)', actual: null, forecast: 1220, lower: 1150, upper: 1290, isHistorical: false },
    { time: '16:00 (Tom)', actual: null, forecast: 1270, lower: 1190, upper: 1340, isHistorical: false },
    { time: '18:00 (Tom)', actual: null, forecast: 1360, lower: 1270, upper: 1440, isHistorical: false }, // Predicted peak spike
    { time: '20:00 (Tom)', actual: null, forecast: 1310, lower: 1220, upper: 1390, isHistorical: false },
    { time: '22:00 (Tom)', actual: null, forecast: 840, lower: 780, upper: 900, isHistorical: false }
  ];

  // Machine Level Forecast Drivers
  const machineForecastDrivers = [
    {
      id: 'FURN-HT-01',
      name: 'Carburizing Furnace #01',
      line: 'Line D',
      forecastKwh: 4950,
      peakTime: '18:30 IST',
      driverReason: 'Batch #410 heavy case hardening cycle scheduled across peak tariff window'
    },
    {
      id: 'PRESS-HYD-01',
      name: '800T Hydraulic Press #01',
      line: 'Line B',
      forecastKwh: 3580,
      peakTime: '19:15 IST',
      driverReason: 'Chassis cross-member stamping tooling changeover and cold hydraulic oil ramp'
    },
    {
      id: 'CHILLER-01',
      name: 'Central Closed-Loop Chiller',
      line: 'Utilities',
      forecastKwh: 2240,
      peakTime: '14:00 IST',
      driverReason: 'Ambient afternoon temperature projected at 36°C elevating condensing load'
    },
    {
      id: 'COMP-AIR-01',
      name: '75kW Rotary Screw Air Compressor',
      line: 'Utilities',
      forecastKwh: 1520,
      peakTime: '10:00 IST',
      driverReason: 'Parasitic idle bypass leakage unaddressed; will consume 68 kW during lunch pause'
    }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Energy Forecasting & Peak Demand Projection"
        subtitle="Probabilistic machine learning projections with confidence bounds and ToU tariff exposure"
        metaInfo={[
          `Model: ${selectedModel === 'ensemble' ? 'Gradient Boosted Ensemble + Regressors' : 'Physics-Informed LSTM'}`,
          `Confidence Band: 95% Interval (±4.8%)`,
          `Forecast Horizon: Next ${forecastHorizon.toUpperCase()}`,
          `Last Retrained: 04:00 IST Today`
        ]}
        action={
          <div className="flex items-center gap-1.5 bg-[#EDF1F4] p-0.5 rounded-xs">
            <button
              onClick={() => setForecastHorizon('24h')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                forecastHorizon === '24h' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              24-Hour Horizon
            </button>
            <button
              onClick={() => setForecastHorizon('48h')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                forecastHorizon === '48h' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              48-Hour Plan
            </button>
            <button
              onClick={() => setForecastHorizon('7d')}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors ${
                forecastHorizon === '7d' ? 'bg-white text-[#14283F] font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              7-Day Outlook
            </button>
          </div>
        }
      />

      {/* Forecast Executive KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Projected Energy Consumption"
          value="18,720"
          unit="kWh"
          comparison={{
            value: "+1.5%",
            trend: "up",
            isFavorable: false,
            periodLabel: "vs Today's 18,450 kWh"
          }}
          sublabel="Forecast Uncertainty: ±380 kWh"
        />

        <MetricCard
          label="Expected Peak Demand"
          value="1,360"
          unit="kW"
          comparison={{
            value: "ALERT",
            trend: "up",
            isFavorable: false,
            periodLabel: `Contract Max: ${currentFactory.peakDemandLimitKw} kW`
          }}
          sublabel="Projected at 18:30 IST Tomorrow"
        />

        <MetricCard
          label="Estimated Tomorrow Energy Cost"
          value="₹1,74,800"
          unit="INR"
          comparison={{
            value: "+₹6,560",
            trend: "up",
            isFavorable: false,
            periodLabel: "Driven by 18:00 Peak"
          }}
          sublabel="Includes Peak Tariff Penalty"
        />

        <MetricCard
          label="Forecast Model Accuracy (MAPE)"
          value="2.84"
          unit="%"
          comparison={{
            value: "High Rigor",
            trend: "down",
            isFavorable: true,
            periodLabel: "Mean Absolute Error"
          }}
          sublabel="Grounded on 90-day MES logs"
        />
      </div>

      {/* Historical vs Predicted Interactive Chart */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Historical Telemetry vs. Projected Horizon (kWh)
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Solid Blue: Actual Telemetry · Dashed Green: AI Forecast · Shaded Area: 95% Uncertainty Bound
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="px-2 py-1 text-xs bg-[#F4F6F8] border border-slate-200 rounded-xs font-mono"
            >
              <option value="ensemble">Ensemble (XGBoost + Gradient Boost)</option>
              <option value="physics_lstm">Physics-Informed LSTM (Thermal Lag)</option>
            </select>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#23865B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#23865B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} />
              <XAxis dataKey="time" stroke="#687684" fontSize={11} tickLine={false} />
              <YAxis stroke="#687684" fontSize={11} tickLine={false} unit=" kWh" domain={[400, 1600]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#14283F] text-white p-2.5 rounded-xs shadow-md text-xs font-mono">
                      <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-4">
                        <span>Horizon: {label}</span>
                        <span className="text-[10px] text-slate-400">
                          {item.isHistorical ? 'Historical Actual' : 'Predicted Forecast'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {item.actual !== null && (
                          <div className="flex justify-between gap-4 text-blue-300">
                            <span>Actual Measured:</span>
                            <span className="font-bold">{item.actual} kWh</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 text-emerald-300">
                          <span>AI Projection:</span>
                          <span className="font-bold">{item.forecast} kWh</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-400 text-[11px]">
                          <span>95% Confidence Band:</span>
                          <span>{item.lower} - {item.upper} kWh</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />

              {/* Reference line separating history from prediction */}
              <ReferenceLine
                x="22:00"
                stroke="#C94A45"
                strokeDasharray="3 3"
                label={{ value: 'NOW / PROJECTION START', position: 'top', fill: '#C94A45', fontSize: 10 }}
              />

              <Area
                type="monotone"
                dataKey="upper"
                name="Confidence Range (Upper)"
                stroke="transparent"
                fill="url(#uncertaintyGradient)"
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Telemetry (kWh)"
                stroke="#2563A6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Predicted Consumption (kWh)"
                stroke="#23865B"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equipment-Level Forecast Drivers Breakdown */}
      <div className="bg-white border border-[#EDF1F4] rounded-xs p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-[#14283F]">
              Machine-Level Forecast Drivers for Tomorrow's Peak
            </h3>
            <p className="text-[11px] text-slate-500">
              High-draw equipment scheduled to absorb power during the critical 18:00–22:00 tariff window
            </p>
          </div>
          <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-xs font-semibold">
            Predicted Peak: 1,360 kW (+110 kW over contract limit)
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {machineForecastDrivers.map((driver) => (
            <div key={driver.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{driver.id}</span>
                  <span className="text-slate-700 font-medium">{driver.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">[{driver.line}]</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-700">Driver:</span> {driver.driverReason}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-right text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Tomorrow Energy</span>
                  <span className="font-bold text-slate-900">{driver.forecastKwh.toLocaleString()} kWh</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Peak Incurrence</span>
                  <span className="font-semibold text-rose-600">{driver.peakTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
