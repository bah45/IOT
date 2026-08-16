import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  accent?: 'teal' | 'amber' | 'red' | 'blue' | 'slate';
  sub?: ReactNode;
}

const ACCENT: Record<string, string> = {
  teal: 'text-signal-teal ring-signal-teal/30 bg-signal-teal/10',
  amber: 'text-signal-amber ring-signal-amber/30 bg-signal-amber/10',
  red: 'text-signal-red ring-signal-red/30 bg-signal-red/10',
  blue: 'text-signal-blue ring-signal-blue/30 bg-signal-blue/10',
  slate: 'text-slate-300 ring-base-700 bg-base-800',
};

export default function MetricCard({ label, value, unit, icon: Icon, accent = 'slate', sub }: Props) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-slate-500 font-mono">{label}</span>
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ring-1 ${ACCENT[accent]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="data-value text-2xl font-semibold">{value}</span>
        {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}
