import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { EnergyHourlyData } from '../../types';

interface ProductionVsEnergyChartProps {
  data: EnergyHourlyData[];
  height?: number;
}

export const ProductionVsEnergyChart: React.FC<ProductionVsEnergyChartProps> = ({
  data,
  height = 260
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#14283F]">
          Production Units vs. Energy (Correlation & Idle Loss)
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Secondary Axis: Units Output
        </span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#687684"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EDF1F4' }}
            />
            {/* Left Y Axis: Energy kWh */}
            <YAxis
              yAxisId="energy"
              stroke="#2563A6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" kWh"
            />
            {/* Right Y Axis: Production Units */}
            <YAxis
              yAxisId="units"
              orientation="right"
              stroke="#23865B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" u"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as EnergyHourlyData;
                const specificIntensity = (point.actualKwh / Math.max(1, point.productionUnits)).toFixed(2);
                return (
                  <div className="bg-[#14283F] text-white p-2 rounded-xs shadow-md border border-slate-700 text-xs font-mono">
                    <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
                      Time: {label} IST
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-4 text-slate-300">
                        <span>Energy:</span>
                        <span className="font-bold text-[#60A5FA]">{point.actualKwh} kWh</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-300">
                        <span>Production:</span>
                        <span className="font-bold text-[#34D399]">{point.productionUnits} Units</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700 text-amber-300">
                        <span>Specific Intensity:</span>
                        <span>{specificIntensity} kWh / unit</span>
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
            <Bar
              yAxisId="units"
              dataKey="productionUnits"
              name="Production (Units)"
              fill="#23865B"
              fillOpacity={0.75}
              radius={[2, 2, 0, 0]}
              barSize={12}
            />
            <Line
              yAxisId="energy"
              type="monotone"
              dataKey="actualKwh"
              name="Energy (kWh)"
              stroke="#2563A6"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
