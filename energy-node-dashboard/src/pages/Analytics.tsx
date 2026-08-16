import type { Telemetry } from '@/types';
import VibrationChart from '@/components/charts/VibrationChart';
import AnomalyChart from '@/components/charts/AnomalyChart';
import EnergyChart from '@/components/charts/EnergyChart';
import LoadCorrelationChart from '@/components/charts/LoadCorrelationChart';
import HealthRadarChart from '@/components/charts/HealthRadarChart';
import PowerBarChart from '@/components/charts/PowerBarChart';

interface Props {
  chronological: Telemetry[];
  latest?: Telemetry;
}

const PANELS = [
  { title: 'Vibration Analysis — ISO 10816 Velocity', desc: 'Velocity vs. Zone C/D thresholds' },
  { title: 'Statistical Anomaly Detection', desc: 'Kurtosis & Z-score over time' },
  { title: 'Energy Harvest vs. Storage', desc: 'LTC3588-1 output vs. supercap charge' },
  { title: 'Motor Current vs. Vibration Correlation', desc: 'Electrical load vs. mechanical stress' },
  { title: 'Machine Health Radar', desc: 'Normalized snapshot across all signatures' },
  { title: 'Power Budget', desc: 'Harvested power vs. estimated transmit draw' },
];

export default function Analytics({ chronological, latest }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {PANELS.map((p, i) => (
        <div key={p.title} className="card p-4">
          <h3 className="text-[13px] font-semibold text-slate-200">{p.title}</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-2">{p.desc}</p>
          {i === 0 && <VibrationChart data={chronological} />}
          {i === 1 && <AnomalyChart data={chronological} />}
          {i === 2 && <EnergyChart data={chronological} />}
          {i === 3 && <LoadCorrelationChart data={chronological} />}
          {i === 4 && <HealthRadarChart latest={latest} />}
          {i === 5 && <PowerBarChart latest={latest} />}
        </div>
      ))}
    </div>
  );
}
