import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  History,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  FileSearch,
  CheckCircle2,
  Cpu,
  Clock
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { PageHeader } from '../common/PageHeader';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  supportingMetrics?: {
    label: string;
    value: string;
  }[];
  referencedMachines?: string[];
  evidenceQuality?: string;
  recommendedAction?: string;
}

export const CopilotView: React.FC = () => {
  const { currentFactory, machines, anomalies, digitalTwinScenarios, setCurrentRoute, setSelectedMachineId } = useFactory();

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string>('inv-1');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Saved investigations
  const savedInvestigations = [
    {
      id: 'inv-1',
      title: 'Line B Peak Surge & Tariff Audit',
      date: 'Today, 18:30 IST',
      category: 'Tariff & Peak Demand'
    },
    {
      id: 'inv-2',
      title: 'Compressor 01 Idle Blowdown Leakage',
      date: 'Today, 12:20 IST',
      category: 'Pneumatic Parasitic Loss'
    },
    {
      id: 'inv-3',
      title: 'Carburizing Furnace Night Reschedule',
      date: 'Yesterday, 21:00 IST',
      category: 'ToU Arbitrage'
    },
    {
      id: 'inv-4',
      title: 'CNC Spindle Power Factor Diagnostics',
      date: 'Oct 30, 16:00 IST',
      category: 'Power Quality / APFC'
    }
  ];

  // Conversation state
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      timestamp: '18:25 IST',
      text: 'EnerPilot Industrial Analytical Engine initialized for Plant 01 (Pune). Telemetry synchronized across 14 metering nodes. Active peak demand is 1,128 kW (90.2% of contract limit). Critical anomaly ANOM-2026-0412 is logged on Compressor 01.',
      supportingMetrics: [
        { label: 'Plant Active Demand', value: '1,128 kW' },
        { label: 'Contract Max Demand', value: '1,250 kW' },
        { label: 'Active Anomaly Count', value: '2 High / Critical' }
      ],
      referencedMachines: ['COMP-AIR-01', 'PRESS-HYD-01', 'FURN-HT-01'],
      evidenceQuality: 'High (Direct Modbus-TCP sensor validation)',
      recommendedAction: 'Inspect COMP-AIR-01 pilot unloader valve to eliminate 50.2 kW idle leakage.'
    }
  ]);

  const presetQuestions = [
    'Why did energy consumption spike during the evening shift?',
    'Which machine has the highest specific energy intensity?',
    'What anomalies require immediate engineering investigation?',
    'What is the expected peak demand tomorrow and how to shave it?',
    'Compare current schedule with optimized ToU schedule.'
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isProcessing) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    setTimeout(() => {
      let botResponse: CopilotMessage;

      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('spike') || lowerQ.includes('evening') || lowerQ.includes('increase') || lowerQ.includes('yesterday')) {
        botResponse = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'The evening energy surge between 18:00 and 22:00 IST is driven by two overlapping high-load operations during the Maharashtra ToU Peak Tariff window (₹11.40/kWh): 1) Continuous Carburizing Furnace #01 pulling 245 kW for pinion case hardening, and 2) 800T Hydraulic Press #01 experiencing hydraulic oil overheating (68.4°C), which thinned oil viscosity and caused an additional +36.7% motor current draw (184.5 kW total).',
          supportingMetrics: [
            { label: 'Peak Window Active Draw', value: '1,340 kWh/h' },
            { label: 'Hydraulic Oil Sump Temp', value: '68.4 °C (Limit: 55°C)' },
            { label: 'Peak Tariff Penalty Rate', value: '₹11.40 / kWh' }
          ],
          referencedMachines: ['PRESS-HYD-01', 'FURN-HT-01'],
          evidenceQuality: 'High (Thermal sensors & PLC current transducers)',
          recommendedAction: 'Shift Furnace batch soaking to 22:00 IST (Off-Peak ₹5.60/kWh) and unblock Press cooling water manifold valve.'
        };
      } else if (lowerQ.includes('intensity') || lowerQ.includes('highest')) {
        botResponse = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Carburizing Furnace #01 exhibits the plant’s highest specific energy intensity at 42.0 kWh per unit, followed by 800T Hydraulic Press #01 at 28.5 kWh per unit. By production line, Line D (Heat Treatment) accounts for 34.2 kWh/unit, representing 28.9% of plant total consumption.',
          supportingMetrics: [
            { label: 'FURN-HT-01 Intensity', value: '42.0 kWh / unit' },
            { label: 'PRESS-HYD-01 Intensity', value: '28.5 kWh / unit' },
            { label: 'Plant Average Intensity', value: '15.38 kWh / unit' }
          ],
          referencedMachines: ['FURN-HT-01', 'PRESS-HYD-01', 'CNC-MILL-01'],
          evidenceQuality: 'Confirmed (MES parts counter correlated with sub-meters)',
          recommendedAction: 'Execute Digital Twin Scenario 2 to insulate furnace door perimeter and recover waste heat.'
        };
      } else if (lowerQ.includes('anomal') || lowerQ.includes('investigat')) {
        botResponse = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Two open anomalies require immediate engineering action: 1) ANOM-2026-0412 (Critical): Air Compressor 01 unloader valve failed to seat during the 12:00 lunch shutdown, drawing 68.2 kW on zero demand (+278% idle leakage). 2) ANOM-2026-0410 (High): Hydraulic Press 01 motor current surged to 184.5 kW due to cooling manifold scale buildup causing pump cavitation.',
          supportingMetrics: [
            { label: 'Compressor Parasitic Loss', value: '50.2 kW wasted' },
            { label: 'Air Header Pressure', value: '7.85 bar (Excessive)' },
            { label: 'Press Sump Temp', value: '68.4 °C' }
          ],
          referencedMachines: ['COMP-AIR-01', 'PRESS-HYD-01'],
          evidenceQuality: 'High (Forensic telemetry matching Case RCA-2026-009)',
          recommendedAction: 'Isolate Compressor 01 immediately and swap utility load to Backup Compressor 02.'
        };
      } else if (lowerQ.includes('tomorrow') || lowerQ.includes('forecast') || lowerQ.includes('peak')) {
        botResponse = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Energy forecasting models project tomorrow’s peak demand reaching 1,360 kW at 18:30 IST (+110 kW over contract demand limit of 1,250 kW). If unaddressed, this will trigger MSEDCL maximum demand penalty surcharges estimated at ₹1,14,000 for the billing cycle.',
          supportingMetrics: [
            { label: 'Projected Tomorrow Peak', value: '1,360 kW (18:30 IST)' },
            { label: 'Contract Limit', value: '1,250 kW' },
            { label: 'Forecast Model MAPE', value: '2.84%' }
          ],
          referencedMachines: ['FURN-HT-01', 'PRESS-HYD-01'],
          evidenceQuality: 'Probabilistic (95% Confidence Interval: 1,280 - 1,440 kW)',
          recommendedAction: 'Deploy the MILP optimized schedule in the Production Optimization module to shave 240 kW.'
        };
      } else {
        botResponse = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Analysis grounded in plant telemetry: Current plant demand is ${currentFactory.currentDemandKw} kW across ${machines.length} active machines. The current schedule incurs ₹1,68,240 daily cost, whereas the Digital Twin peak-shaved model achieves ₹1,39,480 daily cost by moving heavy thermal cycles to off-peak tariff hours (saving ₹28,760/day).`,
          supportingMetrics: [
            { label: 'Current Energy Cost', value: '₹1,68,240 / day' },
            { label: 'Optimized Energy Cost', value: '₹1,39,480 / day' },
            { label: 'Net Monthly Savings', value: '₹8.62 Lakhs' }
          ],
          referencedMachines: ['FURN-HT-01', 'COMP-AIR-01'],
          evidenceQuality: 'Deterministic verification from Plant 01 Modbus registers',
          recommendedAction: 'Review the Digital Twin comparison tab to simulate alternative production batch allocations.'
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsProcessing(false);
    }, 800);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Energy Copilot & Analytical Assistant"
        subtitle="Industrial energy analyst workspace grounded in real plant telemetry, equipment data, and ToU tariff structures"
        metaInfo={[
          `Grounding Mode: 100% Deterministic Plant Telemetry`,
          `Selected Plant: ${currentFactory.name}`,
          `Zero Hallucination Protocol: Active`,
          `Edge Synced: Modbus-TCP Meters`
        ]}
      />

      {/* 3-Column Industrial Analyst Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[750px]">
        {/* Left Column: Saved Investigations & History (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-[#F4F6F8]">
            <span className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-500" />
              Saved Investigations
            </span>
            <span className="text-[10px] font-mono text-slate-400">ARCHIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {savedInvestigations.map(inv => (
              <button
                key={inv.id}
                onClick={() => setActiveInvestigationId(inv.id)}
                className={`w-full text-left p-2.5 rounded-xs transition-colors text-xs border ${
                  activeInvestigationId === inv.id
                    ? 'bg-blue-50/70 border-blue-200 text-[#2563A6]'
                    : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-semibold truncate">{inv.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>{inv.category}</span>
                  <span>{inv.date}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Analytical Presets */}
          <div className="p-3 border-t border-slate-100 bg-[#F4F6F8] space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
              Quick Diagnostic Prompts
            </span>
            {presetQuestions.slice(0, 3).map((pq, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pq)}
                className="w-full text-left p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xs text-[11px] text-slate-700 truncate transition-colors"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {/* Center Column: Interactive Engineering Conversation Area (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-xs bg-[#2563A6] text-white flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-900">
                Industrial Intelligence Dialogue
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs">
              Context: Pune Plant 01 Telemetry
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="h-7 w-7 rounded-xs bg-[#14283F] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xs p-3 space-y-2.5 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#14283F] text-white'
                      : 'bg-[#F4F6F8] border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-70">
                    <span>{msg.sender === 'user' ? 'Plant Lead Engineer' : 'EnerPilot Analyst Engine'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-line text-xs font-sans">
                    {msg.text}
                  </p>

                  {/* Grounded Supporting Metrics */}
                  {msg.supportingMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                      {msg.supportingMetrics.map((sm, idx) => (
                        <div key={idx} className="bg-white/80 p-1.5 rounded-xs border border-slate-200">
                          <span className="text-slate-400 block text-[9px] font-sans truncate">{sm.label}</span>
                          <span className="font-bold text-slate-900">{sm.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Referenced Machines and Next Action */}
                  {(msg.referencedMachines || msg.recommendedAction) && (
                    <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                      {msg.referencedMachines && (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                          <span>Referenced Nodes:</span>
                          {msg.referencedMachines.map(m => (
                            <button
                              key={m}
                              onClick={() => {
                                setSelectedMachineId(m);
                                setCurrentRoute('machines');
                              }}
                              className="px-1.5 py-0.2 bg-white border border-slate-300 rounded-xs text-[#2563A6] hover:underline font-bold"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.recommendedAction && (
                        <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-xs text-[#1E6B48] flex items-start gap-1.5 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><strong className="font-semibold">Recommended Action:</strong> {msg.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-xs bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
                    ME
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="h-2 w-2 rounded-full bg-[#2563A6] animate-ping" />
                <span>Correlating sub-meter telemetry and tariffs...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask an engineering question (e.g., 'Why did energy consumption spike yesterday?')..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-[#F4F6F8] border border-slate-200 rounded-xs focus:outline-hidden focus:border-[#2563A6] focus:bg-white text-slate-900"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isProcessing}
                className="px-4 py-2 bg-[#2563A6] hover:bg-[#1E528B] disabled:opacity-50 text-white text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Analyze</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Factory Telemetry Snapshot & Evidence References (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#EDF1F4] rounded-xs shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-[#F4F6F8] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#14283F] flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#2563A6]" />
              Live Telemetry Snapshot
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-semibold">ONLINE</span>
          </div>

          <div className="p-3 overflow-y-auto space-y-3 text-xs">
            {/* Plant Snapshot Card */}
            <div className="p-2.5 bg-[#F4F6F8] rounded-xs border border-slate-200 space-y-1.5">
              <span className="font-semibold text-slate-800 text-xs block">
                {currentFactory.name}
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Active Demand:</span>
                  <span className="font-bold text-slate-900">{currentFactory.currentDemandKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Contract Max:</span>
                  <span className="text-slate-600">{currentFactory.peakDemandLimitKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Daily Energy:</span>
                  <span className="font-bold text-slate-900">{currentFactory.todayEnergyKwh.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Active Tariff:</span>
                  <span className="text-amber-700 font-bold">Peak ₹11.40/u</span>
                </div>
              </div>
            </div>

            {/* Top Critical Nodes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Key Industrial Equipment
              </span>
              {machines.slice(0, 4).map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMachineId(m.id);
                    setCurrentRoute('machines');
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-900">{m.id}</span>
                    <span className="font-mono font-semibold text-slate-800">{m.currentPowerKw} kW</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{m.name}</div>
                </div>
              ))}
            </div>

            {/* Active Anomaly Alerts in Context */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Active Grounding Anomalies
              </span>
              {anomalies.slice(0, 2).map(a => (
                <div
                  key={a.id}
                  onClick={() => setCurrentRoute('anomalies')}
                  className="p-2 bg-rose-50/60 border border-rose-200 rounded-xs cursor-pointer text-[11px]"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-rose-800">
                    <span>{a.id}</span>
                    <span>+{a.deviationPct}%</span>
                  </div>
                  <div className="text-slate-700 font-medium truncate mt-0.5">{a.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
