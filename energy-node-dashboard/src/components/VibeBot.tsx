import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import type { AlertRow, Telemetry } from '@/types';
import { diagnoseRootCause, estimateAutonomyHours, isoZoneFromVelocity, ZONE_META } from '@/lib/analytics';

interface Msg {
  role: 'bot' | 'user';
  text: string;
}

interface Props {
  latest?: Telemetry;
  alerts: AlertRow[];
}

const QUICK_PROMPTS = [
  'Diagnose current vibration',
  'Estimate energy autonomy',
  'Summarize active alerts',
  'What is the ISO zone right now?',
];

function answer(question: string, latest: Telemetry | undefined, alerts: AlertRow[]): string {
  const q = question.toLowerCase();

  if (!latest) {
    return "I haven't received a telemetry packet from NODE_01 yet — once the ESP32-C3 (or Wokwi simulation) starts posting to Supabase, I can diagnose live readings.";
  }

  if (q.includes('diagnose') || q.includes('why') || q.includes('vibration')) {
    const zone = isoZoneFromVelocity(latest.vibration_velocity);
    const cause = diagnoseRootCause(latest);
    return `Vibration velocity is ${latest.vibration_velocity.toFixed(2)} mm/s RMS — ${ZONE_META[zone].label}. Kurtosis is ${latest.kurtosis.toFixed(2)} and the current Z-score is ${latest.z_score.toFixed(2)}.\n\nLikely cause: ${cause.label}. ${cause.detail}`;
  }

  if (q.includes('autonomy') || q.includes('runtime') || q.includes('battery') || q.includes('supercap') || q.includes('energy')) {
    const hours = estimateAutonomyHours(latest.supercap_voltage);
    return `Supercapacitor is at ${latest.supercap_voltage.toFixed(2)} V, harvesting ${latest.harvest_rate_mw.toFixed(1)} mW right now. At the current charge, the node has roughly ${hours.toFixed(1)} hours of deep-sleep standby autonomy if harvesting stopped entirely.`;
  }

  if (q.includes('alert') || q.includes('fault') || q.includes('summar')) {
    const unresolved = alerts.filter((a) => !a.acknowledged);
    if (unresolved.length === 0) return 'No unacknowledged alerts right now — the node is operating cleanly.';
    const critical = unresolved.filter((a) => a.severity === 'critical').length;
    const warning = unresolved.filter((a) => a.severity === 'warning').length;
    return `There are ${unresolved.length} unacknowledged alert(s): ${critical} critical, ${warning} warning. Most recent: "${unresolved[0].description}"`;
  }

  if (q.includes('zone') || q.includes('iso')) {
    const zone = isoZoneFromVelocity(latest.vibration_velocity);
    return `Current ISO 10816-3 classification: ${ZONE_META[zone].label} (${latest.vibration_velocity.toFixed(2)} mm/s RMS).`;
  }

  if (q.includes('current') || q.includes('motor') || q.includes('amp')) {
    return `Motor current draw is ${latest.motor_current.toFixed(2)} A. Combined with vibration velocity, this feeds the root-cause diagnostic matrix on the Analytics page.`;
  }

  return `Here's the latest snapshot from NODE_01:\n· Vibration velocity: ${latest.vibration_velocity.toFixed(2)} mm/s RMS\n· Kurtosis: ${latest.kurtosis.toFixed(2)} · Z-score: ${latest.z_score.toFixed(2)}\n· Motor current: ${latest.motor_current.toFixed(2)} A\n· Supercap: ${latest.supercap_voltage.toFixed(2)} V · Harvest: ${latest.harvest_rate_mw.toFixed(1)} mW\n\nAsk me to diagnose vibration, estimate energy autonomy, or summarize alerts.`;
}

export default function VibeBot({ latest, alerts }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: "I'm VibeBot — the on-node diagnostics assistant. Ask about vibration health, energy autonomy, or active alerts." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: answer(text, latest, alerts) }]);
    }, 350);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-signal-teal text-base-950 shadow-lg shadow-signal-teal/20 flex items-center justify-center hover:scale-105 transition-transform"
        title="Open VibeBot diagnostics assistant"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[340px] sm:w-[380px] h-[480px] card flex flex-col shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-base-700/60 flex items-center gap-2 bg-base-800/60">
            <Sparkles className="w-4 h-4 text-signal-teal" />
            <div>
              <p className="text-[13px] font-semibold text-slate-100 leading-tight">VibeBot</p>
              <p className="text-[10px] text-slate-500 font-mono leading-tight">predictive diagnostics assistant</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line text-[12.5px] px-3 py-2 rounded-lg ${
                    m.role === 'user'
                      ? 'bg-signal-teal/15 text-slate-100 ring-1 ring-signal-teal/30'
                      : 'bg-base-800 text-slate-300 ring-1 ring-base-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-[10px] px-2 py-1 rounded-full bg-base-800 text-slate-400 ring-1 ring-base-700 hover:text-signal-teal hover:ring-signal-teal/40"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-2.5 border-t border-base-700/60 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vibration, energy, alerts…"
              className="flex-1 bg-base-800 text-[12.5px] text-slate-200 placeholder:text-slate-600 rounded-md px-3 py-2 outline-none ring-1 ring-base-700 focus:ring-signal-teal/50"
            />
            <button type="submit" className="p-2 rounded-md bg-signal-teal text-base-950">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
