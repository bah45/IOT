import { X, ShieldAlert, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import type { AlertRow } from '@/types';

interface Props {
  alerts: AlertRow[];
  open: boolean;
  onClose: () => void;
  onAcknowledge: (id: number) => void;
}

const SEVERITY_META = {
  critical: { icon: ShieldAlert, className: 'text-signal-red bg-signal-red/10 ring-signal-red/30' },
  warning: { icon: AlertTriangle, className: 'text-signal-amber bg-signal-amber/10 ring-signal-amber/30' },
  info: { icon: Info, className: 'text-signal-blue bg-signal-blue/10 ring-signal-blue/30' },
} as const;

export default function AlertDrawer({ alerts, open, onClose, onAcknowledge }: Props) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-base-900 border-l border-base-700 z-50 transform transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-700">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-signal-red" /> Fault &amp; Emergency Log
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-base-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-base-700/60">
          {alerts.length === 0 && (
            <p className="p-6 text-sm text-slate-500 text-center">No alerts recorded yet.</p>
          )}
          {alerts.map((a) => {
            const meta = SEVERITY_META[a.severity];
            const Icon = meta.icon;
            return (
              <div key={a.id} className={`p-4 ${a.severity === 'critical' && !a.acknowledged ? 'bg-signal-red/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center ring-1 ${meta.className}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wide text-slate-400">
                        {a.trigger_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-200 mt-1">{a.description}</p>
                    {a.iso_zone && (
                      <span className="inline-block mt-1.5 text-[10px] font-mono text-slate-500">
                        {a.iso_zone.replace('_', ' ')}
                      </span>
                    )}
                    {!a.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(a.id)}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-signal-teal hover:underline"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge incident
                      </button>
                    ) : (
                      <span className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
