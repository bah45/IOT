import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Telemetry } from '@/types';
import { ISO_THRESHOLDS } from '@/lib/analytics';

export default function VibrationChart({ data }: { data: Telemetry[] }) {
  const rows = data.map((d) => ({
    t: new Date(d.timestamp).toLocaleTimeString(),
    velocity: d.vibration_velocity,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#5b6675" fontSize={10} tickLine={false} />
        <YAxis stroke="#5b6675" fontSize={10} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
        <ReferenceLine y={ISO_THRESHOLDS.zoneD} stroke="#ff4d4f" strokeDasharray="4 4" label={{ value: 'Zone D', fill: '#ff4d4f', fontSize: 10 }} />
        <ReferenceLine y={ISO_THRESHOLDS.zoneC} stroke="#ffb020" strokeDasharray="4 4" label={{ value: 'Zone C', fill: '#ffb020', fontSize: 10 }} />
        <Line type="monotone" dataKey="velocity" name="Velocity (mm/s)" stroke="#22d3c0" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
