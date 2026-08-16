import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Telemetry } from '@/types';

export type ConnectionState = 'connected' | 'latency_high' | 'offline' | 'waiting';

/**
 * Derives hardware connection health from the age of the latest telemetry packet
 * (heartbeat), and fires a Supabase Edge Function (send-sms) once when the node
 * transitions into the offline state, so a disrupted connection itself becomes
 * an alertable event — not just bad sensor readings.
 */
export function useConnectionStatus(
  latest: Telemetry | undefined,
  heartbeatTimeoutS: number,
  smsEnabled: boolean,
  phoneNumber: string | null
) {
  const [state, setState] = useState<ConnectionState>('waiting');
  const [secondsSinceLast, setSecondsSinceLast] = useState<number | null>(null);
  const hasNotifiedOffline = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!latest) {
        setState('waiting');
        return;
      }
      const ageS = (Date.now() - new Date(latest.timestamp).getTime()) / 1000;
      setSecondsSinceLast(Math.max(0, Math.floor(ageS)));

      let next: ConnectionState = 'connected';
      if (ageS > heartbeatTimeoutS) next = 'offline';
      else if (ageS > heartbeatTimeoutS / 2) next = 'latency_high';

      setState(next);

      if (next === 'offline' && !hasNotifiedOffline.current) {
        hasNotifiedOffline.current = true;
        if (smsEnabled && phoneNumber) {
          supabase.functions
            .invoke('send-sms', {
              body: {
                to: phoneNumber,
                message: `NODE_01 ALERT: No telemetry received for over ${heartbeatTimeoutS}s. Hardware link may be down.`,
              },
            })
            .catch(() => {
              /* edge function may not be deployed yet — fail silently in UI */
            });
        }
      }
      if (next === 'connected') hasNotifiedOffline.current = false;
    }, 1000);

    return () => clearInterval(interval);
  }, [latest, heartbeatTimeoutS, smsEnabled, phoneNumber]);

  return { state, secondsSinceLast };
}
