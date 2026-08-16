import { Area, AreaChart, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Telemetry } from '@/types';

export default function EnergyChart({ data }: { data: Telemetry[] }) {
  const rows = data.map((d) => ({
    t: new Date(d.timestamp).toLocaleTimeString(),
    harvest: d.harvest_rate_mw,
    voltage: d.supercap_voltage,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#5b6675" fontSize={10} tickLine={false} />
        <YAxis yAxisId="left" stroke="#5b6675" fontSize={10} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 5.5]} stroke="#5b6675" fontSize={10} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area yAxisId="left" type="monotone" dataKey="harvest" name="Harvest (mW)" fill="#22d3c033" stroke="#22d3c0" strokeWidth={2} />
        <Line yAxisId="right" type="monotone" dataKey="voltage" name="Supercap (V)" stroke="#4da3ff" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
