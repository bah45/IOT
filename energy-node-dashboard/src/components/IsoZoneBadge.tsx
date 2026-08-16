import type { IsoZone } from '@/types';
import { ZONE_META } from '@/lib/analytics';

export default function IsoZoneBadge({ zone }: { zone: IsoZone }) {
  const meta = ZONE_META[zone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium ${meta.bg}`}
      style={{ color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
