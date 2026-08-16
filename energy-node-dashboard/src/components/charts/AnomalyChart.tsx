import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Telemetry } from '@/types';

export default function AnomalyChart({ data }: { data: Telemetry[] }) {
  const rows = data.map((d) => ({
    t: new Date(d.timestamp).toLocaleTimeString(),
    kurtosis: d.kurtosis,
    zScore: d.z_score,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#5b6675" fontSize={10} tickLine={false} />
        <YAxis stroke="#5b6675" fontSize={10} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={3.0} stroke="#ff4d4f" strokeDasharray="4 4" label={{ value: '|Z| = 3.0', fill: '#ff4d4f', fontSize: 10 }} />
        <Line type="monotone" dataKey="kurtosis" name="Kurtosis" stroke="#ffb020" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="zScore" name="Z-Score" stroke="#4da3ff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
