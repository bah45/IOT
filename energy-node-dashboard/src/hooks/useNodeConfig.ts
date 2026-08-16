import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NodeConfig } from '@/types';

const DEFAULT_CONFIG: Omit<NodeConfig, 'id'> = {
  node_id: 'esp32_c3_node_01',
  phone_number: null,
  sms_enabled: false,
  iso_zone_c_mm_s: 2.8,
  iso_zone_d_mm_s: 4.5,
  z_score_limit: 3.0,
  kurtosis_limit: 4.5,
  low_voltage_limit: 3.5,
  heartbeat_timeout_s: 15,
  sampling_interval_s: 3,
};

export function useNodeConfig() {
  const [config, setConfig] = useState<NodeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('node_config')
      .select('*')
      .eq('node_id', DEFAULT_CONFIG.node_id)
      .maybeSingle();

    if (data) {
      setConfig(data as NodeConfig);
    } else {
      const { data: inserted } = await supabase
        .from('node_config')
        .insert(DEFAULT_CONFIG)
        .select()
        .single();
      setConfig((inserted as NodeConfig) ?? { id: 0, ...DEFAULT_CONFIG });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const save = useCallback(
    async (patch: Partial<NodeConfig>) => {
      if (!config) return;
      setSaving(true);
      const { data } = await supabase
        .from('node_config')
        .update(patch)
        .eq('id', config.id)
        .select()
        .single();
      if (data) setConfig(data as NodeConfig);
      setSaving(false);
    },
    [config]
  );

  return { config, loading, saving, save };
}
