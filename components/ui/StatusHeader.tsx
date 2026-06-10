'use client';

import { useEffect, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { formatUtcTime, formatUtcDate } from '@/lib/formatters';
import { scenarios } from '@/lib/data/scenarios';
import { ApiKeySettings } from './ApiKeySettings';

const VIEW_TABS = [
  { id: 'command', label: 'Command' },
  { id: 'map', label: 'Map' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'scenario', label: 'Scenario Editor' },
] as const;

export function StatusHeader() {
  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);

  const scenario = useEngineStore((s) => s.scenario);
  const output = useEngineStore((s) => s.output);
  const progress = useEngineStore((s) => s.progress);
  const dataSources = useUIStore((s) => s.dataSources);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const setScenario = useEngineStore((s) => s.setScenario);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const online = !dataSources.some((s) => s.offline);
  const withCoverage = output?.incidentMetrics.filter((m) => m.tFirstObsSeconds !== null).length ?? 0;
  const totalIncidents = output?.incidentMetrics.length ?? 0;
  const satCount = scenario.satellites.length;
  const stationCount = scenario.stations.length;

  return (
    <>
      <header className="border-b border-aerospace-700 bg-aerospace-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-4">
          {/* Left: Logo + Clock */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-[0.15em] text-cyan-400">LETO</span>
                <span className="text-[8px] font-medium tracking-wider text-aerospace-500">Low-Earth Triage & Operations</span>
              </div>
            </div>
            <div className="hidden h-6 w-px bg-aerospace-700 sm:block" />
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Mission Clock</span>
              <span className="font-mono text-base font-bold text-aerospace-100 tabular-nums tracking-wide">
                {formatUtcTime(now)}
              </span>
              <span className="font-mono text-[9px] text-aerospace-500">{formatUtcDate(now)}</span>
            </div>
          </div>

          {/* Center/Right: Scenario, Status, Tabs */}
          <div className="flex items-center gap-3">
            {/* Scenario Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
                className="flex items-center gap-2 rounded border border-aerospace-700 bg-aerospace-800 px-3 py-1.5 text-xs font-semibold text-aerospace-200 transition hover:border-aerospace-600"
              >
                {scenario.name}
                <svg className="h-3 w-3 text-aerospace-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showScenarioDropdown && (
                <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded border border-aerospace-700 bg-aerospace-800 py-1 shadow-xl">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setScenario(s);
                        setShowScenarioDropdown(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-xs transition hover:bg-aerospace-700 ${
                        s.id === scenario.id ? 'text-cyan-400' : 'text-aerospace-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Feeds Status */}
            <div className="flex items-center gap-1.5 rounded border border-aerospace-700 bg-aerospace-800 px-2.5 py-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500 shadow-glow-green' : 'bg-amber-500 shadow-glow-amber'}`} />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-300">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Coverage */}
            <div className="hidden items-center gap-1.5 rounded border border-aerospace-700 bg-aerospace-800 px-2.5 py-1.5 sm:flex">
              <span className="font-mono text-[10px] font-bold text-cyan-400">{satCount}</span>
              <span className="text-[9px] text-aerospace-500">SATS</span>
              <span className="text-[9px] text-aerospace-600">/</span>
              <span className="font-mono text-[10px] font-bold text-cyan-400">{stationCount}</span>
              <span className="text-[9px] text-aerospace-500">STS</span>
            </div>

            {/* View Tabs */}
            <div className="flex rounded border border-aerospace-700 bg-aerospace-800 overflow-hidden">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as typeof viewMode)}
                  className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${
                    viewMode === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-aerospace-400 hover:text-aerospace-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="rounded border border-aerospace-700 bg-aerospace-800 p-1.5 text-aerospace-400 transition hover:text-aerospace-200"
              title="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/benajaero/leto"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded border border-aerospace-700 bg-aerospace-800 px-2.5 py-1.5 text-aerospace-400 transition hover:border-aerospace-600 hover:text-aerospace-200 sm:flex"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            {progress < 100 && progress > 0 && (
              <div className="w-20">
                <div className="h-1 w-full rounded-full bg-aerospace-700">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[9px] font-mono text-aerospace-400">{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </header>
      {showSettings && <ApiKeySettings onClose={() => setShowSettings(false)} />}
    </>
  );
}
