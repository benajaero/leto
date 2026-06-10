'use client';

import { useMemo, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { formatUtc, formatDuration } from '@/lib/formatters';
import type { AccessWindow } from '@/lib/engine/types';

type PassRow = {
  id: string;
  satName: string;
  type: 'aoi' | 'station';
  subtypeLabel: string;
  startUtc: string;
  endUtc: string;
  durationSec: number;
  maxElevationDeg?: number;
};

function makePassId(satIdx: number, type: string, idx: number) {
  return `pass-${satIdx}-${type}-${idx}`;
}

function buildPasses(output: ReturnType<typeof useEngineStore.getState>['output']): PassRow[] {
  if (!output) return [];
  const rows: PassRow[] = [];
  output.satellites.forEach((sat, satIdx) => {
    sat.aoiAccess.forEach((w, i) => {
      rows.push({
        id: makePassId(satIdx, 'aoi', i),
        satName: sat.name,
        type: 'aoi',
        subtypeLabel: 'AOI Imaging',
        startUtc: w.startUtc,
        endUtc: w.endUtc,
        durationSec: (new Date(w.endUtc).getTime() - new Date(w.startUtc).getTime()) / 1000,
        maxElevationDeg: w.maxElevationDeg,
      });
    });
    Object.entries(sat.stationContacts).forEach(([stationId, windows]) => {
      windows.forEach((w, i) => {
        rows.push({
          id: makePassId(satIdx, stationId, i),
          satName: sat.name,
          type: 'station',
          subtypeLabel: stationId,
          startUtc: w.startUtc,
          endUtc: w.endUtc,
          durationSec: (new Date(w.endUtc).getTime() - new Date(w.startUtc).getTime()) / 1000,
          maxElevationDeg: w.maxElevationDeg,
        });
      });
    });
  });
  rows.sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
  return rows;
}

type FilterMode = 'all' | 'aoi' | 'station';

export function PassSchedule() {
  const output = useEngineStore((s) => s.output);
  const scenario = useEngineStore((s) => s.scenario);
  const [filter, setFilter] = useState<FilterMode>('all');

  const allPasses = useMemo(() => buildPasses(output), [output]);

  const passes = useMemo(() => {
    if (filter === 'all') return allPasses;
    return allPasses.filter((p) => p.type === filter);
  }, [allPasses, filter]);

  const totalDurationSec = useMemo(
    () => passes.reduce((sum, p) => sum + p.durationSec, 0),
    [passes]
  );

  if (!output) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-aerospace-400">
        <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-aerospace-600 border-t-cyan-400" />
        <p className="text-sm">Computing pass schedule…</p>
      </div>
    );
  }

  if (allPasses.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-aerospace-400">
        <p className="text-sm">No passes found for this scenario.</p>
        <p className="mt-1 text-xs text-aerospace-500">Try extending the horizon or adding satellites.</p>
      </div>
    );
  }

  const FilterButton = ({ mode, label }: { mode: FilterMode; label: string }) => (
    <button
      onClick={() => setFilter(mode)}
      className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
        filter === mode
          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
          : 'border-aerospace-700 bg-aerospace-800 text-aerospace-400 hover:text-aerospace-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-aerospace-700 bg-aerospace-900/80 px-4 py-3 backdrop-blur">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-aerospace-200">
            Pass Schedule
          </h2>
          <p className="mt-0.5 font-mono text-[10px] text-aerospace-500">
            {formatUtc(scenario.startTimeUtc).slice(0, 10)} · {scenario.horizonHours}h horizon
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <FilterButton mode="all" label="All" />
            <FilterButton mode="aoi" label="AOI" />
            <FilterButton mode="station" label="Stations" />
          </div>
          <div className="hidden h-4 w-px bg-aerospace-700 sm:block" />
          <div className="hidden text-right sm:block">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-aerospace-500">
              Total Pass Time
            </span>
            <p className="font-mono text-xs font-bold text-cyan-400">
              {formatDuration(totalDurationSec)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-aerospace-900/95 backdrop-blur">
            <tr className="border-b border-aerospace-700">
              <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                Satellite
              </th>
              <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                Type
              </th>
              <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                Start
              </th>
              <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                End
              </th>
              <th className="px-4 py-2 text-right text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                Duration
              </th>
              <th className="px-4 py-2 text-right text-[9px] font-bold uppercase tracking-wider text-aerospace-500">
                Max Elev
              </th>
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => {
              const isAoi = pass.type === 'aoi';
              return (
                <tr
                  key={pass.id}
                  className="border-b border-aerospace-800 transition hover:bg-aerospace-800/40"
                >
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold text-aerospace-200">{pass.satName}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isAoi
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {isAoi ? 'AOI' : pass.subtypeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-aerospace-300">
                    {formatUtc(pass.startUtc).slice(11, 19)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-aerospace-300">
                    {formatUtc(pass.endUtc).slice(11, 19)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-aerospace-200">
                    {formatDuration(pass.durationSec)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-aerospace-300">
                    {pass.maxElevationDeg !== undefined
                      ? `${pass.maxElevationDeg.toFixed(1)}°`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-aerospace-700 bg-aerospace-900/80 px-4 py-2 backdrop-blur">
        <p className="text-[10px] text-aerospace-500">
          Showing {passes.length} passes · {allPasses.length} total
        </p>
      </div>
    </div>
  );
}
