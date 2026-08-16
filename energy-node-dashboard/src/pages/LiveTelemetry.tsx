import type { Telemetry } from '@/types';
import VibrationChart from '@/components/charts/VibrationChart';
import AnomalyChart from '@/components/charts/AnomalyChart';
import { isoZoneFromVelocity } from '@/lib/analytics';
import IsoZoneBadge from '@/components/IsoZoneBadge';

interface Props {
  telemetry: Telemetry[]; // newest first
  chronological: Telemetry[];
}

const FIELDS: { key: keyof Telemetry; label: string; unit: string; digits: number }[] = [
  { key: 'vibration_rms', label: 'Vibration RMS', unit: 'g', digits: 3 },
  { key: 'vibration_velocity', label: 'Velocity', unit: 'mm/s', digits: 2 },
  { key: 'kurtosis', label: 'Kurtosis', unit: '', digits: 2 },
  { key: 'z_score', label: 'Z-Score', unit: '', digits: 2 },
  { key: 'motor_current', label: 'Current', unit: 'A', digits: 2 },
  { key: 'harvest_rate_mw', label: 'Harvest', unit: 'mW', digits: 1 },
  { key: 'supercap_voltage', label: 'Supercap', unit: 'V', digits: 2 },
];

export default function LiveTelemetry({ telemetry, chronological }: Props) {
  const latest = telemetry[0];

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden waveform-track">
        <div className="px-4 py-3 border-b border-base-700/60 flex items-center justify-between">
          <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500">Live Stream — Vibration Velocity</h3>
          {latest && <IsoZoneBadge zone={isoZoneFromVelocity(latest.vibration_velocity)} />}
        </div>
        <div className="p-4">
          <VibrationChart data={chronological} />
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500 mb-2">Statistical Anomaly Trace</h3>
        <AnomalyChart data={chronological} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-slate-500 font-mono uppercase text-[10px] border-b border-base-700/60">
              <th className="px-4 py-2.5">Time</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="px-4 py-2.5">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/40">
            {telemetry.slice(0, 20).map((row) => (
              <tr key={row.id} className="hover:bg-base-800/40">
                <td className="px-4 py-2 font-mono text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</td>
                {FIELDS.map((f) => (
                  <td key={f.key} className="px-4 py-2 font-mono data-value">
                    {(row[f.key] as number).toFixed(f.digits)} <span className="text-slate-600">{f.unit}</span>
                  </td>
                ))}
              </tr>
            ))}
            {telemetry.length === 0 && (
              <tr>
                <td colSpan={FIELDS.length + 1} className="px-4 py-8 text-center text-slate-500">
                  No live packets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
