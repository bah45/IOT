import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  LineChart,
  HeartPulse,
  Settings,
  History,
  CircuitBoard,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/live', label: 'Live Telemetry', icon: Activity },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/reliability', label: 'Reliability', icon: HeartPulse },
  { to: '/history', label: 'History', icon: History },
  { to: '/configuration', label: 'Configuration', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-base-700/60 bg-base-900/60 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-base-700/60">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-signal-teal/20 to-base-800 ring-1 ring-signal-teal/40 flex items-center justify-center">
          <CircuitBoard className="w-4.5 h-4.5 text-signal-teal" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-100 leading-tight">NODE_01</p>
          <p className="text-[10px] text-slate-500 font-mono leading-tight">esp32-c3 · self-powered</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-signal-teal/10 text-signal-teal ring-1 ring-signal-teal/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-base-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-base-700/60 text-[11px] text-slate-500 font-mono">
        ISO 10816-3 · PZT + LTC3588-1
        <br />0.5F 5.5V supercap
      </div>
    </aside>
  );
}
