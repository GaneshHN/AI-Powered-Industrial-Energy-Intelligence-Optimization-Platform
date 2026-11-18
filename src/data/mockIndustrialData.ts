import {
  Factory,
  Machine,
  EnergyHourlyData,
  MachineDistribution,
  LineContribution,
  ShiftPerformance,
  Anomaly,
  RootCauseInvestigation,
  DigitalTwinScenario,
  ProductionScheduleItem,
  Recommendation,
  AlertItem
} from '../types';

export const FACTORIES: Factory[] = [
  {
    id: 'plant-01-pune',
    name: 'Plant 01 — Pune Automotive Press & Powertrain',
    code: 'PUN-MFG-01',
    location: 'Chakan Industrial Corridor, Pune, Maharashtra',
    status: 'warning',
    linesCount: 5,
    machinesCount: 14,
    activeShift: 'Shift B (14:00 - 22:00 IST)',
    peakDemandLimitKw: 1250,
    currentDemandKw: 1128,
    baselineEnergyIntensity: 14.2, // kWh / unit
    currentEnergyIntensity: 15.4,
    todayEnergyKwh: 18450,
    todayProductionUnits: 1205,
    todayCostInr: 168240,
    todayCo2eKg: 13284,
    tariffPeakInr: 11.40,
    tariffNormalInr: 8.40,
    tariffOffPeakInr: 5.60
  },
  {
    id: 'plant-02-chennai',
    name: 'Plant 02 — Chennai Transmission & Precision CNC',
    code: 'MAA-CNC-02',
    location: 'Sriperumbudur Industrial Area, Chennai, Tamil Nadu',
    status: 'optimal',
    linesCount: 4,
    machinesCount: 18,
    activeShift: 'Shift B (14:00 - 22:00 IST)',
    peakDemandLimitKw: 1400,
    currentDemandKw: 980,
    baselineEnergyIntensity: 18.5,
    currentEnergyIntensity: 18.1,
    todayEnergyKwh: 15200,
    todayProductionUnits: 840,
    todayCostInr: 136800,
    todayCo2eKg: 10944,
    tariffPeakInr: 10.80,
    tariffNormalInr: 8.10,
    tariffOffPeakInr: 5.40
  },
  {
    id: 'plant-03-sanand',
    name: 'Plant 03 — Sanand Aluminum Die-Casting & Stamping',
    code: 'AMD-CAST-03',
    location: 'GIDC Sanand Phase II, Ahmedabad, Gujarat',
    status: 'optimal',
    linesCount: 3,
    machinesCount: 10,
    activeShift: 'Shift B (14:00 - 22:00 IST)',
    peakDemandLimitKw: 1800,
    currentDemandKw: 1350,
    baselineEnergyIntensity: 22.0,
    currentEnergyIntensity: 21.8,
    todayEnergyKwh: 22400,
    todayProductionUnits: 1028,
    todayCostInr: 197120,
    todayCo2eKg: 16128,
    tariffPeakInr: 10.50,
    tariffNormalInr: 7.90,
    tariffOffPeakInr: 5.20
  }
];

