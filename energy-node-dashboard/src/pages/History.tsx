import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Telemetry } from '@/types';
import { summarize } from '@/lib/analytics';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

const QUICK_RANGES = [
  { label: 'Last 1h', ms: 3600e3 },
  { label: 'Last 24h', ms: 24 * 3600e3 },
  { label: 'Last 7d', ms: 7 * 24 * 3600e3 },
  { label: 'Last 30d', ms: 30 * 24 * 3600e3 },
];

const METRICS: { key: keyof Telemetry; label: string; color: string }[] = [
  { key: 'vibration_velocity', label: 'Velocity (mm/s)', color: '#22d3c0' },
  { key: 'kurtosis', label: 'Kurtosis', color: '#ffb020' },
  { key: 'z_score', label: 'Z-Score', color: '#4da3ff' },
  { key: 'motor_current', label: 'Current (A)', color: '#ff8fa3' },
  { key: 'supercap_voltage', label: 'Supercap (V)', color: '#a78bfa' },
  { key: 'harvest_rate_mw', label: 'Harvest (mW)', color: '#34d399' },
];

const PAGE_SIZE = 25;

export default function History() {
  const [rows, setRows] = useState<Telemetry[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [selected, setSelected] = useState<Set<keyof Telemetry>>(new Set(['vibration_velocity']));
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('telemetry')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (start) query = query.gte('timestamp', new Date(start).toISOString());
    if (end) query = query.lte('timestamp', new Date(end).toISOString());
    if (anomaliesOnly) query = query.or('z_score.gte.3,vibration_velocity.gte.4.5');

    const { data, count: total } = await query;
    setRows((data as Telemetry[]) ?? []);
    setCount(total ?? 0);
    setLoading(false);
  }, [page, start, end, anomaliesOnly]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  function applyQuickRange(ms: number) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - ms);
    setStart(startDate.toISOString().slice(0, 16));
    setEnd(endDate.toISOString().slice(0, 16));
    setPage(1);
  }

  function toggleMetric(key: keyof Telemetry) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const chartRows = useMemo(
    () =>
      [...rows]
        .reverse()
        .map((r) => ({
          t: new Date(r.timestamp).toLocaleString(),
          ...Object.fromEntries(METRICS.map((m) => [m.key, r[m.key]])),
        })),
    [rows]
  );

  const stats = useMemo(() => {
    const out: Record<string, ReturnType<typeof summarize>> = {};
    METRICS.forEach((m) => {
      out[m.key] = summarize(rows.map((r) => r[m.key] as number));
    });
    return out;
  }, [rows]);

  function exportCsv() {
    const headers = ['timestamp', ...METRICS.map((m) => m.key)];
    const lines = rows.map((r) => headers.map((h) => r[h as keyof Telemetry]).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[11px] font-mono text-slate-500 uppercase">
            Start
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="block mt-1 bg-base-800 ring-1 ring-base-700 rounded-md px-2 py-1.5 text-sm text-slate-200" />
          </label>
          <label className="text-[11px] font-mono text-slate-500 uppercase">
            End
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="block mt-1 bg-base-800 ring-1 ring-base-700 rounded-md px-2 py-1.5 text-sm text-slate-200" />
          </label>
          <div className="flex gap-1.5">
            {QUICK_RANGES.map((r) => (
              <button key={r.label} onClick={() => applyQuickRange(r.ms)} className="px-2.5 py-1.5 rounded-md bg-base-800 ring-1 ring-base-700 text-[12px] text-slate-400 hover:text-signal-teal">
                {r.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[12px] text-slate-400 ml-auto">
            <input type="checkbox" checked={anomaliesOnly} onChange={(e) => setAnomaliesOnly(e.target.checked)} className="accent-signal-teal" />
            Anomalies only (Z≥3 or Zone D)
          </label>
          <button onClick={() => { setPage(1); fetchPage(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-signal-teal/15 text-signal-teal ring-1 ring-signal-teal/30 text-[12px]">
            <Search className="w-3.5 h-3.5" /> Apply
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-base-800 ring-1 ring-base-700 text-[12px] text-slate-300">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className="text-[11px] px-2.5 py-1 rounded-full ring-1"
              style={{
                color: selected.has(m.key) ? m.color : '#5b6675',
                borderColor: selected.has(m.key) ? m.color : '#212a36',
                background: selected.has(m.key) ? `${m.color}1a` : 'transparent',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartRows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#212a36" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#5b6675" fontSize={9} tickLine={false} minTickGap={40} />
            <YAxis stroke="#5b6675" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0f151c', border: '1px solid #212a36', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {METRICS.filter((m) => selected.has(m.key)).map((m) => (
              <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {METRICS.filter((m) => selected.has(m.key)).map((m) => {
          const s = stats[m.key];
          return (
            <div key={m.key} className="card p-3">
              <p className="text-[11px] font-mono text-slate-500 mb-1">{m.label}</p>
              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                <span className="text-slate-500">min <br /><span className="text-slate-200">{s.min.toFixed(2)}</span></span>
                <span className="text-slate-500">max <br /><span className="text-slate-200">{s.max.toFixed(2)}</span></span>
                <span className="text-slate-500">avg <br /><span className="text-slate-200">{s.avg.toFixed(2)}</span></span>
                <span className="text-slate-500">std <br /><span className="text-slate-200">{s.std.toFixed(2)}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-slate-500 font-mono uppercase text-[10px] border-b border-base-700/60">
              <th className="px-3 py-2">Timestamp</th>
              {METRICS.map((m) => <th key={m.key} className="px-3 py-2">{m.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/40">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-base-800/40">
                <td className="px-3 py-2 font-mono text-slate-500">{new Date(r.timestamp).toLocaleString()}</td>
                {METRICS.map((m) => (
                  <td key={m.key} className="px-3 py-2 font-mono data-value">{(r[m.key] as number).toFixed(2)}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={METRICS.length + 1} className="px-3 py-8 text-center text-slate-500">No rows in this range.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-base-700/60 text-[12px] text-slate-500">
          <span>{count} total rows</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded bg-base-800 ring-1 ring-base-700 disabled:opacity-40">Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded bg-base-800 ring-1 ring-base-700 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
