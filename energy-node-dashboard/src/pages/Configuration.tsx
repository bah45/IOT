import { useState } from 'react';
import { Save, Send, Zap, TestTube2 } from 'lucide-react';
import type { NodeConfig } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  config: NodeConfig | null;
  saving: boolean;
  onSave: (patch: Partial<NodeConfig>) => Promise<void>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-wide text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full bg-base-800 text-slate-200 text-sm rounded-md px-3 py-2 outline-none ring-1 ring-base-700 focus:ring-signal-teal/50';

export default function Configuration({ config, saving, onSave }: Props) {
  const [form, setForm] = useState<Partial<NodeConfig>>(config ?? {});
  const [testMsg, setTestMsg] = useState<string | null>(null);

  if (!config) return <div className="card p-6 text-slate-500">Loading configuration…</div>;

  function update<K extends keyof NodeConfig>(key: K, value: NodeConfig[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function sendTestSms() {
    setTestMsg('Sending…');
    const { error } = await supabase.functions.invoke('send-sms', {
      body: { to: form.phone_number, message: 'NODE_01 test alert — SMS notifications are configured correctly.' },
    });
    setTestMsg(error ? `Failed: deploy the send-sms Edge Function and set Twilio secrets first.` : 'Test SMS dispatched.');
  }

  async function simulateSpike() {
    await supabase.from('telemetry').insert({
      node_id: config.node_id,
      vibration_rms: 3.2,
      vibration_velocity: 5.4,
      kurtosis: 5.8,
      motor_current: 14.5,
      harvest_rate_mw: 6.0,
      z_score: 4.6,
      supercap_voltage: 4.0,
    });
  }

  async function simulateLowEnergy() {
    await supabase.from('telemetry').insert({
      node_id: config.node_id,
      vibration_rms: 0.4,
      vibration_velocity: 1.1,
      kurtosis: 3.0,
      motor_current: 6.0,
      harvest_rate_mw: 1.2,
      z_score: 0.4,
      supercap_voltage: 3.1,
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Emergency Notification (SMS)</h3>
        <Field label="Registered phone number (E.164, e.g. +15551234567)">
          <input
            type="tel"
            value={form.phone_number ?? ''}
            onChange={(e) => update('phone_number', e.target.value)}
            placeholder="+15551234567"
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={!!form.sms_enabled}
            onChange={(e) => update('sms_enabled', e.target.checked)}
            className="w-4 h-4 accent-signal-teal"
          />
          <span className="text-sm text-slate-300">Send SMS on critical faults and connection loss</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} disabled={saving} className="flex items-center gap-2 px-3 py-2 rounded-md bg-signal-teal text-base-950 text-sm font-medium">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button onClick={sendTestSms} className="flex items-center gap-2 px-3 py-2 rounded-md bg-base-800 ring-1 ring-base-700 text-slate-300 text-sm">
            <Send className="w-3.5 h-3.5" /> Send test SMS
          </button>
        </div>
        {testMsg && <p className="text-[12px] text-slate-500">{testMsg}</p>}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Alert Thresholds</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ISO Zone C boundary (mm/s)">
            <input type="number" step="0.1" value={form.iso_zone_c_mm_s ?? 2.8} onChange={(e) => update('iso_zone_c_mm_s', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="ISO Zone D boundary (mm/s)">
            <input type="number" step="0.1" value={form.iso_zone_d_mm_s ?? 4.5} onChange={(e) => update('iso_zone_d_mm_s', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Z-score limit">
            <input type="number" step="0.1" value={form.z_score_limit ?? 3.0} onChange={(e) => update('z_score_limit', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Kurtosis limit">
            <input type="number" step="0.1" value={form.kurtosis_limit ?? 4.5} onChange={(e) => update('kurtosis_limit', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Low supercap voltage (V)">
            <input type="number" step="0.1" value={form.low_voltage_limit ?? 3.5} onChange={(e) => update('low_voltage_limit', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Heartbeat timeout (s)">
            <input type="number" value={form.heartbeat_timeout_s ?? 15} onChange={(e) => update('heartbeat_timeout_s', Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Edge sampling interval (s)">
            <input type="number" value={form.sampling_interval_s ?? 3} onChange={(e) => update('sampling_interval_s', Number(e.target.value))} className={inputClass} />
          </Field>
        </div>
        <button onClick={() => onSave(form)} disabled={saving} className="flex items-center gap-2 px-3 py-2 rounded-md bg-signal-teal text-base-950 text-sm font-medium">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save thresholds'}
        </button>
        <p className="text-[11px] text-slate-500">
          Note: threshold values are stored for reference and for the frontend's own zone/anomaly badges. The Supabase SQL trigger
          in <code className="font-mono">supabase/schema.sql</code> enforces its own copy of these limits server-side — update both if you change them.
        </p>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <TestTube2 className="w-4 h-4 text-signal-amber" /> Hardware Simulator
        </h3>
        <p className="text-[12px] text-slate-500">
          Insert synthetic rows directly into <code className="font-mono">telemetry</code> to verify the end-to-end realtime and SMS pipeline without live hardware.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={simulateSpike} className="flex items-center gap-2 px-3 py-2 rounded-md bg-signal-red/10 text-signal-red ring-1 ring-signal-red/30 text-sm">
            <Zap className="w-3.5 h-3.5" /> Simulate Zone D emergency spike
          </button>
          <button onClick={simulateLowEnergy} className="flex items-center gap-2 px-3 py-2 rounded-md bg-signal-amber/10 text-signal-amber ring-1 ring-signal-amber/30 text-sm">
            <Zap className="w-3.5 h-3.5" /> Simulate low-energy warning
          </button>
        </div>
      </div>
    </div>
  );
}
