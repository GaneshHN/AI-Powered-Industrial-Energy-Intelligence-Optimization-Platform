import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  comparison?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    isFavorable: boolean; // e.g. lower energy is favorable; higher production is favorable
    periodLabel?: string;
  };
  sublabel?: string;
  contextNote?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  comparison,
  sublabel,
  contextNote
}) => {
  return (
    <div className="bg-white border border-[#EDF1F4] rounded-xs p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between text-xs text-[#687684] mb-1 font-medium">
        <span className="truncate">{label}</span>
        {comparison && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-medium ${
              comparison.isFavorable ? 'text-[#24845A]' : 'text-[#C94A45]'
            }`}
          >
            {comparison.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {comparison.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {comparison.trend === 'neutral' && <Minus className="h-3 w-3" />}
            <span>{comparison.value}</span>
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl font-bold tracking-tight text-[#1C2834] tabular-nums font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-xs font-semibold text-[#687684] uppercase tracking-wide">
          {unit}
        </span>
      </div>

      {(sublabel || comparison?.periodLabel || contextNote) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#687684]">
          <span className="truncate">{sublabel || comparison?.periodLabel}</span>
          {contextNote && <span className="text-slate-400 font-mono text-[10px]">{contextNote}</span>}
        </div>
      )}
    </div>
  );
};
