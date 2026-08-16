import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AlertRow } from '@/types';

export function useAlerts(onCritical?: (a: AlertRow) => void) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (!error && data) setAlerts(data as AlertRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitial();

    const channel = supabase
      .channel('alert-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const row = payload.new as AlertRow;
          setAlerts((prev) => [row, ...prev].slice(0, 100));
          if (row.severity === 'critical' && onCritical) onCritical(row);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInitial]);

  const acknowledge = useCallback(async (id: number) => {
    await supabase.from('alerts').update({ acknowledged: true }).eq('id', id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  return { alerts, loading, acknowledge, refetch: fetchInitial };
}
