import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Telemetry } from '@/types';

export const MAX_LIVE_POINTS = 60;

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]); // newest first
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(MAX_LIVE_POINTS);
    if (!error && data) setTelemetry(data as Telemetry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitial();

    const channel = supabase
      .channel('telemetry-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry' },
        (payload) => {
          const row = payload.new as Telemetry;
          setTelemetry((prev) => [row, ...prev].slice(0, MAX_LIVE_POINTS));
        }
      )
      .subscribe((status) => setRealtimeConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitial]);

  const latest = telemetry[0];
  const chronological = [...telemetry].reverse(); // oldest -> newest for charts

  return { telemetry, chronological, latest, realtimeConnected, loading, refetch: fetchInitial };
}
