export type FactoryStatus = 'optimal' | 'warning' | 'critical';

export interface Factory {
  id: string;
  name: string;
  code: string;
  location: string;
  status: FactoryStatus;
  linesCount: number;
  machinesCount: number;
  activeShift: string;
  peakDemandLimitKw: number;
  currentDemandKw: number;
  baselineEnergyIntensity: number; // kWh per unit
  currentEnergyIntensity: number;
  todayEnergyKwh: number;
  todayProductionUnits: number;
  todayCostInr: number;
  todayCo2eKg: number;
  tariffPeakInr: number;
  tariffNormalInr: number;
  tariffOffPeakInr: number;
}

export type MachineStatus = 'running' | 'idle' | 'warning' | 'down';
export type MaintenanceStatus = 'nominal' | 'scheduled' | 'overdue' | 'in_progress';

export interface Machine {
  id: string;
  name: string;
  line: string;
  status: MachineStatus;
  currentPowerKw: number;
  ratedPowerKw: number;
  energyTodayKwh: number;
  utilizationPct: number;
  runtimeHours: number;
  idleHours: number;
  powerFactor: number;
  temperatureC: number;
  vibrationMmS: number;
  maintenanceStatus: MaintenanceStatus;
  daysToNextMaintenance: number;
  specificEnergyKwhPerUnit: number;
  hourlyOutputUnits: number;
  lastAnomaly?: string;
}

export interface EnergyHourlyData {
  time: string; // "00:00", "01:00", etc.
  actualKwh: number;
  baselineKwh: number;
  forecastKwh?: number;
  forecastLower?: number;
  forecastUpper?: number;
  peakKw: number;
  productionUnits: number;
  costInr: number;
  isPeakTariff: boolean;
}

export interface MachineDistribution {
  machineId: string;
  name: string;
  line: string;
  energyKwh: number;
  sharePct: number;
  status: MachineStatus;
  powerKw: number;
}

export interface LineContribution {
  lineId: string;
  name: string;
  energyKwh: number;
  sharePct: number;
  machineCount: number;
  activePowerKw: number;
  energyIntensityKwhPerUnit: number;
}

export interface ShiftPerformance {
  shiftId: string;
  name: string;
  hours: string;
  energyKwh: number;
  unitsProduced: number;
  energyIntensity: number;
  costInr: number;
  leadOperator: string;
  compliancePct: number;
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface Anomaly {
  id: string;
  machineId: string;
  machineName: string;
  line: string;
  detectedAt: string;
  expectedKw: number;
  actualKw: number;
  deviationPct: number;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  category: 'Idle Leakage' | 'Motor Overload' | 'Thermal Dissipation' | 'Power Factor Drop' | 'Harmonic Distortion' | 'Peak Penalty';
  description: string;
  evidence: {
    label: string;
    value: string;
    threshold: string;
    nature: 'Observed' | 'Correlated' | 'Contributing' | 'Confirmed';
  }[];
  operatingConditions: string;
  investigationNotes?: string;
}

export interface RootCauseInvestigation {
  id: string;
  title: string;
  anomalyId: string;
  machineId: string;
  detectedIssue: string;
  investigationSummary: string;
  evidenceStrength: 'High' | 'Moderate' | 'Correlated';
  findings: {
    category: 'Observed' | 'Correlated' | 'Potential Contributor' | 'Confirmed';
    parameter: string;
    reading: string;
    expectedRange: string;
    impact: string;
  }[];
  recommendedActions: {
    step: number;
    action: string;
    owner: string;
    estimatedDowntimeMin: number;
    expectedSavingKwh: number;
    status: 'Pending' | 'In Progress' | 'Completed';
  }[];
  timeline: {
    time: string;
    event: string;
    severity: AnomalySeverity;
  }[];
}

export interface DigitalTwinScenario {
  id: string;
  name: string;
  description: string;
  productionTargetUnits: number;
  shiftHours: number;
  peakShavingEnabled: boolean;
  activeLines: string[];
  plannedMaintenanceMachines: string[];
  simulatedEnergyKwh: number;
  simulatedCostInr: number;
  simulatedPeakKw: number;
  simulatedCo2eKg: number;
  targetMet: boolean;
  deltaEnergyPct: number;
  deltaCostInr: number;
  deltaPeakKw: number;
}

export interface ProductionScheduleItem {
  id: string;
  machineId: string;
  machineName: string;
  line: string;
  taskName: string;
  startTime: string; // e.g. "06:00"
  endTime: string;   // e.g. "12:00"
  durationHours: number;
  plannedUnits: number;
  avgPowerKw: number;
  totalEnergyKwh: number;
  tariffZone: 'Off-Peak' | 'Normal' | 'Peak';
  isOptimized: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  machineId: string;
  machineName: string;
  line: string;
  issue: string;
  recommendedAction: string;
  engineeringReason: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'new' | 'reviewed' | 'applied' | 'dismissed';
  monthlySavingsInr: number;
  kwhReductionMonthly: number;
  co2AvoidedKgMonthly: number;
  paybackPeriodDays: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  machineId: string;
  machineName: string;
  category: string;
  description: string;
  isResolved: boolean;
  acknowledgedBy?: string;
}

export interface UserSession {
  name: string;
  role: string;
  email: string;
  plantAccess: string[];
  isLoggedIn: boolean;
}
