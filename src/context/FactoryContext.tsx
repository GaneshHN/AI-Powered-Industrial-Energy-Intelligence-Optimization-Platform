import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Factory,
  Machine,
  EnergyHourlyData,
  Anomaly,
  RootCauseInvestigation,
  DigitalTwinScenario,
  ProductionScheduleItem,
  Recommendation,
  AlertItem,
  UserSession
} from '../types';
import {
  FACTORIES,
  MACHINES,
  HOURLY_ENERGY_SERIES,
  ANOMALIES,
  ROOT_CAUSE_CASES,
  DIGITAL_TWIN_SCENARIOS,
  PRODUCTION_SCHEDULE,
  RECOMMENDATIONS,
  ALERTS
} from '../data/mockIndustrialData';

export type DateRange = 'today' | 'yesterday' | 'last7days' | 'monthToDate';
export type AppRoute =
  | 'dashboard'
  | 'energy'
  | 'machines'
  | 'forecast'
  | 'anomalies'
  | 'root-cause'
  | 'digital-twin'
  | 'optimization'
  | 'copilot'
  | 'recommendations'
  | 'alerts'
  | 'settings'
  | 'login';

interface FactoryContextType {
  // Navigation & View
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  selectedMachineId: string | null;
  setSelectedMachineId: (id: string | null) => void;
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (id: string | null) => void;
  selectedRcaId: string | null;
  setSelectedRcaId: (id: string | null) => void;

  // Global Context Selectors
  factories: Factory[];
  selectedFactoryId: string;
  setSelectedFactoryId: (id: string) => void;
  currentFactory: Factory;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedShift: string;
  setSelectedShift: (shift: string) => void;
  
  // Real-time telemetry simulation
  isLiveTelemetry: boolean;
  setIsLiveTelemetry: (live: boolean) => void;
  lastTelemetryTimestamp: string;
  triggerManualRefresh: () => void;

  // Data states
  machines: Machine[];
  hourlySeries: EnergyHourlyData[];
  anomalies: Anomaly[];
  rcaCases: RootCauseInvestigation[];
  digitalTwinScenarios: DigitalTwinScenario[];
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  productionSchedule: ProductionScheduleItem[];
  recommendations: Recommendation[];
  alerts: AlertItem[];
  
  // User Session
  userSession: UserSession;
  loginUser: (email: string, role: string) => void;
  logoutUser: () => void;

  // Actions
  updateMachineStatus: (id: string, status: Machine['status']) => void;
  updateAnomalyStatus: (id: string, status: Anomaly['status']) => void;
  updateRecommendationStatus: (id: string, status: Recommendation['status']) => void;
  resolveAlert: (id: string) => void;
  applyOptimizedSchedule: () => void;
  runScenarioSimulation: (config: Partial<DigitalTwinScenario>) => DigitalTwinScenario;
  
  // Notifications feedback
  notificationMessage: string | null;
  clearNotification: () => void;
  showNotification: (msg: string) => void;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export const FactoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [selectedRcaId, setSelectedRcaId] = useState<string | null>(null);

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(FACTORIES[0].id);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [isLiveTelemetry, setIsLiveTelemetry] = useState<boolean>(true);
  const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState<string>('Just now');

