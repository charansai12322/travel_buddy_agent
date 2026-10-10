import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { BackendConnectionState } from '../types/api';

interface BackendStatusProps {
  status: BackendConnectionState;
  onRefresh: () => void;
  isChecking: boolean;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({
  status,
  onRefresh,
  isChecking,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          status === 'connected'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
            : status === 'checking'
            ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
            : 'bg-rose-50 text-rose-700 border border-rose-200/80'
        }`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'connected'
              ? 'bg-emerald-500'
              : status === 'checking'
              ? 'bg-amber-500 animate-pulse'
              : 'bg-rose-500'
          }`}
          aria-hidden="true"
        />

        {status === 'connected' && (
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            <span>Backend connected</span>
          </span>
        )}

        {status === 'checking' && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Checking connection</span>
          </span>
        )}

        {status === 'unavailable' && (
          <span className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            <span>Backend unavailable</span>
          </span>
        )}
      </div>

      <button
        onClick={onRefresh}
        disabled={isChecking}
        className="text-slate-400 hover:text-slate-600 disabled:opacity-40 p-1 rounded transition-colors"
        title="Check backend status"
        aria-label="Recheck backend health status"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
