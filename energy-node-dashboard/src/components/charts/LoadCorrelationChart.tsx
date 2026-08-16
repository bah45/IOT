import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import type { Telemetry } from '@/types';

export default function LoadCorrelationChart({ data }: { data: Telemetry[] }) {
  const rows = data.map((d) => ({
    current: d.motor_current,
    vibration: d.vibration_rms,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="current" name="Motor Current" unit=" A" stroke="#5b6675" fontSize={10} />
        <YAxis type="number" dataKey="vibration" name="Vibration RMS" unit=" g" stroke="#5b6675" fontSize={10} />
        <ZAxis range={[60, 60]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
        <Scatter data={rows} fill="#ffb020" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