export const MACHINES: Machine[] = [
  {
    id: 'PRESS-HYD-01',
    name: '800T Hydraulic Forming Press',
    line: 'Line B — Press & Stamping',
    status: 'warning',
    currentPowerKw: 184.5,
    ratedPowerKw: 220,
    energyTodayKwh: 3420,
    utilizationPct: 82.4,
    runtimeHours: 13.8,
    idleHours: 2.2,
    powerFactor: 0.88,
    temperatureC: 68.4,
    vibrationMmS: 4.8,
    maintenanceStatus: 'scheduled',
    daysToNextMaintenance: 4,
    specificEnergyKwhPerUnit: 28.5,
    hourlyOutputUnits: 65,
    lastAnomaly: 'High idle draw during die changeover'
  },
  {
    id: 'FURN-HT-01',
    name: 'Continuous Carburizing Furnace',
    line: 'Line D — Heat Treatment',
    status: 'running',
    currentPowerKw: 245.0,
    ratedPowerKw: 300,
    energyTodayKwh: 4860,
    utilizationPct: 94.0,
    runtimeHours: 15.5,
    idleHours: 0.5,
    powerFactor: 0.95,
    temperatureC: 920.0,
    vibrationMmS: 1.2,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 28,
    specificEnergyKwhPerUnit: 42.0,
    hourlyOutputUnits: 38
  },
  {
    id: 'CNC-MILL-01',
    name: '5-Axis Precision Vertical Mill',
    line: 'Line A — CNC Machining',
    status: 'running',
    currentPowerKw: 42.8,
    ratedPowerKw: 55,
    energyTodayKwh: 680,
    utilizationPct: 78.5,
    runtimeHours: 12.5,
    idleHours: 3.5,
    powerFactor: 0.92,
    temperatureC: 44.2,
    vibrationMmS: 2.1,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 18,
    specificEnergyKwhPerUnit: 8.6,
    hourlyOutputUnits: 52
  },
  {
    id: 'CNC-MILL-02',
    name: 'Horizontal Twin-Spindle Machining Center',
    line: 'Line A — CNC Machining',
    status: 'running',
    currentPowerKw: 56.2,
    ratedPowerKw: 75,
    energyTodayKwh: 910,
    utilizationPct: 81.0,
    runtimeHours: 13.0,
    idleHours: 3.0,
    powerFactor: 0.91,
    temperatureC: 48.0,
    vibrationMmS: 2.4,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 14,
    specificEnergyKwhPerUnit: 9.2,
    hourlyOutputUnits: 60
  },
  {
    id: 'COMP-AIR-01',
    name: '75kW Rotary Screw Air Compressor',
    line: 'Plant Utilities',
    status: 'warning',
    currentPowerKw: 71.4,
    ratedPowerKw: 75,
    energyTodayKwh: 1420,
    utilizationPct: 88.0,
    runtimeHours: 15.8,
    idleHours: 0.2,
    powerFactor: 0.84,
    temperatureC: 78.5,
    vibrationMmS: 3.8,
    maintenanceStatus: 'overdue',
    daysToNextMaintenance: -2,
    specificEnergyKwhPerUnit: 0.0,
    hourlyOutputUnits: 0,
    lastAnomaly: 'Unloading valve blow-by failure'
  },
  {
    id: 'INJ-MOLD-01',
    name: '350T Electric Injection Molding Cell',
    line: 'Line C — Polymer Molding',
    status: 'running',
    currentPowerKw: 88.5,
    ratedPowerKw: 110,
    energyTodayKwh: 1540,
    utilizationPct: 84.5,
    runtimeHours: 13.5,
    idleHours: 2.5,
    powerFactor: 0.93,
    temperatureC: 220.0,
    vibrationMmS: 1.8,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 21,
    specificEnergyKwhPerUnit: 14.1,
    hourlyOutputUnits: 110
  },
  {
    id: 'PRESS-MECH-02',
    name: '400T High-Speed Stamping Press',
    line: 'Line B — Press & Stamping',
    status: 'running',
    currentPowerKw: 92.0,
    ratedPowerKw: 130,
    energyTodayKwh: 1780,
    utilizationPct: 76.2,
    runtimeHours: 12.0,
    idleHours: 4.0,
    powerFactor: 0.89,
    temperatureC: 52.0,
    vibrationMmS: 3.2,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 35,
    specificEnergyKwhPerUnit: 12.4,
    hourlyOutputUnits: 140
  },
  {
    id: 'WELD-ROB-01',
    name: 'Automated 6-Axis Spot Welding Cell',
    line: 'Line E — Final Assembly',
    status: 'idle',
    currentPowerKw: 12.4,
    ratedPowerKw: 60,
    energyTodayKwh: 420,
    utilizationPct: 54.0,
    runtimeHours: 8.5,
    idleHours: 7.5,
    powerFactor: 0.79,
    temperatureC: 38.0,
    vibrationMmS: 1.0,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 42,
    specificEnergyKwhPerUnit: 5.2,
    hourlyOutputUnits: 80
  },
  {
    id: 'CHILLER-01',
    name: 'Central Closed-Loop Water Chiller (120 TR)',
    line: 'Plant Utilities',
    status: 'running',
    currentPowerKw: 110.0,
    ratedPowerKw: 140,
    energyTodayKwh: 2180,
    utilizationPct: 79.0,
    runtimeHours: 16.0,
    idleHours: 0.0,
    powerFactor: 0.92,
    temperatureC: 12.4,
    vibrationMmS: 1.9,
    maintenanceStatus: 'nominal',
    daysToNextMaintenance: 11,
    specificEnergyKwhPerUnit: 0.0,
    hourlyOutputUnits: 0
  },
  {
    id: 'INDUCT-HEAT-02',
    name: 'Dual-Spindle Induction Hardening Rig',
    line: 'Line D — Heat Treatment',
    status: 'down',
    currentPowerKw: 0.0,
    ratedPowerKw: 90,
    energyTodayKwh: 480,
    utilizationPct: 22.0,
    runtimeHours: 3.5,
    idleHours: 12.5,
    powerFactor: 0.0,
    temperatureC: 28.0,
    vibrationMmS: 0.0,
    maintenanceStatus: 'in_progress',
    daysToNextMaintenance: 0,
    specificEnergyKwhPerUnit: 16.0,
    hourlyOutputUnits: 0,
    lastAnomaly: 'IGBT inverter bridge trip on over-current'
  }
];

