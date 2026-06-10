'use client';

import { useUIStore } from '@/lib/stores/uiStore';

const SOURCES = [
  { name: 'NASA FIRMS', icon: '🔥', color: 'text-orange-400' },
  { name: 'GDACS', icon: '🌊', color: 'text-cyan-400' },
  { name: 'NASA EONET', icon: '🌍', color: 'text-emerald-400' },
  { name: 'USGS Earthquakes', icon: '🌋', color: 'text-purple-400' },
];

export function DataSourceFooter() {
  const dataSources = useUIStore((s) => s.dataSources);

  return (
    <footer className="flex items-center justify-between border-t border-aerospace-700 bg-aerospace-900/80 px-4 py-1.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-[8px] font-bold uppercase tracking-wider text-aerospace-500">Data Sources</span>
        <div className="flex items-center gap-2">
          {SOURCES.map((s) => {
            const ds = dataSources.find((d) => d.name.includes(s.name.split(' ')[0]));
            const active = ds && !ds.offline;
            return (
              <div key={s.name} className="flex items-center gap-1 rounded border border-aerospace-700 bg-aerospace-800 px-1.5 py-0.5">
                <span className="text-[10px]">{s.icon}</span>
                <span className={`text-[9px] font-semibold ${active ? s.color : 'text-aerospace-600'}`}>{s.name}</span>
                {active && <div className="ml-0.5 h-1 w-1 rounded-full bg-emerald-500" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-glow-green" />
          <span className="text-[9px] font-semibold text-emerald-400">All Systems Operational</span>
        </div>
        <span className="text-[9px] text-aerospace-500">Data latency: 2–5 min</span>
        <span className="font-mono text-[9px] text-aerospace-500">v2.3.0</span>
      </div>
    </footer>
  );
}
