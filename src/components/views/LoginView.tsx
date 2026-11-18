import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';

export const LoginView: React.FC = () => {
  const { loginUser, setCurrentRoute } = useFactory();

  const [email, setEmail] = useState('r.mehta@auto-tier1.enerpilot.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Principal Energy & Operations Lead');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide valid enterprise credentials.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginUser(email, role);
    }, 600);
  };

  const setDemoRole = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('IndustrialPilot2026!');
    setRole(demoRole);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-[#14283F] text-white flex items-center justify-center font-mono font-bold text-base shadow-xs">
              EP
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#14283F] block leading-tight">
                EnerPilot
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block">
                Industrial Energy OS
              </span>
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-center text-sm font-semibold text-slate-700">
          Sign in to Manufacturing Plant Telemetry
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-[#EDF1F4] rounded-xs sm:px-10 space-y-5">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Enterprise Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F6F8] border border-slate-200 rounded-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#2563A6] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-[#F4F6F8] border border-slate-200 rounded-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#2563A6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#2563A6] rounded-xs" />
                <span>Keep session active</span>
              </label>
              <a href="#reset" className="font-semibold text-[#2563A6] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#14283F] hover:bg-[#202B36] text-white font-semibold rounded-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>{isLoading ? 'Verifying SSO Signature...' : 'Sign In to Operations Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block text-center">
              Quick Role Presets (One-Click Testing)
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDemoRole('r.mehta@auto-tier1.enerpilot.io', 'Principal Energy & Plant Operations Lead')}
                className="w-full text-left p-2 bg-[#F4F6F8] hover:bg-[#EDF1F4] border border-slate-200 rounded-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-800">R. Mehta (Energy Lead)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Full Audit & Scheduling Access</div>
                </div>
                <span className="text-[10px] font-mono text-[#2563A6] font-semibold">Select →</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('s.kulkarni@plant.enerpilot.io', 'Production Shift Supervisor')}
                className="w-full text-left p-2 bg-[#F4F6F8] hover:bg-[#EDF1F4] border border-slate-200 rounded-xs flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-800">S. Kulkarni (Shift Supervisor)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Machine Control & Dispatch</div>
                </div>
                <span className="text-[10px] font-mono text-[#2563A6] font-semibold">Select →</span>
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-mono">
            Yuva Yodha Energy Tech Hackathon 2026 · Smart Manufacturing
          </div>
        </div>
      </div>
    </div>
  );
};