export const HOURLY_ENERGY_SERIES: EnergyHourlyData[] = [
  { time: '00:00', actualKwh: 620, baselineKwh: 640, forecastKwh: 615, forecastLower: 590, forecastUpper: 640, peakKw: 680, productionUnits: 45, costInr: 3472, isPeakTariff: false },
  { time: '01:00', actualKwh: 590, baselineKwh: 630, forecastKwh: 600, forecastLower: 575, forecastUpper: 625, peakKw: 650, productionUnits: 42, costInr: 3304, isPeakTariff: false },
  { time: '02:00', actualKwh: 610, baselineKwh: 620, forecastKwh: 610, forecastLower: 585, forecastUpper: 635, peakKw: 670, productionUnits: 44, costInr: 3416, isPeakTariff: false },
  { time: '03:00', actualKwh: 580, baselineKwh: 610, forecastKwh: 590, forecastLower: 565, forecastUpper: 615, peakKw: 640, productionUnits: 40, costInr: 3248, isPeakTariff: false },
  { time: '04:00', actualKwh: 640, baselineKwh: 630, forecastKwh: 630, forecastLower: 605, forecastUpper: 655, peakKw: 710, productionUnits: 46, costInr: 3584, isPeakTariff: false },
  { time: '05:00', actualKwh: 710, baselineKwh: 680, forecastKwh: 700, forecastLower: 670, forecastUpper: 730, peakKw: 790, productionUnits: 50, costInr: 3976, isPeakTariff: false },
  { time: '06:00', actualKwh: 980, baselineKwh: 940, forecastKwh: 960, forecastLower: 920, forecastUpper: 1000, peakKw: 1040, productionUnits: 72, costInr: 8232, isPeakTariff: false },
  { time: '07:00', actualKwh: 1120, baselineKwh: 1050, forecastKwh: 1080, forecastLower: 1030, forecastUpper: 1130, peakKw: 1190, productionUnits: 88, costInr: 9408, isPeakTariff: false },
  { time: '08:00', actualKwh: 1180, baselineKwh: 1100, forecastKwh: 1120, forecastLower: 1070, forecastUpper: 1170, peakKw: 1220, productionUnits: 94, costInr: 9912, isPeakTariff: false },
  { time: '09:00', actualKwh: 1220, baselineKwh: 1150, forecastKwh: 1160, forecastLower: 1110, forecastUpper: 1210, peakKw: 1280, productionUnits: 98, costInr: 10248, isPeakTariff: false },
  { time: '10:00', actualKwh: 1240, baselineKwh: 1180, forecastKwh: 1190, forecastLower: 1140, forecastUpper: 1240, peakKw: 1290, productionUnits: 102, costInr: 10416, isPeakTariff: false },
  { time: '11:00', actualKwh: 1210, baselineKwh: 1160, forecastKwh: 1170, forecastLower: 1120, forecastUpper: 1220, peakKw: 1260, productionUnits: 96, costInr: 10164, isPeakTariff: false },
  { time: '12:00', actualKwh: 880, baselineKwh: 820, forecastKwh: 840, forecastLower: 800, forecastUpper: 880, peakKw: 950, productionUnits: 55, costInr: 7392, isPeakTariff: false }, // Lunch break
  { time: '13:00', actualKwh: 1190, baselineKwh: 1140, forecastKwh: 1150, forecastLower: 1100, forecastUpper: 1200, peakKw: 1240, productionUnits: 95, costInr: 9996, isPeakTariff: false },
  { time: '14:00', actualKwh: 1230, baselineKwh: 1150, forecastKwh: 1170, forecastLower: 1120, forecastUpper: 1220, peakKw: 1280, productionUnits: 96, costInr: 10332, isPeakTariff: false },
  { time: '15:00', actualKwh: 1260, baselineKwh: 1170, forecastKwh: 1190, forecastLower: 1140, forecastUpper: 1240, peakKw: 1310, productionUnits: 99, costInr: 10584, isPeakTariff: false },
  { time: '16:00', actualKwh: 1280, baselineKwh: 1180, forecastKwh: 1200, forecastLower: 1150, forecastUpper: 1250, peakKw: 1320, productionUnits: 101, costInr: 10752, isPeakTariff: false },
  { time: '17:00', actualKwh: 1290, baselineKwh: 1190, forecastKwh: 1210, forecastLower: 1160, forecastUpper: 1260, peakKw: 1340, productionUnits: 100, costInr: 10836, isPeakTariff: false },
  { time: '18:00', actualKwh: 1340, baselineKwh: 1120, forecastKwh: 1240, forecastLower: 1180, forecastUpper: 1300, peakKw: 1380, productionUnits: 92, costInr: 15276, isPeakTariff: true }, // PEAK TARIFF START
  { time: '19:00', actualKwh: 1320, baselineKwh: 1100, forecastKwh: 1230, forecastLower: 1170, forecastUpper: 1290, peakKw: 1360, productionUnits: 90, costInr: 15048, isPeakTariff: true },
  { time: '20:00', actualKwh: 1290, baselineKwh: 1080, forecastKwh: 1210, forecastLower: 1150, forecastUpper: 1270, peakKw: 1330, productionUnits: 88, costInr: 14706, isPeakTariff: true },
  { time: '21:00', actualKwh: 1210, baselineKwh: 1040, forecastKwh: 1150, forecastLower: 1090, forecastUpper: 1210, peakKw: 1270, productionUnits: 82, costInr: 13794, isPeakTariff: true },
  { time: '22:00', actualKwh: 860, baselineKwh: 810, forecastKwh: 830, forecastLower: 790, forecastUpper: 870, peakKw: 920, productionUnits: 60, costInr: 4816, isPeakTariff: false }, // PEAK TARIFF END
  { time: '23:00', actualKwh: 740, baselineKwh: 720, forecastKwh: 730, forecastLower: 700, forecastUpper: 760, peakKw: 800, productionUnits: 52, costInr: 4144, isPeakTariff: false }
];

export const MACHINE_DISTRIBUTIONS: MachineDistribution[] = [
  { machineId: 'FURN-HT-01', name: 'Carburizing Furnace #01', line: 'Line D', energyKwh: 4860, sharePct: 26.3, status: 'running', powerKw: 245.0 },
  { machineId: 'PRESS-HYD-01', name: '800T Hydraulic Press #01', line: 'Line B', energyKwh: 3420, sharePct: 18.5, status: 'warning', powerKw: 184.5 },
  { machineId: 'CHILLER-01', name: 'Central Chiller #01', line: 'Utilities', energyKwh: 2180, sharePct: 11.8, status: 'running', powerKw: 110.0 },
  { machineId: 'PRESS-MECH-02', name: '400T Stamping Press #02', line: 'Line B', energyKwh: 1780, sharePct: 9.6, status: 'running', powerKw: 92.0 },
  { machineId: 'INJ-MOLD-01', name: '350T Injection Mold #01', line: 'Line C', energyKwh: 1540, sharePct: 8.3, status: 'running', powerKw: 88.5 },
  { machineId: 'COMP-AIR-01', name: '75kW Air Compressor #01', line: 'Utilities', energyKwh: 1420, sharePct: 7.7, status: 'warning', powerKw: 71.4 },
  { machineId: 'CNC-MILL-02', name: 'Twin Spindle CNC #02', line: 'Line A', energyKwh: 910, sharePct: 4.9, status: 'running', powerKw: 56.2 },
  { machineId: 'CNC-MILL-01', name: '5-Axis Vertical Mill #01', line: 'Line A', energyKwh: 680, sharePct: 3.7, status: 'running', powerKw: 42.8 },
  { machineId: 'INDUCT-HEAT-02', name: 'Induction Rig #02', line: 'Line D', energyKwh: 480, sharePct: 2.6, status: 'down', powerKw: 0.0 },
  { machineId: 'WELD-ROB-01', name: 'Spot Welding Cell #01', line: 'Line E', energyKwh: 420, sharePct: 2.3, status: 'idle', powerKw: 12.4 }
];

