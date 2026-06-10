'use client';

import { useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { ScoreBadge } from './ScoreBadge';
import { MissionTimeline } from './MissionTimeline';
import { formatDuration, formatUtc } from '@/lib/formatters';

const TABS = ['Overview', 'Intelligence', 'History'] as const;

export function IncidentDetail() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const selectedId = useUIStore((s) => s.selectedIncidentId);
  const incidents = useEngineStore((s) => s.incidents);
  const output = useEngineStore((s) => s.output);
  const scenario = useEngineStore((s) => s.scenario);
  const dataSources = useUIStore((s) => s.dataSources);
  const isMobile = useIsMobile();
  const setMobileView = useUIStore((s) => s.setMobileView);

  const incident = incidents.find((i) => i.id === selectedId);
  const metrics = output?.incidentMetrics.find((m) => m.incidentId === selectedId);

  if (!incident) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l border-aerospace-700 bg-aerospace-900 p-6">
        <div className="rounded-full border border-aerospace-700 bg-aerospace-800 p-4">
          <svg className="h-6 w-6 text-aerospace-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="mt-3 text-xs text-aerospace-400">Select an incident to view details</p>
      </div>
    );
  }

  // Calculate next sat pass from output
  const nextPass = (() => {
    if (!output || !metrics?.servingSatellite) return null;
    const sat = output.satellites.find((s) => s.name === metrics.servingSatellite);
    if (!sat?.aoiAccess.length) return null;
    const firstWindow = sat.aoiAccess[0];
    return { satName: sat.name, time: firstWindow.startUtc };
  })();

  const earliestDownlink = (() => {
    if (!output || !metrics?.servingSatellite) return null;
    const sat = output.satellites.find((s) => s.name === metrics.servingSatellite);
    if (!sat) return null;
    // Find the first station contact with a station name
    const contacts = Object.entries(sat.stationContacts)
      .flatMap(([stationId, windows]) =>
        windows.map((w) => ({
          stationId,
          stationName: scenario.stations.find((st) => st.id === stationId)?.name || stationId,
          startUtc: w.startUtc,
          endUtc: w.endUtc,
        }))
      )
      .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
    if (!contacts.length) return null;
    return contacts[0];
  })();

  // Calculate revisit gap from serving satellite's AOI access windows
  const revisitGap = (() => {
    if (!output || !metrics?.servingSatellite) return null;
    const sat = output.satellites.find((s) => s.name === metrics.servingSatellite);
    if (!sat || sat.aoiAccess.length < 2) return null;
    const gaps: number[] = [];
    for (let i = 1; i < sat.aoiAccess.length; i++) {
      const prevEnd = new Date(sat.aoiAccess[i - 1].endUtc).getTime();
      const nextStart = new Date(sat.aoiAccess[i].startUtc).getTime();
      gaps.push((nextStart - prevEnd) / 1000);
    }
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const max = Math.max(...gaps);
    return { avg, max, count: sat.aoiAccess.length };
  })();

  return (
    <div className="flex h-full flex-col border-l border-aerospace-700 bg-aerospace-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-aerospace-700 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-aerospace-100">{incident.label}</span>
            {metrics && <ScoreBadge score={metrics.score} size="lg" />}
          </div>
          <p className="mt-0.5 font-mono text-xs text-aerospace-400">
            {incident.lat.toFixed(4)}°, {incident.lon.toFixed(4)}°
          </p>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileView('list')}
            className="ml-2 shrink-0 rounded border border-aerospace-700 bg-aerospace-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerospace-300 active:bg-aerospace-700"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-aerospace-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-aerospace-500 hover:text-aerospace-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Overview' && (
          <OverviewTab
            incident={incident}
            metrics={metrics}
            scenario={scenario}
            nextPass={nextPass}
            earliestDownlink={earliestDownlink}
            revisitGap={revisitGap}
            dataSources={dataSources}
          />
        )}
        {activeTab === 'Intelligence' && <IntelligenceTab incident={incident} />}
        {activeTab === 'History' && <HistoryTab />}
      </div>
    </div>
  );
}

