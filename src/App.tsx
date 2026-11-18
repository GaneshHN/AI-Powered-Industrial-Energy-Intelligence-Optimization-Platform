/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FactoryProvider, useFactory, AppRoute } from './context/FactoryContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/views/DashboardView';
import { EnergyIntelligenceView } from './components/views/EnergyIntelligenceView';
import { MachineMonitoringView } from './components/views/MachineMonitoringView';
import { EnergyForecastView } from './components/views/EnergyForecastView';
import { AnomalyDetectionView } from './components/views/AnomalyDetectionView';
import { RootCauseView } from './components/views/RootCauseView';
import { DigitalTwinView } from './components/views/DigitalTwinView';
import { ProductionOptimizationView } from './components/views/ProductionOptimizationView';
import { CopilotView } from './components/views/CopilotView';
import { RecommendationsView } from './components/views/RecommendationsView';
import { AlertsView } from './components/views/AlertsView';
import { SettingsView } from './components/views/SettingsView';
import { LoginView } from './components/views/LoginView';
import { CheckCircle2, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRoute, notificationMessage, clearNotification, userSession } = useFactory();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // If user is on login page or logged out
  if (currentRoute === 'login' || !userSession.isLoggedIn) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView />;
      case 'energy':
        return <EnergyIntelligenceView />;
      case 'machines':
        return <MachineMonitoringView />;
      case 'forecast':
        return <EnergyForecastView />;
      case 'anomalies':
        return <AnomalyDetectionView />;
      case 'root-cause':
        return <RootCauseView />;
      case 'digital-twin':
        return <DigitalTwinView />;
      case 'optimization':
        return <ProductionOptimizationView />;
      case 'copilot':
        return <CopilotView />;
      case 'recommendations':
        return <RecommendationsView />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1C2834] flex flex-col antialiased">
      {/* Toast Notification Banner */}
      {notificationMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-[#14283F] text-white px-4 py-2.5 rounded-xs shadow-lg border border-slate-700 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#24845A] shrink-0" />
          <span className="font-medium">{notificationMessage}</span>
          <button
            onClick={clearNotification}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Collapsible Navigation Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Primary Layout Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onOpenMobileMenu={() => setMobileOpen(true)}
          collapsed={collapsed}
        />

        {/* Content Viewport */}
        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-200 ${
            collapsed ? 'lg:pl-22' : 'lg:pl-68'
          }`}
        >
          <div className="max-w-[1440px] mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FactoryProvider>
      <AppContent />
    </FactoryProvider>
  );
}