export const LINE_CONTRIBUTIONS: LineContribution[] = [
  { lineId: 'LINE-D', name: 'Line D — Heat Treatment', energyKwh: 5340, sharePct: 28.9, machineCount: 2, activePowerKw: 245.0, energyIntensityKwhPerUnit: 34.2 },
  { lineId: 'LINE-B', name: 'Line B — Press & Stamping', energyKwh: 5200, sharePct: 28.2, machineCount: 3, activePowerKw: 276.5, energyIntensityKwhPerUnit: 18.6 },
  { lineId: 'LINE-UTIL', name: 'Plant Utilities (Air & Chilling)', energyKwh: 3600, sharePct: 19.5, machineCount: 2, activePowerKw: 181.4, energyIntensityKwhPerUnit: 3.0 },
  { lineId: 'LINE-A', name: 'Line A — Precision CNC Machining', energyKwh: 2270, sharePct: 12.3, machineCount: 4, activePowerKw: 142.0, energyIntensityKwhPerUnit: 9.8 },
  { lineId: 'LINE-C', name: 'Line C — Polymer Injection Molding', energyKwh: 1540, sharePct: 8.3, machineCount: 2, activePowerKw: 88.5, energyIntensityKwhPerUnit: 14.1 },
  { lineId: 'LINE-E', name: 'Line E — Final Assembly & Welding', energyKwh: 500, sharePct: 2.7, machineCount: 1, activePowerKw: 12.4, energyIntensityKwhPerUnit: 4.8 }
];

export const SHIFT_PERFORMANCES: ShiftPerformance[] = [
  {
    shiftId: 'SHIFT-A',
    name: 'Shift A (Morning)',
    hours: '06:00 - 14:00',
    energyKwh: 7150,
    unitsProduced: 520,
    energyIntensity: 13.75,
    costInr: 60060,
    leadOperator: 'S. Kulkarni (Production Supv)',
    compliancePct: 96.2
  },
  {
    shiftId: 'SHIFT-B',
    name: 'Shift B (Evening / Peak Tariff)',
    hours: '14:00 - 22:00',
    energyKwh: 8620,
    unitsProduced: 485,
    energyIntensity: 17.77,
    costInr: 88420,
    leadOperator: 'P. Deshmukh (Energy Lead)',
    compliancePct: 78.4
  },
  {
    shiftId: 'SHIFT-C',
    name: 'Shift C (Night / Off-Peak)',
    hours: '22:00 - 06:00',
    energyKwh: 2680,
    unitsProduced: 200,
    energyIntensity: 13.40,
    costInr: 15008,
    leadOperator: 'A. Nair (Maintenance Supv)',
    compliancePct: 94.8
  }
];

