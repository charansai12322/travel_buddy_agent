import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { BackendStatus } from './BackendStatus';
import type { BackendConnectionState } from '../types/api';

interface HeaderProps {
  backendStatus: BackendConnectionState;
  onRefreshHealth: () => void;
  isCheckingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  backendStatus,
  onRefreshHealth,
  isCheckingHealth,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Travel Buddy AI
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                <Sparkles className="w-2.5 h-2.5" />
                Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Your AI travel companion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BackendStatus
            status={backendStatus}
            onRefresh={onRefreshHealth}
            isChecking={isCheckingHealth}
          />
        </div>
      </div>
    </header>
  );
};
