import type { AlertRow, Telemetry } from '@/types';
import { estimateAutonomyHours, summarize } from '@/lib/analytics';
import { BatteryCharging, Clock, TrendingUp, Wrench } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import VibrationChart from '@/components/charts/VibrationChart';

interface Props {
  chronological: Telemetry[];
  latest?: Telemetry;
  alerts: AlertRow[];
}

export default function Reliability({ chronological, latest, alerts }: Props) {
  const velocityStats = summarize(chronological.map((t) => t.vibration_velocity));
  const critical = alerts.filter((a) => a.severity === 'critical');

  // Simple MTBF-style estimate: window span / number of critical events (if any)
  const windowMs =
    chronological.length > 1
      ? new Date(chronological[chronological.length - 1].timestamp).getTime() - new Date(chronological[0].timestamp).getTime()
      : 0;
  const windowHours = windowMs / 3.6e6;
  const mtbfHours = critical.length > 0 ? windowHours / critical.length : windowHours || 0;

  const autonomy = latest ? estimateAutonomyHours(latest.supercap_voltage) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Peak Velocity (window)" value={velocityStats.max.toFixed(2)} unit="mm/s" icon={TrendingUp} accent="amber" />
        <MetricCard label="Avg Velocity (window)" value={velocityStats.avg.toFixed(2)} unit="mm/s" icon={TrendingUp} accent="teal" />
        <MetricCard label="Est. MTBF (critical faults)" value={mtbfHours ? mtbfHours.toFixed(1) : '—'} unit="hrs" icon={Wrench} accent="blue" />
        <MetricCard label="Energy Autonomy" value={autonomy.toFixed(1)} unit="hrs standby" icon={BatteryCharging} accent="slate" />
      </div>

      <div className="card p-4">
        <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500 mb-2">Vibration Trend — Reliability Window</h3>
        <VibrationChart data={chronological} />
      </div>

      <div className="card p-4">
        <h3 className="text-[13px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-signal-teal" /> Maintenance Recommendation
        </h3>
        {critical.length === 0 ? (
          <p className="text-sm text-slate-400">No critical faults recorded in this session — condition-based maintenance is not currently indicated.</p>
        ) : (
          <p className="text-sm text-slate-400">
            {critical.length} critical event(s) recorded. Average time between critical faults is approximately{' '}
            <span className="text-slate-200 font-medium">{mtbfHours.toFixed(1)} hours</span> in this window — schedule an inspection if this trend continues.
          </p>
        )}
      </div>
    </div>
  );
}
