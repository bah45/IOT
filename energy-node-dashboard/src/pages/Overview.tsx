import { Activity, Zap, Gauge, BatteryCharging, ShieldCheck } from 'lucide-react';
import type { Telemetry, AlertRow } from '@/types';
import MetricCard from '@/components/MetricCard';
import IsoZoneBadge from '@/components/IsoZoneBadge';
import VibrationChart from '@/components/charts/VibrationChart';
import EnergyChart from '@/components/charts/EnergyChart';
import { diagnoseRootCause, isoZoneFromVelocity } from '@/lib/analytics';

interface Props {
  latest?: Telemetry;
  chronological: Telemetry[];
  alerts: AlertRow[];
}

export default function Overview({ latest, chronological, alerts }: Props) {
  const zone = latest ? isoZoneFromVelocity(latest.vibration_velocity) : 'ZONE_A';
  const cause = latest ? diagnoseRootCause(latest) : null;
  const unresolved = alerts.filter((a) => !a.acknowledged);

  if (!latest) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-40" />
        Waiting for the first telemetry packet from NODE_01 — power up the ESP32-C3 or start the Wokwi simulation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Vibration Velocity"
          value={latest.vibration_velocity.toFixed(2)}
          unit="mm/s RMS"
          icon={Gauge}
          accent={zone === 'ZONE_D' ? 'red' : zone === 'ZONE_C' ? 'amber' : 'teal'}
          sub={<IsoZoneBadge zone={zone} />}
        />
        <MetricCard
          label="Supercap Voltage"
          value={latest.supercap_voltage.toFixed(2)}
          unit="V / 5.5V"
          icon={BatteryCharging}
          accent="blue"
          sub={`${latest.harvest_rate_mw.toFixed(1)} mW harvesting`}
        />
        <MetricCard
          label="Motor Current"
          value={latest.motor_current.toFixed(2)}
          unit="A"
          icon={Zap}
          accent="slate"
        />
        <MetricCard
          label="Active Alerts"
          value={String(unresolved.length)}
          icon={ShieldCheck}
          accent={unresolved.some((a) => a.severity === 'critical') ? 'red' : 'teal'}
          sub={unresolved.length === 0 ? 'All clear' : `${unresolved.filter((a) => a.severity === 'critical').length} critical`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500 mb-2">Vibration vs ISO 10816 Zones</h3>
          <VibrationChart data={chronological} />
        </div>
        <div className="card p-4">
          <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500 mb-2">Energy Harvest vs Supercap Charge</h3>
          <EnergyChart data={chronological} />
        </div>
      </div>

      {cause && (
        <div className="card p-4">
          <h3 className="text-[12px] font-mono uppercase tracking-wide text-slate-500 mb-2">Root-Cause Diagnostic</h3>
          <p className="text-sm text-slate-200 font-medium">{cause.label}</p>
          <p className="text-[13px] text-slate-500 mt-1">{cause.detail}</p>
        </div>
      )}
    </div>
  );
}