export const ANOMALIES: Anomaly[] = [
  {
    id: 'ANOM-2026-0412',
    machineId: 'COMP-AIR-01',
    machineName: '75kW Rotary Screw Air Compressor',
    line: 'Plant Utilities',
    detectedAt: 'Today, 12:15 IST',
    expectedKw: 18.0,
    actualKw: 68.2,
    deviationPct: 278.8,
    severity: 'critical',
    status: 'open',
    category: 'Idle Leakage',
    description: 'Compressor maintaining 91% full load power during factory lunch break (zero pneumatic production demand).',
    evidence: [
      { label: 'Unload Solenoid Valve Voltage', value: '0V (De-energized command sent)', threshold: '0V', nature: 'Observed' },
      { label: 'Receiver Tank Pressure', value: '7.8 bar (Above setpoint)', threshold: '6.5 - 7.2 bar', nature: 'Observed' },
      { label: 'Blowdown Exhaust Flow', value: 'High continuous venting audible', threshold: '0 Nm³/h', nature: 'Correlated' },
      { label: 'Root Cause Confidence', value: 'Mechanical bypass valve sticking in loaded stroke', threshold: '> 85%', nature: 'Confirmed' }
    ],
    operatingConditions: 'Plant Lunch Shutdown window (12:00 - 13:00); pneumatic line demand was < 4 Nm³/min, yet compressor consumed 68.2 kW.',
    investigationNotes: 'Inspection assigned to Maintenance Shift B. Suspected mechanical debris in intake modulation poppet.'
  },
  {
    id: 'ANOM-2026-0410',
    machineId: 'PRESS-HYD-01',
    machineName: '800T Hydraulic Forming Press',
    line: 'Line B — Press & Stamping',
    detectedAt: 'Today, 18:24 IST',
    expectedKw: 135.0,
    actualKw: 184.5,
    deviationPct: 36.7,
    severity: 'high',
    status: 'investigating',
    category: 'Motor Overload',
    description: 'Pump motor current surge of +36.7% occurring concurrently with Maharashtra peak tariff window start.',
    evidence: [
      { label: 'Hydraulic Oil Sump Temperature', value: '68.4 °C', threshold: '< 55.0 °C max nominal', nature: 'Observed' },
      { label: 'Proportional Relief Valve Position', value: '88% throttled', threshold: '< 40% in return cycle', nature: 'Correlated' },
      { label: 'Pressure Drop across Return Filter', value: '3.4 bar (differential)', threshold: '< 1.8 bar clean', nature: 'Contributing' },
      { label: 'Peak Tariff Penalty Accrual', value: '₹11.40 / kWh', threshold: 'Off-Peak ₹5.60', nature: 'Confirmed' }
    ],
    operatingConditions: 'Running automotive chassis cross-member stamping batch. Sump temperature exceeded thermal threshold.',
    investigationNotes: 'Proportional valve flow restriction identified; maintenance cleaning scheduled for 22:00 tonight.'
  },
  {
    id: 'ANOM-2026-0408',
    machineId: 'FURN-HT-01',
    machineName: 'Continuous Carburizing Furnace',
    line: 'Line D — Heat Treatment',
    detectedAt: 'Yesterday, 20:10 IST',
    expectedKw: 210.0,
    actualKw: 245.0,
    deviationPct: 16.7,
    severity: 'medium',
    status: 'resolved',
    category: 'Thermal Dissipation',
    description: 'Zone 2 heating elements pulling excessive baseline power to maintain 920°C holding setpoint.',
    evidence: [
      { label: 'Outer Shell Thermal Camera Spot', value: '86 °C on door seal quadrant', threshold: '< 45 °C skin temp', nature: 'Observed' },
      { label: 'Atmosphere Gas Consumption', value: '+14% Endothermic gas', threshold: 'Nominal 22 Nm³/h', nature: 'Correlated' },
      { label: 'Ceramic Fiber Gasket Wear', value: 'Gasket perimeter displacement', threshold: 'Flush clamp fit', nature: 'Confirmed' }
    ],
    operatingConditions: 'Full continuous 24h heat treatment campaign.',
    investigationNotes: 'Door perimeter ceramic sealing cord reseated during 06:00 shift change. Temperature returned to nominal 42°C skin.'
  },
  {
    id: 'ANOM-2026-0399',
    machineId: 'CNC-MILL-01',
    machineName: '5-Axis Precision Vertical Mill',
    line: 'Line A — CNC Machining',
    detectedAt: 'Oct 30, 15:42 IST',
    expectedKw: 34.0,
    actualKw: 42.8,
    deviationPct: 25.9,
    severity: 'low',
    status: 'resolved',
    category: 'Power Factor Drop',
    description: 'Spindle drive regeneration circuit capacitor degradation pulling power factor down to 0.78.',
    evidence: [
      { label: 'Power Factor (cos φ)', value: '0.78 inductive', threshold: '> 0.92 minimum', nature: 'Observed' },
      { label: 'KVAR Reactive Demand', value: '28.4 kVAR', threshold: '< 12 kVAR', nature: 'Observed' },
      { label: 'Spindle Bearing Temperature', value: '44.2 °C', threshold: '< 50 °C', nature: 'Correlated' }
    ],
    operatingConditions: 'Hard-milling 42CrMo4 gear steel forgings.',
    investigationNotes: 'Local APFC capacitor bank module #2 replaced. PF restored to 0.94.'
  }
];

