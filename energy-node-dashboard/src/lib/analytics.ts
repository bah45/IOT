import type { AlertRow, IsoZone, Telemetry } from '@/types';

export const ISO_THRESHOLDS = {
  zoneB: 1.4, // mm/s — Zone A/B boundary (small/medium machines)
  zoneC: 2.8, // mm/s — Zone B/C boundary
  zoneD: 4.5, // mm/s — Zone C/D boundary (critical, unacceptable)
};

export function isoZoneFromVelocity(velocity: number): IsoZone {
  if (velocity < ISO_THRESHOLDS.zoneB) return 'ZONE_A';
  if (velocity < ISO_THRESHOLDS.zoneC) return 'ZONE_B';
  if (velocity < ISO_THRESHOLDS.zoneD) return 'ZONE_C';
  return 'ZONE_D';
}

export const ZONE_META: Record<IsoZone, { label: string; color: string; bg: string }> = {
  ZONE_A: { label: 'Zone A — Good', color: '#22d3c0', bg: 'bg-signal-teal/10' },
  ZONE_B: { label: 'Zone B — Satisfactory', color: '#8ee6da', bg: 'bg-signal-teal/10' },
  ZONE_C: { label: 'Zone C — Unsatisfactory', color: '#ffb020', bg: 'bg-signal-amber/10' },
  ZONE_D: { label: 'Zone D — Unacceptable', color: '#ff4d4f', bg: 'bg-signal-red/10' },
};

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export function summarize(values: number[]) {
  if (!values.length) return { min: 0, max: 0, avg: 0, std: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: mean(values),
    std: stddev(values),
  };
}

/** Cross-sensor root-cause diagnostic rule engine. */
export function diagnoseRootCause(t: Telemetry): { label: string; detail: string } {
  const highVib = t.vibration_velocity >= ISO_THRESHOLDS.zoneC;
  const highKurt = t.kurtosis >= 4.5;
  const highZ = Math.abs(t.z_score) >= 3.0;
  const highCurrent = t.motor_current >= 15;
  const lowVibHighCurrent = t.vibration_velocity < ISO_THRESHOLDS.zoneB && highCurrent;

  if (highVib && highKurt) {
    return {
      label: 'Bearing friction / mechanical impact',
      detail: 'Elevated vibration velocity combined with a high kurtosis (impulsiveness) factor typically points to bearing raceway pitting or lubrication failure.',
    };
  }
  if (highVib && !highCurrent) {
    return {
      label: 'Mechanical misalignment / shaft unbalance',
      detail: 'Vibration velocity is elevated while motor current stays within normal range — consistent with structural unbalance or shaft misalignment rather than an electrical fault.',
    };
  }
  if (lowVibHighCurrent) {
    return {
      label: 'Rotor bar / winding fault',
      detail: 'Current draw is high while vibration stays low — a signature often associated with rotor bar breaks or stator winding degradation (confirm with MCSA).',
    };
  }
  if (highZ) {
    return {
      label: 'Statistical anomaly (unclassified)',
      detail: 'Z-score has crossed the 3-sigma boundary against the rolling baseline, but the pattern does not clearly match a known mechanical or electrical signature yet.',
    };
  }
  return {
    label: 'Nominal operating condition',
    detail: 'All monitored signatures are within their normal statistical and ISO 10816 bounds.',
  };
}

/** Energy autonomy estimate: how long the node can run in deep-sleep on stored charge alone. */
export function estimateAutonomyHours(supercapVoltage: number): number {
  const usableEnergyJ = 0.5 * 0.5 * (supercapVoltage ** 2 - 3.0 ** 2); // 0.5F cap, cutoff at 3.0V
  const deepSleepDrawW = 0.0000165; // ~5uA @ 3.3V
  if (usableEnergyJ <= 0) return 0;
  return Math.max(0, usableEnergyJ / deepSleepDrawW / 3600);
}

export function severityWeight(s: AlertRow['severity']): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1;
}
