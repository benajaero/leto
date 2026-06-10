'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { formatUtcTime } from '@/lib/formatters';

export function StatusHeader() {
  const [now, setNow] = useState(new Date());
  const scenario = useStore((s) => s.scenario);
  const dataSources = useStore((s) => s.dataSources);
  const output = useStore((s) => s.output);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const progress = useStore((s) => s.progress);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const online = !dataSources.some((s) => s.offline);
  const withCoverage = output?.incidentMetrics.filter((m) => m.tFirstObsSeconds !== null).length ?? 0;
  const totalIncidents = output?.incidentMetrics.length ?? 0;

  return (
    <header className="border-b border-aerospace-700 bg-aerospace-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span className="text-xs font-bold tracking-[0.2em] text-cyan-400">LETO</span>
          </div>
          <div className="hidden h-4 w-px bg-aerospace-700 sm:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aerospace-400">Mission Clock</span>
            <span className="font-mono text-lg font-bold text-aerospace-100 tabular-nums tracking-wide">
              {formatUtcTime(now)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aerospace-400">Scenario</span>
            <span className="text-sm font-semibold text-aerospace-200">{scenario.name}</span>
          </div>

          <div className="flex items-center gap-3 rounded border border-aerospace-700 bg-aerospace-800 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-status-good shadow-glow-green' : 'bg-status-warn shadow-glow-amber'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-aerospace-300">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="h-3 w-px bg-aerospace-700" />
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-cyan-400">{withCoverage}</span>
              <span className="text-[10px] text-aerospace-400">/</span>
              <span className="font-mono text-xs text-aerospace-400">{totalIncidents}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-aerospace-400">covered</span>
            </div>
          </div>

          <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
            <button
              onClick={() => setViewMode('command')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                viewMode === 'command'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-aerospace-400 hover:text-aerospace-200'
              }`}
            >
              Command
            </button>
            <button
              onClick={() => setViewMode('explore')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                viewMode === 'explore'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-aerospace-400 hover:text-aerospace-200'
              }`}
            >
              Explore
            </button>
          </div>

          <a
            href="https://github.com/benajaero/leto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded border border-aerospace-700 bg-aerospace-800 px-2.5 py-1.5 text-aerospace-400 transition hover:border-aerospace-600 hover:text-aerospace-200"
            title="View source on GitHub"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider">GitHub</span>
          </a>

          {progress < 100 && progress > 0 && (
            <div className="w-24">
              <div className="h-1 w-full rounded-full bg-aerospace-700">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-aerospace-400">{progress}%</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