export const ROOT_CAUSE_CASES: RootCauseInvestigation[] = [
  {
    id: 'RCA-2026-009',
    title: 'Pneumatic System Parasitic Leakage & Blowdown Failure on Compressor 01',
    anomalyId: 'ANOM-2026-0412',
    machineId: 'COMP-AIR-01',
    detectedIssue: 'Severe parasitic energy drain (50.2 kW excess) during scheduled unworked production intervals.',
    investigationSummary: 'The 75kW rotary screw compressor failed to transition to blowdown standby upon plant line idle command. Telemetry correlates elevated receiver pressure with non-responsive solenoid pilot valve.',
    evidenceStrength: 'High',
    findings: [
      {
        category: 'Observed',
        parameter: 'Standby Power Draw',
        reading: '68.2 kW (91% full load)',
        expectedRange: '15.0 - 18.0 kW (unloaded idle)',
        impact: 'Wasting 50.2 kWh per idle hour; ₹421 / hour unrecoverable loss.'
      },
      {
        category: 'Correlated',
        parameter: 'Air Line Header Pressure',
        reading: '7.85 bar steady',
        expectedRange: '6.50 - 7.00 bar operating range',
        impact: 'Exceeding safety band by 0.85 bar; causing unnecessary artificial demand in pneumatic cylinders.'
      },
      {
        category: 'Potential Contributor',
        parameter: 'Compressor Intake Modulation Plate',
        reading: '40% open mechanical position',
        expectedRange: '0% closed when unloader energized',
        impact: 'Physical obstruction or spring fatigue preventing complete sealing.'
      },
      {
        category: 'Confirmed',
        parameter: 'Unload Solenoid Actuator',
        reading: 'Core seized with particulate emulsion',
        expectedRange: 'Free mechanical travel (12mm)',
        impact: 'Direct root cause: air pilot line moisture ingress emulsified valve grease.'
      }
    ],
    recommendedActions: [
      {
        step: 1,
        action: 'Isolate Compressor 01 and swap utility load to Backup Compressor 02 (55kW VFD unit).',
        owner: 'Duty Utility Engineer (M. Shinde)',
        estimatedDowntimeMin: 15,
        expectedSavingKwh: 50.2,
        status: 'Completed'
      },
      {
        step: 2,
        action: 'Disassemble intake poppet valve; replace pilot solenoid coil and Teflon plunger seal kit.',
        owner: 'Atlas Copco OEM Certified Technician',
        estimatedDowntimeMin: 90,
        expectedSavingKwh: 350.0,
        status: 'In Progress'
      },
      {
        step: 3,
        action: 'Purge desiccant dryer pre-filter coalescing element to eliminate future oil-water emulsion.',
        owner: 'Pneumatic Maintenance Lead',
        estimatedDowntimeMin: 30,
        expectedSavingKwh: 40.0,
        status: 'Pending'
      }
    ],
    timeline: [
      { time: '12:00 IST', event: 'Plant assembly lines paused for Shift Lunch transition; pneumatic flow drops to 2.8 Nm³/min.', severity: 'low' },
      { time: '12:05 IST', event: 'Compressor 01 command state switched to UNLOAD. Active power failed to drop below 68 kW.', severity: 'medium' },
      { time: '12:15 IST', event: 'EnerPilot Anomaly Engine triggered Critical Alert ANOM-2026-0412 (+278% over baseline).', severity: 'critical' },
      { time: '12:22 IST', event: 'Root Cause investigation opened; telemetry correlation confirmed solenoid plunger seizure.', severity: 'high' }
    ]
  },
  {
    id: 'RCA-2026-008',
    title: 'Hydraulic Stamping Press 01 Heat Exchanger Throttling & Cavitation Draw',
    anomalyId: 'ANOM-2026-0410',
    machineId: 'PRESS-HYD-01',
    detectedIssue: 'Hydraulic power consumption climbed 49.5 kW above standard stamping stroke profile.',
    investigationSummary: 'Thermal runaway in hydraulic sump oil caused fluid viscosity drop from ISO VG 46 nominal to 28 cSt equivalent, inducing internal gear pump slip and forcing the 220kW motor to operate at high slip torque.',
    evidenceStrength: 'High',
    findings: [
      {
        category: 'Observed',
        parameter: 'Hydraulic Oil Sump Temp',
        reading: '68.4 °C',
        expectedRange: '45.0 - 52.0 °C nominal',
        impact: 'Oil viscosity thinned out; high internal recirculation leakages.'
      },
      {
        category: 'Correlated',
        parameter: 'Cooling Water Flow Rate',
        reading: '18 L/min',
        expectedRange: '60 - 80 L/min design capacity',
        impact: 'Cooling tower manifold valve found 70% throttled following morning line maintenance.'
      },
      {
        category: 'Potential Contributor',
        parameter: 'Proportional Relief Valve Drift',
        reading: 'Holding pressure 240 bar in neutral return',
        expectedRange: '< 30 bar circulation pressure',
        impact: 'Continuous throttling loss converted directly into heat.'
      },
      {
        category: 'Confirmed',
        parameter: 'Main Cooling Manifold Valve',
        reading: 'Partially choked by scale buildup',
        expectedRange: 'Full open bore (DN50)',
        impact: 'Cooling starvation allowed sump temperature to cross 65°C trigger point.'
      }
    ],
    recommendedActions: [
      {
        step: 1,
        action: 'Open secondary bypass valve on cooling line to restore 75 L/min coolant flow.',
        owner: 'Line B Maintenance Tech',
        estimatedDowntimeMin: 5,
        expectedSavingKwh: 38.0,
        status: 'Completed'
      },
      {
        step: 2,
        action: 'Recalibrate proportional relief valve null offset in PLC controller.',
        owner: 'Automation & Controls Eng',
        estimatedDowntimeMin: 20,
        expectedSavingKwh: 12.0,
        status: 'In Progress'
      }
    ],
    timeline: [
      { time: '16:30 IST', event: 'Line B started heavy-gauge stamping cross-member campaign.', severity: 'low' },
      { time: '17:15 IST', event: 'Sump temperature crossed 58°C; motor average load increased by 18 kW.', severity: 'medium' },
      { time: '18:00 IST', event: 'Evening peak tariff window initiated (₹11.40/kWh).', severity: 'high' },
      { time: '18:24 IST', event: 'Peak power reached 184.5 kW; EnerPilot triggered Motor Overload / Peak Penalty Anomaly.', severity: 'critical' }
    ]
  }
];

export const DIGITAL_TWIN_SCENARIOS: DigitalTwinScenario[] = [
  {
    id: 'SCENARIO-BASELINE',
    name: 'Current Operational Schedule (As-Is)',
    description: 'Current 3-shift factory schedule with Carburizing Furnace and 800T Press operating continuously through Maharashtra peak tariff hours (18:00 - 22:00 IST).',
    productionTargetUnits: 1200,
    shiftHours: 24,
    peakShavingEnabled: false,
    activeLines: ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D', 'LINE-E', 'LINE-UTIL'],
    plannedMaintenanceMachines: [],
    simulatedEnergyKwh: 18450,
    simulatedCostInr: 168240,
    simulatedPeakKw: 1380,
    simulatedCo2eKg: 13284,
    targetMet: true,
    deltaEnergyPct: 0.0,
    deltaCostInr: 0,
    deltaPeakKw: 0
  },
  {
    id: 'SCENARIO-PEAK-SHAVED',
    name: 'EnerPilot ToU Peak-Shaved Schedule (Simulated)',
    description: 'Shifts Furnace high-temperature batch cycles from peak hours (18:00-22:00) into Night Tariff (22:00-06:00), limits Press 01 stamping to 70% rate during peak, and pre-chills storage.',
    productionTargetUnits: 1200,
    shiftHours: 24,
    peakShavingEnabled: true,
    activeLines: ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D', 'LINE-E', 'LINE-UTIL'],
    plannedMaintenanceMachines: ['COMP-AIR-01'],
    simulatedEnergyKwh: 17120,
    simulatedCostInr: 139480,
    simulatedPeakKw: 1140,
    simulatedCo2eKg: 12326,
    targetMet: true,
    deltaEnergyPct: -7.2,
    deltaCostInr: -28760, // Per day savings
    deltaPeakKw: -240
  },
  {
    id: 'SCENARIO-ECO-THROTTLE',
    name: 'Max Efficiency & Compressor VFD Simulation',
    description: 'Compressor bypass repair active, CNC machine eco-standby timers reduced from 10m to 2m, and chiller water setpoint raised by +1.5°C during low-ambient evening hours.',
    productionTargetUnits: 1180,
    shiftHours: 24,
    peakShavingEnabled: true,
    activeLines: ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D', 'LINE-UTIL'],
    plannedMaintenanceMachines: ['COMP-AIR-01', 'PRESS-HYD-01'],
    simulatedEnergyKwh: 16340,
    simulatedCostInr: 132100,
    simulatedPeakKw: 1090,
    simulatedCo2eKg: 11765,
    targetMet: true,
    deltaEnergyPct: -11.4,
    deltaCostInr: -36140,
    deltaPeakKw: -290
  }
];

