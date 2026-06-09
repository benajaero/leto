import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { IncidentCard } from './IncidentCard';
import type { Incident } from '@/lib/engine/types';

export function IncidentList() {
  const incidents = useStore((s) => s.incidents);
  const output = useStore((s) => s.output);
  const selectedId = useStore((s) => s.selectedIncidentId);
  const setSelectedId = useStore((s) => s.setSelectedIncidentId);

  const [filterType, setFilterType] = useState<string>('all');
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

  return (
    <div className="flex h-full flex-col border-r border-aerospace-700 bg-aerospace-900">
      <div className="border-b border-aerospace-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-aerospace-300">Incident Queue</h2>
          <span className="font-mono text-[10px] text-aerospace-400">
            {coveredCount}/{filtered.length} covered
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerospace-300 focus:border-cyan-400 focus:outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Types' : t}
              </option>
            ))}
          </select>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded border border-aerospace-700 bg-aerospace-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-aerospace-300 focus:border-cyan-400 focus:outline-none"
          >
            <option value={0}>All Scores</option>
            <option value={50}>Score ≥ 50</option>
            <option value={80}>Score ≥ 80</option>
          </select>
        </div>
      </div>

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
    </div>
  );
}
