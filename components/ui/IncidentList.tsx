import { useMemo, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { IncidentCard } from './IncidentCard';
import { formatDuration } from '@/lib/formatters';

export function IncidentList() {
  const incidents = useEngineStore((s) => s.incidents);
  const output = useEngineStore((s) => s.output);
  const selectedId = useUIStore((s) => s.selectedIncidentId);
  const setSelectedId = useUIStore((s) => s.setSelectedIncidentId);

  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);

  const metricsMap = useMemo(() => {
    const map = new Map<string, typeof output extends null ? never : NonNullable<typeof output>['incidentMetrics'][number]>();
    output?.incidentMetrics.forEach((m) => map.set(m.incidentId, m));
    return map;
  }, [output]);

  const types = useMemo(() => {
    const set = new Set(incidents.map((i) => i.type));
    return ['all', ...Array.from(set)];
  }, [incidents]);

  const filtered = useMemo(() => {
    let list = incidents.map((inc) => ({
      incident: inc,
      metrics: metricsMap.get(inc.id)
    }));

    if (filterType !== 'all') {
      list = list.filter((item) => item.incident.type === filterType);
    }

    if (minScore > 0) {
      list = list.filter((item) => (item.metrics?.score ?? 0) >= minScore);
    }

    list.sort((a, b) => (b.metrics?.score ?? -1) - (a.metrics?.score ?? -1));
    return list;
  }, [incidents, metricsMap, filterType, minScore]);

  const coveredCount = filtered.filter((item) => item.metrics?.tFirstObsSeconds !== null).length;

  // Metrics summary
  const avgTobs = useMemo(() => {
    const vals = filtered.map((i) => i.metrics?.tFirstObsSeconds).filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [filtered]);

  const avgTdl = useMemo(() => {
    const vals = filtered.map((i) => i.metrics?.tFirstDownlinkSeconds).filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [filtered]);

  const revisitStats = useMemo(() => output?.revisit ?? null, [output]);

  return (
    <div className="flex h-full flex-col border-r border-aerospace-700 bg-aerospace-900">
      {/* Header */}
      <div className="border-b border-aerospace-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-aerospace-300">Incident Queue</h2>
          <span className="font-mono text-readout text-aerospace-400">
            {coveredCount}/{filtered.length} covered
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1 text-readout font-semibold uppercase tracking-wider text-aerospace-300 focus:border-signal-400 focus:outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
            ))}
          </select>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1 text-readout font-semibold uppercase tracking-wider text-aerospace-300 focus:border-signal-400 focus:outline-none"
          >
            <option value={0}>All Scores</option>
            <option value={50}>Score ≥ 50</option>
            <option value={80}>Score ≥ 80</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {filtered.map(({ incident, metrics }) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              metrics={metrics}
              selected={selectedId === incident.id}
              onClick={() => setSelectedId(incident.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-6 text-center">
              <p className="text-xs text-aerospace-400">No incidents match current filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="border-t border-aerospace-700 bg-aerospace-850 px-3 py-2">
        <span className="mb-1.5 block text-micro font-bold uppercase tracking-wider text-aerospace-500">Metrics (Live)</span>
        <div className="grid grid-cols-4 gap-2">
          <MetricBox label="Time to First Obs" value={formatDuration(avgTobs)} target="< 2h" targetMet={avgTobs !== null && avgTobs < 7200} />
          <MetricBox label="Time to Downlink" value={formatDuration(avgTdl)} target="< 8h" targetMet={avgTdl !== null && avgTdl < 28800} />
          <MetricBox label="Avg Revisit Gap" value={formatDuration(revisitStats?.avgGapSeconds ?? null)} target="< 4h" targetMet={revisitStats ? revisitStats.avgGapSeconds < 14400 : false} />
          <MetricBox label="Max Revisit Gap" value={formatDuration(revisitStats?.maxGapSeconds ?? null)} target="< 12h" targetMet={revisitStats ? revisitStats.maxGapSeconds < 43200 : false} warn={revisitStats ? revisitStats.maxGapSeconds >= 43200 : false} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-micro text-aerospace-500">
          <span>Last updated: {output?.generatedUtc ? new Date(output.generatedUtc).toISOString().slice(11, 16) : '--'} UTC</span>
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-0.5 text-micro font-bold uppercase tracking-wider text-aerospace-400 transition hover:text-aerospace-200"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, target, targetMet, warn }: { label: string; value: string; target: string; targetMet: boolean; warn?: boolean }) {
  return (
    <div className="rounded border border-aerospace-700 bg-aerospace-800/50 p-1.5">
      <span className="block text-[7px] font-semibold uppercase tracking-wider text-aerospace-500">{label}</span>
      <span className={`block font-mono text-readout font-bold ${warn ? 'text-status-bad' : 'text-aerospace-200'}`}>{value}</span>
      <span className={`text-micro ${targetMet ? 'text-emerald-400' : warn ? 'text-status-warn' : 'text-aerospace-500'}`}>
        Target: {target} {targetMet ? '✓' : ''}
      </span>
    </div>
  );
}
