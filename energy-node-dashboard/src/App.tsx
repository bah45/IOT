import { useCallback, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AlertDrawer from '@/components/AlertDrawer';
import VibeBot from '@/components/VibeBot';
import Overview from '@/pages/Overview';
import LiveTelemetry from '@/pages/LiveTelemetry';
import Alerts from '@/pages/Alerts';
import Analytics from '@/pages/Analytics';
import Reliability from '@/pages/Reliability';
import Configuration from '@/pages/Configuration';
import History from '@/pages/History';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useAlerts } from '@/hooks/useAlerts';
import { useNodeConfig } from '@/hooks/useNodeConfig';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import type { AlertRow } from '@/types';
import { supabase } from '@/lib/supabase';

function playSiren() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* AudioContext unavailable — ignore */
  }
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const { config, saving, save } = useNodeConfig();

  const handleCritical = useCallback(
    (a: AlertRow) => {
      setDrawerOpen(true);
      if (soundRef.current) playSiren();
      if (config?.sms_enabled && config.phone_number) {
        supabase.functions
          .invoke('send-sms', { body: { to: config.phone_number, message: `NODE_01 CRITICAL: ${a.description}` } })
          .catch(() => {});
      }
    },
    [config]
  );

  const { alerts, acknowledge } = useAlerts(handleCritical);
  const { telemetry, chronological, latest, realtimeConnected } = useTelemetry();
  const { state: connectionState, secondsSinceLast } = useConnectionStatus(
    latest,
    config?.heartbeat_timeout_s ?? 15,
    config?.sms_enabled ?? false,
    config?.phone_number ?? null
  );

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar
          connectionState={connectionState}
          secondsSinceLast={secondsSinceLast}
          realtimeConnected={realtimeConnected}
          criticalCount={criticalCount}
          onOpenAlerts={() => setDrawerOpen(true)}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
        />
        <main className="p-4 lg:p-6 max-w-[1500px] mx-auto">
          <Routes>
            <Route path="/" element={<Overview latest={latest} chronological={chronological} alerts={alerts} />} />
            <Route path="/live" element={<LiveTelemetry telemetry={telemetry} chronological={chronological} />} />
            <Route path="/alerts" element={<Alerts alerts={alerts} onAcknowledge={acknowledge} />} />
            <Route path="/analytics" element={<Analytics chronological={chronological} latest={latest} />} />
            <Route path="/reliability" element={<Reliability chronological={chronological} latest={latest} alerts={alerts} />} />
            <Route path="/history" element={<History />} />
            <Route path="/configuration" element={<Configuration config={config} saving={saving} onSave={save} />} />
          </Routes>
        </main>
      </div>

      <AlertDrawer alerts={alerts} open={drawerOpen} onClose={() => setDrawerOpen(false)} onAcknowledge={acknowledge} />
      <VibeBot latest={latest} alerts={alerts} />
    </div>
  );
}