  const [machines, setMachines] = useState<Machine[]>(MACHINES);
  const [hourlySeries, setHourlySeries] = useState<EnergyHourlyData[]>(HOURLY_ENERGY_SERIES);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(ANOMALIES);
  const [rcaCases, setRcaCases] = useState<RootCauseInvestigation[]>(ROOT_CAUSE_CASES);
  const [digitalTwinScenarios, setDigitalTwinScenarios] = useState<DigitalTwinScenario[]>(DIGITAL_TWIN_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCENARIO-PEAK-SHAVED');
  const [productionSchedule, setProductionSchedule] = useState<ProductionScheduleItem[]>(PRODUCTION_SCHEDULE);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(RECOMMENDATIONS);
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const [userSession, setUserSession] = useState<UserSession>({
    name: 'Rajesh Mehta',
    role: 'Principal Energy & Plant Operations Lead',
    email: 'r.mehta@auto-tier1.enerpilot.io',
    plantAccess: ['PUN-MFG-01', 'MAA-CNC-02', 'AMD-CAST-03'],
    isLoggedIn: true
  });

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const clearNotification = () => setNotificationMessage(null);

  const currentFactory = FACTORIES.find(f => f.id === selectedFactoryId) || FACTORIES[0];

  // Subtle real-time telemetry updates for industrial realism
  useEffect(() => {
    if (!isLiveTelemetry) return;

    const interval = setInterval(() => {
      const date = new Date();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastTelemetryTimestamp(timeStr);

      // Jitter machine powers slightly by +/- 0.5% to simulate active edge gateway polling
      setMachines(prev => prev.map(m => {
        if (m.status !== 'running') return m;
        const delta = (Math.random() - 0.5) * 1.2;
        const newPower = Math.max(5, Number((m.currentPowerKw + delta).toFixed(1)));
        return {
          ...m,
          currentPowerKw: newPower
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveTelemetry]);

  const triggerManualRefresh = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastTelemetryTimestamp(timeStr);
    showNotification('Edge telemetry synchronized across all 14 metering nodes.');
  };

  const loginUser = (email: string, role: string) => {
    setUserSession({
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role,
      email,
      plantAccess: ['PUN-MFG-01', 'MAA-CNC-02', 'AMD-CAST-03'],
      isLoggedIn: true
    });
    setCurrentRoute('dashboard');
    showNotification(`Logged in successfully as ${role}`);
  };

  const logoutUser = () => {
    setUserSession(prev => ({ ...prev, isLoggedIn: false }));
    setCurrentRoute('login');
    showNotification('Session concluded.');
  };

  const updateMachineStatus = (id: string, status: Machine['status']) => {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    showNotification(`Machine ${id} operational status set to ${status.toUpperCase()}.`);
  };

  const updateAnomalyStatus = (id: string, status: Anomaly['status']) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    showNotification(`Anomaly ${id} marked as ${status}.`);
  };

  const updateRecommendationStatus = (id: string, status: Recommendation['status']) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showNotification(`Recommendation ${id} updated to ${status}.`);
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true, acknowledgedBy: userSession.name } : a));
    showNotification(`Alert ${id} acknowledged & resolved.`);
  };

  const applyOptimizedSchedule = () => {
    setProductionSchedule(prev => prev.map(s => {
      if (s.id === 'SCH-04') {
        // Shift furnace to night
        return {
          ...s,
          startTime: '22:00',
          endTime: '06:00',
          tariffZone: 'Off-Peak',
          isOptimized: true
        };
      }
      if (s.id === 'SCH-03') {
        // Shift press out of peak
        return {
          ...s,
          startTime: '10:00',
          endTime: '14:00',
          tariffZone: 'Normal',
          isOptimized: true
        };
      }
      return s;
    }));
    showNotification('Optimized dispatch schedule applied to MES / PLC gateway.');
  };

  const runScenarioSimulation = (config: Partial<DigitalTwinScenario>): DigitalTwinScenario => {
    const targetUnits = config.productionTargetUnits || 1200;
    const isPeakShaved = config.peakShavingEnabled ?? true;

    // Realistic calculation based on energy intensity
    const baseKwh = targetUnits * 14.8;
    const peakPenaltyFactor = isPeakShaved ? 0.92 : 1.05;
    const simulatedKwh = Math.round(baseKwh * (isPeakShaved ? 0.93 : 1.0));
    const simulatedPeak = Math.round(isPeakShaved ? 1120 : 1360);
    const avgTariff = isPeakShaved ? 7.60 : 9.15;
    const simulatedCost = Math.round(simulatedKwh * avgTariff);
    const simulatedCo2 = Math.round(simulatedKwh * 0.72);

    const deltaEnergy = Number((((simulatedKwh - 18450) / 18450) * 100).toFixed(1));
    const deltaCost = simulatedCost - 168240;
    const deltaPeak = simulatedPeak - 1380;

    const newScenario: DigitalTwinScenario = {
      id: `SIM-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: config.name || 'Custom Simulation',
      description: config.description || 'Simulated dynamic scenario with user constraints.',
      productionTargetUnits: targetUnits,
      shiftHours: config.shiftHours || 24,
      peakShavingEnabled: isPeakShaved,
      activeLines: config.activeLines || ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D', 'LINE-UTIL'],
      plannedMaintenanceMachines: config.plannedMaintenanceMachines || [],
      simulatedEnergyKwh: simulatedKwh,
      simulatedCostInr: simulatedCost,
      simulatedPeakKw: simulatedPeak,
      simulatedCo2eKg: simulatedCo2,
      targetMet: true,
      deltaEnergyPct: deltaEnergy,
      deltaCostInr: deltaCost,
      deltaPeakKw: deltaPeak
    };

    setDigitalTwinScenarios(prev => [newScenario, ...prev]);
    setActiveScenarioId(newScenario.id);
    showNotification('Digital Twin simulation completed with deterministic physics model.');
    return newScenario;
  };

  return (
    <FactoryContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        selectedMachineId,
        setSelectedMachineId,
        selectedAnomalyId,
        setSelectedAnomalyId,
        selectedRcaId,
        setSelectedRcaId,
        factories: FACTORIES,
        selectedFactoryId,
        setSelectedFactoryId,
        currentFactory,
        dateRange,
        setDateRange,
        selectedShift,
        setSelectedShift,
        isLiveTelemetry,
        setIsLiveTelemetry,
        lastTelemetryTimestamp,
        triggerManualRefresh,
        machines,
        hourlySeries,
        anomalies,
        rcaCases,
        digitalTwinScenarios,
        activeScenarioId,
        setActiveScenarioId,
        productionSchedule,
        recommendations,
        alerts,
        userSession,
        loginUser,
        logoutUser,
        updateMachineStatus,
        updateAnomalyStatus,
        updateRecommendationStatus,
        resolveAlert,
        applyOptimizedSchedule,
        runScenarioSimulation,
        notificationMessage,
        clearNotification,
        showNotification
      }}
    >
      {children}
    </FactoryContext.Provider>
  );
};

export const useFactory = () => {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
};
