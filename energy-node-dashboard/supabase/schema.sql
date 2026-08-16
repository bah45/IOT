-- =======================================================
-- Energy-Aware Predictive Maintenance Node — Full Schema
-- Run this whole file in Supabase SQL Editor.
-- =======================================================

-- 1. CLEANUP (safe to re-run)
DROP TRIGGER IF EXISTS trigger_sensor_anomaly ON telemetry;
DROP TRIGGER IF EXISTS on_telemetry_anomaly ON telemetry;
DROP FUNCTION IF EXISTS process_sensor_anomaly() CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS node_config CASCADE;

-- 2. TELEMETRY TABLE
CREATE TABLE telemetry (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id TEXT DEFAULT 'esp32_c3_node_01',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  vibration_rms FLOAT NOT NULL,
  vibration_velocity FLOAT NOT NULL,
  kurtosis FLOAT NOT NULL,
  motor_current FLOAT NOT NULL,
  harvest_rate_mw FLOAT NOT NULL,
  z_score FLOAT NOT NULL,
  supercap_voltage FLOAT NOT NULL
);

CREATE INDEX idx_telemetry_timestamp ON telemetry (timestamp DESC);
CREATE INDEX idx_telemetry_node ON telemetry (node_id);

-- 3. ALERTS TABLE
CREATE TABLE alerts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  trigger_type TEXT NOT NULL,
  iso_zone TEXT CHECK (iso_zone IN ('ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D')),
  description TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_alerts_timestamp ON alerts (timestamp DESC);

-- 4. NODE CONFIG TABLE (thresholds + registered phone number for SMS)
CREATE TABLE node_config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id TEXT UNIQUE NOT NULL DEFAULT 'esp32_c3_node_01',
  phone_number TEXT,
  sms_enabled BOOLEAN DEFAULT FALSE,
  iso_zone_c_mm_s FLOAT DEFAULT 2.8,
  iso_zone_d_mm_s FLOAT DEFAULT 4.5,
  z_score_limit FLOAT DEFAULT 3.0,
  kurtosis_limit FLOAT DEFAULT 4.5,
  low_voltage_limit FLOAT DEFAULT 3.5,
  heartbeat_timeout_s INT DEFAULT 15,
  sampling_interval_s INT DEFAULT 3
);

-- 5. ROW LEVEL SECURITY
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_config ENABLE ROW LEVEL SECURITY;

-- NOTE: policies below are intentionally open (public) so the ESP32's anon-key
-- HTTP POST and the browser dashboard can both read/write without a login flow.
-- Tighten these (e.g. require auth, or a service-role-only insert policy) before
-- exposing this project outside a hackathon/demo setting.
CREATE POLICY "public insert telemetry" ON telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "public select telemetry" ON telemetry FOR SELECT USING (true);

CREATE POLICY "public insert alerts" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "public select alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "public update alerts" ON alerts FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public select config" ON node_config FOR SELECT USING (true);
CREATE POLICY "public insert config" ON node_config FOR INSERT WITH CHECK (true);
CREATE POLICY "public update config" ON node_config FOR UPDATE USING (true) WITH CHECK (true);

-- 6. REALTIME BROADCASTING
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- 7. AUTOMATED ANOMALY & ALERT TRIGGER (ISO 10816 Zone D / statistical / energy)
CREATE OR REPLACE FUNCTION process_sensor_anomaly()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vibration_velocity > 4.5 OR NEW.z_score > 3.0 OR NEW.kurtosis > 4.5 THEN
    INSERT INTO alerts (node_id, severity, trigger_type, iso_zone, description)
    VALUES (
      NEW.node_id,
      'critical',
      'ISO_10816_ZONE_D_FAULT',
      'ZONE_D',
      CONCAT('Critical vibration detected: ', ROUND(NEW.vibration_velocity::numeric, 2),
             ' mm/s RMS (Z-score: ', ROUND(NEW.z_score::numeric, 2),
             ', Kurtosis: ', ROUND(NEW.kurtosis::numeric, 2), ')')
    );
  ELSIF NEW.vibration_velocity > 2.8 THEN
    INSERT INTO alerts (node_id, severity, trigger_type, iso_zone, description)
    VALUES (
      NEW.node_id, 'warning', 'ISO_10816_ZONE_C', 'ZONE_C',
      CONCAT('Vibration entering Zone C (unsatisfactory): ', ROUND(NEW.vibration_velocity::numeric, 2), ' mm/s RMS.')
    );
  END IF;

  IF NEW.supercap_voltage < 3.5 THEN
    INSERT INTO alerts (node_id, severity, trigger_type, description)
    VALUES (
      NEW.node_id, 'warning', 'LOW_SUPERCAP_VOLTAGE',
      CONCAT('Energy storage depleted: ', ROUND(NEW.supercap_voltage::numeric, 2), ' V remaining.')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sensor_anomaly
  AFTER INSERT ON telemetry
  FOR EACH ROW
  EXECUTE FUNCTION process_sensor_anomaly();

-- 8. SEED DATA (so the dashboard isn't empty on first load)
INSERT INTO node_config (node_id) VALUES ('esp32_c3_node_01') ON CONFLICT (node_id) DO NOTHING;

INSERT INTO telemetry (node_id, vibration_rms, vibration_velocity, kurtosis, motor_current, harvest_rate_mw, z_score, supercap_voltage)
VALUES ('esp32_c3_node_01', 0.42, 1.1, 3.0, 8.4, 14.5, 0.3, 4.2);

INSERT INTO alerts (node_id, severity, trigger_type, description)
VALUES ('esp32_c3_node_01', 'info', 'SYSTEM_INIT', 'IoT predictive maintenance node online and connected.');

-- 9. FORCE POSTGREST SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