function OverviewTab({
  incident,
  metrics,
  scenario,
  nextPass,
  earliestDownlink,
  revisitGap,
  dataSources,
}: {
  incident: NonNullable<ReturnType<typeof useEngineStore.getState>['incidents'][number]>;
  metrics: NonNullable<ReturnType<typeof useEngineStore.getState>['output']>['incidentMetrics'][number] | undefined;
  scenario: ReturnType<typeof useEngineStore.getState>['scenario'];
  nextPass: { satName: string; time: string } | null;
  earliestDownlink: { stationId: string; stationName: string; startUtc: string } | null;
  revisitGap: { avg: number; max: number; count: number } | null;
  dataSources: ReturnType<typeof useUIStore.getState>['dataSources'];
}) {
  const now = new Date();

  const timeRelative = (utc: string) => {
    const diff = (new Date(utc).getTime() - now.getTime()) / 1000;
    if (diff < -60) return { text: `${formatDuration(Math.abs(diff))} ago`, past: true };
    if (diff < 0) return { text: 'now', past: true };
    return { text: `in ${formatDuration(diff)}`, past: false };
  };

  return (
    <div className="space-y-4">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {nextPass && (
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Next Sat Pass</span>
            <p className="mt-1 text-sm font-semibold text-aerospace-200">{nextPass.satName}</p>
            <p className="font-mono text-xs text-cyan-400">{formatUtc(nextPass.time).slice(11, 19)} UTC</p>
            {(() => {
              const rel = timeRelative(nextPass.time);
              return <p className={`text-[9px] ${rel.past ? 'text-emerald-400' : 'text-aerospace-500'}`}>{rel.text}</p>;
            })()}
          </div>
        )}
        {earliestDownlink && (
          <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Earliest Downlink</span>
            <p className="mt-1 text-sm font-semibold text-aerospace-200">{earliestDownlink.stationName}</p>
            <p className="font-mono text-xs text-cyan-400">{formatUtc(earliestDownlink.startUtc).slice(11, 19)} UTC</p>
            {(() => {
              const rel = timeRelative(earliestDownlink.startUtc);
              return <p className={`text-[9px] ${rel.past ? 'text-emerald-400' : 'text-aerospace-500'}`}>{rel.text}</p>;
            })()}
          </div>
        )}
      </div>

      {/* Revisit gap */}
      {revisitGap && (
        <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Revisit Gap</span>
          <p className="text-[10px] text-aerospace-400">{revisitGap.count} passes · serving satellite</p>
          <div className="mt-2 flex gap-4">
            <div>
              <span className="text-[8px] text-aerospace-500">AVG</span>
              <p className="font-mono text-sm font-bold text-aerospace-200">{formatDuration(revisitGap.avg)}</p>
            </div>
            <div>
              <span className="text-[8px] text-aerospace-500">MAX</span>
              <p className="font-mono text-sm font-bold text-aerospace-200">{formatDuration(revisitGap.max)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data health & confidence */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Data Health</span>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-aerospace-200">All data sources nominal</span>
          </div>
        </div>
        <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Confidence</span>
          <p className="mt-1 font-mono text-lg font-bold text-cyan-400">{incident.confidence ?? '--'}%</p>
        </div>
      </div>

      {/* Recommended action */}
      {metrics && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Recommended Action</span>
          </div>
          <p className="mt-1 text-xs text-aerospace-300">
            Task {metrics.servingSatellite || 'next available satellite'} for targeted collection to reduce revisit gap.
          </p>
          <button className="mt-2 w-full rounded bg-cyan-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 transition hover:bg-cyan-500/30">
            Task Satellite
          </button>
        </div>
      )}

      {/* Sources */}
      <div>
        <span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-aerospace-500">Sources ({dataSources.length})</span>
        <div className="space-y-1">
          {dataSources.map((ds) => (
            <div key={ds.name} className="flex items-center justify-between rounded border border-aerospace-800 bg-aerospace-850 px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${ds.offline ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] text-aerospace-300">{ds.name}</span>
              </div>
              <span className="font-mono text-[9px] text-aerospace-500">{ds.fetchedUtc.slice(11, 16)} UTC</span>
            </div>
          ))}
        </div>
      </div>

      {metrics && <MissionTimeline metrics={metrics} startTime={scenario.startTimeUtc} />}
    </div>
  );
}

function IntelligenceTab({ incident }: { incident: { type: string; lat: number; lon: number } }) {
  return (
    <div className="space-y-4">
      <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Sentinel Hub</span>
        <p className="mt-1 text-xs text-aerospace-300">Satellite imagery search for this location.</p>
        <a
          href={`https://apps.sentinel-hub.com/eo-browser/?lat=${incident.lat}&lng=${incident.lon}&zoom=12`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded border border-aerospace-600 bg-aerospace-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerospace-300 transition hover:text-aerospace-100"
        >
          Open in EO Browser →
        </a>
      </div>
      <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-3">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">Weather Context</span>
        <p className="mt-1 text-xs text-aerospace-300">Wind, precipitation, and cloud cover for mission planning.</p>
        <p className="mt-1 text-[10px] text-aerospace-500">Weather overlay integration coming soon.</p>
      </div>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-aerospace-400">
      <p className="text-xs">Observation history will appear here.</p>
      <p className="mt-1 text-[10px] text-aerospace-500">Task a satellite to begin tracking.</p>
    </div>
  );
}
