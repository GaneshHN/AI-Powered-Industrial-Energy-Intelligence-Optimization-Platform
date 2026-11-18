import React from 'react';
import { MachineStatus, AnomalySeverity, AnomalyStatus } from '../../types';

export type UniversalStatus =
  | MachineStatus
  | AnomalySeverity
  | AnomalyStatus
  | 'nominal'
  | 'optimal'
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'
  | 'new'
  | 'reviewed'
  | 'applied'
  | 'dismissed';

interface StatusBadgeProps {
  status: UniversalStatus;
  type?: 'machine' | 'severity' | 'lifecycle';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'machine', className = '' }) => {
  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-600';
  let label = String(status);

  switch (status) {
    case 'running':
    case 'optimal':
    case 'nominal':
    case 'resolved':
    case 'applied':
      dotColor = 'bg-[#24845A]';
      textColor = 'text-[#24845A]';
      label = status === 'nominal' ? 'Nominal' : status === 'applied' ? 'Applied' : status === 'resolved' ? 'Resolved' : 'Running';
      break;

    case 'idle':
    case 'open':
    case 'new':
      dotColor = 'bg-slate-500';
      textColor = 'text-slate-600';
      label = status === 'open' ? 'Open' : status === 'new' ? 'New' : 'Idle Standby';
      break;

    case 'warning':
    case 'medium':
    case 'investigating':
    case 'reviewed':
      dotColor = 'bg-[#D99125]';
      textColor = 'text-[#B87514]';
      label = status === 'investigating' ? 'Investigating' : status === 'reviewed' ? 'Under Review' : status === 'medium' ? 'Medium' : 'Warning';
      break;

    case 'critical':
    case 'urgent':
    case 'high':
    case 'down':
      dotColor = 'bg-[#C94A45]';
      textColor = 'text-[#C94A45]';
      label = status === 'down' ? 'Down / Tripped' : status === 'critical' ? 'Critical' : status === 'urgent' ? 'Urgent' : 'High Severity';
      break;

    case 'low':
      dotColor = 'bg-[#3478B8]';
      textColor = 'text-[#2563A6]';
      label = 'Low';
      break;

    case 'dismissed':
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-500';
      label = 'Dismissed';
      break;

    default:
      label = String(status);
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="capitalize">{label}</span>
    </span>
  );
};
