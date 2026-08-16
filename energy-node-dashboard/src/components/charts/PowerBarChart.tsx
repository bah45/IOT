import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Telemetry } from '@/types';

const TX_ENERGY_MW = 1.2; // approximate transmission energy draw per cycle, for comparison

export default function PowerBarChart({ latest }: { latest?: Telemetry }) {
  const rows = [
    { name: 'Harvested', value: latest?.harvest_rate_mw ?? 0 },
    { name: 'Est. TX draw', value: TX_ENERGY_MW * 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#5b6675" fontSize={11} tickLine={false} />
        <YAxis stroke="#5b6675" fontSize={10} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
        <Bar dataKey="value" fill="#4da3ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