export const PRODUCTION_SCHEDULE: ProductionScheduleItem[] = [
  { id: 'SCH-01', machineId: 'PRESS-HYD-01', machineName: '800T Press #01', line: 'Line B', taskName: 'Front Subframe Stamping (Batch #408)', startTime: '06:00', endTime: '12:00', durationHours: 6, plannedUnits: 390, avgPowerKw: 145, totalEnergyKwh: 870, tariffZone: 'Normal', isOptimized: false },
  { id: 'SCH-02', machineId: 'PRESS-HYD-01', machineName: '800T Press #01', line: 'Line B', taskName: 'Cross-Member High-Draw Punching', startTime: '13:00', endTime: '18:00', durationHours: 5, plannedUnits: 325, avgPowerKw: 155, totalEnergyKwh: 775, tariffZone: 'Normal', isOptimized: false },
  { id: 'SCH-03', machineId: 'PRESS-HYD-01', machineName: '800T Press #01', line: 'Line B', taskName: 'Rear Longitudinal Bumper Pressing', startTime: '18:00', endTime: '22:00', durationHours: 4, plannedUnits: 240, avgPowerKw: 175, totalEnergyKwh: 700, tariffZone: 'Peak', isOptimized: false },
  { id: 'SCH-04', machineId: 'FURN-HT-01', machineName: 'Carburizing Furnace #01', line: 'Line D', taskName: 'Pinion Shaft Case Hardening (Batch #12)', startTime: '14:00', endTime: '22:00', durationHours: 8, plannedUnits: 280, avgPowerKw: 245, totalEnergyKwh: 1960, tariffZone: 'Peak', isOptimized: false },
  { id: 'SCH-05', machineId: 'CNC-MILL-01', machineName: '5-Axis CNC #01', line: 'Line A', taskName: 'Cylinder Head Port Finishing', startTime: '06:00', endTime: '14:00', durationHours: 8, plannedUnits: 410, avgPowerKw: 42, totalEnergyKwh: 336, tariffZone: 'Normal', isOptimized: false },
  { id: 'SCH-06', machineId: 'CNC-MILL-02', machineName: 'Twin Spindle CNC #02', line: 'Line A', taskName: 'Gearbox Housing Rough Boring', startTime: '06:00', endTime: '14:00', durationHours: 8, plannedUnits: 480, avgPowerKw: 56, totalEnergyKwh: 448, tariffZone: 'Normal', isOptimized: false },
  { id: 'SCH-07', machineId: 'INJ-MOLD-01', machineName: '350T Injection Mold #01', line: 'Line C', taskName: 'Engine Cover Baffle Molding', startTime: '08:00', endTime: '20:00', durationHours: 12, plannedUnits: 1320, avgPowerKw: 88, totalEnergyKwh: 1056, tariffZone: 'Normal', isOptimized: false },
  // OPTIMIZED SCHEDULE RECOMMENDATIONS:
  { id: 'SCH-OPT-01', machineId: 'FURN-HT-01', machineName: 'Carburizing Furnace #01', line: 'Line D', taskName: 'Pinion Shaft Case Hardening (Optimized)', startTime: '22:00', endTime: '06:00', durationHours: 8, plannedUnits: 280, avgPowerKw: 245, totalEnergyKwh: 1960, tariffZone: 'Off-Peak', isOptimized: true },
  { id: 'SCH-OPT-02', machineId: 'PRESS-HYD-01', machineName: '800T Press #01', line: 'Line B', taskName: 'Rear Longitudinal Bumper (Shifted to Day)', startTime: '10:00', endTime: '14:00', durationHours: 4, plannedUnits: 240, avgPowerKw: 150, totalEnergyKwh: 600, tariffZone: 'Normal', isOptimized: true }
];

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'REC-2026-101',
    title: 'Shift Continuous Carburizing Heat Soak Cycle to Night Tariff Window',
    machineId: 'FURN-HT-01',
    machineName: 'Continuous Carburizing Furnace',
    line: 'Line D — Heat Treatment',
    issue: 'High-power 245kW thermal soak occurs between 18:00 and 22:00 IST at maximum tariff (₹11.40/kWh).',
    recommendedAction: 'Reschedule primary batch loading to 22:00 IST to execute holding soak during Off-Peak tariff (₹5.60/kWh). Maintain low-power holding seal during 18:00-22:00.',
    engineeringReason: 'Furnace thermal mass retains temperature with only 32kW holding power. Moving the 245kW thermal absorption stroke saves ₹5.80 per kWh for 4 hours daily.',
    priority: 'urgent',
    status: 'new',
    monthlySavingsInr: 162400,
    kwhReductionMonthly: 0, // Tariff arbitrage, cost savings
    co2AvoidedKgMonthly: 4800,
    paybackPeriodDays: 1
  },
  {
    id: 'REC-2026-102',
    title: 'Rectify Compressor 01 Solenoid Unload Valve & Lower Header Pressure to 6.8 bar',
    machineId: 'COMP-AIR-01',
    machineName: '75kW Rotary Screw Air Compressor',
    line: 'Plant Utilities',
    issue: 'Idle power remains at 68.2 kW due to sticking poppet valve; receiver operating at 7.85 bar (0.85 bar above tooling requirement).',
    recommendedAction: 'Replace pilot solenoid plunger and drop target line regulator to 6.8 bar. Every 1 bar reduction cuts compressor power by ~7%.',
    engineeringReason: 'Eliminates 50kW idle bypass drain during breaks and reduces continuous motor power draw by 6.0%.',
    priority: 'urgent',
    status: 'reviewed',
    monthlySavingsInr: 114500,
    kwhReductionMonthly: 13600,
    co2AvoidedKgMonthly: 9792,
    paybackPeriodDays: 3
  },
  {
    id: 'REC-2026-103',
    title: 'Install Variable Frequency Drive (VFD) on Hydraulic Press 01 Cooling Circulator',
    machineId: 'PRESS-HYD-01',
    machineName: '800T Hydraulic Forming Press',
    line: 'Line B — Press & Stamping',
    issue: 'Cooling water pump runs full speed (30kW) regardless of hydraulic oil temperature or press cycling.',
    recommendedAction: 'Install closed-loop temperature-controlled VFD modulating pump flow to maintain exact 48°C oil temperature.',
    engineeringReason: 'Reduces auxiliary cooling pumping power by 55% during machine idle, die changeover, and light-gauge stamping strokes.',
    priority: 'high',
    status: 'new',
    monthlySavingsInr: 48200,
    kwhReductionMonthly: 5740,
    co2AvoidedKgMonthly: 4132,
    paybackPeriodDays: 45
  },
  {
    id: 'REC-2026-104',
    title: 'Activate Automated Machine Tool Spindle Deep Sleep on CNC Mill Bank',
    machineId: 'CNC-MILL-01',
    machineName: '5-Axis Precision Vertical Mill',
    line: 'Line A — CNC Machining',
    issue: 'Hydraulic chuck clamping and high-pressure coolant pump idle for average 3.5 hours/day between part loadings.',
    recommendedAction: 'Configure Fanuc CNC Eco-Mode parameter #1240 to switch auxiliary coolant pumps to standby after 90 seconds of part unload.',
    engineeringReason: 'Cuts non-productive idle standby power from 12.8 kW down to 1.8 kW during operator setup intervals.',
    priority: 'medium',
    status: 'applied',
    monthlySavingsInr: 32600,
    kwhReductionMonthly: 3880,
    co2AvoidedKgMonthly: 2793,
    paybackPeriodDays: 0
  },
  {
    id: 'REC-2026-105',
    title: 'Automatic Power Factor Correction (APFC) Capacitor Bank Tuning on Line A',
    machineId: 'CNC-MILL-02',
    machineName: 'Twin Spindle CNC #02',
    line: 'Line A — CNC Machining',
    issue: 'Discharged capacitor cell causes local line power factor to sag to 0.88, risking utility kVA demand surcharge.',
    recommendedAction: 'Replace defective 25 kVAR capacitor step and calibrate thyristor switching relay.',
    engineeringReason: 'Restores power factor to 0.98, avoiding MSEDCL low-power-factor penalty surcharge.',
    priority: 'medium',
    status: 'new',
    monthlySavingsInr: 24800,
    kwhReductionMonthly: 1200,
    co2AvoidedKgMonthly: 864,
    paybackPeriodDays: 15
  }
];

