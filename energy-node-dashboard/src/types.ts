export interface Telemetry {
  id: number;
  node_id: string;
  timestamp: string;
  vibration_rms: number;
  vibration_velocity: number;
  kurtosis: number;
  motor_current: number;
  harvest_rate_mw: number;
  z_score: number;
  supercap_voltage: number;
}

export type Severity = 'info' | 'warning' | 'critical';
export type IsoZone = 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ZONE_D';

export interface AlertRow {
  id: number;
  node_id: string;
  timestamp: string;
  severity: Severity;
  trigger_type: string;
  iso_zone: IsoZone | null;
  description: string;
  acknowledged: boolean;
}

export interface NodeConfig {
  id: number;
  node_id: string;
  phone_number: string | null;
  sms_enabled: boolean;
  iso_zone_c_mm_s: number;
  iso_zone_d_mm_s: number;
  z_score_limit: number;
  kurtosis_limit: number;
  low_voltage_limit: number;
  heartbeat_timeout_s: number;
  sampling_interval_s: number;
}
