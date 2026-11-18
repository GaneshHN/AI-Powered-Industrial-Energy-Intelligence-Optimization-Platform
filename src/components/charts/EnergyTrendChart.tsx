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
  ReferenceArea
} from 'recharts';
import { EnergyHourlyData } from '../../types';

interface EnergyTrendChartProps {
  data: EnergyHourlyData[];
  height?: number;
}

export const EnergyTrendChart: React.FC<EnergyTrendChartProps> = ({ data, height = 300 }) => {
  const [timeFilter, setTimeFilter] = useState<'24h' | 'shift' | 'peak'>('24h');

  const filteredData = React.useMemo(() => {
    if (timeFilter === 'peak') {
      return data.filter(d => parseInt(d.time.split(':')[0]) >= 16 && parseInt(d.time.split(':')[0]) <= 23);
    }
    if (timeFilter === 'shift') {
      return data.filter(d => parseInt(d.time.split(':')[0]) >= 6 && parseInt(d.time.split(':')[0]) <= 14);
    }
    return data;
  }, [data, timeFilter]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#14283F]">Hourly Energy Consumption (kWh)</span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            · ToU Peak Shaded Window (18:00 - 22:00)
          </span>
        </div>

        {/* Filter Controls (Segmented Button) */}
        <div className="flex items-center gap-1 bg-[#EDF1F4] p-0.5 rounded-xs">
          <button
            onClick={() => setTimeFilter('24h')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-xs transition-colors ${
              timeFilter === '24h'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24h Profile
          </button>
          <button
            onClick={() => setTimeFilter('shift')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-xs transition-colors ${
              timeFilter === 'shift'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shift A Only
          </button>
          <button
            onClick={() => setTimeFilter('peak')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-xs transition-colors ${
              timeFilter === 'peak'
                ? 'bg-white text-[#14283F] shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peak Tariff Window
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563A6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563A6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#687684"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EDF1F4' }}
            />
            <YAxis
              stroke="#687684"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" kWh"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as EnergyHourlyData;
                return (
                  <div className="bg-[#14283F] text-white p-2.5 rounded-xs shadow-md border border-slate-700 text-xs font-mono">
                    <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-4">
                      <span>Time: {label} IST</span>
                      {point.isPeakTariff && (
                        <span className="text-amber-400 font-sans text-[10px] uppercase font-bold">
                          Peak Tariff (₹11.40)
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 text-slate-300">
                        <span>Actual Consumption:</span>
                        <span className="text-white font-bold">{point.actualKwh} kWh</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Baseline Target:</span>
                        <span className="text-slate-300">{point.baselineKwh} kWh</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Peak Demand:</span>
                        <span className="text-amber-300">{point.peakKw} kW</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-400">
                        <span>Production Output:</span>
                        <span className="text-emerald-300">{point.productionUnits} units</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700 text-slate-300">
                        <span>Calculated Cost:</span>
                        <span className="text-white font-semibold">₹{point.costInr.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />

            {/* Peak Tariff Window Visual Reference */}
            {timeFilter === '24h' && (
              <ReferenceArea
                x1="18:00"
                x2="22:00"
                stroke="#D99125"
                strokeOpacity={0.3}
                fill="#D99125"
                fillOpacity={0.06}
                label={{ value: 'Peak Tariff (₹11.40)', position: 'insideTopLeft', fill: '#B87514', fontSize: 10 }}
              />
            )}

            <Area
              type="monotone"
              dataKey="actualKwh"
              name="Actual Energy"
              stroke="#2563A6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#actualGradient)"
            />
            <Line
              type="monotone"
              dataKey="baselineKwh"
              name="Target Baseline"
              stroke="#687684"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="forecastKwh"
              name="AI Forecast"
              stroke="#23865B"
              strokeWidth={1.5}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