export const ALERTS: AlertItem[] = [
  {
    id: 'ALT-1092',
    timestamp: 'Today, 18:24 IST',
    severity: 'critical',
    machineId: 'PRESS-HYD-01',
    machineName: '800T Hydraulic Forming Press',
    category: 'Peak Demand & Tariff Risk',
    description: 'Demand spike to 184.5 kW during ToU Peak Tariff Window (₹11.40/kWh). Plant demand reaching 1128 kW (90% of contract max demand limit).',
    isResolved: false
  },
  {
    id: 'ALT-1091',
    timestamp: 'Today, 12:15 IST',
    severity: 'critical',
    machineId: 'COMP-AIR-01',
    machineName: '75kW Rotary Screw Air Compressor',
    category: 'Unload Valve Leakage',
    description: 'Compressor drawing 68.2 kW during zero-pneumatic plant lunch window. Parasitic idle loss exceeding 50.2 kW.',
    isResolved: false
  },
  {
    id: 'ALT-1088',
    timestamp: 'Today, 11:30 IST',
    severity: 'warning',
    machineId: 'COMP-AIR-01',
    machineName: '75kW Rotary Screw Air Compressor',
    category: 'Maintenance Overdue',
    description: 'Desiccant air dryer pre-filter differential pressure crossed 0.8 bar. Scheduled service overdue by 2 days.',
    isResolved: false
  },
  {
    id: 'ALT-1084',
    timestamp: 'Yesterday, 20:10 IST',
    severity: 'warning',
    machineId: 'FURN-HT-01',
    machineName: 'Carburizing Furnace #01',
    category: 'Thermal Loss',
    description: 'Zone 2 heating elements increased power by +16.7% to maintain setpoint. Door perimeter thermal leak confirmed.',
    isResolved: true,
    acknowledgedBy: 'S. Kulkarni (Shift Lead)'
  },
  {
    id: 'ALT-1079',
    timestamp: 'Oct 30, 15:42 IST',
    severity: 'info',
    machineId: 'CNC-MILL-01',
    machineName: '5-Axis Precision Vertical Mill',
    category: 'Power Factor',
    description: 'Power factor recovered to 0.94 following APFC step #2 replacement.',
    isResolved: true,
    acknowledgedBy: 'P. Deshmukh'
  }
];
