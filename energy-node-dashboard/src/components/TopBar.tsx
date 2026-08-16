import { Wifi, WifiOff, AlertTriangle, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import type { ConnectionState } from '@/hooks/useConnectionStatus';

interface Props {
  connectionState: ConnectionState;
  secondsSinceLast: number | null;
  realtimeConnected: boolean;
  criticalCount: number;
  onOpenAlerts: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

const STATE_META: Record<ConnectionState, { label: string; className: string }> = {
  connected: { label: 'ESP32 LIVE', className: 'bg-signal-teal/10 text-signal-teal ring-1 ring-signal-teal/30' },
  latency_high: { label: 'LATENCY HIGH', className: 'bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/30' },
  offline: { label: 'NODE OFFLINE', className: 'bg-signal-red/10 text-signal-red ring-1 ring-signal-red/30 animate-pulseSoft' },
  waiting: { label: 'AWAITING DATA', className: 'bg-base-800 text-slate-500 ring-1 ring-base-700' },
};

export default function TopBar({
  connectionState,
  secondsSinceLast,
  realtimeConnected,
  criticalCount,
  onOpenAlerts,
  soundOn,
  onToggleSound,
}: Props) {
  const meta = STATE_META[connectionState];

  return (
    <header className="sticky top-0 z-30 bg-base-950/90 backdrop-blur-md border-b border-base-700/60">
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-100 leading-tight">
            Energy-Aware Predictive Maintenance
          </h1>
          <p className="text-[11px] text-slate-500 font-mono leading-tight">
            Self-powered vibration &amp; current telemetry
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono font-medium ${meta.className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {meta.label}
            {secondsSinceLast !== null && connectionState !== 'waiting' && (
              <span className="opacity-70">· {secondsSinceLast}s ago</span>
            )}
          </div>

          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono font-medium ${
              realtimeConnected
                ? 'bg-signal-blue/10 text-signal-blue ring-1 ring-signal-blue/30'
                : 'bg-base-800 text-slate-500 ring-1 ring-base-700'
            }`}
          >
            {realtimeConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {realtimeConnected ? 'Realtime' : 'Connecting'}
          </div>

          <button
            onClick={onToggleSound}
            title="Toggle critical alert siren"
            className="p-2 rounded-md bg-base-800 text-slate-400 ring-1 ring-base-700 hover:text-slate-200"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenAlerts}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono font-medium bg-signal-red/10 text-signal-red ring-1 ring-signal-red/30 hover:bg-signal-red/20"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Faults
            {criticalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-signal-red rounded-full text-[9px] font-bold text-base-950 flex items-center justify-center">
                {criticalCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {connectionState === 'offline' && (
        <div className="px-4 lg:px-6 pb-2 flex items-center gap-2 text-[11px] text-signal-red">
          <AlertTriangle className="w-3.5 h-3.5" />
          No packet received recently — check hardware power, Wi-Fi, or Wokwi simulation status.
        </div>
      )}
    </header>
  );
}
