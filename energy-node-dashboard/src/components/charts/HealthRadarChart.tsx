import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { Telemetry } from '@/types';

export default function HealthRadarChart({ latest }: { latest?: Telemetry }) {
  const rows = latest
    ? [
        { metric: 'Velocity', value: Math.min(100, (latest.vibration_velocity / 4.5) * 100) },
        { metric: 'Kurtosis', value: Math.min(100, (latest.kurtosis / 4.5) * 100) },
        { metric: 'Z-Score', value: Math.min(100, (Math.abs(latest.z_score) / 3.0) * 100) },
        { metric: 'Current', value: Math.min(100, (latest.motor_current / 20) * 100) },
        { metric: 'Energy', value: Math.min(100, (latest.supercap_voltage / 5.5) * 100) },
      ]
    : [];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={rows} outerRadius={90}>
        <PolarGrid stroke="#212a36" />
        <PolarAngleAxis dataKey="metric" stroke="#5b6675" fontSize={10} />
        <Radar dataKey="value" stroke="#22d3c0" fill="#22d3c0" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
