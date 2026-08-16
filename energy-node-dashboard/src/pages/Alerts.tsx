import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { AlertRow, Severity } from '@/types';

interface Props {
  alerts: AlertRow[];
  onAcknowledge: (id: number) => void;
}

const FILTERS: { key: 'all' | Severity; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
];

const META = {
  critical: { icon: ShieldAlert, className: 'text-signal-red bg-signal-red/10 ring-signal-red/30' },
  warning: { icon: AlertTriangle, className: 'text-signal-amber bg-signal-amber/10 ring-signal-amber/30' },
  info: { icon: Info, className: 'text-signal-blue bg-signal-blue/10 ring-signal-blue/30' },
} as const;

export default function Alerts({ alerts, onAcknowledge }: Props) {
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length,
    info: alerts.filter((a) => a.severity === 'info' && !a.acknowledged).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-signal-red data-value">{counts.critical}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Critical unresolved</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-signal-amber data-value">{counts.warning}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Warning unresolved</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-signal-blue data-value">{counts.info}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Info unresolved</p>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium ${
              filter === f.key
                ? 'bg-signal-teal/15 text-signal-teal ring-1 ring-signal-teal/30'
                : 'bg-base-800 text-slate-400 ring-1 ring-base-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-base-700/50">
        {filtered.length === 0 && <p className="p-6 text-center text-slate-500 text-sm">No alerts match this filter.</p>}
        {filtered.map((a) => {
          const meta = META[a.severity];
          const Icon = meta.icon;
          return (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center ring-1 ${meta.className}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-mono uppercase text-slate-400">{a.trigger_type}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-200 mt-1">{a.description}</p>
              </div>
              {!a.acknowledged ? (
                <button
                  onClick={() => onAcknowledge(a.id)}
                  className="shrink-0 text-[11px] font-medium text-signal-teal hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                </button>
              ) : (
                <span className="shrink-0 text-[11px] text-slate-600">Acknowledged</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
